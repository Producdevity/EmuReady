import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getAuthorReportCounts } from './report-stats.service'
import type { PrismaClient } from '@orm'

function createMockPrisma() {
  return {
    listingReport: {
      count: vi.fn().mockResolvedValue(0),
    },
    pcListingReport: {
      count: vi.fn().mockResolvedValue(0),
    },
    listing: {
      count: vi.fn().mockResolvedValue(0),
    },
    pcListing: {
      count: vi.fn().mockResolvedValue(0),
    },
  }
}

describe('getAuthorReportCounts', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
  })

  it('sums handheld and PC reports for totalReports', async () => {
    mockPrisma.listingReport.count.mockResolvedValue(3)
    mockPrisma.pcListingReport.count.mockResolvedValue(2)

    const result = await getAuthorReportCounts(mockPrisma as unknown as PrismaClient, 'user-1')

    expect(result.totalReports).toBe(5)
  })

  it('includes PC reports when there are no handheld reports', async () => {
    mockPrisma.listingReport.count.mockResolvedValue(0)
    mockPrisma.pcListingReport.count.mockResolvedValue(4)

    const result = await getAuthorReportCounts(mockPrisma as unknown as PrismaClient, 'user-1')

    expect(result.totalReports).toBe(4)
    expect(result.hasReports).toBe(true)
  })

  it('sums reported listings from both types', async () => {
    mockPrisma.listing.count.mockResolvedValue(2)
    mockPrisma.pcListing.count.mockResolvedValue(1)

    const result = await getAuthorReportCounts(mockPrisma as unknown as PrismaClient, 'user-1')

    expect(result.reportedListingsCount).toBe(3)
  })

  it('returns hasReports true when any reports exist', async () => {
    mockPrisma.listingReport.count.mockResolvedValue(1)

    const result = await getAuthorReportCounts(mockPrisma as unknown as PrismaClient, 'user-1')

    expect(result.hasReports).toBe(true)
  })

  it('returns hasReports false when no reports exist', async () => {
    const result = await getAuthorReportCounts(mockPrisma as unknown as PrismaClient, 'user-1')

    expect(result.hasReports).toBe(false)
    expect(result.totalReports).toBe(0)
    expect(result.reportedListingsCount).toBe(0)
  })

  it('counts PENDING reports (regression test for status filter bug)', async () => {
    // Previously, only RESOLVED and UNDER_REVIEW were counted.
    // This verifies that all reports are counted regardless of status,
    // since no status filter is applied.
    mockPrisma.listingReport.count.mockResolvedValue(1)

    const result = await getAuthorReportCounts(mockPrisma as unknown as PrismaClient, 'user-1')

    expect(result.totalReports).toBe(1)
    expect(result.hasReports).toBe(true)

    // Verify no status filter was passed to the count query
    const countCall = mockPrisma.listingReport.count.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined
    const where = countCall?.where as Record<string, unknown> | undefined
    expect(where).not.toHaveProperty('status')
  })

  it('queries with correct authorId filter', async () => {
    await getAuthorReportCounts(mockPrisma as unknown as PrismaClient, 'user-42')

    expect(mockPrisma.listingReport.count).toHaveBeenCalledWith({
      where: { listing: { authorId: 'user-42' } },
    })
    expect(mockPrisma.pcListingReport.count).toHaveBeenCalledWith({
      where: { pcListing: { authorId: 'user-42' } },
    })
    expect(mockPrisma.listing.count).toHaveBeenCalledWith({
      where: { authorId: 'user-42', reports: { some: {} } },
    })
    expect(mockPrisma.pcListing.count).toHaveBeenCalledWith({
      where: { authorId: 'user-42', reports: { some: {} } },
    })
  })
})
