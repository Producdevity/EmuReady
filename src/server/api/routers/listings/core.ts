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
      const {
        systemId,
        deviceId,
        emulatorId,
        performanceId,
        searchTerm,
        page,
        limit,
        sortField,
        sortDirection,
        approvalStatus,
      } = input
      const skip = (page - 1) * limit

      const gameFilter: Prisma.GameWhereInput = {}
      if (systemId) {
        gameFilter.systemId = systemId
      }

      const filters: Prisma.ListingWhereInput = {
        ...(deviceId ? { deviceId } : {}),
        ...(emulatorId ? { emulatorId } : {}),
        ...(performanceId ? { performanceId } : {}),
        ...(approvalStatus
          ? { status: approvalStatus }
          : { status: ListingApprovalStatus.APPROVED }),
      }

      if (searchTerm) {
        filters.OR = [
          Object.keys(gameFilter).length
            ? {
                game: {
                  is: {
                    ...gameFilter,
                    title: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              }
            : {
                game: {
                  is: {
                    title: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
          {
            notes: { contains: searchTerm, mode: Prisma.QueryMode.insensitive },
          },
        ]
      } else if (Object.keys(gameFilter).length) {
        filters.game = { is: gameFilter }
      }

      const total = await ctx.prisma.listing.count({ where: filters })

      // Build orderBy based on sortField and sortDirection
      const orderBy: Prisma.ListingOrderByWithRelationInput[] = []

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'game.title':
            orderBy.push({ game: { title: sortDirection } })
            break
          case 'game.system.name':
            orderBy.push({ game: { system: { name: sortDirection } } })
            break
          case 'device':
            orderBy.push({ device: { brand: { name: sortDirection } } })
            orderBy.push({ device: { modelName: sortDirection } })
            break
          case 'emulator.name':
            orderBy.push({ emulator: { name: sortDirection } })
            break
          case 'performance.label':
            orderBy.push({ performance: { label: sortDirection } })
            break
          case 'author.name':
            orderBy.push({ author: { name: sortDirection } })
            break
          case 'createdAt':
            orderBy.push({ createdAt: sortDirection })
            break
          // 'successRate' will be handled after fetching the data
        }
      }

      // Default ordering if no sort specified or for secondary sort
      if (!orderBy.length || sortField !== 'createdAt') {
        orderBy.push({ createdAt: 'desc' })
      }

      const listings = await ctx.prisma.listing.findMany({
        where: filters,
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true } },
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
        take: limit,
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
      if (sortField === 'successRate' && sortDirection) {
        listingsWithStats.sort((a, b) =>
          sortDirection === 'asc'
            ? a.successRate - b.successRate
            : b.successRate - a.successRate,
        )
      }

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
    .input(GetListingByIdSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input

      const listing = await ctx.prisma.listing.findUnique({
        where: { id },
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true } },
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

      if (!listing) {
        ResourceError.listing.notFound()
        return // This will never be reached, but helps TypeScript
      }

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
