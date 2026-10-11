import { ANONYMOUS_AUTHOR_ID } from '@/features/accounts/shared/anonymous-author'
import { AppError } from '@/lib/errors'
import { PrismaRepository } from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { updateListingVoteCounts, updatePcListingVoteCounts } from '@/server/utils/vote-counts'
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

async function removeVoteContributions(tx: Prisma.TransactionClient, userId: string) {
  const votes = await tx.vote.findMany({
    where: { userId, nullifiedAt: null },
    select: { listingId: true, value: true },
  })
  const pcVotes = await tx.pcListingVote.findMany({
    where: { userId, nullifiedAt: null },
    select: { pcListingId: true, value: true },
  })
  const commentVotes = await tx.commentVote.findMany({
    where: { userId, nullifiedAt: null, comment: { userId: { not: userId } } },
    select: { commentId: true, value: true },
  })
  const pcCommentVotes = await tx.pcListingCommentVote.findMany({
    where: { userId, nullifiedAt: null, comment: { userId: { not: userId } } },
    select: { commentId: true, value: true },
  })

  for (const vote of votes) {
    await updateListingVoteCounts(tx, vote.listingId, 'delete', undefined, vote.value)
  }
  for (const vote of pcVotes) {
    await updatePcListingVoteCounts(tx, vote.pcListingId, 'delete', undefined, vote.value)
  }
  for (const vote of commentVotes) {
    await tx.comment.update({
      where: { id: vote.commentId },
      data: { score: { increment: vote.value ? -1 : 1 } },
    })
  }
  for (const vote of pcCommentVotes) {
    await tx.pcListingComment.update({
      where: { id: vote.commentId },
      data: { score: { increment: vote.value ? -1 : 1 } },
    })
  }
}
