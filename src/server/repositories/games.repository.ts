import { PAGINATION } from '@/data/constants'
import { type PaginationResult, paginate, calculateOffset } from '@/server/utils/pagination'
import { buildSearchFilter, buildShadowBanFilter } from '@/server/utils/query-builders'
import { hasPermission } from '@/utils/permissions'
import { Prisma, ApprovalStatus, Role } from '@orm'
import { BaseRepository } from './base.repository'
// Monitoring will be integrated after fixing TypeScript issues

// Repository filters that match the schema plus internal fields
export interface GameFilters {
  systemId?: string | null
  search?: string | null
  status?: ApprovalStatus | null
  submittedBy?: string | null
  hideGamesWithNoListings?: boolean | null
  listingFilter?: 'all' | 'withListings' | 'noListings' | null
  limit?: number | null
  offset?: number | null
  page?: number | null
  sortField?: string | null
  sortDirection?: Prisma.SortOrder | null
  userRole?: Role | null
  userId?: string | null
  showNsfw?: boolean | null
}

/**
 * Repository for Game data access operations.
 * Handles all database interactions for games with support for:
 * - Pagination and filtering
 * - Permission-based visibility
 * - Shadow ban filtering
 * - NSFW content filtering
 * - Approval status management
 */
export class GamesRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    minimal: {
      system: { select: { id: true, name: true } },
    } satisfies Prisma.GameInclude,

    full: {
      system: {
        include: {
          emulators: true,
        },
      },
      submitter: true,
      listings: {
        where: { status: ApprovalStatus.APPROVED },
        include: {
          device: { include: { brand: true, soc: true } },
          emulator: true,
          performance: true,
          author: { select: { id: true, name: true, profileImage: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10,
      },
      pcListings: {
        where: { status: ApprovalStatus.APPROVED },
        include: {
          cpu: { include: { brand: true } },
          gpu: { include: { brand: true } },
          emulator: true,
          performance: true,
          author: { select: { id: true, name: true, profileImage: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10,
      },
      _count: {
        select: {
          listings: { where: { status: ApprovalStatus.APPROVED } },
          pcListings: { where: { status: ApprovalStatus.APPROVED } },
        },
      },
    } satisfies Prisma.GameInclude,
  } as const

  static readonly selects = {
    listingFields: {
      id: true,
      title: true,
      systemId: true,
      imageUrl: true,
      boxartUrl: true,
      bannerUrl: true,
      tgdbGameId: true,
      metadata: true,
      isErotic: true,
      status: true,
      submittedBy: true,
      submittedAt: true,
      approvedBy: true,
      approvedAt: true,
      createdAt: true,
    } satisfies Prisma.GameSelect,

    withCounts: {
      id: true,
      title: true,
      systemId: true,
      imageUrl: true,
      boxartUrl: true,
      bannerUrl: true,
      tgdbGameId: true,
      metadata: true,
      isErotic: true,
      status: true,
      submittedBy: true,
      submittedAt: true,
      approvedBy: true,
      approvedAt: true,
      createdAt: true,
      system: { select: { id: true, name: true } },
      _count: { select: { listings: true, pcListings: true } },
    } satisfies Prisma.GameSelect,

    withSubmitter: {
      id: true,
      title: true,
      systemId: true,
      imageUrl: true,
      boxartUrl: true,
      bannerUrl: true,
      tgdbGameId: true,
      metadata: true,
      isErotic: true,
      status: true,
      submittedBy: true,
      submittedAt: true,
      approvedBy: true,
      approvedAt: true,
      createdAt: true,
      system: { select: { id: true, name: true } },
      submitter: { select: { id: true, name: true, email: true } },
      _count: { select: { listings: true, pcListings: true } },
    } satisfies Prisma.GameSelect,

    mobile: {
      id: true,
      title: true,
      systemId: true,
      imageUrl: true,
      boxartUrl: true,
      bannerUrl: true,
      tgdbGameId: true,
      metadata: true,
      isErotic: true,
      status: true,
      createdAt: true,
      system: { select: { id: true, name: true, key: true } },
      _count: {
        select: {
          listings: { where: { status: ApprovalStatus.APPROVED } },
        },
      },
    } satisfies Prisma.GameSelect,
  } as const

  // Type aliases for cleaner method signatures - using proper type declarations
  // These are compile-time only types, not runtime values

  /**
   * Get games with pagination and filtering for web interface.
   * Applies role-based visibility rules and shadow ban filtering.
   *
   * @param filters - Filtering options including search, status, pagination
   * @param filters.systemId - Filter by system/platform ID
   * @param filters.search - Search term for title matching
   * @param filters.status - Approval status filter (admin only)
   * @param filters.listingFilter - Filter by listing existence
   * @param filters.userRole - User's role for permission checking
   * @param filters.userId - User's ID for showing their pending games
   * @param filters.limit - Number of items per page (default: PAGINATION.DEFAULT_LIMIT)
   * @param filters.page - Page number for pagination
   * @returns Games array with complete pagination metadata
   * @throws {Error} If database query fails
   */
  async list(filters: GameFilters = {}): Promise<{
    games: (
      | Prisma.GameGetPayload<{ select: typeof GamesRepository.selects.withSubmitter }>
      | Prisma.GameGetPayload<{ select: typeof GamesRepository.selects.withCounts }>
    )[]
    pagination: PaginationResult
  }> {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = 0,
      page,
      sortField,
      sortDirection,
      userRole,
    } = filters

    const where = this.buildWhereClause(filters)
    const orderBy = this.buildOrderBy(sortField, sortDirection)
    const actualOffset = calculateOffset({ page, offset }, limit ?? PAGINATION.DEFAULT_LIMIT)

    const includeSubmitter = hasPermission(userRole, Role.ADMIN)

    const [total, games] = await Promise.all([
      this.prisma.game.count({ where }),
      this.prisma.game.findMany({
        where,
        select: includeSubmitter
          ? GamesRepository.selects.withSubmitter
          : GamesRepository.selects.withCounts,
        orderBy,
        skip: actualOffset,
        take: limit ?? PAGINATION.DEFAULT_LIMIT,
      }),
    ])

    const pagination = paginate({
      total: total,
      page: page ?? Math.floor(actualOffset / (limit ?? PAGINATION.DEFAULT_LIMIT)) + 1,
      limit: limit ?? PAGINATION.DEFAULT_LIMIT,
    })

    return { games, pagination }
  }

  /**
   * Get games optimized for mobile API.
   * Returns approved games only with simplified structure.
   *
   * @param filters - Mobile-specific filtering options
   * @param filters.systemId - Filter by system ID
   * @param filters.search - Search in game titles
   * @param filters.showNsfw - Include NSFW content (default: false)
   * @param filters.page - Page number (default: 1)
   * @param filters.limit - Items per page (default: PAGINATION.DEFAULT_LIMIT)
   * @returns Simplified game data optimized for mobile consumption
   */
  async listMobile(filters: GameFilters = {}): Promise<{
    games: Prisma.GameGetPayload<{ select: typeof GamesRepository.selects.mobile }>[]
    pagination: PaginationResult
  }> {
    const {
      systemId,
      search,
      showNsfw = false,
      page,
      offset,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = filters

    const where: Prisma.GameWhereInput = {
      status: ApprovalStatus.APPROVED,
      ...(systemId && { systemId }),
      ...(search && { title: { contains: search, mode: Prisma.QueryMode.insensitive } }),
      ...(!showNsfw && { isErotic: false }),
    }

    const actualOffset = calculateOffset({ page, offset }, limit ?? PAGINATION.DEFAULT_LIMIT)

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        select: GamesRepository.selects.mobile,
        orderBy: [
          { listings: { _count: 'desc' } },
          { createdAt: 'desc' },
          { title: this.sortOrder },
        ],
        skip: actualOffset,
        take: limit ?? PAGINATION.DEFAULT_LIMIT,
      }),
      this.prisma.game.count({ where }),
    ])

    const pagination = paginate({
      total: total,
      page: page ?? Math.floor(actualOffset / (limit ?? PAGINATION.DEFAULT_LIMIT)) + 1,
      limit: limit ?? PAGINATION.DEFAULT_LIMIT,
    })

    return {
      games,
      pagination,
    }
  }

  /**
   * Get popular games for mobile based on listing count.
   * Returns top 20 approved games sorted by listing count.
   *
   * @param showNsfw - Include NSFW content (default: false)
   * @returns Array of popular games with mobile-optimized data
   */
  async listPopularMobile(
    showNsfw = false,
  ): Promise<Prisma.GameGetPayload<{ select: typeof GamesRepository.selects.mobile }>[]> {
    const where: Prisma.GameWhereInput = {
      status: ApprovalStatus.APPROVED,
      ...(!showNsfw && { isErotic: false }),
    }

    return this.prisma.game.findMany({
      where,
      select: GamesRepository.selects.mobile,
      orderBy: { listings: { _count: Prisma.SortOrder.desc } },
      take: PAGINATION.DEFAULT_LIMIT,
    })
  }

  /**
   * Search games for mobile by title.
   * Returns approved games matching the search query.
   *
   * @param query - Search query for game titles
   * @param showNsfw - Include NSFW content (default: false)
   * @returns Array of games matching the search
   */
  async listSearchMobile(
    query: string,
    showNsfw = false,
  ): Promise<Prisma.GameGetPayload<{ select: typeof GamesRepository.selects.mobile }>[]> {
    const where: Prisma.GameWhereInput = {
      status: ApprovalStatus.APPROVED,
      title: { contains: query, mode: this.mode },
      ...(!showNsfw && { isErotic: false }),
    }

    return this.prisma.game.findMany({
      where,
      select: GamesRepository.selects.mobile,
      orderBy: [
        { listings: { _count: Prisma.SortOrder.desc } },
        { createdAt: Prisma.SortOrder.desc },
        { title: this.sortOrder },
      ],
      take: PAGINATION.DEFAULT_LIMIT,
    })
  }

  /**
   * Get a single game by ID for mobile.
   * Returns simplified game data optimized for mobile.
   *
   * @param id - The game's unique identifier
   * @returns Game data for mobile or null if not found
   */
  async byIdMobile(
    id: string,
  ): Promise<Prisma.GameGetPayload<{ select: typeof GamesRepository.selects.mobile }> | null> {
    return this.prisma.game.findUnique({
      where: { id },
      select: GamesRepository.selects.mobile,
    })
  }

  /**
   * Get a single game by ID with full details including listings.
   * Applies shadow ban filtering unless user can see banned content.
   *
   * @param id - The game's unique identifier
   * @param canSeeBannedUsers - Whether to include content from banned users
   * @returns Complete game data with listings or null if not found
   */
  async byId(
    id: string,
    canSeeBannedUsers = false,
  ): Promise<Prisma.GameGetPayload<{ include: typeof GamesRepository.includes.full }> | null> {
    // Build shadow ban filter once
    const shadowBanFilter = canSeeBannedUsers ? undefined : buildShadowBanFilter(null)

    const listingsWhere: Prisma.ListingWhereInput = {
      status: ApprovalStatus.APPROVED,
      ...(shadowBanFilter && { author: shadowBanFilter }),
    }

    const pcListingsWhere: Prisma.PcListingWhereInput = {
      status: ApprovalStatus.APPROVED,
      ...(shadowBanFilter && { author: shadowBanFilter }),
    }

    // Build the include based on the static full include shape
    const fullInclude = {
      ...GamesRepository.includes.full,
      listings: { ...GamesRepository.includes.full.listings, where: listingsWhere },
      pcListings: { ...GamesRepository.includes.full.pcListings, where: pcListingsWhere },
    }

    return this.prisma.game.findUnique({
      where: { id },
      include: fullInclude,
    })
  }

  /**
   * Check if a game exists with the given title and system.
   * Used to prevent duplicate game entries.
   *
   * @param title - Game title to check
   * @param systemId - System/platform ID
   * @returns True if game exists, false otherwise
   */
  async exists(title: string, systemId: string): Promise<boolean> {
    const game = await this.prisma.game.findFirst({ where: { title, systemId } })
    return !!game
  }

  /**
   * Create a new game entry.
   *
   * @param data - Game creation data following Prisma schema
   * @returns Created game with system relationship
   * @throws {Error} If unique constraint violated
   */
  async create(
    data: Prisma.GameCreateInput,
  ): Promise<Prisma.GameGetPayload<{ include: typeof GamesRepository.includes.minimal }>> {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.game.create({
          data,
          include: GamesRepository.includes.minimal,
        }),
      'Game',
    )
  }

  /**
   * Update an existing game.
   *
   * @param id - Game ID to update
   * @param data - Partial update data
   * @returns Updated game with system relationship
   * @throws {Error} If game not found or constraint violated
   */
  async update(
    id: string,
    data: Prisma.GameUpdateInput,
  ): Promise<Prisma.GameGetPayload<{ include: typeof GamesRepository.includes.minimal }>> {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.game.update({
          where: { id },
          data,
          include: GamesRepository.includes.minimal,
        }),
      'Game',
    )
  }

  /**
   * Permanently delete a game.
   *
   * @param id - Game ID to delete
   * @throws {Error} If game not found or has related listings
   */
  async delete(id: string): Promise<void> {
    await this.handleDatabaseOperation(() => this.prisma.game.delete({ where: { id } }), 'Game')
  }

  /**
   * Get statistical summary of games in the system.
   * Used for admin dashboard metrics.
   *
   * @returns Object containing counts by approval status
   */
  async stats(): Promise<{
    pending: number
    approved: number
    rejected: number
    total: number
  }> {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.game.count({ where: { status: ApprovalStatus.PENDING } }),
      this.prisma.game.count({ where: { status: ApprovalStatus.APPROVED } }),
      this.prisma.game.count({ where: { status: ApprovalStatus.REJECTED } }),
    ])

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    }
  }

  /**
   * Build Prisma where clause from filter parameters.
   * Handles complex permission logic and visibility rules.
   *
   * @private
   * @param filters - Filter parameters
   * @returns Prisma where clause object
   */
  private buildWhereClause(filters: GameFilters): Prisma.GameWhereInput {
    const { systemId, search, status, submittedBy, listingFilter, userRole, userId } = filters

    const where: Prisma.GameWhereInput = {}

    if (systemId) where.systemId = systemId

    // Handle listing filter
    if (listingFilter === 'withListings') {
      where.listings = { some: {} }
    } else if (listingFilter === 'noListings') {
      where.listings = { none: {} }
    }

    // Handle game approval status filtering
    if (hasPermission(userRole, Role.ADMIN)) {
      // Admins can see all games
      if (status) where.status = status
      if (submittedBy) where.submittedBy = submittedBy
    } else if (userId) {
      // Authenticated users see approved games + their own pending games
      if (status === ApprovalStatus.PENDING) {
        where.status = ApprovalStatus.PENDING
        where.submittedBy = userId
      } else {
        where.OR = [
          { status: ApprovalStatus.APPROVED },
          { status: ApprovalStatus.PENDING, submittedBy: userId },
        ]
      }
    } else {
      // Public users only see approved games
      where.status = ApprovalStatus.APPROVED
    }

    // Add search conditions
    const searchConditions = buildSearchFilter(search, ['title'])
    if (searchConditions) where.OR = searchConditions

    return where
  }

  /**
   * Build Prisma orderBy clause from sort parameters.
   *
   * @private
   * @param sortField - Field to sort by
   * @param sortDirection - Sort direction (asc/desc)
   * @returns Prisma orderBy clause
   */
  private buildOrderBy(
    sortField?: string | null,
    sortDirection?: Prisma.SortOrder | null,
  ): Prisma.GameOrderByWithRelationInput {
    const direction = sortDirection || this.sortOrder

    switch (sortField) {
      case 'title':
        return { title: direction }
      case 'system.name':
        return { system: { name: direction } }
      case 'listingsCount':
        return { listings: { _count: direction } }
      case 'submittedAt':
        return { submittedAt: direction }
      case 'status':
        return { status: direction }
      default:
        return { title: this.sortOrder }
    }
  }
}
