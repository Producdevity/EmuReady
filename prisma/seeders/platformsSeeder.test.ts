import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type PrismaClient } from '@orm'
import platformsSeeder, { PLATFORMS } from './platformsSeeder'

function createMockPrisma() {
  return {
    platform: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  } as unknown as PrismaClient
}

describe('platformsSeeder', () => {
  let prisma: PrismaClient

  beforeEach(() => {
    prisma = createMockPrisma()
  })

  it('upserts all 9 canonical platform entries', async () => {
    await platformsSeeder(prisma)

    expect(prisma.platform.upsert).toHaveBeenCalledTimes(9)
    expect(PLATFORMS).toHaveLength(9)
  })

  it('uses slug as the unique key so re-running does not duplicate', async () => {
    await platformsSeeder(prisma)

    for (const platform of PLATFORMS) {
      expect(prisma.platform.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: platform.slug } }),
      )
    }
  })

  it('seeds all the expected platform slugs', () => {
    const slugs = PLATFORMS.map((p) => p.slug).sort()
    expect(slugs).toEqual([
      'android',
      'freebsd',
      'ios',
      'linux-arm',
      'linux-x86',
      'macos-arm',
      'macos-x86',
      'windows-arm',
      'windows-x86',
    ])
  })

  it('classifies each platform into the correct scope', () => {
    const scopeBySlug = Object.fromEntries(PLATFORMS.map((p) => [p.slug, p.scope]))

    expect(scopeBySlug['android']).toBe('MOBILE')
    expect(scopeBySlug['ios']).toBe('MOBILE')
    expect(scopeBySlug['windows-x86']).toBe('DESKTOP')
    expect(scopeBySlug['windows-arm']).toBe('DESKTOP')
    expect(scopeBySlug['macos-x86']).toBe('DESKTOP')
    expect(scopeBySlug['macos-arm']).toBe('DESKTOP')
    expect(scopeBySlug['linux-x86']).toBe('DESKTOP')
    expect(scopeBySlug['linux-arm']).toBe('UNIVERSAL')
    expect(scopeBySlug['freebsd']).toBe('DESKTOP')
  })

  it('writes all 9 platforms on a subsequent run (idempotent)', async () => {
    await platformsSeeder(prisma)
    const callCountAfterFirstRun = vi.mocked(prisma.platform.upsert).mock.calls.length

    await platformsSeeder(prisma)
    const callCountAfterSecondRun = vi.mocked(prisma.platform.upsert).mock.calls.length

    // Second run should perform another 9 upserts — the point of idempotency
    // is the upsert primitive (same count both times), not that we skip work.
    expect(callCountAfterSecondRun - callCountAfterFirstRun).toBe(9)
  })
})
