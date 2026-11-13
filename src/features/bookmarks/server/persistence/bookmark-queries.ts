import { type z } from 'zod'
import {
  type GetListingBookmarksSchema,
  type GetPcListingBookmarksSchema,
} from '@/features/bookmarks/shared/bookmark.schemas'
import { ApprovalStatus, Prisma } from '@orm'

function reportFilters(input: z.output<typeof GetListingBookmarksSchema>) {
  const game: Prisma.GameWhereInput = {
    ...(input.search
      ? { title: { contains: input.search, mode: Prisma.QueryMode.insensitive } }
      : {}),
    ...(input.systemIds.length ? { systemId: { in: input.systemIds } } : {}),
  }
  return {
    status: ApprovalStatus.APPROVED,
    game: input.search || input.systemIds.length ? game : undefined,
    emulatorId: input.emulatorIds.length ? { in: input.emulatorIds } : undefined,
    performanceId: input.performanceIds.length ? { in: input.performanceIds } : undefined,
  }
}

export function buildListingBookmarkQuery(input: z.output<typeof GetListingBookmarksSchema>) {
  const where: Prisma.ListingBookmarkWhereInput = {
    userId: input.userId,
    listing: {
      ...reportFilters(input),
      ...(input.deviceIds.length ? { deviceId: { in: input.deviceIds } } : {}),
      ...(input.socIds.length ? { device: { socId: { in: input.socIds } } } : {}),
    },
  }
  const orderBy: Prisma.ListingBookmarkOrderByWithRelationInput[] = []
  switch (input.sortField) {
    case 'savedAt':
      orderBy.push({ createdAt: input.sortDirection })
      break
    case 'title':
      orderBy.push({ listing: { game: { title: input.sortDirection } } })
      break
    case 'performance':
      orderBy.push({ listing: { performance: { rank: input.sortDirection } } })
      break
    case 'successRate':
      orderBy.push({ listing: { successRate: input.sortDirection } })
      break
  }
  orderBy.push({ id: Prisma.SortOrder.asc })
  return { where, orderBy }
}

export function buildPcListingBookmarkQuery(input: z.output<typeof GetPcListingBookmarksSchema>) {
  const where: Prisma.PcListingBookmarkWhereInput = {
    userId: input.userId,
    pcListing: {
      ...reportFilters(input),
      ...(input.cpuIds.length ? { cpuId: { in: input.cpuIds } } : {}),
      ...(input.gpuIds.length ? { gpuId: { in: input.gpuIds } } : {}),
      ...(input.memoryMin !== null || input.memoryMax !== null
        ? { memorySize: { gte: input.memoryMin ?? undefined, lte: input.memoryMax ?? undefined } }
        : {}),
    },
  }
  const orderBy: Prisma.PcListingBookmarkOrderByWithRelationInput[] = []
  switch (input.sortField) {
    case 'savedAt':
      orderBy.push({ createdAt: input.sortDirection })
      break
    case 'title':
      orderBy.push({ pcListing: { game: { title: input.sortDirection } } })
      break
    case 'performance':
      orderBy.push({ pcListing: { performance: { rank: input.sortDirection } } })
      break
    case 'successRate':
      orderBy.push({ pcListing: { successRate: input.sortDirection } })
      break
  }
  orderBy.push({ id: Prisma.SortOrder.asc })
  return { where, orderBy }
}
