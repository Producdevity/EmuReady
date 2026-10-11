import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AccountDeletionRepository } from '@/features/accounts/server/account-deletion.repository'
import { ANONYMOUS_AUTHOR_ID } from '@/features/accounts/shared/anonymous-author'
import { createPrismaClient } from '@/server/prisma-client'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { ApprovalStatus, PcOs } from '@orm/client'

const databaseUrl = new URL(process.env.DATABASE_URL ?? '')
if (
  !['localhost', '127.0.0.1'].includes(databaseUrl.hostname) ||
  databaseUrl.pathname !== '/emuready_test'
) {
  throw new Error('Database tests require the disposable localhost emuready_test database')
}

const db = createPrismaClient()
const accounts = new AccountDeletionRepository(db)
const prefix = `account-deletion-${randomUUID()}`

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
    data: { listingId: report.id, userId: other.id, content: 'Keep this comment', score: 1 },
  })
  const pcComment = await db.pcListingComment.create({
    data: {
      pcListingId: pcReport.id,
      userId: other.id,
      content: 'Keep this PC comment',
      score: -1,
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
        authorId: ANONYMOUS_AUTHOR_ID,
        notes: 'Retain this report',
        status: ApprovalStatus.APPROVED,
        upvoteCount: 0,
        downvoteCount: 1,
        voteCount: 1,
      })
    }
    expect(
      await db.comment.findUniqueOrThrow({ where: { id: fixtures.comment.id } }),
    ).toMatchObject({ score: 0 })
    expect(
      await db.pcListingComment.findUniqueOrThrow({ where: { id: fixtures.pcComment.id } }),
    ).toMatchObject({ score: 0 })
    expect(await db.comment.findUnique({ where: { id: fixtures.removedComment.id } })).toBeNull()
    expect(await db.listing.findUniqueOrThrow({ where: { id: fixtures.report.id } })).toMatchObject(
      { pinnedCommentId: null, pinnedByUserId: null },
    )
    expect(await db.badge.findUniqueOrThrow({ where: { id: fixtures.badge.id } })).toMatchObject({
      createdBy: ANONYMOUS_AUTHOR_ID,
    })
    expect(
      await db.userBan.findFirstOrThrow({ where: { userId: fixtures.other.id } }),
    ).toMatchObject({ bannedById: ANONYMOUS_AUTHOR_ID })
    expect(
      await db.verifiedDeveloper.findFirstOrThrow({ where: { userId: fixtures.other.id } }),
    ).toMatchObject({ verifiedBy: ANONYMOUS_AUTHOR_ID })
    expect(
      await db.userBadge.findFirstOrThrow({ where: { userId: fixtures.other.id } }),
    ).toMatchObject({ assignedBy: ANONYMOUS_AUTHOR_ID })
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
    await accounts.deleteAccount({ id: banned.id })
    expect(await db.listing.findUniqueOrThrow({ where: { id: report.id } })).toMatchObject({
      authorId: ANONYMOUS_AUTHOR_ID,
      status: ApprovalStatus.PENDING,
      voteCount: 1,
      upvoteCount: 1,
      successRate: calculateWilsonScore(1, 0),
      downvoteCount: 0,
    })
    expect(await db.pcListing.findUniqueOrThrow({ where: { id: pcReport.id } })).toMatchObject({
      authorId: ANONYMOUS_AUTHOR_ID,
      status: ApprovalStatus.PENDING,
      voteCount: 1,
      upvoteCount: 1,
      successRate: calculateWilsonScore(1, 0),
      downvoteCount: 0,
    })
  })

  it('removes a voting history spanning multiple batches for both report types', async () => {
    const voter = await db.user.create({
      data: { clerkId: `${prefix}-prolific`, email: `${prefix}-prolific@example.invalid` },
    })
    const reportIds = Array.from({ length: 1001 }, () => randomUUID())
    const pcReportIds = Array.from({ length: 1001 }, () => randomUUID())
    const reportData = {
      gameId: fixtures.game.id,
      emulatorId: fixtures.emulator.id,
      performanceId: fixtures.performance.id,
      authorId: fixtures.other.id,
      upvoteCount: 1,
      downvoteCount: 1,
      voteCount: 2,
    }
    await db.listing.createMany({
      data: reportIds.map((id) => ({ ...reportData, id, deviceId: fixtures.device.id })),
    })
    await db.pcListing.createMany({
      data: pcReportIds.map((id) => ({
        ...reportData,
        id,
        cpuId: fixtures.cpu.id,
        memorySize: 16,
        os: PcOs.LINUX,
        osVersion: 'test',
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
        },
      }),
    ).toBe(pcReportIds.length)
  })

  it('rejects deletion of the shared anonymous principal without losing reports', async () => {
    await expect(accounts.deleteAccount({ id: ANONYMOUS_AUTHOR_ID })).rejects.toThrow(
      'cannot be deleted',
    )
    expect(await db.listing.count({ where: { id: fixtures.report.id } })).toBe(1)
    expect(await db.pcListing.count({ where: { id: fixtures.pcReport.id } })).toBe(1)
  })
})
