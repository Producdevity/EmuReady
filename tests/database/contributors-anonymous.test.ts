import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createPrismaClient } from '@/server/prisma-client'
import { getTopContributorsRaw } from '@/server/services/contributors.service'
import { ApprovalStatus, PcOs } from '@orm/client'

const databaseUrl = new URL(process.env.DATABASE_URL ?? '')
if (
  !['localhost', '127.0.0.1'].includes(databaseUrl.hostname) ||
  databaseUrl.pathname !== '/emuready_test'
) {
  throw new Error('Database tests require the disposable localhost emuready_test database')
}

const db = createPrismaClient()
const prefix = `contributors-anonymous-${randomUUID()}`

async function createFixtures() {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { clerkId: prefix, email: `${prefix}@example.invalid` },
    })
    const system = await tx.system.create({ data: { name: prefix } })
    const brand = await tx.deviceBrand.create({ data: { name: prefix } })
    const device = await tx.device.create({ data: { brandId: brand.id, modelName: prefix } })
    const cpu = await tx.cpu.create({ data: { brandId: brand.id, modelName: prefix } })
    const game = await tx.game.create({ data: { title: prefix, systemId: system.id } })
    const emulator = await tx.emulator.create({ data: { name: prefix } })
    const performance = await tx.performanceScale.create({ data: { label: prefix, rank: 1 } })
    const reportData = {
      gameId: game.id,
      emulatorId: emulator.id,
      performanceId: performance.id,
      status: ApprovalStatus.APPROVED,
    }
    const authorIds = [user.id, null, null, null]
    await tx.listing.createMany({
      data: authorIds.map((authorId) => ({ ...reportData, deviceId: device.id, authorId })),
    })
    await tx.pcListing.createMany({
      data: authorIds.map((authorId) => ({
        ...reportData,
        cpuId: cpu.id,
        authorId,
        memorySize: 16,
        os: PcOs.LINUX,
        osVersion: 'test',
      })),
    })
    return { user, system, brand, device, cpu, game, emulator, performance }
  })
}

let fixtures: Awaited<ReturnType<typeof createFixtures>> | undefined

describe('anonymous reports in the contributor leaderboard', () => {
  beforeAll(async () => {
    expect(
      await db.userBan.count({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
    ).toBe(0)
    fixtures = await createFixtures()
  })

  afterAll(async () => {
    if (fixtures) {
      await db.listing.deleteMany({ where: { gameId: fixtures.game.id } })
      await db.pcListing.deleteMany({ where: { gameId: fixtures.game.id } })
      await db.user.delete({ where: { id: fixtures.user.id } })
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

  it('excludes anonymous groups before applying the top contributor limit when no bans exist', async () => {
    expect(fixtures).toBeDefined()
    const contributors = await getTopContributorsRaw(db, 'all_time', 1)

    expect(contributors).toMatchObject([
      { userId: fixtures?.user.id, breakdown: { listings: 1, pcListings: 1, total: 2 } },
    ])
  })
})
