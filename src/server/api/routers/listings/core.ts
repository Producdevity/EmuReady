import { keys } from 'remeda'
import { z } from 'zod'
import analytics from '@/lib/analytics'
import { RECAPTCHA_CONFIG } from '@/lib/captcha/config'
import { getClientIP, verifyRecaptcha } from '@/lib/captcha/verify'
import { ResourceError, AppError } from '@/lib/errors'
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
  UpdateListingUserSchema,
  GetListingForUserEditSchema,
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

const EDIT_TIME_LIMIT_MINUTES = 60

export const coreRouter = createTRPCRouter({
  get: publicProcedure
    .input(GetListingsSchema)
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit

      const gameFilter: Prisma.GameWhereInput = {}
      if (input.systemIds && input.systemIds.length > 0) {
        gameFilter.systemId = { in: input.systemIds }
      }

      // Game approval status filtering - filter games based on user authentication
      if (ctx.session?.user?.id) {
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

      // Add myListings filter if requested and user is authenticated
      if (input.myListings && ctx.session?.user?.id) {
        filters.authorId = ctx.session.user.id
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

      // Special handling for success rate sorting - we need to fetch all data first
      const isSortingBySuccessRate = input.sortField === 'successRate'

      if (input.sortField && input.sortDirection && !isSortingBySuccessRate) {
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
          case 'performance.rank':
            orderBy.push({ performance: { rank: input.sortDirection } })
            break
          case 'author.name':
            orderBy.push({ author: { name: input.sortDirection } })
            break
          case 'createdAt':
            orderBy.push({ createdAt: input.sortDirection })
            break
        }
      }

      // Default ordering if no sort specified or for secondary sort
      if (
        !orderBy.length ||
        (input.sortField !== 'createdAt' && !isSortingBySuccessRate)
      ) {
        orderBy.push({ createdAt: 'desc' })
      }

      // For success rate sorting, we need to fetch ALL listings, calculate rates, sort, then paginate
      if (isSortingBySuccessRate) {
        const allListings = await ctx.prisma.listing.findMany({
          where: combinedFilters,
          include: {
            game: { include: { system: true } },
            device: { include: { brand: true, soc: true } },
            emulator: true,
            performance: true,
            author: { select: { id: true, name: true } },
            _count: { select: { votes: true, comments: true } },
            votes: ctx.session
              ? {
                  where: { userId: ctx.session.user.id },
                  select: { value: true },
                }
              : undefined,
          },
          orderBy: { createdAt: 'desc' }, // fallback ordering
        })

        // Calculate success rates for all listings
        const allListingsWithStats = await Promise.all(
          allListings.map(async (listing) => {
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

        // Sort by success rate / verified
        allListingsWithStats.sort((a, b) => {
          if (input.sortDirection === 'asc') {
            // For ascending (low to high)
            // 1. Listings with votes and low success rate first
            // 2. Listings with no votes last
            if (a._count.votes === 0 && b._count.votes === 0) return 0
            if (a._count.votes === 0) return 1
            if (b._count.votes === 0) return -1
            return a.successRate - b.successRate
          } else {
            // For descending (high to low)
            // 1. Listings with high success rate first
            // 2. Listings with no votes last
            if (a._count.votes === 0 && b._count.votes === 0) return 0
            if (a._count.votes === 0) return 1
            if (b._count.votes === 0) return -1
            return b.successRate - a.successRate
          }
        })

        // Apply pagination manually
        const startIndex = skip
        const endIndex = skip + input.limit
        const paginatedListings = allListingsWithStats.slice(
          startIndex,
          endIndex,
        )

        return {
          listings: paginatedListings,
          pagination: {
            total,
            pages: Math.ceil(total / input.limit),
            page: input.page,
            limit: input.limit,
          },
        }
      }

      // Regular database sorting for other fields
      const listings = await ctx.prisma.listing.findMany({
        where: combinedFilters,
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true, soc: true } },
          emulator: true,
          performance: true,
          author: { select: { id: true, name: true } },
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
            select: { id: true, name: true, profileImage: true },
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
        recaptchaToken,
      } = input
      const authorId = ctx.session.user.id

      // Verify CAPTCHA if token is provided
      if (recaptchaToken) {
        const clientIP = ctx.headers ? getClientIP(ctx.headers) : undefined
        const captchaResult = await verifyRecaptcha({
          token: recaptchaToken,
          expectedAction: RECAPTCHA_CONFIG.actions.CREATE_LISTING,
          userIP: clientIP,
        })

        if (!captchaResult.success) {
          throw new Error(`CAPTCHA verification failed: ${captchaResult.error}`)
        }
      }

      const userExists = await ctx.prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true },
      })

      if (!userExists) {
        analytics.user.notInDatabase({
          userId: authorId,
          userRole: ctx.session.user.role ?? 'UNKNOWN',
        })
        return ResourceError.user.notInDatabase(authorId)
      }

      return ctx.prisma.$transaction(async (tx) => {
        // Validate custom fields
        await validateCustomFields(tx, emulatorId, customFieldValues)

        // Check if user can auto-approve
        const canAutoApprove = await canUserAutoApprove(authorId)
        const isAuthorOrHigher = hasPermission(
          ctx.session.user.role,
          Role.AUTHOR,
        )
        const listingStatus =
          canAutoApprove || isAuthorOrHigher
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
            ...((canAutoApprove || isAuthorOrHigher) && {
              processedByUserId: authorId,
              processedAt: new Date(),
              processedNotes:
                isAuthorOrHigher && !canAutoApprove
                  ? 'Auto-approved (Author or higher role)'
                  : 'Auto-approved (Trusted user)',
            }),
          },
        })

        // Create custom field values
        if (customFieldValues && customFieldValues.length > 0) {
          await tx.listingCustomFieldValue.createMany({
            data: customFieldValues.map((cfv) => ({
              listingId: newListing.id,
              customFieldDefinitionId: cfv.customFieldDefinitionId,
              value:
                cfv.value === null
                  ? Prisma.JsonNull
                  : (cfv.value as Prisma.InputJsonValue),
            })),
          })
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

        // Get game system ID for analytics
        const game = await tx.game.findUnique({
          where: { id: gameId },
          select: { systemId: true },
        })

        analytics.listing.created({
          listingId: newListing.id,
          gameId: gameId,
          systemId: game?.systemId || 'unknown',
          emulatorId: emulatorId,
          deviceId: deviceId,
          performanceId: performanceId,
          hasCustomFields: (customFieldValues?.length || 0) > 0,
          customFieldCount: customFieldValues?.length || 0,
        })

        // Check if this is user's first listing for journey analytics
        const userListingCount = await tx.listing.count({
          where: { authorId: authorId },
        })

        if (userListingCount === 1) {
          analytics.userJourney.firstTimeAction({
            userId: authorId,
            action: 'first_listing',
          })
        }

        return newListing
      })
    }),

  vote: protectedProcedure
    .input(CreateVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify CAPTCHA if token is provided
      if (input.recaptchaToken) {
        const clientIP = ctx.headers ? getClientIP(ctx.headers) : undefined
        const captchaResult = await verifyRecaptcha({
          token: input.recaptchaToken,
          expectedAction: RECAPTCHA_CONFIG.actions.VOTE,
          userIP: clientIP,
        })

        if (!captchaResult.success) {
          throw new Error(`CAPTCHA verification failed: ${captchaResult.error}`)
        }
      }

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
        // Get listing details to find the author
        const listing = await ctx.prisma.listing.findUnique({
          where: { id: input.listingId },
          select: { authorId: true },
        })

        if (!listing) return AppError.notFound('Listing')

        // Create new vote
        const vote = await ctx.prisma.vote.create({
          data: { value: input.value, userId, listingId: input.listingId },
        })

        // Apply trust action for the voter
        await applyTrustAction({
          userId,
          action: input.value ? TrustAction.UPVOTE : TrustAction.DOWNVOTE,
          context: { listingId: input.listingId },
        })

        // Apply trust action for the listing creator (only if not voting on their own listing)
        if (listing.authorId && listing.authorId !== userId) {
          await applyTrustAction({
            userId: listing.authorId,
            action: input.value
              ? TrustAction.LISTING_RECEIVED_UPVOTE
              : TrustAction.LISTING_RECEIVED_DOWNVOTE,
            context: { listingId: input.listingId, voterId: userId },
          })
        }

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

        analytics.engagement.vote({
          listingId: input.listingId,
          voteValue: input.value,
        })

        // Check if this is user's first vote for journey analytics
        const userVoteCount = await ctx.prisma.vote.count({
          where: { userId: userId },
        })

        if (userVoteCount === 1) {
          analytics.userJourney.firstTimeAction({
            userId: userId,
            action: 'first_vote',
          })
        }

        return vote
      }

      // If value is the same, remove the vote (toggle)
      if (existingVote.value === input.value) {
        // Get listing details to find the author
        const listingForRemoval = await ctx.prisma.listing.findUnique({
          where: { id: input.listingId },
          select: { authorId: true },
        })

        if (!listingForRemoval) {
          AppError.notFound('Listing')
        }

        await ctx.prisma.vote.delete({
          where: { userId_listingId: { userId, listingId: input.listingId } },
        })

        // Reverse trust action for the voter
        await reverseTrustAction({
          userId,
          action: existingVote.value
            ? TrustAction.UPVOTE
            : TrustAction.DOWNVOTE,
          context: { listingId: input.listingId, reason: 'vote_removed' },
        })

        // Reverse trust action for the listing creator (only if they didn't vote on their own listing)
        if (
          listingForRemoval.authorId &&
          listingForRemoval.authorId !== userId
        ) {
          await reverseTrustAction({
            userId: listingForRemoval.authorId,
            action: existingVote.value
              ? TrustAction.LISTING_RECEIVED_UPVOTE
              : TrustAction.LISTING_RECEIVED_DOWNVOTE,
            context: {
              listingId: input.listingId,
              reason: 'vote_removed',
              voterId: userId,
            },
          })
        }

        return { message: 'Vote removed' }
      }

      // Otherwise update the existing vote
      // Get listing details to find the author
      const listingForUpdate = await ctx.prisma.listing.findUnique({
        where: { id: input.listingId },
        select: { authorId: true },
      })

      if (!listingForUpdate) {
        AppError.notFound('Listing')
      }

      const updatedVote = await ctx.prisma.vote.update({
        where: { userId_listingId: { userId, listingId: input.listingId } },
        data: { value: input.value },
      })

      // Apply trust action for vote change (properly reverse old, add new) for voter
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

      // Apply trust action for vote change for listing creator (only if they didn't vote on their own listing)
      if (listingForUpdate.authorId && listingForUpdate.authorId !== userId) {
        // Reverse old received vote action
        await reverseTrustAction({
          userId: listingForUpdate.authorId,
          action: existingVote.value
            ? TrustAction.LISTING_RECEIVED_UPVOTE
            : TrustAction.LISTING_RECEIVED_DOWNVOTE,
          context: {
            listingId: input.listingId,
            reason: 'vote_changed_from',
            voterId: userId,
          },
        })
        // Apply new received vote action
        await applyTrustAction({
          userId: listingForUpdate.authorId,
          action: input.value
            ? TrustAction.LISTING_RECEIVED_UPVOTE
            : TrustAction.LISTING_RECEIVED_DOWNVOTE,
          context: {
            listingId: input.listingId,
            reason: 'vote_changed_to',
            voterId: userId,
          },
        })
      }

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

  canEdit: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (hasPermission(ctx.session.user.role, Role.ADMIN)) {
        return {
          canEdit: true,
          isOwner: true,
          reason: 'Admin can edit any listing',
        }
      }

      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        select: {
          authorId: true,
          status: true,
          processedAt: true,
        },
      })

      if (!listing) {
        return { canEdit: false, isOwner: false, reason: 'Listing not found' }
      }

      // Check ownership
      const isOwner = listing.authorId === ctx.session.user.id
      if (!isOwner) {
        return { canEdit: false, isOwner: false, reason: 'Not your listing' }
      }

      // PENDING listings can always be edited by the author
      if (listing.status === ApprovalStatus.PENDING) {
        return {
          canEdit: true,
          isOwner: true,
          reason: 'Pending listings can always be edited',
          isPending: true,
        }
      }

      // REJECTED listings cannot be edited
      if (listing.status === ApprovalStatus.REJECTED) {
        return {
          canEdit: false,
          isOwner: true,
          reason:
            'Rejected listings cannot be edited. Please create a new listing.',
        }
      }

      // APPROVED listings can be edited for 1 hour after approval
      if (listing.status === ApprovalStatus.APPROVED) {
        if (!listing.processedAt) {
          return {
            canEdit: false,
            isOwner: true,
            reason: 'No approval time found',
          }
        }

        const now = new Date()
        const timeSinceApproval = now.getTime() - listing.processedAt.getTime()
        const timeLimit = EDIT_TIME_LIMIT_MINUTES * 60 * 1000

        const remainingTime = timeLimit - timeSinceApproval
        const remainingMinutes = Math.floor(remainingTime / (60 * 1000))

        if (timeSinceApproval > timeLimit) {
          return {
            canEdit: false,
            isOwner: true,
            reason: `Edit time expired (${EDIT_TIME_LIMIT_MINUTES} minutes after approval)`,
            timeExpired: true,
          }
        }

        return {
          canEdit: true,
          isOwner: true,
          remainingMinutes: Math.max(0, remainingMinutes),
          remainingTime: Math.max(0, remainingTime),
          isApproved: true,
        }
      }

      return { canEdit: false, isOwner: true, reason: 'Invalid listing status' }
    }),

  update: authorProcedure
    .input(UpdateListingUserSchema)
    .mutation(async ({ ctx, input }) => {
      // First check if user can edit this listing
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        select: {
          authorId: true,
          status: true,
          processedAt: true,
          emulatorId: true,
        },
      })

      if (!listing) {
        throw ResourceError.listing.notFound()
      }

      if (listing.authorId !== ctx.session.user.id) {
        throw AppError.forbidden('You can only edit your own listings')
      }

      // REJECTED listings cannot be edited
      if (listing.status === ApprovalStatus.REJECTED) {
        throw AppError.badRequest(
          'Rejected listings cannot be edited. Please create a new listing.',
        )
      }

      // PENDING listings can always be edited
      if (listing.status === ApprovalStatus.PENDING) {
        // No time restrictions for pending listings
      } else if (listing.status === ApprovalStatus.APPROVED) {
        // APPROVED listings have a time limit
        if (!listing.processedAt) {
          throw AppError.badRequest('Listing approval time not found')
        }

        const now = new Date()
        const timeSinceApproval = now.getTime() - listing.processedAt.getTime()
        const timeLimit = EDIT_TIME_LIMIT_MINUTES * 60 * 1000

        if (timeSinceApproval > timeLimit) {
          throw AppError.badRequest(
            `You can only edit listings within ${EDIT_TIME_LIMIT_MINUTES} minutes of approval`,
          )
        }
      } else {
        throw AppError.badRequest('Invalid listing status')
      }

      // Update the listing using a transaction to handle custom fields
      return await ctx.prisma.$transaction(async (tx) => {
        // Validate custom fields if provided
        if (input.customFieldValues && input.customFieldValues.length > 0) {
          await validateCustomFields(
            tx,
            listing.emulatorId,
            input.customFieldValues,
          )
        }

        // Delete existing custom field values
        if (input.customFieldValues) {
          await tx.listingCustomFieldValue.deleteMany({
            where: { listingId: input.id },
          })

          // Create new custom field values
          if (input.customFieldValues.length > 0) {
            await tx.listingCustomFieldValue.createMany({
              data: input.customFieldValues.map((cfv) => ({
                listingId: input.id,
                customFieldDefinitionId: cfv.customFieldDefinitionId,
                value: cfv.value,
              })),
            })
          }
        }

        // Update the listing
        return await tx.listing.update({
          where: { id: input.id },
          data: {
            notes: input.notes,
            performanceId: input.performanceId,
          },
        })
      })
    }),

  getForUserEdit: authorProcedure
    .input(GetListingForUserEditSchema)
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          authorId: true,
          status: true,
          processedAt: true,
          notes: true,
          performanceId: true,
          game: {
            select: {
              id: true,
              title: true,
              system: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          device: {
            select: {
              id: true,
              modelName: true,
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
              customFieldDefinitions: {
                orderBy: { displayOrder: 'asc' },
              },
            },
          },
          performance: {
            select: {
              id: true,
              label: true,
              rank: true,
            },
          },
          customFieldValues: {
            include: {
              customFieldDefinition: true,
            },
          },
        },
      })

      if (!listing) {
        throw ResourceError.listing.notFound()
      }

      if (listing.authorId !== ctx.session.user.id) {
        throw AppError.forbidden(
          'You can only view your own listings for editing',
        )
      }

      return listing
    }),
})
