import { randomUUID } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AccountDeletionRepository } from '@/features/accounts/server/account-deletion.repository'
import { canUserAutoApprove } from '@/lib/trust/service'
import { createPrismaClient } from '@/server/prisma-client'
import { GamesRepository } from '@/server/repositories/games.repository'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { ActivityService } from '@/server/services/activity.service'
import { updateListingVoteCounts } from '@/server/utils/vote-counts'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { ApprovalStatus, PcOs, Role, TrustAction } from '@orm/client'

const databaseUrl = new URL(process.env.DATABASE_URL ?? '')
if (
  !['localhost', '127.0.0.1'].includes(databaseUrl.hostname) ||
  databaseUrl.pathname !== '/emuready_test'
) {
  throw new Error('Database tests require the disposable localhost emuready_test database')
}

const db = createPrismaClient()
const accounts = new AccountDeletionRepository(db)
const listings = new ListingsRepository(db)
const pcListings = new PcListingsRepository(db)
const games = new GamesRepository(db)
const activity = new ActivityService(db)
const prefix = `account-deletion-${randomUUID()}`
const previousUpdate = new Date('2000-01-01T00:00:00Z')

async function waitForBlockedTransaction(blockingPid: number) {
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline) {
    const [result] = await db.$queryRaw<{ blocked: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_stat_activity WHERE ${blockingPid} = ANY(pg_blocking_pids(pid))
      ) AS blocked
    `
    if (result?.blocked) return
    await setTimeout(10)
  }
  throw new Error('Account deletion did not wait for the competing vote transaction')
}

async function createFixtures() {
  const owner = await db.user.create({
    data: {
      clerkId: prefix,
      email: `${prefix}@example.invalid`,
      name: 'Former author',
      settings: { create: {} },
    },
  })
  const other = await db.user.create({
    data: { clerkId: `${prefix}-other`, email: `${prefix}-other@example.invalid` },
  })
  const system = await db.system.create({ data: { name: prefix } })
  const brand = await db.deviceBrand.create({ data: { name: prefix } })
  const device = await db.device.create({ data: { brandId: brand.id, modelName: prefix } })
  const cpu = await db.cpu.create({ data: { brandId: brand.id, modelName: prefix } })
  const game = await db.game.create({ data: { title: prefix, systemId: system.id } })
  const emulator = await db.emulator.create({ data: { name: prefix } })
  const performance = await db.performanceScale.create({ data: { label: prefix, rank: 1 } })
  const reportData = {
    gameId: game.id,
    emulatorId: emulator.id,
    performanceId: performance.id,
    authorId: owner.id,
    notes: 'Retain this report',
    status: ApprovalStatus.APPROVED,
    upvoteCount: 1,
    downvoteCount: 1,
    voteCount: 2,
  }
  const report = await db.listing.create({ data: { ...reportData, deviceId: device.id } })
  const pcReport = await db.pcListing.create({
    data: { ...reportData, cpuId: cpu.id, memorySize: 16, os: PcOs.LINUX, osVersion: 'test' },
  })
  const pcReportWithoutVotes = await db.pcListing.create({
    data: {
      ...reportData,
      cpuId: cpu.id,
      memorySize: 16,
      os: PcOs.LINUX,
      osVersion: 'test',
      upvoteCount: 0,
      downvoteCount: 0,
      voteCount: 0,
      updatedAt: previousUpdate,
    },
  })
  await db.vote.createMany({
    data: [
      { listingId: report.id, userId: owner.id, value: true },
      { listingId: report.id, userId: other.id, value: false },
    ],
  })
  await db.pcListingVote.createMany({
    data: [
      { pcListingId: pcReport.id, userId: owner.id, value: true },
      { pcListingId: pcReport.id, userId: other.id, value: false },
    ],
  })
  const comment = await db.comment.create({
    data: {
      listingId: report.id,
      userId: other.id,
      content: 'Keep this comment',
      score: 1,
      updatedAt: previousUpdate,
    },
  })
  const pcComment = await db.pcListingComment.create({
    data: {
      pcListingId: pcReport.id,
      userId: other.id,
      content: 'Keep this PC comment',
      score: -1,
      updatedAt: previousUpdate,
    },
  })
  await db.commentVote.create({ data: { userId: owner.id, commentId: comment.id, value: true } })
  await db.pcListingCommentVote.create({
    data: { userId: owner.id, commentId: pcComment.id, value: false },
  })
  const removedComment = await db.comment.create({
    data: { listingId: report.id, userId: owner.id, content: 'Account comment' },
  })
  await db.listing.update({
    where: { id: report.id },
    data: { pinnedCommentId: removedComment.id, pinnedByUserId: owner.id },
  })
  const badge = await db.badge.create({ data: { name: prefix, createdBy: owner.id } })
  await db.userBadge.create({ data: { userId: other.id, badgeId: badge.id, assignedBy: owner.id } })
  await db.verifiedDeveloper.create({
    data: { userId: other.id, emulatorId: emulator.id, verifiedBy: owner.id },
  })
  await db.userBan.create({
    data: { userId: other.id, bannedById: owner.id, reason: 'Keep moderation decision' },
  })
  await db.externalAccount.create({
    data: { userId: owner.id, provider: 'fixture', externalId: prefix },
  })
  return {
    owner,
    other,
    system,
    brand,
    device,
    cpu,
    game,
    emulator,
    performance,
    report,
    pcReport,
    pcReportWithoutVotes,
    comment,
    pcComment,
    removedComment,
    badge,
  }
}

let fixtures: Awaited<ReturnType<typeof createFixtures>>

describe('account deletion against PostgreSQL', () => {
  beforeAll(async () => {
    fixtures = await createFixtures()
  })
  afterAll(async () => {
    if (fixtures) {
      await db.listing.deleteMany({ where: { gameId: fixtures.game.id } })
      await db.pcListing.deleteMany({ where: { gameId: fixtures.game.id } })
      await db.badge.deleteMany({ where: { id: fixtures.badge.id } })
      await db.userBan.deleteMany({ where: { userId: fixtures.other.id } })
      await db.verifiedDeveloper.deleteMany({ where: { emulatorId: fixtures.emulator.id } })
      await db.user.deleteMany({ where: { clerkId: { startsWith: prefix } } })
      await db.game.delete({ where: { id: fixtures.game.id } })
      await db.device.delete({ where: { id: fixtures.device.id } })
      await db.cpu.delete({ where: { id: fixtures.cpu.id } })
      await db.deviceBrand.delete({ where: { id: fixtures.brand.id } })
      await db.emulator.delete({ where: { id: fixtures.emulator.id } })
      await db.system.delete({ where: { id: fixtures.system.id } })
      await db.performanceScale.delete({ where: { id: fixtures.performance.id } })
    }
    await db.$disconnect()
  })

  it('retains both reports anonymously while deleting the account and correcting active votes', async () => {
    await Promise.all([
      accounts.deleteAccount({ clerkId: fixtures.owner.clerkId }),
      accounts.deleteAccount({ clerkId: fixtures.owner.clerkId }),
    ])
    expect(await db.user.findUnique({ where: { id: fixtures.owner.id } })).toBeNull()
    expect(await db.externalAccount.count({ where: { userId: fixtures.owner.id } })).toBe(0)
    expect(await db.userSettings.count({ where: { userId: fixtures.owner.id } })).toBe(0)
    for (const report of [
      await db.listing.findUniqueOrThrow({ where: { id: fixtures.report.id } }),
      await db.pcListing.findUniqueOrThrow({ where: { id: fixtures.pcReport.id } }),
    ]) {
      expect(report).toMatchObject({
        authorId: null,
        notes: 'Retain this report',
        status: ApprovalStatus.APPROVED,
        upvoteCount: 0,
        downvoteCount: 1,
        voteCount: 1,
      })
    }
    for (const comment of [
      await db.comment.findUniqueOrThrow({ where: { id: fixtures.comment.id } }),
      await db.pcListingComment.findUniqueOrThrow({ where: { id: fixtures.pcComment.id } }),
    ]) {
      expect(comment.score).toBe(0)
      expect(comment.updatedAt.getTime()).toBeGreaterThan(previousUpdate.getTime())
    }
    expect(await db.comment.findUnique({ where: { id: fixtures.removedComment.id } })).toBeNull()
    expect(await db.listing.findUniqueOrThrow({ where: { id: fixtures.report.id } })).toMatchObject(
      { pinnedCommentId: null, pinnedByUserId: null },
    )
    expect(await db.badge.findUniqueOrThrow({ where: { id: fixtures.badge.id } })).toMatchObject({
      createdBy: null,
    })
    expect(
      await db.userBan.findFirstOrThrow({ where: { userId: fixtures.other.id } }),
    ).toMatchObject({ bannedById: null })
    expect(
      await db.verifiedDeveloper.findFirstOrThrow({ where: { userId: fixtures.other.id } }),
    ).toMatchObject({ verifiedBy: null })
    expect(
      await db.userBadge.findFirstOrThrow({ where: { userId: fixtures.other.id } }),
    ).toMatchObject({ assignedBy: null })
    expect(await listings.byIdWithAccess(fixtures.report.id)).toMatchObject({ author: null })
    expect(await pcListings.getByIdWithDetails(fixtures.pcReport.id)).toMatchObject({
      author: null,
    })
    const reportWithoutVotes = await db.pcListing.findUniqueOrThrow({
      where: { id: fixtures.pcReportWithoutVotes.id },
    })
    expect(reportWithoutVotes).toMatchObject({ authorId: null, voteCount: 0 })
    expect(reportWithoutVotes.updatedAt.getTime()).toBeGreaterThan(previousUpdate.getTime())
    const game = await games.byId(fixtures.game.id)
    expect(game?.listings).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: fixtures.report.id })]),
    )
    expect(game?.pcListings).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: fixtures.pcReport.id })]),
    )
    expect(await activity.getRecentListings('24h', 100, Role.USER)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: fixtures.report.id, authorId: null }),
        expect.objectContaining({ id: fixtures.pcReport.id, authorId: null }),
      ]),
    )
    expect(await accounts.deleteAccount({ clerkId: fixtures.owner.clerkId })).toBeNull()
  })

  it('does not publish a banned author’s reports or decrement already-nullified votes', async () => {
    const banned = await db.user.create({
      data: { clerkId: `${prefix}-banned`, email: `${prefix}-banned@example.invalid` },
    })
    const report = await db.listing.create({
      data: {
        deviceId: fixtures.device.id,
        gameId: fixtures.game.id,
        emulatorId: fixtures.emulator.id,
        performanceId: fixtures.performance.id,
        authorId: banned.id,
        status: ApprovalStatus.APPROVED,
        voteCount: 1,
        upvoteCount: 1,
        successRate: calculateWilsonScore(1, 0),
      },
    })
    const pcReport = await db.pcListing.create({
      data: {
        cpuId: fixtures.cpu.id,
        memorySize: 16,
        os: PcOs.LINUX,
        osVersion: 'test',
        gameId: fixtures.game.id,
        emulatorId: fixtures.emulator.id,
        performanceId: fixtures.performance.id,
        authorId: banned.id,
        status: ApprovalStatus.APPROVED,
        voteCount: 1,
        upvoteCount: 1,
        successRate: calculateWilsonScore(1, 0),
      },
    })
    await db.userBan.create({
      data: { userId: banned.id, bannedById: fixtures.other.id, reason: 'Active ban' },
    })
    await db.vote.create({
      data: { listingId: report.id, userId: banned.id, value: true, nullifiedAt: new Date() },
    })
    await db.pcListingVote.create({
      data: { pcListingId: pcReport.id, userId: banned.id, value: false, nullifiedAt: new Date() },
    })
    await db.vote.create({
      data: { listingId: report.id, userId: fixtures.other.id, value: true },
    })
    await db.pcListingVote.create({
      data: { pcListingId: pcReport.id, userId: fixtures.other.id, value: true },
    })
    const comment = await db.comment.create({
      data: {
        listingId: report.id,
        userId: fixtures.other.id,
        content: 'Nullified vote must stay excluded',
        score: 1,
        votes: {
          create: [
            { userId: banned.id, value: true, nullifiedAt: new Date() },
            { userId: fixtures.other.id, value: true },
          ],
        },
      },
    })
    const pcComment = await db.pcListingComment.create({
      data: {
        pcListingId: pcReport.id,
        userId: fixtures.other.id,
        content: 'Nullified vote must stay excluded',
        score: 1,
        votes: {
          create: [
            { userId: banned.id, value: false, nullifiedAt: new Date() },
            { userId: fixtures.other.id, value: true },
          ],
        },
      },
    })
    const authorBefore = await db.user.findUniqueOrThrow({ where: { id: fixtures.other.id } })
    await accounts.deleteAccount({ id: banned.id })
    expect(await db.user.findUniqueOrThrow({ where: { id: fixtures.other.id } })).toMatchObject({
      trustScore: authorBefore.trustScore,
    })
    expect(await db.listing.findUniqueOrThrow({ where: { id: report.id } })).toMatchObject({
      authorId: null,
      status: ApprovalStatus.PENDING,
      voteCount: 1,
      upvoteCount: 1,
      successRate: calculateWilsonScore(1, 0),
      downvoteCount: 0,
    })
    expect(await db.comment.findUniqueOrThrow({ where: { id: comment.id } })).toMatchObject({
      score: 1,
    })
    expect(
      await db.pcListingComment.findUniqueOrThrow({ where: { id: pcComment.id } }),
    ).toMatchObject({
      score: 1,
    })
    expect(await db.pcListing.findUniqueOrThrow({ where: { id: pcReport.id } })).toMatchObject({
      authorId: null,
      status: ApprovalStatus.PENDING,
      voteCount: 1,
      upvoteCount: 1,
      successRate: calculateWilsonScore(1, 0),
      downvoteCount: 0,
    })
    await expect(listings.byIdWithAccess(report.id)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(await pcListings.getByIdWithDetails(pcReport.id)).toBeNull()
    const game = await games.byId(fixtures.game.id)
    expect(game?.listings).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: report.id })]),
    )
    expect(game?.pcListings).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: pcReport.id })]),
    )
    const recentReports = await activity.getRecentListings('24h', 100, Role.USER)
    expect(recentReports).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: report.id })]),
    )
    expect(recentReports).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: pcReport.id })]),
    )
  })

  it('removes a voting history spanning multiple batches for both report types', async () => {
    const voter = await db.user.create({
      data: { clerkId: `${prefix}-prolific`, email: `${prefix}-prolific@example.invalid` },
    })
    const authors = Array.from({ length: 1001 }, () => ({
      id: randomUUID(),
      reportId: randomUUID(),
      pcReportId: randomUUID(),
    }))
    const authorIds = authors.map((author) => author.id)
    const reportIds = authors.map((author) => author.reportId)
    const pcReportIds = authors.map((author) => author.pcReportId)
    await db.user.createMany({
      data: authors.map((author) => ({
        id: author.id,
        clerkId: `${prefix}-${author.id}`,
        email: `${prefix}-${author.id}@example.invalid`,
        trustScore: 250,
      })),
    })
    const reportData = {
      gameId: fixtures.game.id,
      emulatorId: fixtures.emulator.id,
      performanceId: fixtures.performance.id,
      upvoteCount: 1,
      downvoteCount: 1,
      voteCount: 2,
    }
    await db.listing.createMany({
      data: authors.map((author) => ({
        ...reportData,
        id: author.reportId,
        authorId: author.id,
        deviceId: fixtures.device.id,
      })),
    })
    await db.pcListing.createMany({
      data: authors.map((author) => ({
        ...reportData,
        id: author.pcReportId,
        authorId: author.id,
        cpuId: fixtures.cpu.id,
        memorySize: 16,
        os: PcOs.LINUX,
        osVersion: 'test',
        updatedAt: previousUpdate,
      })),
    })
    await db.vote.createMany({
      data: reportIds.flatMap((listingId) => [
        { listingId, userId: voter.id, value: true },
        { listingId, userId: fixtures.other.id, value: false },
      ]),
    })
    await db.pcListingVote.createMany({
      data: pcReportIds.flatMap((pcListingId) => [
        { pcListingId, userId: voter.id, value: false },
        { pcListingId, userId: fixtures.other.id, value: true },
      ]),
    })
    await accounts.deleteAccount({ id: voter.id })
    expect(await db.user.findUnique({ where: { id: voter.id } })).toBeNull()
    expect(
      await db.listing.count({
        where: {
          id: { in: reportIds },
          upvoteCount: 0,
          downvoteCount: 1,
          voteCount: 1,
          successRate: calculateWilsonScore(0, 1),
        },
      }),
    ).toBe(reportIds.length)
    expect(
      await db.pcListing.count({
        where: {
          id: { in: pcReportIds },
          upvoteCount: 1,
          downvoteCount: 0,
          voteCount: 1,
          successRate: calculateWilsonScore(1, 0),
          updatedAt: { gt: previousUpdate },
        },
      }),
    ).toBe(pcReportIds.length)
    expect(await db.user.count({ where: { id: { in: authorIds }, trustScore: 249 } })).toBe(
      authors.length,
    )
    expect(
      await db.trustActionLog.count({
        where: { userId: { in: authorIds }, action: TrustAction.VOTE_CHANGE_REVERSAL, weight: -1 },
      }),
    ).toBe(authors.length)
  })

  it.each([true, false])(
    'reverses received trust for all four active vote types (%s)',
    async (value) => {
      const voter = await db.user.create({
        data: {
          clerkId: `${prefix}-trust-voter-${value}`,
          email: `${prefix}-trust-voter-${value}@example.invalid`,
        },
      })
      const author = await db.user.create({
        data: {
          clerkId: `${prefix}-trust-author-${value}`,
          email: `${prefix}-trust-author-${value}@example.invalid`,
          trustScore: value ? 250 : 249,
        },
      })
      const reportData = {
        gameId: fixtures.game.id,
        emulatorId: fixtures.emulator.id,
        performanceId: fixtures.performance.id,
        authorId: author.id,
        upvoteCount: value ? 1 : 0,
        downvoteCount: value ? 0 : 1,
        voteCount: 1,
        votes: { create: { userId: voter.id, value } },
      }
      const report = await db.listing.create({
        data: { ...reportData, deviceId: fixtures.device.id },
      })
      const pcReport = await db.pcListing.create({
        data: {
          ...reportData,
          cpuId: fixtures.cpu.id,
          memorySize: 16,
          os: PcOs.LINUX,
          osVersion: 'test',
        },
      })
      const supporters = await db.user.createManyAndReturn({
        data: Array.from({ length: value ? 4 : 5 }, (_, index) => ({
          clerkId: `${prefix}-trust-supporter-${value}-${index}`,
          email: `${prefix}-trust-supporter-${value}-${index}@example.invalid`,
        })),
        select: { id: true },
      })
      const commentData = {
        userId: author.id,
        content: 'Retained comment',
        score: value ? 5 : 4,
        votes: {
          create: [
            { userId: voter.id, value },
            ...supporters.map((supporter) => ({ userId: supporter.id, value: true })),
          ],
        },
      }
      const comment = await db.comment.create({ data: { ...commentData, listingId: report.id } })
      const pcComment = await db.pcListingComment.create({
        data: { ...commentData, pcListingId: pcReport.id },
      })
      if (value) {
        await db.trustActionLog.createMany({
          data: [comment, pcComment].map((entry) => ({
            userId: author.id,
            action: TrustAction.HELPFUL_COMMENT,
            weight: 3,
            metadata: { commentId: entry.id, score: 5, threshold: 5 },
          })),
        })
      }

      await Promise.all([
        accounts.deleteAccount({ id: voter.id }),
        accounts.deleteAccount({ id: voter.id }),
      ])
      const expectedTrust = value ? 242 : 259
      expect(await db.user.findUniqueOrThrow({ where: { id: author.id } })).toMatchObject({
        trustScore: expectedTrust,
      })
      expect(await canUserAutoApprove(author.id, db)).toBe(!value)
      expect(await db.comment.findUniqueOrThrow({ where: { id: comment.id } })).toMatchObject({
        score: value ? 4 : 5,
      })
      expect(
        await db.pcListingComment.findUniqueOrThrow({ where: { id: pcComment.id } }),
      ).toMatchObject({ score: value ? 4 : 5 })
      const logs = await db.trustActionLog.findMany({ where: { userId: author.id } })
      expect(logs.filter((log) => log.action === TrustAction.VOTE_CHANGE_REVERSAL)).toMatchObject([
        {
          weight: value ? -8 : 4,
          metadata: { reason: 'Account deletion vote removal', reversed: true },
        },
      ])
      expect(logs.filter((log) => log.action === TrustAction.HELPFUL_COMMENT)).toHaveLength(2)
      expect(JSON.stringify(logs)).not.toContain(voter.id)
      expect(await accounts.deleteAccount({ id: voter.id })).toBeNull()
      expect(await db.user.findUniqueOrThrow({ where: { id: author.id } })).toMatchObject({
        trustScore: expectedTrust,
      })
    },
  )

  it('retries a report-write conflict without losing another user’s concurrent vote', async () => {
    const authorBefore = await db.user.findUniqueOrThrow({ where: { id: fixtures.other.id } })
    const voter = await db.user.create({
      data: { clerkId: `${prefix}-concurrent`, email: `${prefix}-concurrent@example.invalid` },
    })
    const report = await db.listing.create({
      data: {
        gameId: fixtures.game.id,
        deviceId: fixtures.device.id,
        emulatorId: fixtures.emulator.id,
        performanceId: fixtures.performance.id,
        authorId: fixtures.other.id,
        upvoteCount: 1,
        voteCount: 1,
        successRate: calculateWilsonScore(1, 0),
        votes: { create: { userId: voter.id, value: true } },
      },
    })
    const writerReady = Promise.withResolvers<number>()
    const releaseWriter = Promise.withResolvers<void>()
    const writer = db.$transaction(
      async (tx) => {
        try {
          await tx.vote.create({
            data: { listingId: report.id, userId: fixtures.other.id, value: false },
          })
          await updateListingVoteCounts(tx, report.id, 'create', false)
          const [connection] = await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`
          if (!connection) throw new Error('Missing PostgreSQL backend PID')
          writerReady.resolve(connection.pid)
          await releaseWriter.promise
        } catch (error) {
          writerReady.reject(error)
          throw error
        }
      },
      { timeout: 15_000 },
    )
    const writerResult = Promise.allSettled([writer])
    let deletionResult: ReturnType<typeof Promise.allSettled> | undefined
    try {
      const blockingPid = await writerReady.promise
      deletionResult = Promise.allSettled([accounts.deleteAccount({ id: voter.id })])
      await waitForBlockedTransaction(blockingPid)
      releaseWriter.resolve()
      expect((await writerResult)[0]).toMatchObject({ status: 'fulfilled' })
      expect((await deletionResult)[0]).toMatchObject({ status: 'fulfilled' })
    } finally {
      releaseWriter.resolve()
      await writerResult
      await deletionResult
    }

    expect(await db.user.findUnique({ where: { id: voter.id } })).toBeNull()
    expect(await db.vote.findMany({ where: { listingId: report.id } })).toMatchObject([
      { userId: fixtures.other.id, value: false },
    ])
    expect(await db.listing.findUniqueOrThrow({ where: { id: report.id } })).toMatchObject({
      upvoteCount: 0,
      downvoteCount: 1,
      voteCount: 1,
      successRate: calculateWilsonScore(0, 1),
    })
    expect(await db.user.findUniqueOrThrow({ where: { id: fixtures.other.id } })).toMatchObject({
      trustScore: authorBefore.trustScore - 2,
    })
  })
})
