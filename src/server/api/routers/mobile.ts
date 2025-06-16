import { AppError } from '@/lib/errors'
import {
  CreateCommentSchema,
  CreateListingSchema,
  DeleteCommentSchema,
  DeleteListingSchema,
  GetGameByIdSchema,
  GetListingByIdSchema,
  GetListingCommentsSchema,
  GetListingsByGameSchema,
  GetUserListingsSchema,
  GetUserProfileSchema,
  SearchGamesSchema,
  UpdateCommentSchema,
  UpdateListingSchema,
  UpdateProfileSchema,
  VoteListingSchema,
} from '@/schemas/mobile'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { ApprovalStatus } from '@orm'

export const mobileRouter = createTRPCRouter({
  getFeaturedListings: publicProcedure.query(async ({ ctx }) => {
    const listings = await ctx.prisma.listing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        game: { status: ApprovalStatus.APPROVED },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        game: {
          include: { system: { select: { id: true, name: true, key: true } } },
        },
        device: { include: { brand: { select: { id: true, name: true } } } },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true } },
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    // Calculate success rate for each listing
    return await Promise.all(
      listings.map(async (listing) => {
        const upVotes = await ctx.prisma.vote.count({
          where: { listingId: listing.id, value: true },
        })
        const downVotes = await ctx.prisma.vote.count({
          where: { listingId: listing.id, value: false },
        })
        const totalVotes = upVotes + downVotes
        const successRate = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0

        return { ...listing, successRate, upVotes, downVotes, totalVotes }
      }),
    )
  }),

  getPopularGames: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.game.findMany({
      where: { status: ApprovalStatus.APPROVED },
      include: {
        system: { select: { id: true, name: true, key: true } },
        _count: {
          select: { listings: { where: { status: ApprovalStatus.APPROVED } } },
        },
      },
      orderBy: { listings: { _count: 'desc' } },
      take: 20,
    })
  }),

  getAppStats: publicProcedure.query(async ({ ctx }) => {
    const [totalListings, totalGames, totalUsers] = await Promise.all([
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.game.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.user.count(),
    ])

    return {
      totalListings,
      totalGames,
      totalUsers,
    }
  }),

  getListingsByGame: publicProcedure
    .input(GetListingsByGameSchema)
    .query(async ({ ctx, input }) => {
      const listings = await ctx.prisma.listing.findMany({
        where: { gameId: input.gameId, status: ApprovalStatus.APPROVED },
        include: {
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Calculate success rate for each listing
      return await Promise.all(
        listings.map(async (listing) => {
          const upVotes = await ctx.prisma.vote.count({
            where: { listingId: listing.id, value: true },
          })
          const downVotes = await ctx.prisma.vote.count({
            where: { listingId: listing.id, value: false },
          })
          const totalVotes = upVotes + downVotes
          const successRate = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0

          return { ...listing, successRate, upVotes, downVotes, totalVotes }
        }),
      )
    }),

  searchGames: publicProcedure.input(SearchGamesSchema).query(
    async ({ ctx, input }) =>
      await ctx.prisma.game.findMany({
        where: {
          status: ApprovalStatus.APPROVED,
          title: { contains: input.query, mode: 'insensitive' },
        },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        take: 20,
      }),
  ),

  getGameById: publicProcedure.input(GetGameByIdSchema).query(
    async ({ ctx, input }) =>
      await ctx.prisma.game.findUnique({
        where: { id: input.gameId },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
      }),
  ),

  getListingComments: publicProcedure.input(GetListingCommentsSchema).query(
    async ({ ctx, input }) =>
      await ctx.prisma.comment.findMany({
        where: { listingId: input.listingId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
  ),

  createComment: protectedProcedure.input(CreateCommentSchema).mutation(
    async ({ ctx, input }) =>
      await ctx.prisma.comment.create({
        data: {
          content: input.content,
          listingId: input.listingId,
          userId: ctx.session.user.id,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
  ),

  voteListing: protectedProcedure
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

  getUserProfile: protectedProcedure
    .input(GetUserProfileSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              votes: true,
              comments: true,
            },
          },
        },
      })
    }),

  getUserListings: protectedProcedure.input(GetUserListingsSchema).query(
    async ({ ctx, input }) =>
      await ctx.prisma.listing.findMany({
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
      }),
  ),

  getListingById: publicProcedure
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
          device: { include: { brand: { select: { id: true, name: true } } } },
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

      // Calculate success rate
      const upVotes = await ctx.prisma.vote.count({
        where: { listingId: listing.id, value: true },
      })
      const downVotes = await ctx.prisma.vote.count({
        where: { listingId: listing.id, value: false },
      })
      const totalVotes = upVotes + downVotes
      const successRate = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0

      return { ...listing, successRate, upVotes, downVotes, totalVotes }
    }),

  getSystems: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.system.findMany({
      select: { id: true, name: true, key: true },
      orderBy: { name: 'asc' },
    })
  }),

  getDevices: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.device.findMany({
      include: {
        brand: { select: { id: true, name: true } },
        soc: { select: { id: true, name: true, manufacturer: true } },
      },
      orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
    })
  }),

  createListing: protectedProcedure
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

  updateListing: protectedProcedure
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

  deleteListing: protectedProcedure
    .input(DeleteListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the listing
      const existing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      })

      if (!existing) return AppError.notFound('Listing')

      if (existing.authorId !== ctx.session.user.id) {
        return AppError.forbidden('You can only delete your own listings')
      }

      return await ctx.prisma.listing.delete({
        where: { id: input.id },
      })
    }),

  updateComment: protectedProcedure
    .input(UpdateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the comment
      const existing = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      })

      if (!existing) {
        return AppError.notFound('Comment')
      }

      if (existing.userId !== ctx.session.user.id) {
        return AppError.forbidden('You can only edit your own comments')
      }

      return await ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: { content: input.content },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
    }),

  deleteComment: protectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the comment
      const existing = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      })

      if (!existing) return AppError.notFound('Comment')

      if (existing.userId !== ctx.session.user.id) {
        return AppError.forbidden('You can only delete your own comments')
      }

      return await ctx.prisma.comment.delete({ where: { id: input.commentId } })
    }),

  updateProfile: protectedProcedure.input(UpdateProfileSchema).mutation(
    async ({ ctx, input }) =>
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          createdAt: true,
        },
      }),
  ),
})
