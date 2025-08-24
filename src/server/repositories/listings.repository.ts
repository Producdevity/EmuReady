import { calculateOffset, createPaginationResult } from '@/server/utils/pagination'
import {
  buildNsfwFilter,
  buildArrayFilter,
  buildShadowBanFilter,
  buildApprovalStatusFilter,
} from '@/server/utils/query-builders'
import { Prisma, ApprovalStatus, type Role } from '@orm'
import { BaseRepository } from './base.repository'

export interface ListingFilters {
  // Common filters for both mobile and web
  gameId?: string
  systemIds?: string[]
  deviceIds?: string[]
  socIds?: string[]
  emulatorIds?: string[]
  performanceIds?: (number | string)[]
  search?: string

  // Pagination
  page?: number
  limit?: number
  offset?: number

  // Sorting
  sortField?: string
  sortDirection?: 'asc' | 'desc'

  // Web-specific filters
  approvalStatus?: ApprovalStatus
  myListings?: boolean
  authorId?: string

  // User context
  userId?: string
  userRole?: string
  showNsfw?: boolean
}

export interface ListingStats {
  upVotes: number
  downVotes: number
  totalVotes: number
  successRate: number
  userVote?: boolean | null
}

// Type namespace for ListingsRepository
export namespace ListingsRepositoryTypes {
  export type Minimal = Prisma.ListingGetPayload<{
    include: {
      game: { select: { id: true; title: true; systemId: true } }
      device: { include: { brand: true; soc: true } }
      emulator: { select: { id: true; name: true; logo: true } }
      performance: true
      author: { select: { id: true; name: true; profileImage: true } }
    }
  }>

  export type Default = Prisma.ListingGetPayload<{
    include: {
      game: { select: { id: true; title: true; systemId: true } }
      device: { include: { brand: true; soc: true } }
      emulator: { select: { id: true; name: true; logo: true } }
      performance: true
      author: { select: { id: true; name: true; profileImage: true } }
      _count: { select: { votes: true; comments: true } }
    }
  }>

  export type WithVotes = Prisma.ListingGetPayload<{
    include: {
      game: { select: { id: true; title: true; systemId: true } }
      device: { include: { brand: true; soc: true } }
      emulator: { select: { id: true; name: true; logo: true } }
      performance: true
      author: { select: { id: true; name: true; profileImage: true } }
      votes: { select: { id: true; value: true; userId: true } }
      _count: { select: { votes: true; comments: true } }
    }
  }>

  export type Full = Prisma.ListingGetPayload<{
    include: {
      game: {
        include: {
          system: { select: { id: true; name: true; key: true } }
        }
      }
      device: { include: { brand: true; soc: true } }
      emulator: {
        include: {
          customFieldDefinitions: { orderBy: { displayOrder: 'asc' } }
        }
      }
      performance: true
      author: {
        select: {
          id: true
          name: true
          profileImage: true
          userBans: true
        }
      }
      customFieldValues: {
        include: { customFieldDefinition: true }
      }
      votes: { select: { id: true; value: true; userId: true } }
      developerVerifications: {
        include: { developer: { select: { id: true; name: true } } }
      }
      _count: { select: { votes: true; comments: true } }
    }
  }>
}

/**
 * Repository for Listing data access operations.
 * Manages game compatibility reports with:
 * - Vote count tracking and Wilson score sorting
 * - Shadow ban filtering for content moderation
 * - Advanced search and filtering capabilities
 * - Mobile and web-optimized query methods
 */
