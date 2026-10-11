import { ANONYMOUS_AUTHOR_ID } from '@/features/accounts/shared/anonymous-author'
import { AppError } from '@/lib/errors'
import { PrismaRepository } from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { ApprovalStatus, Prisma, Role, type PrismaClient } from '@orm/client'

const retainedReportsSelect = {
  id: true,
  listings: { select: { id: true, gameId: true, deviceId: true, emulatorId: true } },
  pcListings: { select: { id: true, gameId: true, cpuId: true, gpuId: true } },
} satisfies Prisma.UserSelect

type AccountIdentity = { id: string } | { clerkId: string }

export class AccountDeletionRepository extends PrismaRepository {
  constructor(private readonly client: PrismaClient) {
    super(client)
  }

  async deleteAccount(identity: AccountIdentity) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.client.$transaction(
          async (tx) => {
            const user = await tx.user.findUnique({
              where: identity,
              select: retainedReportsSelect,
            })
            if (!user) return null
            if (user.id === ANONYMOUS_AUTHOR_ID) {
              return AppError.forbidden('The anonymous report author cannot be deleted')
            }

            await tx.user.upsert({
              where: { id: ANONYMOUS_AUTHOR_ID },
              create: {
                id: ANONYMOUS_AUTHOR_ID,
                clerkId: 'anonymous-report-author',
                email: 'anonymous-report-author@emuready.invalid',
                name: 'Anonymous',
                role: Role.USER,
                notifyOnNewListings: false,
              },
              update: {},
            })
            await tx.userSettings.upsert({
              where: { userId: ANONYMOUS_AUTHOR_ID },
              create: {
                userId: ANONYMOUS_AUTHOR_ID,
                notifyOnNewListings: false,
                profilePublic: false,
                showActivityInFeed: false,
                showVotingActivity: false,
                allowFollows: false,
                allowFriendRequests: false,
                followersVisible: false,
                followingVisible: false,
                followedGamesVisible: false,
              },
              update: {},
            })

            const activeBan = await tx.userBan.findFirst({
              where: {
                userId: user.id,
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              select: { id: true },
            })
            if (activeBan) {
              // Removing the author must not publish reports previously hidden by their ban.
              await tx.listing.updateMany({
                where: { authorId: user.id, status: ApprovalStatus.APPROVED },
                data: { status: ApprovalStatus.PENDING },
              })
              await tx.pcListing.updateMany({
                where: { authorId: user.id, status: ApprovalStatus.APPROVED },
                data: { status: ApprovalStatus.PENDING },
              })
            }
            await removeVoteContributions(tx, user.id)
            await tx.listing.updateMany({
              where: { authorId: user.id },
              data: { authorId: ANONYMOUS_AUTHOR_ID },
            })
            await tx.pcListing.updateMany({
              where: { authorId: user.id },
              data: { authorId: ANONYMOUS_AUTHOR_ID },
            })
            // Required moderation references must survive without retaining the moderator's account.
            await tx.verifiedDeveloper.updateMany({
              where: { verifiedBy: user.id },
              data: { verifiedBy: ANONYMOUS_AUTHOR_ID },
            })
            await tx.userBan.updateMany({
              where: { bannedById: user.id },
              data: { bannedById: ANONYMOUS_AUTHOR_ID },
            })
            await tx.badge.updateMany({
              where: { createdBy: user.id },
              data: { createdBy: ANONYMOUS_AUTHOR_ID },
            })
            await tx.userBadge.updateMany({
              where: { assignedBy: user.id },
              data: { assignedBy: ANONYMOUS_AUTHOR_ID },
            })
            await tx.notificationEvent.deleteMany({ where: { triggeredBy: user.id } })
            await tx.auditLog.updateMany({
              where: { OR: [{ actorId: user.id }, { targetUserId: user.id }] },
              data: { metadata: Prisma.DbNull, ipAddress: null, userAgent: null, requestId: null },
            })
            await tx.user.delete({ where: { id: user.id } })
            return user
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 },
        )
      } catch (error) {
        if (attempt < 2 && isPrismaError(error, PRISMA_ERROR_CODES.TRANSACTION_FAILED)) continue
        throw error
      }
    }
  }
}

const voteCountsSelect = {
  id: true,
  upvoteCount: true,
  downvoteCount: true,
} satisfies Prisma.ListingSelect

async function removeVoteContributions(tx: Prisma.TransactionClient, userId: string) {
  const votes = await tx.vote.findMany({
    where: { userId, nullifiedAt: null },
    select: { value: true, listing: { select: voteCountsSelect } },
  })
  const pcVotes = await tx.pcListingVote.findMany({
    where: { userId, nullifiedAt: null },
    select: { value: true, pcListing: { select: voteCountsSelect } },
  })
  await updateReportVoteCounts(
    tx,
    Prisma.sql`"Listing"`,
    votes.map((vote) => voteRemovalRow(vote.listing, vote.value)),
  )
  await updateReportVoteCounts(
    tx,
    Prisma.sql`"pc_listings"`,
    pcVotes.map((vote) => voteRemovalRow(vote.pcListing, vote.value)),
  )
  await tx.$executeRaw`
    UPDATE "Comment" AS comment
    SET "score" = comment."score" + CASE WHEN vote."value" THEN -1 ELSE 1 END,
        "updatedAt" = NOW()
    FROM "CommentVote" AS vote
    WHERE vote."commentId" = comment."id" AND vote."userId" = ${userId}
      AND vote."nullifiedAt" IS NULL AND comment."userId" <> ${userId}
  `
  await tx.$executeRaw`
    UPDATE "pc_listing_comments" AS comment
    SET "score" = comment."score" + CASE WHEN vote."value" THEN -1 ELSE 1 END,
        "updatedAt" = NOW()
    FROM "pc_listing_comment_votes" AS vote
    WHERE vote."commentId" = comment."id" AND vote."userId" = ${userId}
      AND vote."nullifiedAt" IS NULL AND comment."userId" <> ${userId}
  `
}

function voteRemovalRow(
  report: Prisma.ListingGetPayload<{ select: typeof voteCountsSelect }>,
  value: boolean,
) {
  const upvotes = Math.max(0, report.upvoteCount - (value ? 1 : 0))
  const downvotes = Math.max(0, report.downvoteCount - (value ? 0 : 1))
  const removed = report.upvoteCount + report.downvoteCount - upvotes - downvotes
  const score = calculateWilsonScore(upvotes, downvotes)
  return Prisma.sql`(${report.id}, ${upvotes}::int, ${downvotes}::int, ${removed}::int, ${score}::double precision)`
}

async function updateReportVoteCounts(
  tx: Prisma.TransactionClient,
  table: Prisma.Sql,
  rows: Prisma.Sql[],
) {
  for (let offset = 0; offset < rows.length; offset += 500) {
    await tx.$executeRaw(Prisma.sql`
      UPDATE ${table} AS report
      SET "upvoteCount" = counts.upvotes, "downvoteCount" = counts.downvotes,
          "voteCount" = report."voteCount" - counts.removed, "successRate" = counts.score
      FROM (VALUES ${Prisma.join(rows.slice(offset, offset + 500))})
        AS counts(id, upvotes, downvotes, removed, score)
      WHERE report."id" = counts.id
    `)
  }
}
