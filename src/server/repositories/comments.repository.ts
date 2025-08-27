import { PAGINATION } from '@/data/constants'
import {
  calculateOffset,
  createPaginationResult,
  type PaginationResult,
} from '@/server/utils/pagination'
import { roleIncludesRole } from '@/utils/permission-system'
import { type Prisma, Role } from '@orm'
import { BaseRepository } from './base.repository'

export interface CommentFilters {
  listingId?: string
  authorId?: string
  limit?: number
  offset?: number
  page?: number
  sortField?: string | null
  sortDirection?: Prisma.SortOrder | null
  userRole?: Role
  userId?: string
}

// Export types directly without namespace
export type CommentDefault = Prisma.CommentGetPayload<{
  include: typeof CommentsRepository.includes.default
}>

export type CommentMinimal = Prisma.CommentGetPayload<{
  include: typeof CommentsRepository.includes.minimal
}>

export type CommentWithListing = Prisma.CommentGetPayload<{
  include: typeof CommentsRepository.includes.withListing
}>

export type CommentRecent = Prisma.CommentGetPayload<{
  include: typeof CommentsRepository.includes.recent
}>

export class CommentsRepository extends BaseRepository {
  // Static query shapes for this repository
  static readonly includes = {
    default: {
      user: { select: { id: true, name: true, profileImage: true } },
      votes: { select: { id: true, value: true, userId: true } },
      _count: { select: { votes: true } },
    } satisfies Prisma.CommentInclude,

    minimal: {
      user: { select: { id: true, name: true, profileImage: true } },
    } satisfies Prisma.CommentInclude,

    withListing: {
      user: { select: { id: true, name: true, profileImage: true } },
      listing: { select: { id: true, gameId: true } },
    } satisfies Prisma.CommentInclude,

    recent: {
      user: { select: { id: true, name: true, profileImage: true } },
      listing: { select: { id: true, game: { select: { id: true, title: true } } } },
    } satisfies Prisma.CommentInclude,
  } as const

  /**
   * Get comments with pagination
   */
  async list(filters: CommentFilters = {}): Promise<{
    comments: CommentDefault[]
    pagination: PaginationResult
  }> {
    const { limit = PAGINATION.DEFAULT_LIMIT, offset = 0, page, sortField, sortDirection } = filters

    const where = this.buildWhereClause(filters)
    const orderBy = this.buildOrderBy(sortField, sortDirection)
    const actualOffset = calculateOffset(
      { page: page ?? undefined, offset: offset ?? undefined },
      limit ?? 20,
    )

    const [total, comments] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        include: CommentsRepository.includes.default,
        orderBy,
        skip: actualOffset,
        take: limit ?? 20,
      }),
    ])

    const pagination = createPaginationResult(
      total,
      { page: page ?? undefined, offset: offset ?? undefined },
      limit ?? 20,
      actualOffset,
    )

    return { comments, pagination }
  }

  /**
   * Get comments for a listing
   */
  async listByListing(listingId: string, userRole?: Role): Promise<CommentDefault[]> {
    const canSeeBannedUsers = roleIncludesRole(userRole, Role.MODERATOR)

    const where: Prisma.CommentWhereInput = {
      listingId,
      // Shadow ban filter
      ...(!canSeeBannedUsers && {
        user: {
          userBans: {
            none: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      }),
    }

    return this.prisma.comment.findMany({
      where,
      include: CommentsRepository.includes.default,
      orderBy: { createdAt: this.sortOrder },
    })
  }

  /**
   * Get comment by ID
   */
  async byId(id: string): Promise<CommentWithListing | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: CommentsRepository.includes.withListing,
    })
  }

  /**
   * Create a new comment
   */
  async create(data: Prisma.CommentCreateInput): Promise<CommentMinimal> {
    return this.prisma.comment.create({
      data,
      include: CommentsRepository.includes.minimal,
    })
  }

  /**
   * Update a comment
   */
  async update(id: string, data: Prisma.CommentUpdateInput): Promise<CommentMinimal> {
    return this.prisma.comment.update({
      where: { id },
      data,
      include: CommentsRepository.includes.minimal,
    })
  }

  /**
   * Soft delete a comment
   */
  async delete(id: string): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Get comment count for a listing
   */
  async countForListing(listingId: string, userRole?: Role): Promise<number> {
    const canSeeBannedUsers = roleIncludesRole(userRole, Role.MODERATOR)

    const where: Prisma.CommentWhereInput = {
      listingId,
      // Shadow ban filter
      ...(!canSeeBannedUsers && {
        user: {
          userBans: {
            none: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      }),
    }

    return this.prisma.comment.count({ where })
  }

  /**
   * Get recent comments
   */
  async listRecent(limit = 10, userRole?: Role): Promise<CommentRecent[]> {
    const canSeeBannedUsers = roleIncludesRole(userRole, Role.MODERATOR)

    const where: Prisma.CommentWhereInput = !canSeeBannedUsers
      ? {
          user: {
            userBans: {
              none: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          },
        }
      : {}

    return this.prisma.comment.findMany({
      where,
      include: CommentsRepository.includes.recent,
      orderBy: { createdAt: this.sortOrder },
      take: limit,
    })
  }

  /**
   * Build where clause for comment queries
   */
  private buildWhereClause(filters: CommentFilters): Prisma.CommentWhereInput {
    const { listingId, authorId, userRole } = filters

    const canSeeBannedUsers = roleIncludesRole(userRole, Role.MODERATOR)

    const where: Prisma.CommentWhereInput = {}

    if (listingId) where.listingId = listingId
    if (authorId) where.userId = authorId

    // Shadow ban filter
    if (!canSeeBannedUsers) {
      where.user = {
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
   * Build orderBy clause for comment queries
   */
  private buildOrderBy(
    sortField?: string | null,
    sortDirection?: Prisma.SortOrder | null,
  ): Prisma.CommentOrderByWithRelationInput {
    const direction = sortDirection || this.sortOrder

    switch (sortField) {
      case 'createdAt':
        return { createdAt: direction }
      case 'votes':
        return { votes: { _count: direction } }
      default:
        return { createdAt: this.sortOrder }
    }
  }
}