export class ListingsRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    minimal: {
      game: { select: { id: true, title: true } },
      emulator: { select: { id: true, name: true } },
      performance: true,
      author: { select: { id: true, name: true } },
    } satisfies Prisma.ListingInclude,

    default: {
      game: { select: { id: true, title: true, systemId: true } },
      device: { include: { brand: true, soc: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: true,
      author: { select: { id: true, name: true, profileImage: true } },
    } satisfies Prisma.ListingInclude,

    withVotes: {
      game: { select: { id: true, title: true, systemId: true } },
      device: { include: { brand: true, soc: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: true,
      author: { select: { id: true, name: true, profileImage: true } },
      votes: true,
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    } satisfies Prisma.ListingInclude,

    full: {
      game: {
        include: {
          system: { select: { id: true, name: true, key: true } },
        },
      },
      device: { include: { brand: true, soc: true } },
      emulator: true,
      performance: true,
      author: true,
      votes: true,
      comments: {
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      },
      customFieldValues: {
        include: {
          customFieldDefinition: true,
        },
      },
      developerVerifications: {
        include: {
          developer: { select: { id: true, name: true } },
        },
      },
    } satisfies Prisma.ListingInclude,
  } as const

  /**
   * Build the where clause for listing queries
   * @param filters - Listing filter options including search, IDs, and user context
   * @returns Prisma where clause object
   * @private
   */
  private buildWhereClause(filters: ListingFilters): Prisma.ListingWhereInput {
    const where: Prisma.ListingWhereInput = {}

    // Basic filters
    if (filters.gameId) where.gameId = filters.gameId

    // Emulator and performance filters (simple array filters)
    const emulatorFilter = buildArrayFilter(filters.emulatorIds, 'emulatorId')
    if (emulatorFilter) Object.assign(where, emulatorFilter)

    // Handle performance IDs (ensure they're numbers)
    const numericPerformanceIds = filters.performanceIds?.map((id) =>
      typeof id === 'string' ? Number(id) : id,
    )
    const performanceFilter = buildArrayFilter(numericPerformanceIds, 'performanceId')
    if (performanceFilter) Object.assign(where, performanceFilter)

    // Handle device and SoC filters with OR logic (matching original implementation)
    const deviceSocConditions: Prisma.ListingWhereInput[] = []

    if (filters.deviceIds && filters.deviceIds.length > 0) {
      deviceSocConditions.push({ deviceId: { in: filters.deviceIds } })
    }

    if (filters.socIds && filters.socIds.length > 0) {
      deviceSocConditions.push({ device: { socId: { in: filters.socIds } } })
    }

    // Apply device/SoC OR conditions if any exist
    if (deviceSocConditions.length > 0) {
      if (deviceSocConditions.length === 1) {
        Object.assign(where, deviceSocConditions[0])
      } else {
        where.OR = deviceSocConditions
      }
    }

    // System filtering through game relationship
    if (filters.systemIds && filters.systemIds.length > 0) {
      where.game = { ...(where.game as Prisma.GameWhereInput), systemId: { in: filters.systemIds } }
    }

    // Build comprehensive search conditions
    if (filters.search) {
      const mode = Prisma.QueryMode.insensitive
      const searchFilters: Prisma.ListingWhereInput[] = [
        { game: { title: { contains: filters.search, mode } } },
        { notes: { contains: filters.search, mode } },
        { device: { modelName: { contains: filters.search, mode } } },
        { device: { brand: { name: { contains: filters.search, mode } } } },
        { emulator: { name: { contains: filters.search, mode } } },
      ]

      // Combine search with existing OR conditions if present
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchFilters }]
        delete where.OR
      } else {
        where.OR = searchFilters
      }
    }

    // Approval status (default to APPROVED for public access)
    const statusFilter = buildApprovalStatusFilter(
      filters.userRole as Role | undefined,
      filters.userId,
      filters.approvalStatus,
      'authorId',
    )
    if (statusFilter) Object.assign(where, statusFilter)

    // NSFW filtering on games
    where.game = {
      ...(where.game as Prisma.GameWhereInput),
      status: ApprovalStatus.APPROVED,
      ...buildNsfwFilter(filters.showNsfw),
    }

    // Shadow ban filtering
    const shadowBanFilter = buildShadowBanFilter(
      filters.userRole as Role | undefined,
      filters.userId,
    )
    if (shadowBanFilter) where.author = shadowBanFilter

    // My listings filter
    if (filters.myListings && filters.userId) where.authorId = filters.userId

    return where
  }

  /**
   * Get paginated listings with all related data
   */
  async getListings(filters: ListingFilters) {
    const limit = filters.limit || 20
    const offset = calculateOffset({ page: filters.page, offset: filters.offset }, limit)

    const where = this.buildWhereClause(filters)

    // Build order by clause - now includes native success rate sorting!
    const orderBy = this.buildOrderBy(filters.sortField, filters.sortDirection)

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          ...ListingsRepository.includes.default,
          performance: { select: { id: true, label: true, rank: true, description: true } },
          game: { include: { system: { select: { id: true, name: true, key: true } } } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ])

    // Get user votes for these listings if user is logged in
    const userVotes = filters.userId
      ? await this.prisma.vote.findMany({
          where: {
            userId: filters.userId,
            listingId: { in: listings.map((l) => l.id) },
          },
          select: { listingId: true, value: true },
        })
      : []

    const userVoteMap = new Map(userVotes.map((v) => [v.listingId, v.value]))

    // Add user vote info and use materialized stats
    const listingsWithStats = listings.map((listing) => ({
      ...listing,
      upVotes: listing.upvoteCount,
      downVotes: listing.downvoteCount,
      totalVotes: listing.voteCount,
      successRate: listing.successRate,
      userVote: userVoteMap.get(listing.id) ?? null,
    }))

    const pagination = createPaginationResult(
      total,
      { page: filters.page, offset: filters.offset },
      limit,
      offset,
    )

    return {
      listings: listingsWithStats,
      pagination,
    }
  }

  /**
   * Get a single listing by ID with full details
   */
  async getListingById(id: string, userId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        ...ListingsRepository.includes.full,
        emulator: { include: { customFieldDefinitions: true } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    if (!listing) return null

    // Get user vote if user is logged in
    const userVote = userId
      ? await this.prisma.vote.findUnique({
          where: { userId_listingId: { userId, listingId: listing.id } },
          select: { value: true },
        })
      : null

    // Use materialized stats
    return {
      ...listing,
      upVotes: listing.upvoteCount,
      downVotes: listing.downvoteCount,
      totalVotes: listing.voteCount,
      successRate: listing.successRate,
      userVote: userVote?.value ?? null,
    }
  }

  /**
   * Build order by clause based on sort field
   */
  private buildOrderBy(
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
  ): Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] {
    const direction = (sortDirection as Prisma.SortOrder) || this.sortOrder

    switch (sortField) {
      case 'game.title':
        return { game: { title: direction } }
      case 'game.system.name':
        return { game: { system: { name: direction } } }
      case 'device':
        return [{ device: { brand: { name: direction } } }, { device: { modelName: direction } }]
      case 'emulator.name':
        return { emulator: { name: direction } }
      case 'performance.rank':
        return { performance: { rank: direction } }
      case 'successRate':
        // Wilson Score already accounts for vote count in its calculation
        return [
          { successRate: direction }, // Primary sort by Wilson Score
          { createdAt: Prisma.SortOrder.desc }, // Tie breaker for identical scores
        ]
      case 'createdAt':
      default:
        return { createdAt: direction }
    }
  }

  /**
   * Get featured listings (high success rate)
   */
  async getFeaturedListings(limit: number = 10) {
    const listings = await this.prisma.listing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        game: {
          status: ApprovalStatus.APPROVED,
        },
        // Filter by success rate using materialized column
        successRate: { gte: 0.7 },
        voteCount: { gte: 1 }, // Ensure at least one vote
      },
      take: limit,
      orderBy: [
        { successRate: 'desc' }, // Wilson Score accounts for both rate and confidence
        { createdAt: 'desc' }, // Tie breaker
      ],
      include: {
        ...ListingsRepository.includes.default,
        game: { include: { system: { select: { id: true, name: true, key: true } } } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    // Use materialized stats
    return listings.map((listing) => ({
      ...listing,
      upVotes: listing.upvoteCount,
      downVotes: listing.downvoteCount,
      totalVotes: listing.voteCount,
      successRate: listing.successRate,
      userVote: null, // Featured listings don't need user vote info
    }))
  }

  /**
   * Get recent listings
   */
  async getRecentListings(limit: number = 20) {
    return this.getListings({ limit, sortField: 'createdAt', sortDirection: 'desc' })
  }

  /**
   * Get listings by game
   */
  async getListingsByGame(gameId: string, userId?: string) {
    return this.getListings({ gameId, userId, limit: 100 })
  }

  /**
   * Get user's listings
   */
  async getUserListings(userId: string, includeUnapproved: boolean = false) {
    const filters: ListingFilters = {
      authorId: userId,
      userId,
      myListings: true,
    }

    if (!includeUnapproved) filters.approvalStatus = ApprovalStatus.APPROVED

    return this.getListings(filters)
  }
}
