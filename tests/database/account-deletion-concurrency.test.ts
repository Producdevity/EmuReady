import { randomUUID } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { AccountDeletionRepository } from '@/features/accounts/server/account-deletion.repository'
import analytics from '@/lib/analytics'
import { createPrismaClient } from '@/server/prisma-client'
import { updateListingVoteCounts, updatePcListingVoteCounts } from '@/server/utils/vote-counts'
import { handleListingVoteTrustEffects } from '@/server/utils/vote-trust-effects'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { PcOs, TrustAction } from '@orm/client'

vi.mock('@/lib/analytics', () => ({
  default: {
    trust: { trustScoreChanged: vi.fn(), trustLevelChanged: vi.fn() },
  },
}))

const databaseUrl = new URL(process.env.DATABASE_URL ?? '')
if (
  !['localhost', '127.0.0.1'].includes(databaseUrl.hostname) ||
  databaseUrl.pathname !== '/emuready_test'
) {
  throw new Error('Database tests require the disposable localhost emuready_test database')
}

const db = createPrismaClient()
const accounts = new AccountDeletionRepository(db)
const prefix = `account-deletion-concurrency-${randomUUID()}`

async function waitForBlockedTransaction(blockingPid: number) {
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline) {
    const [blocked] = await db.$queryRaw<{ pid: number }[]>`
      SELECT pid FROM pg_stat_activity
      WHERE ${blockingPid} = ANY(pg_blocking_pids(pid)) LIMIT 1
    `
    if (blocked) return blocked.pid
    await setTimeout(10)
  }
  throw new Error('Expected transaction did not block behind its predecessor')
}

async function createFixtures() {
  return db.$transaction(async (tx) => {
    const author = await tx.user.create({
      data: { clerkId: `${prefix}-author`, email: `${prefix}-author@example.invalid` },
    })
    const writer = await tx.user.create({
      data: { clerkId: `${prefix}-writer`, email: `${prefix}-writer@example.invalid` },
    })
    const system = await tx.system.create({ data: { name: prefix } })
    const brand = await tx.deviceBrand.create({ data: { name: prefix } })
    const device = await tx.device.create({ data: { brandId: brand.id, modelName: prefix } })
    const cpu = await tx.cpu.create({ data: { brandId: brand.id, modelName: prefix } })
    const game = await tx.game.create({ data: { title: prefix, systemId: system.id } })
    const emulator = await tx.emulator.create({ data: { name: prefix } })
    const performance = await tx.performanceScale.create({ data: { label: prefix, rank: 1 } })
    return { author, writer, system, brand, device, cpu, game, emulator, performance }
  })
}

let fixtures: Awaited<ReturnType<typeof createFixtures>>

