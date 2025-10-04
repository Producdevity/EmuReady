import { PAGINATION } from '@/data/constants'
import { AppError, ResourceError } from '@/lib/errors'
import { canUserAutoApprove } from '@/lib/trust/service'
import { validateCustomFields } from '@/server/api/routers/listings/validation'
import { paginate, calculateOffset } from '@/server/utils/pagination'
import {
  buildNsfwFilter,
  buildArrayFilter,
  buildShadowBanFilter,
  buildApprovalStatusFilter,
} from '@/server/utils/query-builders'
import { roleIncludesRole } from '@/utils/permission-system'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { Prisma, ApprovalStatus, Role } from '@orm'
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
  userRole?: Role
  showNsfw?: boolean
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
  protected readonly sortOrder: Prisma.SortOrder = Prisma.SortOrder.desc

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

    forList: {
      game: { include: { system: { select: { id: true, name: true, key: true } } } },
      device: { include: { brand: true, soc: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: { select: { id: true, label: true, rank: true, description: true } },
      author: { select: { id: true, name: true, profileImage: true } },
      _count: { select: { votes: true, comments: true } },
    } satisfies Prisma.ListingInclude,

    forById: {
      game: { include: { system: { select: { id: true, name: true, key: true } } } },
      device: { include: { brand: true, soc: true } },
      emulator: { include: { customFieldDefinitions: true } },
      performance: true,
      author: { select: { id: true, name: true, profileImage: true, verifiedDeveloperBy: true } },
      comments: { include: { user: { select: { id: true, name: true, profileImage: true } } } },
      customFieldValues: {
        include: {
          customFieldDefinition: {
            select: {
              id: true,
              type: true,
              label: true,
              name: true,
              options: true,
              defaultValue: true,
              rangeDecimals: true,
              rangeUnit: true,
            },
          },
        },
      },
      developerVerifications: { include: { developer: { select: { id: true, name: true } } } },
      _count: { select: { votes: true, comments: true } },
    } satisfies Prisma.ListingInclude,

    forEmulatorConfig: {
      game: { include: { system: { select: { id: true, name: true, key: true } } } },
      emulator: { select: { id: true, name: true } },
      customFieldValues: {
        include: {
          customFieldDefinition: {
            select: {
              id: true,
              type: true,
              label: true,
              name: true,
              options: true,
              defaultValue: true,
              rangeDecimals: true,
              rangeUnit: true,
            },
          },
        },
      },
    } satisfies Prisma.ListingInclude,

    forFeatured: {
      game: { include: { system: { select: { id: true, name: true, key: true } } } },
      device: { include: { brand: true, soc: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: true,
      author: { select: { id: true, name: true, profileImage: true } },
      _count: { select: { votes: true, comments: true } },
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
    let gameFilter: Prisma.GameWhereInput = {}

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
      gameFilter = {
        ...gameFilter,
        systemId: { in: filters.systemIds },
      }
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
      filters.userRole,
      filters.userId,
      filters.approvalStatus,
      'authorId',
    )
    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        where.OR = where.OR
          ? [...(Array.isArray(where.OR) ? where.OR : [where.OR]), ...statusFilter]
          : statusFilter
      } else {
        Object.assign(where, statusFilter)
      }
    }

    // NSFW filtering on games
    gameFilter = {
      ...gameFilter,
      status: ApprovalStatus.APPROVED,
      ...buildNsfwFilter(filters.showNsfw),
    }

    // Apply game filter if any conditions were added
    if (Object.keys(gameFilter).length > 0) {
      where.game = gameFilter
    }

    // Shadow ban filtering
    const shadowBanFilter = buildShadowBanFilter(filters.userRole, filters.userId)
    if (shadowBanFilter) where.author = shadowBanFilter

    // My listings filter
    if (filters.myListings && filters.userId) where.authorId = filters.userId

    return where
  }

  /**
   * Get paginated listings with all related data
   */
  async list(filters: ListingFilters) {
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
        include: ListingsRepository.includes.forList,
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
    // Compute verified developer flags for authors per emulator
    const verifiedPairs = listings.length
      ? await this.prisma.verifiedDeveloper.findMany({
          where: {
            OR: listings.map((l) => ({ userId: l.authorId, emulatorId: l.emulatorId })),
          },
          select: { userId: true, emulatorId: true },
        })
      : []
    const verifiedSet = new Set(verifiedPairs.map((v) => `${v.userId}_${v.emulatorId}`))

    const listingsWithStats = listings.map((listing) => {
      const upVotes = listing.upvoteCount
      const downVotes = listing.downvoteCount

      return {
        ...listing,
        upVotes,
        downVotes,
        totalVotes: listing.voteCount,
        successRate: calculateWilsonScore(upVotes, downVotes),
        userVote: userVoteMap.get(listing.id) ?? null,
        isVerifiedDeveloper: verifiedSet.has(`${listing.authorId}_${listing.emulatorId}`),
      }
    })

    const pagination = paginate({
      total: total,
      page: filters.page ?? Math.floor(offset / limit) + 1,
      limit: limit,
    })

    return {
      listings: listingsWithStats,
      pagination,
    }
  }

  /**
   * Get a single listing by ID with full details
   */
  async byId(id: string, userId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: ListingsRepository.includes.forById,
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
    const isVerifiedDeveloper =
      listing.author.verifiedDeveloperBy?.some((vd) => vd.emulatorId === listing.emulatorId) ||
      false

    const upVotes = listing.upvoteCount
    const downVotes = listing.downvoteCount

    return {
      ...listing,
      upVotes,
      downVotes,
      totalVotes: listing.voteCount,
      successRate: calculateWilsonScore(upVotes, downVotes),
      userVote: userVote?.value ?? null,
      isVerifiedDeveloper,
    }
  }

  async findForEmulatorConfig(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      include: ListingsRepository.includes.forEmulatorConfig,
    })
  }

  /**
   * Get a single listing by ID with full details and optional access control.
   * When canSeeBannedUsers is false, hides listings from banned authors and REJECTED listings.
   */
  async byIdWithAccess(id: string, userId?: string, canSeeBannedUsers: boolean = false) {
    const where: Prisma.ListingWhereInput = {
      id,
      ...(canSeeBannedUsers
        ? {}
        : {
            author: {
              userBans: {
                none: {
                  isActive: true,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
              },
            },
            NOT: { status: ApprovalStatus.REJECTED },
          }),
    }

    const listing = await this.prisma.listing.findFirst({
      where,
      include: ListingsRepository.includes.forById,
    })

    if (!listing) {
      const exists = await this.prisma.listing.count({ where: { id } })
      if (exists > 0) throw ResourceError.listing.notAccessible()
      throw ResourceError.listing.notFound()
    }

    const userVote = userId
      ? await this.prisma.vote.findUnique({
          where: { userId_listingId: { userId, listingId: listing.id } },
          select: { value: true },
        })
      : null

    const isVerifiedDeveloper =
      listing.author.verifiedDeveloperBy?.some((vd) => vd.emulatorId === listing.emulatorId) ||
      false

    const upVotes = listing.upvoteCount
    const downVotes = listing.downvoteCount

    return {
      ...listing,
      upVotes,
      downVotes,
      totalVotes: listing.voteCount,
      successRate: calculateWilsonScore(upVotes, downVotes),
      userVote: userVote?.value ?? null,
      isVerifiedDeveloper,
    }
  }

  /**
   * Build order by clause based on sort field
   */
  private buildOrderBy(
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
  ): Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] {
    const direction: Prisma.SortOrder = sortDirection || this.sortOrder

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
          { createdAt: this.sortOrder }, // Tie breaker for identical scores
        ]
      case 'createdAt':
      default:
        return { createdAt: direction }
    }
  }

  /**
   * Get featured listings (high success rate)
   */
  async listFeatured(limit: number = 10) {
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
      include: ListingsRepository.includes.forFeatured,
    })

    // Compute verified developer flags
    const verifiedPairs = listings.length
      ? await this.prisma.verifiedDeveloper.findMany({
          where: {
            OR: listings.map((l) => ({ userId: l.authorId, emulatorId: l.emulatorId })),
          },
          select: { userId: true, emulatorId: true },
        })
      : []
    const verifiedSet = new Set(verifiedPairs.map((v) => `${v.userId}_${v.emulatorId}`))

    // Use materialized stats
    return listings.map((listing) => {
      const upVotes = listing.upvoteCount
      const downVotes = listing.downvoteCount

      return {
        ...listing,
        upVotes,
        downVotes,
        totalVotes: listing.voteCount,
        successRate: calculateWilsonScore(upVotes, downVotes),
        userVote: null, // Featured listings don't need user vote info
        isVerifiedDeveloper: verifiedSet.has(`${listing.authorId}_${listing.emulatorId}`),
      }
    })
  }

  /**
   * Get recent listings
   */
  async listRecent(limit: number = PAGINATION.DEFAULT_LIMIT) {
    return this.list({ limit, sortField: 'createdAt', sortDirection: 'desc' })
  }

  /**
   * Get listings by game
   */
  async listByGameId(gameId: string, userId?: string) {
    return this.list({ gameId, userId, limit: 100 })
  }

  /**
   * Get user's listings
   */
  async listByUserId(userId: string, includeUnapproved: boolean = false) {
    const filters: ListingFilters = {
      authorId: userId,
      userId,
      myListings: true,
    }

    if (!includeUnapproved) filters.approvalStatus = ApprovalStatus.APPROVED

    return this.list(filters)
  }

  /**
   * Create a new listing with validation and auto-approval logic.
   * Returns the created listing row.
   */
  async create(input: {
    authorId: string
    userRole: Role
    gameId: string
    deviceId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    customFieldValues?: { customFieldDefinitionId: string; value: unknown }[] | null
  }) {
    const {
      authorId,
      userRole,
      gameId,
      deviceId,
      emulatorId,
      performanceId,
      notes,
      customFieldValues,
    } = input

    return this.prisma.$transaction(async (tx) => {
      // Validate custom fields
      await validateCustomFields(tx, emulatorId, customFieldValues)

      // Check game system compatibility with emulator
      const gameForValidation = await tx.game.findUnique({
        where: { id: gameId },
        select: { systemId: true },
      })
      if (!gameForValidation) throw ResourceError.game.notFound()

      const emulator = await tx.emulator.findUnique({
        where: { id: emulatorId },
        include: { systems: { select: { id: true } } },
      })
      if (!emulator) throw ResourceError.emulator.notFound()

      const isSystemCompatible = emulator.systems.some((s) => s.id === gameForValidation.systemId)
      if (!isSystemCompatible)
        throw AppError.badRequest("The selected emulator does not support this game's system")

      // Determine approval
      const canAutoApprove = await canUserAutoApprove(authorId)
      const isAuthorOrHigher = roleIncludesRole(userRole, Role.AUTHOR)
      const status: ApprovalStatus =
        canAutoApprove || isAuthorOrHigher ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING

      // Create listing
      const newListing = await tx.listing.create({
        data: {
          gameId,
          deviceId,
          emulatorId,
          performanceId,
          notes,
          authorId,
          status,
          successRate: calculateWilsonScore(0, 0),
          ...((canAutoApprove || isAuthorOrHigher) && {
            processedByUserId: authorId,
            processedAt: new Date(),
            processedNotes:
              isAuthorOrHigher && !canAutoApprove
                ? 'Auto-approved (Author or higher role)'
                : 'Auto-approved (Trusted user)',
          }),
        },
      })

      // Create custom field values
      if (customFieldValues && customFieldValues.length > 0) {
        await tx.listingCustomFieldValue.createMany({
          data: customFieldValues.map((cfv) => ({
            listingId: newListing.id,
            customFieldDefinitionId: cfv.customFieldDefinitionId,
            value: cfv.value === null || cfv.value === undefined ? Prisma.JsonNull : cfv.value,
          })),
        })
      }

      return newListing
    })
  }
}
