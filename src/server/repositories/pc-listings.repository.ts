/**
 * Repository for PC Listing data access
 * Handles all database operations for PC listings with optimized vote count queries
 */

import { Prisma, ApprovalStatus, type PcOs, type Role } from '@orm'
import { BaseRepository } from './base.repository'
import { pcListingInclude, type PcListingWithInclude } from '../api/utils/pcListingHelpers'
import { buildShadowBanFilter } from '../utils/query-builders'
import { calculateWilsonScore } from '../utils/wilson-score'

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

// Type namespace for PcListingsRepository
export namespace PcListingsRepositoryTypes {
  // Type for PC listing with full details including vote counts and custom fields
  export type WithDetails = Prisma.PcListingGetPayload<{
    include: {
      game: { include: { system: true } }
      cpu: { include: { brand: true } }
      gpu: { include: { brand: true } }
      emulator: {
        include: { customFieldDefinitions: { orderBy: { displayOrder: 'asc' } } }
      }
      performance: true
      author: true
      developerVerifications: {
        include: { developer: { select: { id: true; name: true } } }
      }
      customFieldValues: { include: { customFieldDefinition: true } }
      _count: {
        select: {
          reports: true
          votes: true
          comments: true
        }
      }
    }
  }> & {
    userVote: boolean | null
    upvotes: number
    downvotes: number
  }

  // Type for basic PC listing from database
  export type Basic = PcListingWithInclude
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

