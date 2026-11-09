// @vitest-environment node
import { PrismaPg } from '@prisma/adapter-pg'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@orm/client'

vi.unmock('@/server/db')
vi.unmock('@orm/client')

const clients: PrismaClient[] = []

beforeEach(() => {
  vi.stubGlobal('prisma', undefined)
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test?connection_limit=5')
})

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.$disconnect()))
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('Prisma pool reuse across server module instances', () => {
  it.each(['production', 'development', 'test'] as const)(
    'opens one adapter pool in %s when the database module is evaluated independently',
    async (environment) => {
      vi.stubEnv('NODE_ENV', environment)
      const connect = vi.spyOn(PrismaPg.prototype, 'connect')

      for (let index = 0; index < 3; index++) {
        vi.resetModules()
        const { prisma } = await import('./db')
        clients.push(prisma)
      }

      await Promise.all(clients.map((client) => client.$connect()))

      expect(connect).toHaveBeenCalledTimes(1)
      const adapter = await connect.mock.results[0]?.value
      expect(adapter?.underlyingDriver().options.max).toBe(5)
    },
  )
})
