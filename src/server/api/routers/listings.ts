import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  authorProcedure,
  adminProcedure,
} from '@/server/api/trpc'

export const listingsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        systemId: z.string().optional(),
        deviceId: z.string().optional(),
        emulatorId: z.string().optional(),
        performanceId: z.number().optional(),
        searchTerm: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        systemId,
        deviceId,
        emulatorId,
        performanceId,
        searchTerm,
        page,
        limit,
      } = input
      const skip = (page - 1) * limit

      // Build filters
      const filters = {
        ...(systemId ? { game: { systemId } } : {}),
        ...(deviceId ? { deviceId } : {}),
        ...(emulatorId ? { emulatorId } : {}),
        ...(performanceId ? { performanceId } : {}),
        ...(searchTerm
          ? {
              OR: [
                {
                  game: {
                    title: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
                { notes: { contains: searchTerm, mode: 'insensitive' } },
              ],
            }
          : {}),
      }

      // Count total matching records
      const total = await ctx.prisma.listing.count({
        where: filters,
      })

      // Get paginated listings
      const listings = await ctx.prisma.listing.findMany({
        where: filters,
        include: {
          game: {
            include: {
              system: true,
            },
          },
          device: true,
          emulator: true,
          performance: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
          votes: ctx.session
            ? {
                where: {
                  userId: ctx.session.user.id,
                },
                select: {
                  value: true,
                },
              }
            : undefined,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      })

      // For each listing calculate success rate
      const listingsWithStats = await Promise.all(
        listings.map(async (listing) => {
          // Count upvotes
          const upVotes = await ctx.prisma.vote.count({
            where: {
              listingId: listing.id,
              value: true,
            },
          })

          // Count all votes
          const totalVotes = listing._count.votes

          // Calculate success rate
          const successRate = totalVotes > 0 ? upVotes / totalVotes : 0

          // Get user's vote if logged in
          const userVote =
            ctx.session && listing.votes.length > 0
              ? listing.votes[0].value
              : null

          return {
            ...listing,
            successRate,
            userVote,
            // Remove the raw votes array from the response
            votes: undefined,
          }
        }),
      )

      return {
        listings: listingsWithStats,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      }
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input

      const listing = await ctx.prisma.listing.findUnique({
        where: { id },
        include: {
          game: {
            include: {
              system: true,
            },
          },
          device: true,
          emulator: true,
          performance: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
            where: {
              parentId: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
          votes: ctx.session
            ? {
                where: {
                  userId: ctx.session.user.id,
                },
              }
            : undefined,
        },
      })

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        })
      }

      // Count upvotes
      const upVotes = await ctx.prisma.vote.count({
        where: {
          listingId: listing.id,
          value: true,
        },
      })

      // Calculate success rate
      const successRate =
        listing._count.votes > 0 ? upVotes / listing._count.votes : 0

      // Get user's vote if logged in
      const userVote =
        ctx.session && listing.votes.length > 0 ? listing.votes[0].value : null

      return {
        ...listing,
        successRate,
        userVote,
        // Remove the raw votes array from the response
        votes: undefined,
      }
    }),

  create: authorProcedure
    .input(
      z.object({
        gameId: z.string(),
        deviceId: z.string(),
        emulatorId: z.string(),
        performanceId: z.number(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { gameId, deviceId, emulatorId, performanceId, notes } = input

      // Check if listing already exists
      const existingListing = await ctx.prisma.listing.findFirst({
        where: {
          gameId,
          deviceId,
          emulatorId,
        },
      })

      if (existingListing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'A listing for this game, device, and emulator combination already exists',
        })
      }

      // Create new listing
      return ctx.prisma.listing.create({
        data: {
          gameId,
          deviceId,
          emulatorId,
          performanceId,
          notes,
          authorId: ctx.session.user.id,
        },
      })
    }),

  vote: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
        value: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { listingId, value } = input
      const userId = ctx.session.user.id

      // Check if listing exists
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        })
      }

      // Check if user already voted
      const existingVote = await ctx.prisma.vote.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      })

      if (existingVote) {
        // If value is the same, remove the vote (toggle)
        if (existingVote.value === value) {
          await ctx.prisma.vote.delete({
            where: {
              userId_listingId: {
                userId,
                listingId,
              },
            },
          })
          return { message: 'Vote removed' }
        }

        // Otherwise update the existing vote
        return ctx.prisma.vote.update({
          where: {
            userId_listingId: {
              userId,
              listingId,
            },
          },
          data: {
            value,
          },
        })
      }

      // Create new vote
      return ctx.prisma.vote.create({
        data: {
          value,
          userId,
          listingId,
        },
      })
    }),

  // Add a comment to a listing
  comment: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
        content: z.string().min(1).max(1000),
        parentId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { listingId, content, parentId } = input
      const userId = ctx.session.user.id

      // Check if listing exists
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        })
      }

      // If parentId is provided, check if parent comment exists
      if (parentId) {
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: parentId },
        })

        if (!parentComment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent comment not found',
          })
        }
      }

      // Create comment
      return ctx.prisma.comment.create({
        data: {
          content,
          userId,
          listingId,
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    }),

  // Delete a listing (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input

      // Check if listing exists
      const listing = await ctx.prisma.listing.findUnique({
        where: { id },
      })

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        })
      }

      // Delete listing
      await ctx.prisma.listing.delete({
        where: { id },
      })

      return { success: true }
    }),

  performanceScales: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.performanceScale.findMany({
      orderBy: { rank: 'asc' },
    })
  }),
})
