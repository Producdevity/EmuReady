/**
 * Repository for PC Listing data access
 * Handles all database operations for PC listings with optimized vote count queries
 */

import { PAGINATION } from '@/data/constants'
import { AppError, ResourceError } from '@/lib/errors'
import { canUserAutoApprove } from '@/lib/trust/service'
import { paginate, calculateOffset } from '@/server/utils/pagination'
import { sanitizeInput } from '@/server/utils/security-validation'
import { roleIncludesRole } from '@/utils/permission-system'
import { calculateWilsonScore } from '@/utils/wilson-score'
import { Prisma, ApprovalStatus, type PcOs, Role } from '@orm'
import { BaseRepository } from './base.repository'
import { buildShadowBanFilter } from '../utils/query-builders'

export interface PcListingFilters {
  gameId?: string
  systemIds?: string[]
  cpuIds?: string[]
  gpuIds?: string[]
  emulatorIds?: string[]
  performanceIds?: number[]
  searchTerm?: string
  page?: number
  limit?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  approvalStatus?: ApprovalStatus
  myListings?: boolean
  userId?: string
  userRole?: Role
  showNsfw?: boolean
  osFilter?: string[]
  memoryMin?: number
  memoryMax?: number
  canSeeBannedUsers?: boolean
}

export class PcListingsRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    minimal: {
      game: { select: { id: true, title: true } },
      emulator: { select: { id: true, name: true } },
      performance: true,
      author: { select: { id: true, name: true } },
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
    } satisfies Prisma.PcListingInclude,

    default: {
      game: { select: { id: true, title: true, systemId: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: true,
      author: { select: { id: true, name: true, profileImage: true } },
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
    } satisfies Prisma.PcListingInclude,

    forList: {
      game: { include: { system: true } },
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
      emulator: true,
      performance: true,
      author: true,
      _count: { select: { reports: true, votes: true, comments: { where: { deletedAt: null } } } },
    } satisfies Prisma.PcListingInclude,

    forGetById: {
      game: { include: { system: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: { select: { id: true, label: true, rank: true, description: true } },
      author: { select: { id: true, name: true, profileImage: true } },
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
      _count: { select: { comments: true, votes: true } },
    } satisfies Prisma.PcListingInclude,

    forDetails: {
      game: { include: { system: true } },
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
      emulator: { include: { customFieldDefinitions: { orderBy: { displayOrder: 'asc' } } } },
      performance: true,
      author: true,
      developerVerifications: {
        include: { developer: { select: { id: true, name: true } } },
      },
      customFieldValues: { include: { customFieldDefinition: true } },
      _count: { select: { votes: true, comments: { where: { deletedAt: null } }, reports: true } },
    } satisfies Prisma.PcListingInclude,
    forTopBySuccessRate: {
      game: { include: { system: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: {
        select: {
          id: true,
          label: true,
          rank: true,
          description: true,
        },
      },
      author: { select: { id: true, name: true, profileImage: true } },
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
      _count: { select: { comments: true, votes: true } },
    } satisfies Prisma.PcListingInclude,

    forFeatured: {
      game: { include: { system: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: { select: { id: true, label: true, rank: true, description: true } },
      author: { select: { id: true, name: true, profileImage: true } },
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
      _count: { select: { comments: true, votes: true } },
    } satisfies Prisma.PcListingInclude,
  } as const

  /**
   * Get PC listings with filters and optimized vote count sorting
   */
  async list(filters: PcListingFilters): Promise<{
    pcListings: Prisma.PcListingGetPayload<{
      include: typeof PcListingsRepository.includes.forList
    }>[]
    pagination: {
      total: number
      pages: number
      page: number
      offset: number
      limit: number
    }
  }> {
    const {
      gameId,
      systemIds,
      cpuIds,
      gpuIds,
      emulatorIds,
      performanceIds,
      searchTerm,
      page = 1,
      limit = PAGINATION.DEFAULT_LIMIT,
      sortField,
      sortDirection,
      approvalStatus = ApprovalStatus.APPROVED,
      myListings,
      userId,
      showNsfw,
      osFilter,
      memoryMin,
      memoryMax,
      canSeeBannedUsers = false,
    } = filters

    // Build base where clause
    const baseWhere: Prisma.PcListingWhereInput = {
      status: approvalStatus,
      ...(gameId ? { gameId } : {}),
      ...(myListings && userId ? { authorId: userId } : {}),
      // Exclude Microsoft Windows games since PC listings are for emulation
      game: {
        system: { key: { not: 'microsoft_windows' } },
        ...(showNsfw === false ? { isErotic: false } : {}),
        ...(systemIds?.length ? { systemId: { in: systemIds } } : {}),
      },
      ...(cpuIds?.length ? { cpuId: { in: cpuIds } } : {}),
      ...(gpuIds?.length ? { gpuId: { in: gpuIds } } : {}),
      ...(emulatorIds?.length ? { emulatorId: { in: emulatorIds } } : {}),
      ...(performanceIds?.length ? { performanceId: { in: performanceIds } } : {}),
      ...(osFilter?.length ? { os: { in: osFilter as PcOs[] } } : {}),
      ...(memoryMin ? { memorySize: { gte: memoryMin } } : {}),
      ...(memoryMax ? { memorySize: { lte: memoryMax } } : {}),
      ...(searchTerm
        ? {
            OR: [
              {
                game: {
                  title: { contains: searchTerm, mode: this.mode },
                  system: { key: { not: 'microsoft_windows' } },
                },
              },
              { cpu: { modelName: { contains: searchTerm, mode: this.mode } } },
              { gpu: { modelName: { contains: searchTerm, mode: this.mode } } },
              { emulator: { name: { contains: searchTerm, mode: this.mode } } },
              { notes: { contains: searchTerm, mode: this.mode } },
            ],
          }
        : {}),
    }

    // Apply banned user filtering
    const shadowBanFilter = canSeeBannedUsers ? undefined : buildShadowBanFilter(null)
    const where = {
      ...baseWhere,
      ...(shadowBanFilter && { author: shadowBanFilter }),
    }

    // Build orderBy based on sort field
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
        case 'successRate':
          orderBy.push({ successRate: sortDirection })
          orderBy.push({ createdAt: Prisma.SortOrder.desc })
          break
        case 'votes':
          orderBy.push({ voteCount: sortDirection })
          break
      }
    }

    if (!orderBy.length) orderBy.push({ createdAt: 'desc' })

    // Calculate offset
    const actualOffset = calculateOffset({ page }, limit)

    // Execute queries in parallel
    const [total, pcListings] = await Promise.all([
      this.prisma.pcListing.count({ where }),
      this.prisma.pcListing.findMany({
        where,
        include: PcListingsRepository.includes.forList,
        orderBy,
        skip: actualOffset,
        take: limit,
      }),
    ])

    const pagination = paginate({ total: total, page, limit: limit })

    return {
      pcListings,
      pagination,
    }
  }

  /**
   * Get a single PC listing by ID with all relations
   */
  async getById(id: string): Promise<Prisma.PcListingGetPayload<{
    include: typeof PcListingsRepository.includes.forGetById
  }> | null> {
    return this.prisma.pcListing.findUnique({
      where: { id },
      include: PcListingsRepository.includes.forGetById,
    })
  }

  /**
   * Get PC listing by ID with details including vote counts and user vote
   */
  async getByIdWithDetails(
    id: string,
    canSeeBannedUsers: boolean = false,
    userId?: string,
  ): Promise<
    | (Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.forDetails }> & {
        userVote: boolean | null
        upvotes: number
        downvotes: number
        isVerifiedDeveloper: boolean
        upVotes: number
        downVotes: number
      })
    | null
  > {
    // Build where with banned user filtering
    const shadowBanFilter = canSeeBannedUsers ? undefined : buildShadowBanFilter(null)
    const where: Prisma.PcListingWhereInput = {
      id,
      ...(shadowBanFilter && { author: shadowBanFilter }),
    }

    const pcListing = await this.prisma.pcListing.findFirst({
      where,
      include: PcListingsRepository.includes.forDetails,
    })

    if (!pcListing) return null

    // Fetch all additional data in parallel for better performance
    const [userVoteResult, upvotes, downvotes] = await Promise.all([
      // Get user's vote if logged in
      userId
        ? this.prisma.pcListingVote.findUnique({
            where: {
              userId_pcListingId: {
                userId,
                pcListingId: id,
              },
            },
          })
        : Promise.resolve(null),
      // Count upvotes
      this.prisma.pcListingVote.count({
        where: { pcListingId: id, value: true },
      }),
      // Count downvotes
      this.prisma.pcListingVote.count({
        where: { pcListingId: id, value: false },
      }),
    ])

    // Compute verified developer for author/emulator
    const verified = await this.prisma.verifiedDeveloper.findFirst({
      where: { userId: pcListing.authorId, emulatorId: pcListing.emulatorId },
      select: { id: true },
    })

    return {
      ...pcListing,
      userVote: userVoteResult ? userVoteResult.value : null,
      upvotes,
      downvotes,
      // Add camelCase duplicates for API consumers that expect upVotes/downVotes
      upVotes: upvotes,
      downVotes: downvotes,
      isVerifiedDeveloper: !!verified,
    }
  }

  /**
   * Get top PC listings by success rate with minimum vote threshold
   */
  async getTopBySuccessRate(
    minVotes: number = 3,
    limit: number = 10,
  ): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.forGetById }>[]
  > {
    return this.prisma.pcListing.findMany({
      where: {
        voteCount: { gte: minVotes },
        status: ApprovalStatus.APPROVED,
      },
      include: PcListingsRepository.includes.forTopBySuccessRate,
      orderBy: [{ successRate: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.desc }],
      take: limit,
    })
  }

  /**
   * Get PC listings for a specific game
   */
  async getByGameId(
    gameId: string,
    limit: number = PAGINATION.DEFAULT_LIMIT,
  ): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.forGetById }>[]
  > {
    const result = await this.list({
      gameId,
      limit,
      sortField: 'successRate',
      sortDirection: 'desc',
    })
    return result.pcListings
  }

  /**
   * Get PC listings for a specific CPU
   */
  async getByCpuId(
    cpuId: string,
    limit: number = PAGINATION.DEFAULT_LIMIT,
  ): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.forGetById }>[]
  > {
    return this.list({
      cpuIds: [cpuId],
      limit,
      sortField: 'successRate',
      sortDirection: Prisma.SortOrder.desc,
    }).then((result) => result.pcListings)
  }

  /**
   * Get PC listings for a specific GPU
   */
  async getByGpuId(
    gpuId: string,
    limit: number = PAGINATION.DEFAULT_LIMIT,
  ): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.forGetById }>[]
  > {
    return this.list({
      gpuIds: [gpuId],
      limit,
      sortField: 'successRate',
      sortDirection: Prisma.SortOrder.desc,
    }).then((result) => result.pcListings)
  }

  /**
   * Get featured PC listings (most recent with high success rate)
   */
  async getFeatured(
    limit: number = 3,
  ): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.forGetById }>[]
  > {
    return this.prisma.pcListing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        voteCount: { gte: 2 },
        successRate: { gte: 0.8 },
      },
      include: PcListingsRepository.includes.forFeatured,
      orderBy: { createdAt: this.sortOrder },
      take: limit,
    })
  }

  /**
   * Update vote counts atomically
   */
  async updateVoteCounts(
    pcListingId: string,
    upvoteChange: number,
    downvoteChange: number,
  ): Promise<void> {
    await this.prisma.pcListing.update({
      where: { id: pcListingId },
      data: {
        upvoteCount: { increment: upvoteChange },
        downvoteCount: { increment: downvoteChange },
        voteCount: { increment: upvoteChange + downvoteChange },
      },
    })

    // Update Wilson score
    const pcListing = await this.prisma.pcListing.findUnique({
      where: { id: pcListingId },
      select: { upvoteCount: true, downvoteCount: true },
    })

    if (pcListing) {
      const wilsonScore = calculateWilsonScore(pcListing.upvoteCount, pcListing.downvoteCount)
      await this.prisma.pcListing.update({
        where: { id: pcListingId },
        data: { successRate: wilsonScore },
      })
    }
  }

  /**
   * Create a PC listing
   */
  async create(input: {
    authorId: string
    userRole: Role
    gameId: string
    cpuId: string
    gpuId?: string | null
    emulatorId: string
    performanceId: number
    memorySize: number
    os: PcOs
    osVersion: string
    notes?: string | null
    customFieldValues?: { customFieldDefinitionId: string; value: unknown }[] | null
  }): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.forList }>
  > {
    const {
      authorId,
      userRole,
      gameId,
      cpuId,
      gpuId,
      emulatorId,
      performanceId,
      memorySize,
      os,
      osVersion,
      notes,
      customFieldValues,
    } = input

    // Check for existing PC listing with same combination
    const existing = await this.prisma.pcListing.findFirst({
      where: {
        gameId,
        cpuId,
        ...(gpuId ? { gpuId } : { gpuId: null }),
        emulatorId,
        authorId,
      },
    })
    if (existing) throw ResourceError.pcListing.alreadyExists()

    // Validate referenced entities and compatibility
    const [game, cpu, gpu, emulator, performance] = await Promise.all([
      this.prisma.game.findUnique({ where: { id: gameId }, select: { id: true, systemId: true } }),
      this.prisma.cpu.findUnique({ where: { id: cpuId } }),
      gpuId ? this.prisma.gpu.findUnique({ where: { id: gpuId } }) : Promise.resolve(null),
      this.prisma.emulator.findUnique({
        where: { id: emulatorId },
        include: { systems: { select: { id: true } } },
      }),
      this.prisma.performanceScale.findUnique({ where: { id: performanceId } }),
    ])

    if (!game) throw ResourceError.game.notFound()
    if (!cpu) throw ResourceError.cpu.notFound()
    if (gpuId && !gpu) throw ResourceError.gpu.notFound()
    if (!emulator) throw ResourceError.emulator.notFound()
    if (!performance) throw ResourceError.performanceScale.notFound()

    const isSystemCompatible = emulator.systems.some((s) => s.id === game.systemId)
    if (!isSystemCompatible)
      return AppError.badRequest("The selected emulator does not support this game's system")

    const canAutoApprove = await canUserAutoApprove(authorId)
    const isAuthorOrHigher = roleIncludesRole(userRole, Role.AUTHOR)
    const status: ApprovalStatus =
      canAutoApprove || isAuthorOrHigher ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING

    // Create
    const created = await this.prisma.pcListing.create({
      data: {
        gameId,
        cpuId,
        ...(gpuId ? { gpuId } : {}),
        emulatorId,
        performanceId,
        memorySize,
        os,
        osVersion,
        notes: notes ? sanitizeInput(notes) : (notes ?? null),
        authorId,
        status,
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

    if (customFieldValues && customFieldValues.length > 0) {
      await this.prisma.pcListingCustomFieldValue.createMany({
        data: customFieldValues.map((cfv) => ({
          pcListingId: created.id,
          customFieldDefinitionId: cfv.customFieldDefinitionId,
          value: cfv.value as Prisma.InputJsonValue,
        })),
      })
    }

    // Return with standard include
    const result = await this.prisma.pcListing.findUnique({
      where: { id: created.id },
      include: PcListingsRepository.includes.forList,
    })

    if (!result) throw new Error('Failed to load created PC listing')
    return result
  }

  /**
   * Update a PC listing
   */
  async update(
    id: string,
    data: Prisma.PcListingUpdateInput,
  ): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.default }>
  > {
    return this.prisma.pcListing.update({
      where: { id },
      data,
      include: PcListingsRepository.includes.default,
    })
  }

  /**
   * Delete a PC listing
   */
  async delete(id: string): Promise<void> {
    await this.prisma.pcListing.delete({
      where: { id },
    })
  }

  /**
   * Get statistics for PC listings
   */
  async stats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.pcListing.count({ where: { status: ApprovalStatus.PENDING } }),
      this.prisma.pcListing.count({ where: { status: ApprovalStatus.APPROVED } }),
      this.prisma.pcListing.count({ where: { status: ApprovalStatus.REJECTED } }),
    ])

    return {
      total: pending + approved + rejected,
      pending,
      approved,
      rejected,
    }
  }

  /**
   * Get user's vote for a PC listing
   */
  async getUserVote(userId: string, pcListingId: string): Promise<boolean | null> {
    const vote = await this.prisma.pcListingVote.findUnique({
      where: {
        userId_pcListingId: {
          userId,
          pcListingId,
        },
      },
    })
    return vote ? vote.value : null
  }

  /**
   * Check if user has existing vote
   */
  async getExistingVote(userId: string, pcListingId: string): Promise<{ value: boolean } | null> {
    return this.prisma.pcListingVote.findUnique({
      where: {
        userId_pcListingId: {
          userId,
          pcListingId,
        },
      },
    })
  }

  /**
   * Get pending PC listings with optional filtering
   */
  async getPendingListings(
    filters: {
      emulatorIds?: string[]
      search?: string
      page?: number
      limit?: number
      sortField?: string
      sortDirection?: 'asc' | 'desc'
      canSeeBannedUsers?: boolean
    } = {},
  ): Promise<{
    pcListings: Prisma.PcListingGetPayload<{
      include: typeof PcListingsRepository.includes.forList
    }>[]
    pagination: {
      total: number
      pages: number
      page: number
      offset: number
      limit: number
    }
  }> {
    const {
      emulatorIds,
      search,
      page = 1,
      limit = PAGINATION.DEFAULT_LIMIT,
      sortField,
      sortDirection = 'asc',
      canSeeBannedUsers = false,
    } = filters

    const baseWhere: Prisma.PcListingWhereInput = {
      status: ApprovalStatus.PENDING,
      ...(emulatorIds?.length ? { emulatorId: { in: emulatorIds } } : {}),
      ...(search
        ? {
            OR: [
              { game: { title: { contains: search, mode: this.mode } } },
              { cpu: { modelName: { contains: search, mode: this.mode } } },
              { gpu: { modelName: { contains: search, mode: this.mode } } },
              { emulator: { name: { contains: search, mode: this.mode } } },
              { author: { name: { contains: search, mode: this.mode } } },
            ],
          }
        : {}),
    }

    // Apply banned user filtering
    const shadowBanFilter = canSeeBannedUsers ? undefined : buildShadowBanFilter(null)
    const where = {
      ...baseWhere,
      ...(shadowBanFilter && { author: shadowBanFilter }),
    }

    const actualOffset = calculateOffset({ page }, limit)
    const orderBy = this.buildOrderBy(sortField, sortDirection)

    const [total, pcListings] = await Promise.all([
      this.prisma.pcListing.count({ where }),
      this.prisma.pcListing.findMany({
        where,
        include: PcListingsRepository.includes.forList,
        orderBy,
        skip: actualOffset,
        take: limit,
      }),
    ])

    const pagination = paginate({ total: total, page, limit: limit })

    return {
      pcListings,
      pagination,
    }
  }

  /**
   * Get emulator IDs for a verified developer
   */
  async getVerifiedEmulatorIds(userId: string): Promise<string[]> {
    const verifiedEmulators = await this.prisma.verifiedDeveloper.findMany({
      where: { userId },
      select: { emulatorId: true },
    })
    return verifiedEmulators.map((ve) => ve.emulatorId)
  }

  /**
   * Build orderBy clause for PC listings
   */
  private buildOrderBy(
    sortField?: string,
    sortDirection: 'asc' | 'desc' = 'desc',
  ): Prisma.PcListingOrderByWithRelationInput[] {
    const orderBy: Prisma.PcListingOrderByWithRelationInput[] = []

    if (sortField) {
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

    if (!orderBy.length) orderBy.push({ createdAt: sortDirection })

    return orderBy
  }

  /**
   * Approve a PC listing
   */
  async approve(
    pcListingId: string,
    processedByUserId: string,
  ): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.default }>
  > {
    return this.prisma.pcListing.update({
      where: { id: pcListingId },
      data: {
        status: ApprovalStatus.APPROVED,
        processedAt: new Date(),
        processedByUserId,
      },
      include: PcListingsRepository.includes.forList,
    })
  }

  /**
   * Reject a PC listing
   */
  async reject(
    pcListingId: string,
    processedByUserId: string,
    processedNotes?: string,
  ): Promise<
    Prisma.PcListingGetPayload<{ include: typeof PcListingsRepository.includes.default }>
  > {
    return this.prisma.pcListing.update({
      where: { id: pcListingId },
      data: {
        status: ApprovalStatus.REJECTED,
        processedAt: new Date(),
        processedByUserId,
        processedNotes,
      },
      include: PcListingsRepository.includes.forList,
    })
  }

  /**
   * Check if a developer is verified for an emulator
   */
  async isDeveloperVerifiedForEmulator(userId: string, emulatorId: string): Promise<boolean> {
    const verified = await this.prisma.verifiedDeveloper.findUnique({
      where: { userId_emulatorId: { userId, emulatorId } },
    })
    return !!verified
  }
}
