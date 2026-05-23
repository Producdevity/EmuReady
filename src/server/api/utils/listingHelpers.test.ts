import { describe, expect, it } from 'vitest'
import { buildProcessedOrderBy } from './listingHelpers'

describe('buildProcessedOrderBy', () => {
  it('defaults to processedAt desc when both args are null', () => {
    expect(buildProcessedOrderBy(null, null)).toEqual({ processedAt: 'desc' })
  })

  it('defaults to processedAt desc when both args are undefined', () => {
    expect(buildProcessedOrderBy(undefined, undefined)).toEqual({ processedAt: 'desc' })
  })

  it('honours explicit sortDirection with default sortField', () => {
    expect(buildProcessedOrderBy(undefined, 'asc')).toEqual({ processedAt: 'asc' })
    expect(buildProcessedOrderBy(null, 'asc')).toEqual({ processedAt: 'asc' })
  })

  it('maps createdAt directly', () => {
    expect(buildProcessedOrderBy('createdAt', 'asc')).toEqual({ createdAt: 'asc' })
    expect(buildProcessedOrderBy('createdAt', 'desc')).toEqual({ createdAt: 'desc' })
  })

  it('maps status directly', () => {
    expect(buildProcessedOrderBy('status', 'asc')).toEqual({ status: 'asc' })
  })

  it('maps game.title into a nested Prisma order clause', () => {
    expect(buildProcessedOrderBy('game.title', 'asc')).toEqual({ game: { title: 'asc' } })
  })

  it('maps author.name into a nested Prisma order clause', () => {
    expect(buildProcessedOrderBy('author.name', 'desc')).toEqual({ author: { name: 'desc' } })
  })

  it('maps game.system.name into a doubly-nested clause', () => {
    expect(buildProcessedOrderBy('game.system.name', 'asc')).toEqual({
      game: { system: { name: 'asc' } },
    })
  })

  it('maps emulator.name into a nested Prisma order clause', () => {
    expect(buildProcessedOrderBy('emulator.name', 'desc')).toEqual({
      emulator: { name: 'desc' },
    })
  })

  it('maps device into a composite brand+model sort array', () => {
    expect(buildProcessedOrderBy('device', 'asc')).toEqual([
      { device: { brand: { name: 'asc' } } },
      { device: { modelName: 'asc' } },
    ])
  })

  it('maps processedAt explicitly (no change from default)', () => {
    expect(buildProcessedOrderBy('processedAt', 'asc')).toEqual({ processedAt: 'asc' })
  })
})
