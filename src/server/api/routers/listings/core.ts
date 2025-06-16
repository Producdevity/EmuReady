import { keys } from 'remeda'
import { ResourceError } from '@/lib/errors'
import {
  applyTrustAction,
  canUserAutoApprove,
  reverseTrustAction,
} from '@/lib/trust/service'
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
import {
  notificationEventEmitter,
  NOTIFICATION_EVENTS,
} from '@/server/notifications/eventEmitter'
import { hasPermission } from '@/utils/permissions'
import { ApprovalStatus, Prisma, Role, TrustAction } from '@orm'
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

      // Game approval status filtering - similar to listing status filtering
      if (hasPermission(ctx.session?.user?.role, Role.ADMIN)) {
        // Admins can see listings for all games
      } else if (ctx.session?.user?.id) {
        // Authenticated users see listings for approved games + their own pending games
        gameFilter.OR = [
          { status: ApprovalStatus.APPROVED },
          {
            status: ApprovalStatus.PENDING,
            submittedBy: ctx.session.user.id,
          },
        ]
      } else {
        // Public users only see listings for approved games
        gameFilter.status = ApprovalStatus.APPROVED
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
      }

      // Status filtering: show approved listings for everyone, plus pending listings for the current user
      let statusFilter: Prisma.ListingWhereInput
      if (input.approvalStatus) {
        statusFilter = { status: input.approvalStatus }
      } else {
        // Default behavior: show approved listings + user's own pending listings
        if (ctx.session) {
          statusFilter = {
            OR: [
              { status: ApprovalStatus.APPROVED },
              {
                status: ApprovalStatus.PENDING,
                authorId: ctx.session.user.id,
              },
            ],
          }
        } else {
          statusFilter = { status: ApprovalStatus.APPROVED }
        }
      }

      // Combine all filters using AND logic
      const combinedFilters: Prisma.ListingWhereInput = {
        ...filters,
        ...statusFilter,
      }

      // Add search filters if provided
      if (input.searchTerm) {
        const searchFilters: Prisma.ListingWhereInput[] = [
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

        // Combine status filter with search filters
        combinedFilters.AND = [statusFilter, { OR: searchFilters }]

        // Remove the duplicate status filters from the root level
        delete combinedFilters.status
        delete combinedFilters.OR
      } else if (keys(gameFilter).length) {
        combinedFilters.game = { is: gameFilter }
      }

      const total = await ctx.prisma.listing.count({ where: combinedFilters })

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
        where: combinedFilters,
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
          author: {
            select: { id: true, name: true, email: true, profileImage: true },
          },
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

      return ctx.prisma.$transaction(async (tx) => {
        // Validate custom fields
        await validateCustomFields(tx, emulatorId, customFieldValues)

        // Check if user can auto-approve
        const canAutoApprove = await canUserAutoApprove(authorId)
        const listingStatus = canAutoApprove
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.PENDING

        const newListing = await tx.listing.create({
          data: {
            gameId,
            deviceId,
            emulatorId,
            performanceId,
            notes,
            authorId: authorId,
            status: listingStatus,
            ...(canAutoApprove && {
              processedAt: new Date(),
              processedNotes: 'Auto-approved (Trusted user)',
            }),
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

        // Apply trust action for creating a listing
        await applyTrustAction({
          userId: authorId,
          action: TrustAction.LISTING_CREATED,
          context: { listingId: newListing.id },
        })

        // Emit notification event
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.LISTING_CREATED,
          entityType: 'listing',
          entityId: newListing.id,
          triggeredBy: authorId,
          payload: {
            listingId: newListing.id,
            gameId: gameId,
            deviceId: deviceId,
            emulatorId: emulatorId,
            performanceId: performanceId,
            notes: notes,
            customFieldValues: customFieldValues,
          },
        })

        return newListing
      })
    }),

  vote: protectedProcedure
    .input(CreateVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.listingId },
      })

      if (!listing) return ResourceError.listing.notFound()

      const userExists = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!userExists) return ResourceError.user.notInDatabase(userId)

      // Check if user already voted
      const existingVote = await ctx.prisma.vote.findUnique({
        where: { userId_listingId: { userId, listingId: input.listingId } },
      })

      if (!existingVote) {
        // Create new vote
        const vote = await ctx.prisma.vote.create({
          data: { value: input.value, userId, listingId: input.listingId },
        })

        // Apply trust action for the vote
        await applyTrustAction({
          userId,
          action: input.value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE,
          context: { listingId: input.listingId },
        })

        // Emit notification event for new vote
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.LISTING_VOTED,
          entityType: 'listing',
          entityId: input.listingId,
          triggeredBy: userId,
          payload: {
            listingId: input.listingId,
            voteId: vote.id,
            voteValue: input.value,
          },
        })

        return vote
      }

      // If value is the same, remove the vote (toggle)
      if (existingVote.value === input.value) {
        await ctx.prisma.vote.delete({
          where: { userId_listingId: { userId, listingId: input.listingId } },
        })

        // Properly reverse the original trust action when vote is removed
        await reverseTrustAction({
          userId,
          action: existingVote.value
            ? TrustAction.UPVOTE
            : TrustAction.DOWNVOTE,
          context: { listingId: input.listingId, reason: 'vote_removed' },
        })

        return { message: 'Vote removed' }
      }

      // Otherwise update the existing vote
      const updatedVote = await ctx.prisma.vote.update({
        where: { userId_listingId: { userId, listingId: input.listingId } },
        data: { value: input.value },
      })

      // Apply trust action for vote change (properly reverse old, add new)
      await reverseTrustAction({
        userId,
        action: existingVote.value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE,
        context: { listingId: input.listingId, reason: 'vote_changed_from' },
      })
      await applyTrustAction({
        userId,
        action: input.value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE,
        context: { listingId: input.listingId, reason: 'vote_changed_to' },
      })

      // Emit notification event for vote update
      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.LISTING_VOTED,
        entityType: 'listing',
        entityId: input.listingId,
        triggeredBy: userId,
        payload: {
          listingId: input.listingId,
          voteId: updatedVote.id,
          voteValue: input.value,
        },
      })

      return updatedVote
    }),

  performanceScales: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.performanceScale.findMany({ orderBy: { rank: 'asc' } })
  }),

  statistics: publicProcedure.query(async ({ ctx }) => {
    const [listingsCount, gamesCount, emulatorsCount, devicesCount] =
      await Promise.all([
        ctx.prisma.listing.count({
          where: { status: ApprovalStatus.APPROVED },
        }),
        ctx.prisma.game.count({
          where: { status: ApprovalStatus.APPROVED },
        }),
        ctx.prisma.emulator.count(),
        ctx.prisma.device.count(),
      ])

    return {
      listings: listingsCount,
      games: gamesCount,
      emulators: emulatorsCount,
      devices: devicesCount,
    }
  }),

  featured: publicProcedure.query(async ({ ctx }) => {
    const listings = await ctx.prisma.listing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        game: { status: ApprovalStatus.APPROVED },
      },
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
