import { z } from 'zod'
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/api/trpc'
import { ApprovalStatus } from '@orm'
import type { Prisma } from '@orm'

export const mobileRouter = createTRPCRouter({
  // Get featured listings for home screen
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
          include: {
            system: {
              select: {
                id: true,
                name: true,
                key: true,
              },
            },
          },
        },
        device: {
          include: {
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        emulator: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        performance: {
          select: {
            id: true,
            label: true,
            rank: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    })

    // Calculate success rate for each listing
    const listingsWithSuccessRate = await Promise.all(
      listings.map(async (listing) => {
        const upVotes = await ctx.prisma.vote.count({
          where: { listingId: listing.id, value: true },
        })
        const totalVotes = listing._count.votes
        const successRate = totalVotes > 0 ? upVotes / totalVotes : 0
        return { ...listing, successRate }
      }),
    )

    return listingsWithSuccessRate
  }),

  // Get simplified listings with pagination
  getListings: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        gameId: z.string().optional(),
        systemId: z.string().optional(),
        deviceId: z.string().optional(),
        emulatorId: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, gameId, systemId, deviceId, emulatorId, search } =
        input
      const skip = (page - 1) * limit

      const where: Prisma.ListingWhereInput = {
        status: ApprovalStatus.APPROVED,
        game: {
          status: ApprovalStatus.APPROVED,
          ...(systemId && { systemId }),
          ...(search && {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          }),
        },
        ...(gameId && { gameId }),
        ...(deviceId && { deviceId }),
        ...(emulatorId && { emulatorId }),
      }

      const [listings, total] = await Promise.all([
        ctx.prisma.listing.findMany({
          where,
          include: {
            game: {
              include: {
                system: {
                  select: {
                    id: true,
                    name: true,
                    key: true,
                  },
                },
              },
            },
            device: {
              include: {
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            emulator: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            performance: {
              select: {
                id: true,
                label: true,
                rank: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                votes: true,
                comments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.listing.count({ where }),
      ])

      return {
        listings,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit,
        },
      }
    }),

  // Get listing details
  getListingById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        include: {
          game: {
            include: {
              system: true,
            },
          },
          device: {
            include: {
              brand: true,
              soc: true,
            },
          },
          emulator: true,
          performance: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          customFieldValues: {
            include: {
              customFieldDefinition: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      })

      if (!listing) {
        throw new Error('Listing not found')
      }

      // Calculate success rate
      const upVotes = await ctx.prisma.vote.count({
        where: { listingId: listing.id, value: true },
      })
      const totalVotes = listing._count.votes
      const successRate = totalVotes > 0 ? upVotes / totalVotes : 0

      // Get user's vote if authenticated
      let userVote = null
      if (ctx.session?.user) {
        const vote = await ctx.prisma.vote.findUnique({
          where: {
            userId_listingId: {
              userId: ctx.session.user.id,
              listingId: listing.id,
            },
          },
        })
        userVote = vote?.value ?? null
      }

      return { ...listing, successRate, userVote }
    }),

  // Get simplified games list
  getGames: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        systemId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, systemId, limit } = input

      let where: Prisma.GameWhereInput = {
        status: ApprovalStatus.APPROVED,
      }

      if (systemId) where.systemId = systemId
      if (search) {
        where.title = {
          contains: search,
          mode: 'insensitive',
        }
      }

      return ctx.prisma.game.findMany({
        where,
        include: {
          system: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
          _count: {
            select: {
              listings: true,
            },
          },
        },
        orderBy: { title: 'asc' },
        take: limit,
      })
    }),

  // Get systems
  getSystems: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.system.findMany({
      include: {
        _count: {
          select: {
            games: {
              where: {
                status: ApprovalStatus.APPROVED,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }),

  // Get devices
  getDevices: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        brandId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, brandId, limit } = input

      let where: Prisma.DeviceWhereInput = {}

      if (brandId) where.brandId = brandId
      if (search) {
        where.OR = [
          {
            modelName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            brand: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ]
      }

      return ctx.prisma.device.findMany({
        where,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          soc: {
            select: {
              id: true,
              name: true,
              manufacturer: true,
            },
          },
          _count: {
            select: {
              listings: true,
            },
          },
        },
        orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
        take: limit,
      })
    }),

  // Get emulators
  getEmulators: publicProcedure
    .input(
      z.object({
        systemId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { systemId, search, limit } = input

      let where: Prisma.EmulatorWhereInput = {}

      if (systemId) {
        where.systems = {
          some: {
            id: systemId,
          },
        }
      }

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive',
        }
      }

      return ctx.prisma.emulator.findMany({
        where,
        include: {
          systems: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
          _count: {
            select: {
              listings: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
      })
    }),

  // Vote on listing
  voteListing: protectedProcedure
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
        throw new Error('Listing not found')
      }

      // Upsert vote
      await ctx.prisma.vote.upsert({
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

      return { success: true }
    }),

  // Get user's profile
  getUserProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        _count: {
          select: {
            listings: true,
            votes: true,
            comments: true,
          },
        },
        devicePreferences: {
          include: {
            device: {
              include: {
                brand: true,
              },
            },
          },
        },
        socPreferences: {
          include: {
            soc: true,
          },
        },
      },
    })

    return user
  }),

  // Get user's listings
  getUserListings: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit } = input
      const skip = (page - 1) * limit

      const [listings, total] = await Promise.all([
        ctx.prisma.listing.findMany({
          where: { authorId: ctx.session.user.id },
          include: {
            game: {
              include: {
                system: {
                  select: {
                    id: true,
                    name: true,
                    key: true,
                  },
                },
              },
            },
            device: {
              include: {
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            emulator: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            performance: {
              select: {
                id: true,
                label: true,
                rank: true,
              },
            },
            _count: {
              select: {
                votes: true,
                comments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.listing.count({
          where: { authorId: ctx.session.user.id },
        }),
      ])

      return {
        listings,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit,
        },
      }
    }),
})
