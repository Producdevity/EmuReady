import { RestApiError } from '@/server/lib/rest/errors'
import { filterNullAndEmpty } from '@/utils/filter'
import {
  type PrismaClient,
  ApprovalStatus,
  Role,
  type Comment,
  Prisma,
} from '@orm'
import { type PaginationResult, type BaseUser } from '../types'
import {
  type FindListingsParams,
  type CreateListingParams,
  type UpdateListingParams,
  type VoteListingParams,
  type ListingWithRelations,
  type ListingWithStats,
  type GetCommentsParams,
  type CreateCommentParams,
  type UpdateCommentParams,
  type DeleteCommentParams,
} from './listing.types'

export class ListingService {
  constructor(private prisma: PrismaClient) {}

  private readonly defaultInclude = {
    device: { include: { brand: true, soc: true } },
    emulator: { select: { id: true, name: true, logo: true } },
    performance: { select: { id: true, label: true, rank: true } },
    author: { select: { id: true, name: true } },
    _count: { select: { votes: true, comments: true } },
  }

  async findMany(
    params: FindListingsParams,
  ): Promise<PaginationResult<ListingWithStats>> {
    const {
      page = 1,
      limit = 10,
      search,
      gameId,
      systemId,
      emulatorId,
      emulatorIds,
      deviceId,
      deviceIds,
      socId,
      socIds,
      performanceId,
      user,
    } = params

    const where = filterNullAndEmpty({
      status: ApprovalStatus.APPROVED,
      ...(search && {
        OR: [
          {
            game: { title: { contains: search, mode: 'insensitive' as const } },
          },
          {
            device: {
              modelName: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            device: {
              brand: {
                name: { contains: search, mode: 'insensitive' as const },
              },
            },
          },
          {
            emulator: {
              name: { contains: search, mode: 'insensitive' as const },
            },
          },
        ],
      }),
      ...(gameId && { gameId }),
      ...(systemId && { game: { systemId } }),
      ...(emulatorId && { emulatorId }),
      ...(emulatorIds?.length && {
        emulatorId: {
          in: Array.isArray(emulatorIds) ? emulatorIds : [emulatorIds],
        },
      }),
      ...(deviceId && { deviceId }),
      ...(deviceIds?.length && {
        deviceId: { in: Array.isArray(deviceIds) ? deviceIds : [deviceIds] },
      }),
      ...(socId && { device: { socId } }),
      ...(socIds?.length && {
        device: { socId: { in: Array.isArray(socIds) ? socIds : [socIds] } },
      }),
      ...(performanceId && { performanceId }),
      game: {
        status: ApprovalStatus.APPROVED,
        ...(user?.showNsfw ? {} : { isErotic: false }),
      },
    })

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: this.defaultInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ])

    // Calculate stats for each listing
    const listingsWithStats = await Promise.all(
      listings.map(async (listing) =>
        this.addStatsToListing(listing as ListingWithRelations, user?.id),
      ),
    )

