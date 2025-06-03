import { keys } from 'remeda'
import { AppError, ResourceError } from '@/lib/errors'
import {
  CreateListingSchema,
  CreateVoteSchema,
  GetListingByIdSchema,
  GetListingsSchema,
} from '@/schemas/listing'
import {
  authorProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { ListingApprovalStatus, Prisma } from '@orm'
import { validateCustomFields } from './validation'

export const coreRouter = createTRPCRouter({
  get: publicProcedure
    .input(GetListingsSchema)
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit

      const gameFilter: Prisma.GameWhereInput = {}
      if (input.systemIds && input.systemIds.length > 0) {
        gameFilter.systemId = { in: input.systemIds }
      }

      const filters: Prisma.ListingWhereInput = {
        ...(input.deviceIds && input.deviceIds.length > 0
          ? { deviceId: { in: input.deviceIds } }
          : {}),
        ...(input.socIds && input.socIds.length > 0
          ? { device: { socId: { in: input.socIds } } }
          : {}),
        ...(input.emulatorIds && input.emulatorIds.length > 0
          ? { emulatorId: { in: input.emulatorIds } }
          : {}),
        ...(input.performanceIds && input.performanceIds.length > 0
          ? { performanceId: { in: input.performanceIds } }
          : {}),
        ...(input.approvalStatus
          ? { status: input.approvalStatus }
          : { status: ListingApprovalStatus.APPROVED }),
      }

      if (input.searchTerm) {
        filters.OR = [
          keys(gameFilter).length
            ? {
                game: {
                  is: {
                    ...gameFilter,
                    title: {
                      contains: input.searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              }
            : {
                game: {
                  is: {
                    title: {
                      contains: input.searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
          {
            notes: {
              contains: input.searchTerm,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ]
      } else if (keys(gameFilter).length) {
        filters.game = { is: gameFilter }
      }

      const total = await ctx.prisma.listing.count({ where: filters })

      // Build orderBy based on sortField and sortDirection
      const orderBy: Prisma.ListingOrderByWithRelationInput[] = []

      if (input.sortField && input.sortDirection) {
        switch (input.sortField) {
          case 'game.title':
            orderBy.push({ game: { title: input.sortDirection } })
            break
          case 'game.system.name':
            orderBy.push({ game: { system: { name: input.sortDirection } } })
            break
          case 'device':
            orderBy.push({ device: { brand: { name: input.sortDirection } } })
            orderBy.push({ device: { modelName: input.sortDirection } })
            break
          case 'emulator.name':
            orderBy.push({ emulator: { name: input.sortDirection } })
            break
          case 'performance.label':
            orderBy.push({ performance: { label: input.sortDirection } })
            break
          case 'author.name':
            orderBy.push({ author: { name: input.sortDirection } })
            break
          case 'createdAt':
            orderBy.push({ createdAt: input.sortDirection })
            break
          // 'successRate' will be handled after fetching the data
        }
      }

      // Default ordering if no sort specified or for secondary sort
      if (!orderBy.length || input.sortField !== 'createdAt') {
        orderBy.push({ createdAt: 'desc' })
      }

      const listings = await ctx.prisma.listing.findMany({
        where: filters,
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true, soc: true } },
          emulator: true,
          performance: true,
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { votes: true, comments: true } },
          votes: ctx.session
            ? {
                where: { userId: ctx.session.user.id },
                select: { value: true },
              }
            : undefined,
        },
        orderBy,
        skip,
        take: input.limit,
      })

      // For each listing calculate success rate
      const listingsWithStats = await Promise.all(
        listings.map(async (listing) => {
          // Count upvotes
          const upVotes = await ctx.prisma.vote.count({
            where: { listingId: listing.id, value: true },
          })

          const totalVotes = listing._count.votes
          const successRate = totalVotes > 0 ? upVotes / totalVotes : 0

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

      // Handle sorting by success rate since it's calculated after the database query
      if (input.sortField === 'successRate' && input.sortDirection) {
        listingsWithStats.sort((a, b) =>
          input.sortDirection === 'asc'
            ? a.successRate - b.successRate
            : b.successRate - a.successRate,
        )
      }

      return {
        listings: listingsWithStats,
        pagination: {
          total,
          pages: Math.ceil(total / input.limit),
          page: input.page,
          limit: input.limit,
        },
      }
    }),

  byId: publicProcedure
    .input(GetListingByIdSchema)
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true, soc: true } },
          emulator: true,
          performance: true,
          author: { select: { id: true, name: true, email: true } },
          customFieldValues: {
            include: { customFieldDefinition: true },
            orderBy: { customFieldDefinition: { name: 'asc' } },
          },
          comments: {
            where: { parentId: null },
            include: {
              user: { select: { id: true, name: true } },
              replies: {
                include: { user: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { votes: true } },
          votes: ctx.session
            ? { where: { userId: ctx.session.user.id } }
            : undefined,
        },
      })

      if (!listing) return ResourceError.listing.notFound()

      // Count upvotes
      const upVotes = await ctx.prisma.vote.count({
        where: { listingId: listing.id, value: true },
      })

      const successRate =
        listing._count.votes > 0 ? upVotes / listing._count.votes : 0

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
    .input(CreateListingSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        gameId,
        deviceId,
        emulatorId,
        performanceId,
        notes,
        customFieldValues,
      } = input
      const authorId = ctx.session.user.id

      const userExists = await ctx.prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true },
      })

      // TODO: consider logging this error
      if (!userExists) return ResourceError.user.notInDatabase(authorId)

      const existingListing = await ctx.prisma.listing.findFirst({
        where: {
          gameId,
          deviceId,
          emulatorId,
        },
      })

      if (existingListing) {
        AppError.conflict(
          'A listing for this game, device, and emulator combination already exists',
        )
      }

      return ctx.prisma.$transaction(async (tx) => {
        // Validate custom fields
        await validateCustomFields(tx, emulatorId, customFieldValues)

        const newListing = await tx.listing.create({
          data: {
            gameId,
            deviceId,
            emulatorId,
            performanceId,
            notes,
            authorId: authorId,
            status: ListingApprovalStatus.PENDING,
          },
        })

        // Create custom field values
        if (customFieldValues && customFieldValues.length > 0) {
          for (const cfv of customFieldValues) {
            await tx.listingCustomFieldValue.create({
              data: {
                listingId: newListing.id,
                customFieldDefinitionId: cfv.customFieldDefinitionId,
                value:
                  cfv.value === null
                    ? Prisma.JsonNull
                    : (cfv.value as Prisma.InputJsonValue),
              },
            })
          }
        }
        return newListing
      })
    }),

  vote: protectedProcedure
    .input(CreateVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, value } = input
      const userId = ctx.session.user.id

      const listing = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listing) return ResourceError.listing.notFound()

      const userExists = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!userExists) return ResourceError.user.notInDatabase(userId)

      // Check if user already voted
      const existingVote = await ctx.prisma.vote.findUnique({
        where: { userId_listingId: { userId, listingId } },
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
          data: { value },
        })
      }

      // Create new vote
      return ctx.prisma.vote.create({ data: { value, userId, listingId } })
    }),

  performanceScales: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.performanceScale.findMany({ orderBy: { rank: 'asc' } })
  }),

  featured: publicProcedure.query(async ({ ctx }) => {
    const listings = await ctx.prisma.listing.findMany({
      where: { status: ListingApprovalStatus.APPROVED },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        game: { include: { system: true } },
        device: { include: { brand: true } },
        emulator: true,
        performance: true,
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    async function calculateSuccessRate(listing: (typeof listings)[0]) {
      const upVotes = await ctx.prisma.vote.count({
        where: { listingId: listing.id, value: true },
      })
      const totalVotes = listing._count.votes
      const successRate = totalVotes > 0 ? upVotes / totalVotes : 0
      return { ...listing, successRate }
    }

    return await Promise.all(listings.map(calculateSuccessRate))
  }),
})