describe('voting after account deletion locks a report', () => {
  beforeAll(async () => {
    fixtures = await createFixtures()
  })

  afterAll(async () => {
    if (fixtures) {
      await db.listing.deleteMany({ where: { gameId: fixtures.game.id } })
      await db.pcListing.deleteMany({ where: { gameId: fixtures.game.id } })
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

  it.each(['handheld', 'pc'])(
    'keeps %s counters and Wilson score consistent',
    async (reportType) => {
      const voter = await db.user.create({
        data: {
          clerkId: `${prefix}-${reportType}`,
          email: `${prefix}-${reportType}@example.invalid`,
        },
      })
      const reportData = {
        gameId: fixtures.game.id,
        emulatorId: fixtures.emulator.id,
        performanceId: fixtures.performance.id,
        authorId: fixtures.author.id,
        upvoteCount: 1,
        voteCount: 1,
        successRate: calculateWilsonScore(1, 0),
        votes: { create: { userId: voter.id, value: true } },
      }
      const report =
        reportType === 'handheld'
          ? await db.listing.create({ data: { ...reportData, deviceId: fixtures.device.id } })
          : await db.pcListing.create({
              data: {
                ...reportData,
                cpuId: fixtures.cpu.id,
                memorySize: 16,
                os: PcOs.LINUX,
                osVersion: 'test',
              },
            })

      const lockReady = Promise.withResolvers<number>()
      const releaseLock = Promise.withResolvers<void>()
      const locker = db.$transaction(
        async (tx) => {
          try {
            // Hold deletion at its final User DELETE after it has updated the report counters.
            await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${voter.id} FOR KEY SHARE`
            const [connection] = await tx.$queryRaw<
              { pid: number }[]
            >`SELECT pg_backend_pid() AS pid`
            if (!connection) throw new Error('Missing PostgreSQL backend PID')
            lockReady.resolve(connection.pid)
            await releaseLock.promise
          } catch (error) {
            lockReady.reject(error)
            throw error
          }
        },
        { timeout: 20_000 },
      )
      const lockerResult = Promise.allSettled([locker])
      let deletionResult: ReturnType<typeof Promise.allSettled> | undefined
      let writerResult: ReturnType<typeof Promise.allSettled> | undefined
      try {
        const lockerPid = await lockReady.promise
        deletionResult = Promise.allSettled([accounts.deleteAccount({ id: voter.id })])
        const deletionPid = await waitForBlockedTransaction(lockerPid)

        const writer = db.$transaction(
          async (tx) => {
            if (reportType === 'handheld') {
              await tx.vote.create({
                data: { listingId: report.id, userId: fixtures.writer.id, value: false },
              })
              await updateListingVoteCounts(tx, report.id, 'create', false)
            } else {
              await tx.pcListingVote.create({
                data: { pcListingId: report.id, userId: fixtures.writer.id, value: false },
              })
              await updatePcListingVoteCounts(tx, report.id, 'create', false)
            }
          },
          { timeout: 20_000 },
        )
        writerResult = Promise.allSettled([writer])
        await waitForBlockedTransaction(deletionPid)
        releaseLock.resolve()

        expect(await lockerResult).toMatchObject([{ status: 'fulfilled' }])
        expect(await deletionResult).toMatchObject([
          { status: 'fulfilled', value: { id: voter.id } },
        ])
        expect(await writerResult).toMatchObject([{ status: 'fulfilled' }])
      } finally {
        releaseLock.resolve()
        await lockerResult
        await deletionResult
        await writerResult
      }

      const retained =
        reportType === 'handheld'
          ? await db.listing.findUniqueOrThrow({
              where: { id: report.id },
              include: { votes: true },
            })
          : await db.pcListing.findUniqueOrThrow({
              where: { id: report.id },
              include: { votes: true },
            })
      expect(retained).toMatchObject({
        upvoteCount: 0,
        downvoteCount: 1,
        voteCount: 1,
        successRate: calculateWilsonScore(0, 1),
        votes: [{ userId: fixtures.writer.id, value: false }],
      })
      expect(await db.user.findUnique({ where: { id: voter.id } })).toBeNull()
    },
  )

  it('preserves the author trust correction while a different report receives a vote', async () => {
    const author = await db.user.create({
      data: {
        clerkId: `${prefix}-trust-author`,
        email: `${prefix}-trust-author@example.invalid`,
        trustScore: 102,
      },
    })
    const voter = await db.user.create({
      data: {
        clerkId: `${prefix}-trust-voter`,
        email: `${prefix}-trust-voter@example.invalid`,
      },
    })
    const reportData = {
      gameId: fixtures.game.id,
      deviceId: fixtures.device.id,
      emulatorId: fixtures.emulator.id,
      performanceId: fixtures.performance.id,
      authorId: author.id,
    }
    await db.listing.create({
      data: {
        ...reportData,
        upvoteCount: 1,
        voteCount: 1,
        successRate: calculateWilsonScore(1, 0),
        votes: { create: { userId: voter.id, value: true } },
      },
    })
    const otherReport = await db.listing.create({ data: reportData })

    const lockReady = Promise.withResolvers<number>()
    const releaseLock = Promise.withResolvers<void>()
    const locker = db.$transaction(
      async (tx) => {
        try {
          // Pause deletion after its trust correction while another report remains writable.
          await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${voter.id} FOR KEY SHARE`
          const [connection] = await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`
          if (!connection) throw new Error('Missing PostgreSQL backend PID')
          lockReady.resolve(connection.pid)
          await releaseLock.promise
        } catch (error) {
          lockReady.reject(error)
          throw error
        }
      },
      { timeout: 20_000 },
    )
    const lockerResult = Promise.allSettled([locker])
    let deletionResult: ReturnType<typeof Promise.allSettled> | undefined
    let writerResult: ReturnType<typeof Promise.allSettled> | undefined
    try {
      const lockerPid = await lockReady.promise
      deletionResult = Promise.allSettled([accounts.deleteAccount({ id: voter.id })])
      const deletionPid = await waitForBlockedTransaction(lockerPid)

      const writer = db.$transaction(
        async (tx) => {
          await tx.vote.create({
            data: { listingId: otherReport.id, userId: fixtures.writer.id, value: true },
          })
          await updateListingVoteCounts(tx, otherReport.id, 'create', true)
          await handleListingVoteTrustEffects({
            tx,
            action: 'created',
            currentValue: true,
            previousValue: null,
            userId: fixtures.writer.id,
            listingId: otherReport.id,
            listingType: 'handheld',
            authorId: author.id,
          })
        },
        { timeout: 20_000 },
      )
      writerResult = Promise.allSettled([writer])
      await waitForBlockedTransaction(deletionPid)
      releaseLock.resolve()

      expect(await lockerResult).toMatchObject([{ status: 'fulfilled' }])
      expect(await deletionResult).toMatchObject([{ status: 'fulfilled', value: { id: voter.id } }])
      expect(await writerResult).toMatchObject([{ status: 'fulfilled' }])
    } finally {
      releaseLock.resolve()
      await lockerResult
      await deletionResult
      await writerResult
    }

    expect(await db.user.findUniqueOrThrow({ where: { id: author.id } })).toMatchObject({
      trustScore: 102,
    })
    const actions = await db.trustActionLog.findMany({
      where: { userId: author.id },
      orderBy: { weight: 'asc' },
      select: { action: true, weight: true },
    })
    expect(actions).toEqual([
      { action: TrustAction.VOTE_CHANGE_REVERSAL, weight: -2 },
      { action: TrustAction.LISTING_RECEIVED_UPVOTE, weight: 2 },
    ])
    expect(analytics.trust.trustScoreChanged).toHaveBeenCalledWith({
      userId: author.id,
      oldScore: 100,
      newScore: 102,
      action: TrustAction.LISTING_RECEIVED_UPVOTE,
      weight: 2,
    })
  })
})