    return {
      items: listingsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async findFeatured(user?: BaseUser | null): Promise<ListingWithStats[]> {
    const listings = await this.prisma.listing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        game: {
          status: ApprovalStatus.APPROVED,
          ...(user?.showNsfw ? {} : { isErotic: false }),
        },
      },
      include: this.defaultInclude,
      orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: 20,
    })

    return Promise.all(
      listings.map(async (listing) =>
        this.addStatsToListing(listing, user?.id),
      ),
    )
  }

  async findByGame(
    gameId: string,
    user?: BaseUser | null,
  ): Promise<ListingWithStats[]> {
    const listings = await this.prisma.listing.findMany({
      where: {
        gameId,
        status: ApprovalStatus.APPROVED,
        game: {
          status: ApprovalStatus.APPROVED,
          ...(user?.showNsfw ? {} : { isErotic: false }),
        },
      },
      include: this.defaultInclude,
      orderBy: { createdAt: 'desc' },
    })

    return Promise.all(
      listings.map(async (listing) =>
        this.addStatsToListing(listing, user?.id),
      ),
    )
  }

  async findById(
    id: string,
    user?: BaseUser | null,
  ): Promise<ListingWithStats | null> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        ...this.defaultInclude,
        game: {
          include: {
            system: true,
          },
        },
        customFieldValues: {
          include: {
            customFieldDefinition: true,
          },
        },
      },
    })

    if (!listing) return null

    // Check NSFW content
    if (!user?.showNsfw && listing.game.isErotic) {
      return null
    }

    return this.addStatsToListing(listing as ListingWithRelations, user?.id)
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginationResult<ListingWithStats>> {
    const where = { authorId: userId }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: this.defaultInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ])

    const listingsWithStats = await Promise.all(
      listings.map(async (listing) => this.addStatsToListing(listing, userId)),
    )

    return {
      items: listingsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async create(params: CreateListingParams): Promise<ListingWithStats> {
    const {
      gameId,
      deviceId,
      emulatorId,
      performanceId,
      notes,
      customFieldValues,
      authorId,
    } = params

    // Verify all entities exist
    const [game, device, emulator, performance] = await Promise.all([
      this.prisma.game.findUnique({ where: { id: gameId } }),
      this.prisma.device.findUnique({ where: { id: deviceId } }),
      this.prisma.emulator.findUnique({ where: { id: emulatorId } }),
      this.prisma.performanceScale.findUnique({ where: { id: performanceId } }),
    ])

    if (!game) throw new RestApiError(404, 'NOT_FOUND', 'Game not found')
    if (!device) throw new RestApiError(404, 'NOT_FOUND', 'Device not found')
    if (!emulator)
      throw new RestApiError(404, 'NOT_FOUND', 'Emulator not found')
    if (!performance)
      throw new RestApiError(404, 'NOT_FOUND', 'Performance scale not found')

    // Check for duplicates
    const existingListing = await this.prisma.listing.findFirst({
      where: { gameId, deviceId, emulatorId, authorId },
    })

    if (existingListing) {
      throw new RestApiError(
        409,
        'CONFLICT',
        'You already have a listing for this game, device, and emulator combination',
      )
    }

    // Create listing with custom fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma type inference limitation
    const createData: any = {
      gameId,
      deviceId,
      emulatorId,
      performanceId,
      notes,
      authorId,
      status: ApprovalStatus.APPROVED, // Auto-approve for now
    }

    if (customFieldValues) {
      createData.customFieldValues = {
        create: Object.entries(customFieldValues).map(
          ([definitionId, value]) => ({
            customFieldDefinitionId: definitionId,
            value: value !== undefined ? value : Prisma.JsonNull,
          }),
        ),
      }
    }

    const listing = await this.prisma.listing.create({
      data: createData,
      include: this.defaultInclude,
    })

    return this.addStatsToListing(listing as ListingWithRelations, authorId)
  }

  async update(params: UpdateListingParams): Promise<ListingWithStats> {
    const { id, performanceId, notes, customFieldValues, userId } = params

    // Check ownership
    const existingListing = await this.prisma.listing.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!existingListing) {
      throw new RestApiError(404, 'NOT_FOUND', 'Listing not found')
    }

    if (existingListing.authorId !== userId) {
      throw new RestApiError(
        403,
        'FORBIDDEN',
        'You can only update your own listings',
      )
    }

    // Update listing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma type inference limitation
    const updateData: any = {}
    if (performanceId !== undefined) updateData.performanceId = performanceId
    if (notes !== undefined) updateData.notes = notes
    if (customFieldValues) {
      updateData.customFieldValues = {
        deleteMany: {},
        create: Object.entries(customFieldValues).map(
          ([definitionId, value]) => ({
            customFieldDefinitionId: definitionId,
            value: value !== undefined ? value : Prisma.JsonNull,
          }),
        ),
      }
    }

    const listing = await this.prisma.listing.update({
      where: { id },
      data: updateData,
      include: this.defaultInclude,
    })

    return this.addStatsToListing(listing as ListingWithRelations, userId)
  }

  async delete(id: string, userId: string): Promise<{ success: boolean }> {
    // Check ownership
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!listing) {
      throw new RestApiError(404, 'NOT_FOUND', 'Listing not found')
    }

    if (listing.authorId !== userId) {
      // Check if user is admin/moderator
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      const allowedRoles: Role[] = [
        Role.MODERATOR,
        Role.ADMIN,
        Role.SUPER_ADMIN,
      ]
      if (!user || !allowedRoles.includes(user.role)) {
        throw new RestApiError(
          403,
          'FORBIDDEN',
          'You can only delete your own listings',
        )
      }
    }

    await this.prisma.listing.delete({ where: { id } })
    return { success: true }
  }

  async vote(
    params: VoteListingParams,
  ): Promise<{ id: string; value: boolean }> {
    const { listingId, value, userId } = params

    // Check if listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      throw new RestApiError(404, 'NOT_FOUND', 'Listing not found')
    }

    // Upsert vote
    const vote = await this.prisma.vote.upsert({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
      update: { value },
      create: {
        userId,
        listingId,
        value,
      },
    })

    return { id: vote.id, value: vote.value }
  }

  async getUserVote(
    listingId: string,
    userId: string,
  ): Promise<boolean | null> {
    const vote = await this.prisma.vote.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    })

    return vote?.value ?? null
  }

  async getComments(params: GetCommentsParams): Promise<
    PaginationResult<
      Comment & {
        user: { id: string; name: string | null; profileImage: string | null }
        votes?: { value: boolean }[]
      }
    >
  > {
    const { listingId, page = 1, limit = 10 } = params
    const where = { listingId }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          votes: params.userId
            ? {
                where: { userId: params.userId },
                select: { value: true },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.comment.count({ where }),
    ])

    return {
      items: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async createComment(params: CreateCommentParams): Promise<
    Comment & {
      user: { id: string; name: string | null; profileImage: string | null }
    }
  > {
    const { listingId, content, userId } = params

    // Verify listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      throw new RestApiError(404, 'NOT_FOUND', 'Listing not found')
    }

    return this.prisma.comment.create({
      data: {
        content,
        listingId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    })
  }

  async updateComment(params: UpdateCommentParams): Promise<
    Comment & {
      user: { id: string; name: string | null; profileImage: string | null }
    }
  > {
    const { id, content, userId } = params

    // Check ownership
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    })

    if (!comment) {
      throw new RestApiError(404, 'NOT_FOUND', 'Comment not found')
    }

    if (comment.userId !== userId) {
      throw new RestApiError(
        403,
        'FORBIDDEN',
        'You can only update your own comments',
      )
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    })
  }

  async deleteComment(
    params: DeleteCommentParams,
  ): Promise<{ success: boolean }> {
    const { id, userId } = params

    // Check ownership
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    })

    if (!comment) {
      throw new RestApiError(404, 'NOT_FOUND', 'Comment not found')
    }

    if (comment.userId !== userId) {
      // Check if user is admin/moderator
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      const allowedRoles: Role[] = [
        Role.MODERATOR,
        Role.ADMIN,
        Role.SUPER_ADMIN,
      ]
      if (!user || !allowedRoles.includes(user.role)) {
        throw new RestApiError(
          403,
          'FORBIDDEN',
          'You can only delete your own comments',
        )
      }
    }

    await this.prisma.comment.delete({ where: { id } })
    return { success: true }
  }

  private async addStatsToListing(
    listing: ListingWithRelations,
    userId?: string,
  ): Promise<ListingWithStats> {
    const [upVotes, downVotes, userVote] = await Promise.all([
      this.prisma.vote.count({
        where: { listingId: listing.id, value: true },
      }),
      this.prisma.vote.count({
        where: { listingId: listing.id, value: false },
      }),
      userId
        ? this.prisma.vote.findUnique({
            where: {
              userId_listingId: {
                userId,
                listingId: listing.id,
              },
            },
          })
        : null,
    ])

    const totalVotes = upVotes + downVotes
    const successRate = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0

    return {
      ...listing,
      successRate,
      upVotes,
      downVotes,
      totalVotes,
      userVote: userVote?.value ?? null,
    }
  }
}
