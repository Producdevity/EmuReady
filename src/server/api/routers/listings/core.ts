import analytics from '@/lib/analytics'
import { RECAPTCHA_CONFIG } from '@/lib/captcha/config'
import { getClientIP, verifyRecaptcha } from '@/lib/captcha/verify'
import { AppError, ResourceError } from '@/lib/errors'
import { applyTrustAction } from '@/lib/trust/service'
import {
  CreateListingSchema,
  CreateVoteSchema,
  GetListingByIdSchema,
  GetListingForUserEditSchema,
  GetListingsSchema,
  UnverifyListingSchema,
  UpdateListingUserSchema,
  VerifyListingSchema,
} from '@/schemas/listing'
import {
  authorProcedure,
  createListingProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import {
  invalidateListPages,
  invalidateSitemap,
  revalidateByTag,
} from '@/server/cache/invalidation'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { getDriverVersions } from '@/server/utils/driver-versions'
import { sanitizeInput, validatePagination } from '@/server/utils/security-validation'
import { withSavepoint } from '@/server/utils/transactions'
import { updateListingVoteCounts } from '@/server/utils/vote-counts'
import { roleIncludesRole } from '@/utils/permission-system'
import { ms } from '@/utils/time'
import { ApprovalStatus, Prisma, Role, TrustAction } from '@orm'
import { validateCustomFields } from './validation'

const EDIT_TIME_LIMIT_MINUTES = 60
const EDIT_TIME_LIMIT = ms.minutes(EDIT_TIME_LIMIT_MINUTES)

export const coreRouter = createTRPCRouter({
  get: publicProcedure.input(GetListingsSchema).query(async ({ ctx, input }) => {
    const repository = new ListingsRepository(ctx.prisma)
    const userRole = ctx.session?.user?.role
    const userId = ctx.session?.user?.id
    const canSeeBannedUsers = roleIncludesRole(userRole, Role.MODERATOR)

    // Validate and sanitize pagination
    const { page, limit } = validatePagination(input.page, input.limit, 100)

    // Sanitize search term (plain text, not markdown)
    const sanitizedSearchTerm = input.searchTerm ? sanitizeInput(input.searchTerm) : undefined

    // Map input to repository filters (convert null to undefined)
    const filters = {
      systemIds: input.systemIds || undefined,
      deviceIds: input.deviceIds || undefined,
      socIds: input.socIds || undefined,
      emulatorIds: input.emulatorIds || undefined,
      performanceIds: input.performanceIds || undefined,
      search: sanitizedSearchTerm,
      page,
      limit,
      sortField: input.sortField || undefined,
      sortDirection: input.sortDirection || undefined,
      approvalStatus: input.approvalStatus || undefined,
      myListings: input.myListings || undefined,
      userId,
      userRole,
      showNsfw: ctx.session?.user?.showNsfw,
    }

    // Use the repository for the main listing logic
    const result = await repository.list(filters)

    // Batch fetch additional data to avoid N+1 queries
    const listingIds = result.listings.map((l) => l.id)
    const authorIds = [...new Set(result.listings.map((l) => l.authorId))]

    const [developerVerifications, userBans] = await Promise.all([
      // Batch fetch developer verifications
      listingIds.length > 0
        ? ctx.prisma.listingDeveloperVerification.findMany({
            where: { listingId: { in: listingIds } },
            include: { developer: { select: { id: true, name: true } } },
          })
        : [],
      // Batch fetch user ban information (only for moderators)
      canSeeBannedUsers && authorIds.length > 0
        ? ctx.prisma.userBan.findMany({
            where: {
              userId: { in: authorIds },
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: { id: true, reason: true, bannedAt: true, userId: true },
          })
        : [],
    ])

    // Create lookup maps for efficient access
    const devVerificationMap = new Map<string, typeof developerVerifications>()
    developerVerifications.forEach((dv) => {
      const existing = devVerificationMap.get(dv.listingId) || []
      devVerificationMap.set(dv.listingId, [...existing, dv])
    })
    const userBanMap = new Map<string, typeof userBans>()
    userBans.forEach((ban) => {
      const existing = userBanMap.get(ban.userId) || []
      userBanMap.set(ban.userId, [...existing, ban])
    })

    // Enhance listings with batched data
    const enhancedListings = result.listings.map((listing) => ({
      ...listing,
      // isVerifiedDeveloper already provided by repository.list
      isVerifiedDeveloper: listing.isVerifiedDeveloper,
      developerVerifications: devVerificationMap.get(listing.id) || [],
      author: {
        ...listing.author,
        ...(canSeeBannedUsers && { userBans: userBanMap.get(listing.authorId) || [] }),
      },
    }))

    return {
      listings: enhancedListings,
      pagination: result.pagination,
    }
  }),

  driverVersions: publicProcedure.query(async () => getDriverVersions()),

  byId: publicProcedure.input(GetListingByIdSchema).query(async ({ ctx, input }) => {
    const userRole = ctx.session?.user?.role
    const canSeeBannedUsers = roleIncludesRole(userRole, Role.MODERATOR)

    const repository = new ListingsRepository(ctx.prisma)
    return await repository.byIdWithAccess(input.id, ctx.session?.user?.id, canSeeBannedUsers)
  }),

  create: createListingProcedure.input(CreateListingSchema).mutation(async ({ ctx, input }) => {
    const { recaptchaToken, ...payload } = input
    const authorId = ctx.session.user.id

    // Verify CAPTCHA if token is provided
    if (recaptchaToken) {
      const clientIP = ctx.headers ? getClientIP(ctx.headers) : undefined
      const captchaResult = await verifyRecaptcha({
        token: recaptchaToken,
        expectedAction: RECAPTCHA_CONFIG.actions.CREATE_LISTING,
        userIP: clientIP,
      })

      if (!captchaResult.success) return AppError.captcha(captchaResult.error)
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

    const repository = new ListingsRepository(ctx.prisma)
    const newListing = await repository.create({
      authorId,
      userRole: ctx.session.user.role,
      ...payload,
      notes: payload.notes ?? null,
      customFieldValues: (payload.customFieldValues
        ? (payload.customFieldValues as { customFieldDefinitionId: string; value: unknown }[])
        : null) as { customFieldDefinitionId: string; value: unknown }[] | null,
    })

    // Post-create side effects (trust, notifications, analytics, cache)
    await applyTrustAction({
      userId: authorId,
      action: TrustAction.LISTING_CREATED,
      context: { listingId: newListing.id },
    })

    notificationEventEmitter.emitNotificationEvent({
      eventType: NOTIFICATION_EVENTS.LISTING_CREATED,
      entityType: 'listing',
      entityId: newListing.id,
      triggeredBy: authorId,
      payload: {
        listingId: newListing.id,
        gameId: payload.gameId,
        deviceId: payload.deviceId,
        emulatorId: payload.emulatorId,
        performanceId: payload.performanceId,
        notes: payload.notes,
        customFieldValues: payload.customFieldValues,
      },
    })

    const game = await ctx.prisma.game.findUnique({
      where: { id: payload.gameId },
      select: { systemId: true },
    })
    analytics.listing.created({
      listingId: newListing.id,
      gameId: payload.gameId,
      systemId: game?.systemId || 'unknown',
      emulatorId: payload.emulatorId,
      deviceId: payload.deviceId,
      performanceId: payload.performanceId,
      hasCustomFields: (payload.customFieldValues?.length || 0) > 0,
      customFieldCount: payload.customFieldValues?.length || 0,
    })

    if (newListing.status === ApprovalStatus.APPROVED) {
      await invalidateListPages()
      await invalidateSitemap()
      await revalidateByTag('listings')
      await revalidateByTag(`game-${payload.gameId}`)
      await revalidateByTag(`device-${payload.deviceId}`)
      await revalidateByTag(`emulator-${payload.emulatorId}`)
    }

    return newListing
  }),

  vote: protectedProcedure.input(CreateVoteSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify CAPTCHA if token is provided
    if (input.recaptchaToken) {
      const clientIP = ctx.headers ? getClientIP(ctx.headers) : undefined
      const captchaResult = await verifyRecaptcha({
        token: input.recaptchaToken,
        expectedAction: RECAPTCHA_CONFIG.actions.VOTE,
        userIP: clientIP,
      })

      if (!captchaResult.success) return AppError.captcha(captchaResult.error)
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

    // Use a single transaction to avoid race conditions
    const voteResult = await ctx.prisma.$transaction(async (tx) => {
      // Check for existing vote with row-level lock (SELECT ... FOR UPDATE equivalent)
      const existingVote = await tx.vote.findUnique({
        where: { userId_listingId: { userId, listingId: input.listingId } },
      })

      if (!existingVote) {
        // Create new vote
        const newVote = await tx.vote.create({
          data: { value: input.value, userId, listingId: input.listingId },
        })

        await updateListingVoteCounts(tx, input.listingId, 'create', input.value)

        return { vote: newVote, action: 'created' as const, previousValue: null }
      }

      // If value is the same, remove the vote (toggle)
      if (existingVote.value === input.value) {
        await tx.vote.delete({
          where: { userId_listingId: { userId, listingId: input.listingId } },
        })

        await updateListingVoteCounts(tx, input.listingId, 'delete', undefined, existingVote.value)

        return { vote: null, action: 'deleted' as const, previousValue: existingVote.value }
      }

      // Update vote to new value
      const updatedVote = await tx.vote.update({
        where: { userId_listingId: { userId, listingId: input.listingId } },
        data: { value: input.value },
      })

      await updateListingVoteCounts(tx, input.listingId, 'update', input.value, existingVote.value)

      return { vote: updatedVote, action: 'updated' as const, previousValue: existingVote.value }
    })

    // Handle post-transaction operations based on action
    if (voteResult.action === 'created' || voteResult.action === 'updated') {
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

      // Emit notification event
      if (voteResult.vote) {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.LISTING_VOTED,
          entityType: 'listing',
          entityId: input.listingId,
          triggeredBy: userId,
          payload: {
            listingId: input.listingId,
            voteId: voteResult.vote.id,
            voteValue: input.value,
          },
        })
      }

      analytics.engagement.vote({
        listingId: input.listingId,
        voteValue: input.value,
      })
    }

    // Check if this is user's first vote for journey analytics
    if (voteResult.action === 'created') {
      const userVoteCount = await ctx.prisma.vote.count({ where: { userId: userId } })
      if (userVoteCount === 1) {
        analytics.userJourney.firstTimeAction({ userId: userId, action: 'first_vote' })
      }
    }

    return voteResult.vote || { id: '', value: false, listingId: input.listingId, userId }
  }),

  performanceScales: publicProcedure.query(async ({ ctx }) =>
    ctx.prisma.performanceScale.findMany({ orderBy: { rank: 'asc' } }),
  ),

  statistics: publicProcedure.query(async ({ ctx }) => {
    const [listingsCount, pcListingsCount, gamesCount, emulatorsCount, devicesCount] =
      await Promise.all([
        ctx.prisma.listing.count({
          where: { status: ApprovalStatus.APPROVED },
        }),
        ctx.prisma.pcListing.count({
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
      pcListings: pcListingsCount,
      totalReports: listingsCount + pcListingsCount,
      games: gamesCount,
      emulators: emulatorsCount,
      devices: devicesCount,
    }
  }),

  featured: publicProcedure.query(async ({ ctx }) => {
    const listings = await ctx.prisma.listing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        game: {
          status: ApprovalStatus.APPROVED,
          ...(ctx.session?.user?.showNsfw ? {} : { isErotic: false }),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        game: { include: { system: true } },
        device: { include: { brand: true } },
        emulator: true,
        performance: true,
        author: { select: { id: true, name: true } },
        developerVerifications: { include: { developer: { select: { id: true, name: true } } } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    // Get all verified developer statuses in a single query
    const verifiedDevelopers = listings.length
      ? await ctx.prisma.verifiedDeveloper.findMany({
          where: { OR: listings.map((l) => ({ userId: l.authorId, emulatorId: l.emulatorId })) },
          select: { userId: true, emulatorId: true },
        })
      : []

    const verifiedSet = new Set(verifiedDevelopers.map((v) => `${v.userId}_${v.emulatorId}`))

    // Use materialized vote counts
    return listings.map((listing) => ({
      ...listing,
      successRate: listing.successRate,
      upVotes: listing.upvoteCount,
      downVotes: listing.downvoteCount,
      totalVotes: listing.voteCount,
      isVerifiedDeveloper: verifiedSet.has(`${listing.authorId}_${listing.emulatorId}`),
    }))
  }),

  canEdit: protectedProcedure.input(GetListingForUserEditSchema).query(async ({ ctx, input }) => {
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: input.id },
      select: { authorId: true, status: true, processedAt: true },
    })

    if (!listing) return { canEdit: false, isOwner: false, reason: 'Listing not found' }

    // Check ownership
    const isOwner = listing.authorId === ctx.session.user.id

    // Moderators and higher can always edit any listing (but still reflect true ownership)
    if (roleIncludesRole(ctx.session.user.role, Role.MODERATOR)) {
      return {
        canEdit: true,
        isOwner,
        reason: 'Moderators can edit any listing',
      }
    }

    if (!isOwner) return { canEdit: false, isOwner: false, reason: 'Not your listing' }

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
        reason: 'Rejected listings cannot be edited. Please create a new listing.',
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

      const remainingTime = EDIT_TIME_LIMIT - timeSinceApproval
      const remainingMinutes = Math.floor(remainingTime / (60 * 1000))

      if (timeSinceApproval > EDIT_TIME_LIMIT) {
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

  update: authorProcedure.input(UpdateListingUserSchema).mutation(async ({ ctx, input }) => {
    // First check if user can edit this listing
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: input.id },
      select: { authorId: true, status: true, processedAt: true, emulatorId: true },
    })

    if (!listing) return ResourceError.listing.notFound()

    const userRole = ctx.session.user.role
    const isModerator = roleIncludesRole(userRole, Role.MODERATOR)

    // Check ownership unless user is a moderator or higher
    if (!isModerator && listing.authorId !== ctx.session.user.id) {
      return ResourceError.listing.canOnlyEditOwn()
    }

    // For non-moderators, apply edit restrictions
    if (!isModerator) {
      // REJECTED listings cannot be edited by regular users
      if (listing.status === ApprovalStatus.REJECTED) {
        return ResourceError.listing.cannotEditRejected()
      }

      // For APPROVED listings, check time limits for regular users
      if (listing.status === ApprovalStatus.APPROVED) {
        if (!listing.processedAt) return AppError.badRequest('Listing approval time not found')

        const now = new Date()
        const timeSinceApproval = now.getTime() - listing.processedAt.getTime()
        const timeLimit = EDIT_TIME_LIMIT_MINUTES * 60 * 1000

        if (timeSinceApproval > timeLimit) {
          return ResourceError.listing.editTimeExpired(EDIT_TIME_LIMIT_MINUTES)
        }
      }
    }
    // Moderators can edit any listing regardless of status or time

    // Update the listing using a transaction to handle custom fields
    return await ctx.prisma.$transaction(async (tx) => {
      // Validate custom fields if provided
      if (input.customFieldValues && input.customFieldValues.length > 0) {
        await withSavepoint(tx, 'validate-custom-fields', async () => {
          await validateCustomFields(tx, listing.emulatorId, input.customFieldValues)
        })
      }

      // Delete existing custom field values
      if (input.customFieldValues) {
        await tx.listingCustomFieldValue.deleteMany({ where: { listingId: input.id } })

        // Create new custom field values
        if (input.customFieldValues.length > 0) {
          await tx.listingCustomFieldValue.createMany({
            data: input.customFieldValues.map((cfv) => ({
              listingId: input.id,
              customFieldDefinitionId: cfv.customFieldDefinitionId,
              value: cfv.value === null || cfv.value === undefined ? Prisma.JsonNull : cfv.value,
            })),
          })
        }
      }

      // Update the listing
      return await tx.listing.update({
        where: { id: input.id },
        data: { notes: input.notes, performanceId: input.performanceId },
      })
    })
  }),

  getForUserEdit: protectedProcedure
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
          game: { select: { id: true, title: true, system: { select: { id: true, name: true } } } },
          device: {
            select: { id: true, modelName: true, brand: { select: { id: true, name: true } } },
          },
          emulator: {
            select: {
              id: true,
              name: true,
              customFieldDefinitions: {
                orderBy: [{ categoryId: 'asc' }, { categoryOrder: 'asc' }, { displayOrder: 'asc' }],
              },
            },
          },
          performance: { select: { id: true, label: true, rank: true } },
          customFieldValues: {
            include: { customFieldDefinition: { include: { category: true } } },
          },
        },
      })

      if (!listing) return ResourceError.listing.notFound()

      // Moderators and higher can edit any listing
      const userRole = ctx.session.user.role
      const isModerator = roleIncludesRole(userRole, Role.MODERATOR)

      if (!isModerator && listing.authorId !== ctx.session.user.id) {
        return ResourceError.listing.canOnlyEditOwn()
      }

      return listing
    }),

  verifyListing: protectedProcedure.input(VerifyListingSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Get the listing with emulator information
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: input.listingId },
      include: { emulator: true, author: { select: { id: true, name: true } } },
    })

    if (!listing) return ResourceError.listing.notFound()

    // Check if user is verified developer for this emulator
    const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
      where: { userId_emulatorId: { userId: userId, emulatorId: listing.emulatorId } },
    })

    if (!verifiedDeveloper) {
      return ResourceError.verifiedDeveloper.mustBeVerifiedToVerify(listing.emulator.name)
    }

    // Prevent developers from verifying their own listings
    if (listing.authorId === userId) {
      return ResourceError.verifiedDeveloper.cannotVerifyOwnListings()
    }

    // Check if verification already exists
    const existingVerification = await ctx.prisma.listingDeveloperVerification.findUnique({
      where: { listingId_verifiedBy: { listingId: input.listingId, verifiedBy: userId } },
    })

    if (existingVerification) return ResourceError.verifiedDeveloper.alreadyVerifiedListing()

    // Create the verification
    const verification = await ctx.prisma.listingDeveloperVerification.create({
      data: { listingId: input.listingId, verifiedBy: userId, notes: input.notes },
      include: { developer: { select: { id: true, name: true } } },
    })

    // Emit notification event for listing verification
    notificationEventEmitter.emitNotificationEvent({
      eventType: NOTIFICATION_EVENTS.LISTING_VERIFIED,
      entityType: 'listing',
      entityId: input.listingId,
      triggeredBy: userId,
      payload: {
        listingId: input.listingId,
        verificationId: verification.id,
        verifierName: verification.developer.name,
        emulatorName: listing.emulator.name,
      },
    })

    return verification
  }),

  unverifyListing: protectedProcedure
    .input(UnverifyListingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Check if verification exists
      const verification = await ctx.prisma.listingDeveloperVerification.findUnique({
        where: { listingId_verifiedBy: { listingId: input.listingId, verifiedBy: userId } },
        include: { listing: { include: { emulator: true } } },
      })

      if (!verification) return ResourceError.verification.notFound()

      // Delete the verification
      await ctx.prisma.listingDeveloperVerification.delete({ where: { id: verification.id } })

      return { message: 'Verification removed successfully' }
    }),
})
