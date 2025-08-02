import { AppError, ResourceError } from '@/lib/errors'
import {
  CreateCommentSchema,
  CreateListingSchema,
  DeleteCommentSchema,
  DeleteListingSchema,
  GetListingByIdSchema,
  GetListingCommentsSchema,
  GetListingsByGameSchema,
  GetListingsSchema,
  type GetListingsInput,
  GetUserListingsSchema,
  GetUserVoteSchema,
  UpdateCommentSchema,
  UpdateListingSchema,
  VoteListingSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import {
  buildSearchFilter,
  buildNsfwFilter,
  buildArrayFilter,
} from '@/server/utils/query-builders'
import { ApprovalStatus, type PrismaClient } from '@orm'

// Helper function to calculate listing stats
async function calculateListingStats(
  listing: { id: string },
  prisma: PrismaClient,
  userId?: string,
) {
  const [upVotes, userVote] = await Promise.all([
    prisma.vote.count({
      where: { listingId: listing.id, value: true },
    }),
    userId
      ? prisma.vote.findUnique({
          where: {
            userId_listingId: {
              userId: userId,
              listingId: listing.id,
            },
          },
        })
      : null,
  ])
  const downVotes = await prisma.vote.count({
    where: { listingId: listing.id, value: false },
  })
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

// Helper for getting listings
async function getListingsHelper(
  ctx: {
    prisma: PrismaClient
    session?: { user?: { id: string; showNsfw?: boolean } } | null
  },
  input: GetListingsInput,
) {
  const {
    page = 1,
    limit = 20,
    gameId,
    systemId,
    deviceId,
    emulatorIds,
    search,
  } = input ?? {}

  // Build where clause with proper search filtering
  const baseWhere: Record<string, unknown> = {
    status: ApprovalStatus.APPROVED,
    game: {
      status: ApprovalStatus.APPROVED,
      ...buildNsfwFilter(ctx.session?.user?.showNsfw),
    },
  }

  if (gameId) baseWhere.gameId = gameId
  if (deviceId) baseWhere.deviceId = deviceId
  const emulatorFilter = buildArrayFilter(emulatorIds, 'emulatorId')
  if (emulatorFilter) {
    Object.assign(baseWhere, emulatorFilter)
  }
  if (systemId) {
    baseWhere.game = {
      ...(baseWhere.game as Record<string, unknown>),
      systemId,
    }
  }

  // Add search filtering at database level
  const searchConditions = buildSearchFilter(search, ['game.title', 'notes'])
  if (searchConditions) {
    baseWhere.OR = searchConditions
  }

  const [listings, total] = await Promise.all([
    ctx.prisma.listing.findMany({
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        game: {
          include: {
            system: { select: { id: true, name: true, key: true } },
          },
        },
        device: { include: { brand: true, soc: true } },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true } },
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    }),
    ctx.prisma.listing.count({ where: baseWhere }),
  ])

  const listingsWithStats = await Promise.all(
    listings.map((listing) =>
      calculateListingStats(listing, ctx.prisma, ctx.session?.user?.id),
    ),
  )

  const totalPages = Math.ceil(total / limit)

  return {
    listings: listingsWithStats,
    pagination: {
      total,
      pages: totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export const mobileListingsRouter = createMobileTRPCRouter({
  /**
   * Get listings with pagination and filtering
   */
  get: mobilePublicProcedure
    .input(GetListingsSchema)
    .query(async ({ ctx, input }) => getListingsHelper(ctx, input)),

  /**
   * Get featured listings
   */
  featured: mobilePublicProcedure.query(async ({ ctx }) => {
    const listings = await ctx.prisma.listing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        game: {
          status: ApprovalStatus.APPROVED,
          ...buildNsfwFilter(ctx.session?.user?.showNsfw),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        game: {
          include: { system: { select: { id: true, name: true, key: true } } },
        },
        device: { include: { brand: true, soc: true } },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true } },
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    return await Promise.all(
      listings.map((listing) =>
        calculateListingStats(listing, ctx.prisma, ctx.session?.user?.id),
      ),
    )
  }),

  /**
   * Get listings by game
   */
  byGame: mobilePublicProcedure
    .input(GetListingsByGameSchema)
    .query(async ({ ctx, input }) => {
      const listings = await ctx.prisma.listing.findMany({
        where: {
          gameId: input.gameId,
          status: ApprovalStatus.APPROVED,
          game: {
            status: ApprovalStatus.APPROVED,
            ...buildNsfwFilter(ctx.session?.user?.showNsfw),
          },
        },
        include: {
          device: { include: { brand: true, soc: true } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return await Promise.all(
        listings.map((listing) =>
          calculateListingStats(listing, ctx.prisma, ctx.session?.user?.id),
        ),
      )
    }),

  /**
   * Get listing by ID
   */
  byId: mobilePublicProcedure
    .input(GetListingByIdSchema)
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: true, soc: true } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
          customFieldValues: {
            include: {
              customFieldDefinition: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                  type: true,
                  options: true,
                },
              },
            },
          },
        },
      })

      if (!listing) return null

      return await calculateListingStats(
        listing,
        ctx.prisma,
        ctx.session?.user?.id,
      )
    }),

  /**
   * Get user listings
   */
  byUser: mobileProtectedProcedure
    .input(GetUserListingsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.listing.findMany({
        where: { authorId: input.userId },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: {
            include: { brand: { select: { id: true, name: true } } },
          },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  /**
   * Create a new listing
   */
  create: mobileProtectedProcedure
    .input(CreateListingSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.listing.create({
        data: {
          gameId: input.gameId,
          deviceId: input.deviceId,
          emulatorId: input.emulatorId,
          performanceId: input.performanceId,
          notes: input.notes,
          authorId: ctx.session.user.id,
          status: ApprovalStatus.PENDING,
          customFieldValues: input.customFieldValues
            ? {
                create: input.customFieldValues.map((cfv) => ({
                  customFieldDefinitionId: cfv.customFieldDefinitionId,
                  value: cfv.value,
                })),
              }
            : undefined,
        },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
      })
    }),

  /**
   * Update a listing
   */
  update: mobileProtectedProcedure
    .input(UpdateListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...updateData } = input

      // Check if user owns the listing
      const existing = await ctx.prisma.listing.findUnique({
        where: { id },
        select: { authorId: true },
      })

      if (!existing) return AppError.notFound('Listing')

      if (existing.authorId !== ctx.session.user.id) {
        return AppError.forbidden('You can only edit your own listings')
      }

      return await ctx.prisma.listing.update({
        where: { id },
        data: {
          ...updateData,
          customFieldValues: customFieldValues
            ? {
                deleteMany: {},
                create: customFieldValues.map((cfv) => ({
                  customFieldDefinitionId: cfv.customFieldDefinitionId,
                  value: cfv.value,
                })),
              }
            : undefined,
        },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
      })
    }),

  /**
   * Delete a listing
   */
  delete: mobileProtectedProcedure
    .input(DeleteListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the listing
      const existing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      })

      if (!existing) return AppError.notFound('Listing')

      return existing.authorId !== ctx.session.user.id
        ? AppError.forbidden('You can only delete your own listings')
        : await ctx.prisma.listing.delete({ where: { id: input.id } })
    }),

  /**
   * Vote on a listing
   */
  vote: mobileProtectedProcedure
    .input(VoteListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already voted
      const existingVote = await ctx.prisma.vote.findUnique({
        where: {
          userId_listingId: {
            userId: ctx.session.user.id,
            listingId: input.listingId,
          },
        },
      })

      return existingVote
        ? await ctx.prisma.vote.update({
            where: { id: existingVote.id },
            data: { value: input.value },
          })
        : await ctx.prisma.vote.create({
            data: {
              value: input.value,
              listingId: input.listingId,
              userId: ctx.session.user.id,
            },
          })
    }),

  /**
   * Get user's vote on a listing
   */
  userVote: mobileProtectedProcedure
    .input(GetUserVoteSchema)
    .query(async ({ ctx, input }) => {
      const vote = await ctx.prisma.vote.findUnique({
        where: {
          userId_listingId: {
            userId: ctx.session.user.id,
            listingId: input.listingId,
          },
        },
        select: { value: true },
      })

      return vote?.value ?? null
    }),

  /**
   * Get listing comments
   */
  comments: mobilePublicProcedure
    .input(GetListingCommentsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.comment.findMany({
        where: { listingId: input.listingId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    }),

  /**
   * Create a comment
   */
  createComment: mobileProtectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.comment.create({
        data: {
          content: input.content,
          listingId: input.listingId,
          userId: ctx.session.user.id,
        },
        include: { user: { select: { id: true, name: true } } },
      })
    }),

  /**
   * Update a comment
   */
  updateComment: mobileProtectedProcedure
    .input(UpdateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the comment
      const existing = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      })

      if (!existing) return ResourceError.comment.notFound()

      if (existing.userId !== ctx.session.user.id) {
        return AppError.forbidden('You can only edit your own comments')
      }

      return await ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: { content: input.content },
        include: { user: { select: { id: true, name: true } } },
      })
    }),

  /**
   * Delete a comment
   */
  deleteComment: mobileProtectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the comment
      const existing = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      })

      if (!existing) return ResourceError.comment.notFound()

      return existing.userId !== ctx.session.user.id
        ? AppError.forbidden('You can only delete your own comments')
        : await ctx.prisma.comment.delete({ where: { id: input.commentId } })
    }),

  // Backward compatibility aliases
  /**
   * @deprecated Use 'get' instead
   */
  getListings: mobilePublicProcedure
    .input(GetListingsSchema)
    .query(async ({ ctx, input }) => getListingsHelper(ctx, input)),

  /**
   * @deprecated Use 'featured' instead
   */
  getFeaturedListings: mobilePublicProcedure.query(async ({ ctx }) => {
    const listings = await ctx.prisma.listing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        game: {
          status: ApprovalStatus.APPROVED,
          ...buildNsfwFilter(ctx.session?.user?.showNsfw),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        game: {
          include: { system: { select: { id: true, name: true, key: true } } },
        },
        device: { include: { brand: true, soc: true } },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true } },
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    return await Promise.all(
      listings.map((listing) =>
        calculateListingStats(listing, ctx.prisma, ctx.session?.user?.id),
      ),
    )
  }),

  /**
   * @deprecated Use 'byGame' instead
   */
  getListingsByGame: mobilePublicProcedure
    .input(GetListingsByGameSchema)
    .query(async ({ ctx, input }) => {
      const listings = await ctx.prisma.listing.findMany({
        where: {
          gameId: input.gameId,
          status: ApprovalStatus.APPROVED,
          game: {
            status: ApprovalStatus.APPROVED,
            ...buildNsfwFilter(ctx.session?.user?.showNsfw),
          },
        },
        include: {
          device: { include: { brand: true, soc: true } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return await Promise.all(
        listings.map((listing) =>
          calculateListingStats(listing, ctx.prisma, ctx.session?.user?.id),
        ),
      )
    }),

  /**
   * @deprecated Use 'byId' instead
   */
  getListingById: mobilePublicProcedure
    .input(GetListingByIdSchema)
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: true, soc: true } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
          customFieldValues: {
            include: {
              customFieldDefinition: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                  type: true,
                  options: true,
                },
              },
            },
          },
        },
      })

      if (!listing) return null

      return await calculateListingStats(
        listing,
        ctx.prisma,
        ctx.session?.user?.id,
      )
    }),

  /**
   * @deprecated Use 'byUser' instead
   */
  getUserListings: mobileProtectedProcedure
    .input(GetUserListingsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.listing.findMany({
        where: { authorId: input.userId },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: {
            include: { brand: { select: { id: true, name: true } } },
          },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  /**
   * @deprecated Use 'create' instead
   */
  createListing: mobileProtectedProcedure
    .input(CreateListingSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.listing.create({
        data: {
          gameId: input.gameId,
          deviceId: input.deviceId,
          emulatorId: input.emulatorId,
          performanceId: input.performanceId,
          notes: input.notes,
          authorId: ctx.session.user.id,
          status: ApprovalStatus.PENDING,
          customFieldValues: input.customFieldValues
            ? {
                create: input.customFieldValues.map((cfv) => ({
                  customFieldDefinitionId: cfv.customFieldDefinitionId,
                  value: cfv.value,
                })),
              }
            : undefined,
        },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
      })
    }),

  /**
   * @deprecated Use 'update' instead
   */
  updateListing: mobileProtectedProcedure
    .input(UpdateListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...updateData } = input

      // Check if user owns the listing
      const existing = await ctx.prisma.listing.findUnique({
        where: { id },
        select: { authorId: true },
      })

      if (!existing) return AppError.notFound('Listing')

      if (existing.authorId !== ctx.session.user.id) {
        return AppError.forbidden('You can only edit your own listings')
      }

      return await ctx.prisma.listing.update({
        where: { id },
        data: {
          ...updateData,
          customFieldValues: customFieldValues
            ? {
                deleteMany: {},
                create: customFieldValues.map((cfv) => ({
                  customFieldDefinitionId: cfv.customFieldDefinitionId,
                  value: cfv.value,
                })),
              }
            : undefined,
        },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
      })
    }),

  /**
   * @deprecated Use 'delete' instead
   */
  deleteListing: mobileProtectedProcedure
    .input(DeleteListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the listing
      const existing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      })

      if (!existing) return AppError.notFound('Listing')

      return existing.authorId !== ctx.session.user.id
        ? AppError.forbidden('You can only delete your own listings')
        : await ctx.prisma.listing.delete({ where: { id: input.id } })
    }),

  /**
   * @deprecated Use 'vote' instead
   */
  voteListing: mobileProtectedProcedure
    .input(VoteListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already voted
      const existingVote = await ctx.prisma.vote.findUnique({
        where: {
          userId_listingId: {
            userId: ctx.session.user.id,
            listingId: input.listingId,
          },
        },
      })

      return existingVote
        ? await ctx.prisma.vote.update({
            where: { id: existingVote.id },
            data: { value: input.value },
          })
        : await ctx.prisma.vote.create({
            data: {
              value: input.value,
              listingId: input.listingId,
              userId: ctx.session.user.id,
            },
          })
    }),

  /**
   * @deprecated Use 'userVote' instead
   */
  getUserVote: mobileProtectedProcedure
    .input(GetUserVoteSchema)
    .query(async ({ ctx, input }) => {
      const vote = await ctx.prisma.vote.findUnique({
        where: {
          userId_listingId: {
            userId: ctx.session.user.id,
            listingId: input.listingId,
          },
        },
        select: { value: true },
      })

      return vote?.value ?? null
    }),

  /**
   * @deprecated Use 'comments' instead
   */
  getListingComments: mobilePublicProcedure
    .input(GetListingCommentsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.comment.findMany({
        where: { listingId: input.listingId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    }),
})