    withVotes: {
      game: { select: { id: true, title: true, systemId: true } },
      emulator: { select: { id: true, name: true, logo: true } },
      performance: true,
      author: { select: { id: true, name: true, profileImage: true } },
      cpu: { include: { brand: true } },
      gpu: { include: { brand: true } },
      votes: true,
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    } satisfies Prisma.PcListingInclude,
  } as const

  /**
   * Get PC listings with filters and optimized vote count sorting
   */
  async getPcListings(filters: PcListingFilters): Promise<{
    pcListings: PcListingWithInclude[]
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
      limit = 20,
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
    const offset = (page - 1) * limit

    // Execute queries in parallel
    const [total, pcListings] = await Promise.all([
      this.prisma.pcListing.count({ where }),
      this.prisma.pcListing.findMany({
        where,
        include: pcListingInclude,
        orderBy,
        skip: offset,
        take: limit,
      }),
    ])

    return {
      pcListings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        offset,
        limit,
      },
    }
  }

  /**
   * Get a single PC listing by ID with all relations
   */
  async getById(id: string): Promise<PcListingWithRelations | null> {
    return this.prisma.pcListing.findUnique({
      where: { id },
      include: {
        ...PcListingsRepository.includes.default,
        game: {
          include: {
            system: true,
          },
        },
        performance: {
          select: {
            id: true,
            label: true,
            rank: true,
            description: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    })
  }

  /**
   * Get PC listing by ID with details including vote counts and user vote
   */
  async getByIdWithDetails(
    id: string,
    canSeeBannedUsers: boolean = false,
    userId?: string,
  ): Promise<PcListingsRepositoryTypes.WithDetails | null> {
    // Build where with banned user filtering
    const shadowBanFilter = canSeeBannedUsers ? undefined : buildShadowBanFilter(null)
    const where: Prisma.PcListingWhereInput = {
      id,
      ...(shadowBanFilter && { author: shadowBanFilter }),
    }

    const pcListing = await this.prisma.pcListing.findFirst({
      where,
      include: {
        ...pcListingInclude,
        emulator: {
          include: { customFieldDefinitions: { orderBy: { displayOrder: 'asc' } } },
        },
        developerVerifications: {
          include: { developer: { select: { id: true, name: true } } },
        },
        customFieldValues: { include: { customFieldDefinition: true } },
        _count: {
          select: {
            votes: true,
            comments: { where: { deletedAt: null } },
            reports: true,
          },
        },
      },
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

    return {
      ...pcListing,
      userVote: userVoteResult ? userVoteResult.value : null,
      upvotes,
      downvotes,
    }
  }

  /**
   * Get top PC listings by success rate with minimum vote threshold
   */
  async getTopBySuccessRate(
    minVotes: number = 3,
    limit: number = 10,
  ): Promise<PcListingWithRelations[]> {
    return this.prisma.pcListing.findMany({
      where: {
        voteCount: { gte: minVotes },
        status: ApprovalStatus.APPROVED,
      },
      include: {
        ...PcListingsRepository.includes.default,
        game: {
          include: {
            system: true,
          },
        },
        performance: {
          select: {
            id: true,
            label: true,
            rank: true,
            description: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
      orderBy: [{ successRate: Prisma.SortOrder.desc }, { createdAt: Prisma.SortOrder.desc }],
      take: limit,
    })
  }

  /**
   * Get PC listings for a specific game
   */
  async getByGameId(gameId: string, limit: number = 20): Promise<PcListingWithRelations[]> {
    const result = await this.getPcListings({
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
  async getByCpuId(cpuId: string, limit: number = 20): Promise<PcListingWithRelations[]> {
    return this.getPcListings({
      cpuIds: [cpuId],
      limit,
      sortField: 'successRate',
      sortDirection: Prisma.SortOrder.desc,
    }).then((result) => result.pcListings)
  }

  /**
   * Get PC listings for a specific GPU
   */
  async getByGpuId(gpuId: string, limit: number = 20): Promise<PcListingWithRelations[]> {
    return this.getPcListings({
      gpuIds: [gpuId],
      limit,
      sortField: 'successRate',
      sortDirection: Prisma.SortOrder.desc,
    }).then((result) => result.pcListings)
  }

  /**
   * Get featured PC listings (most recent with high success rate)
   */
  async getFeatured(limit: number = 3): Promise<PcListingWithRelations[]> {
    return this.prisma.pcListing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        voteCount: { gte: 2 },
        successRate: { gte: 0.8 },
      },
      include: {
        ...PcListingsRepository.includes.default,
        game: {
          include: {
            system: true,
          },
        },
        performance: {
          select: {
            id: true,
            label: true,
            rank: true,
            description: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
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
  async create(data: Prisma.PcListingCreateInput): Promise<PcListingDefault> {
    return this.prisma.pcListing.create({
      data,
      include: PcListingsRepository.includes.default,
    })
  }

  /**
   * Update a PC listing
   */
  async update(id: string, data: Prisma.PcListingUpdateInput): Promise<PcListingDefault> {
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
  async getStats(): Promise<{
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
    pcListings: PcListingWithInclude[]
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
      limit = 20,
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

    const offset = (page - 1) * limit
    const orderBy = this.buildOrderBy(sortField, sortDirection)

    const [total, pcListings] = await Promise.all([
      this.prisma.pcListing.count({ where }),
      this.prisma.pcListing.findMany({
        where,
        include: pcListingInclude,
        orderBy,
        skip: offset,
        take: limit,
      }),
    ])

    return {
      pcListings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        offset,
        limit,
      },
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
  ): Promise<PcListingsRepositoryTypes.Basic> {
    return this.prisma.pcListing.update({
      where: { id: pcListingId },
      data: {
        status: ApprovalStatus.APPROVED,
        processedAt: new Date(),
        processedByUserId,
      },
      include: pcListingInclude,
    })
  }

  /**
   * Reject a PC listing
   */
  async reject(
    pcListingId: string,
    processedByUserId: string,
    processedNotes?: string,
  ): Promise<PcListingsRepositoryTypes.Basic> {
    return this.prisma.pcListing.update({
      where: { id: pcListingId },
      data: {
        status: ApprovalStatus.REJECTED,
        processedAt: new Date(),
        processedByUserId,
        processedNotes,
      },
      include: pcListingInclude,
    })
  }

  /**
   * Check if a developer is verified for an emulator
   */
  async isDeveloperVerifiedForEmulator(userId: string, emulatorId: string): Promise<boolean> {
    const verified = await this.prisma.verifiedDeveloper.findUnique({
      where: {
        userId_emulatorId: {
          userId,
          emulatorId,
        },
      },
    })
    return !!verified
  }
}

// Use Prisma's type inference for the full listing type
type PcListingWithRelations = Prisma.PcListingGetPayload<{
  include: typeof PcListingsRepository.includes.default & {
    game: {
      include: {
        system: true
      }
    }
    performance: {
      select: {
        id: true
        label: true
        rank: true
        description: true
      }
    }
    _count: {
      select: {
        comments: true
        votes: true
      }
    }
  }
}>

type PcListingDefault = Prisma.PcListingGetPayload<{
  include: typeof PcListingsRepository.includes.default
}>

// Export types for external use
export type { PcListingWithRelations, PcListingDefault }
