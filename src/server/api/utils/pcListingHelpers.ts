import type { Prisma } from '@orm'

/**
 * Common include for PC listings queries
 */
export const pcListingInclude = {
  game: {
    include: { system: true },
  },
  cpu: {
    include: { brand: true },
  },
  gpu: {
    include: { brand: true },
  },
  emulator: true,
  performance: true,
  author: true,
  _count: {
    select: {
      reports: true,
      votes: true,
      comments: {
        where: { deletedAt: null },
      },
    },
  },
} as const

/**
 * PC listing include with custom field values for detailed views
 */
export const pcListingDetailInclude = {
  ...pcListingInclude,
  emulator: {
    include: {
      customFieldDefinitions: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  },
  customFieldValues: {
    include: {
      customFieldDefinition: true,
    },
  },
  developerVerifications: {
    include: {
      developer: true,
    },
  },
} as const

/**
 * PC listing include for admin views (with processed user info)
 */
export const pcListingAdminInclude = {
  ...pcListingInclude,
  processedByUser: true,
} as const

/**
 * Builds orderBy array for PC listings based on sort field and direction
 */
export function buildPcListingOrderBy(
  sortField?: string,
  sortDirection?: 'asc' | 'desc',
): Prisma.PcListingOrderByWithRelationInput[] {
  const orderBy: Prisma.PcListingOrderByWithRelationInput[] = []

  if (sortField && sortDirection) {
    switch (sortField) {
      case 'game.title':
        orderBy.push({ game: { title: sortDirection } })
        break
      case 'game.system.name':
        orderBy.push({ game: { system: { name: sortDirection } } })
        break
      case 'cpu':
        orderBy.push({ cpu: { modelName: sortDirection } })
        break
      case 'gpu':
        orderBy.push({ gpu: { modelName: sortDirection } })
        break
      case 'emulator.name':
        orderBy.push({ emulator: { name: sortDirection } })
        break
      case 'performance.rank':
        orderBy.push({ performance: { rank: sortDirection } })
        break
      case 'author.name':
        orderBy.push({ author: { name: sortDirection } })
        break
      case 'memorySize':
        orderBy.push({ memorySize: sortDirection })
        break
      case 'status':
        orderBy.push({ status: sortDirection })
        break
      case 'createdAt':
        orderBy.push({ createdAt: sortDirection })
        break
    }
  }

  if (!orderBy.length) {
    orderBy.push({ createdAt: 'desc' })
  }

  return orderBy
}

/**
 * Builds where clause for PC listings with banned user filtering
 */
export function buildPcListingWhere(
  baseWhere: Prisma.PcListingWhereInput,
  canSeeBannedUsers: boolean = false,
): Prisma.PcListingWhereInput {
  const where = { ...baseWhere }

  // Filter out listings from banned users (shadow ban)
  if (!canSeeBannedUsers) {
    where.author = {
      userBans: {
        none: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
    }
  }

  return where
}

/**
 * Standard pagination response structure
 */
export function buildPaginationResponse(
  total: number,
  page: number,
  limit: number,
) {
  return {
    total,
    pages: Math.ceil(total / limit),
    page,
    limit,
  }
}
