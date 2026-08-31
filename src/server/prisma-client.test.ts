import { afterEach, describe, expect, it, vi } from 'vitest'

// Keep the test free of the generated Prisma client and driver adapter.
vi.mock('@orm/client', () => ({ PrismaClient: class {} }))
vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: class {} }))

const { getPoolMax, getPoolMin } = await import('./prisma-client')

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getPoolMax', () => {
  it('returns undefined for local hosts (Prisma default pool)', () => {
    expect(getPoolMax('postgres://u:p@localhost:5432/db')).toBeUndefined()
    expect(getPoolMax('postgres://u:p@127.0.0.1:5432/db')).toBeUndefined()
  })

  it('returns 1 on Vercel (one connection per ephemeral instance)', () => {
    vi.stubEnv('VERCEL', '1')
    expect(getPoolMax('postgres://u:p@db.supabase.co:5432/postgres')).toBe(1)
  })

  it('returns 5 for a remote persistent server when not on Vercel', () => {
    vi.stubEnv('VERCEL', '')
    expect(getPoolMax('postgres://u:p@db.supabase.co:5432/postgres')).toBe(5)
  })

  it('honors an explicit connection_limit over the default', () => {
    vi.stubEnv('VERCEL', '')
    expect(getPoolMax('postgres://u:p@db.supabase.co:5432/postgres?connection_limit=10')).toBe(10)
    // still honored on Vercel
    vi.stubEnv('VERCEL', '1')
    expect(getPoolMax('postgres://u:p@db.supabase.co:5432/postgres?connection_limit=3')).toBe(3)
  })

  it('ignores invalid connection_limit values and falls back to the default', () => {
    vi.stubEnv('VERCEL', '')
    expect(getPoolMax('postgres://u:p@db.supabase.co:5432/postgres?connection_limit=abc')).toBe(5)
    expect(getPoolMax('postgres://u:p@db.supabase.co:5432/postgres?connection_limit=0')).toBe(5)
    expect(getPoolMax('postgres://u:p@db.supabase.co:5432/postgres?connection_limit=-2')).toBe(5)
  })

  it('falls back when the connection string is not parseable', () => {
    vi.stubEnv('VERCEL', '')
    expect(getPoolMax('not-a-url')).toBe(5)
    vi.stubEnv('VERCEL', '1')
    expect(getPoolMax('not-a-url')).toBe(1)
  })
})

describe('getPoolMin', () => {
  it('keeps one connection warm on a persistent server', () => {
    vi.stubEnv('VERCEL', '')
    expect(getPoolMin()).toBe(1)
  })

  it('does not retain a connection in a Vercel instance', () => {
    vi.stubEnv('VERCEL', '1')
    expect(getPoolMin()).toBe(0)
  })
})
