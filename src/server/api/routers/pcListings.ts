import analytics from '@/lib/analytics'
import { AppError, ResourceError } from '@/lib/errors'
import { canUserAutoApprove, TrustService } from '@/lib/trust/service'
import {
  ApprovePcListingSchema,
  BulkApprovePcListingsSchema,
  BulkRejectPcListingsSchema,
  CreatePcListingCommentSchema,
  CreatePcListingReportSchema,
  CreatePcListingSchema,
  CreatePcPresetSchema,
  DeletePcListingCommentSchema,
  DeletePcListingSchema,
  DeletePcPresetSchema,
  GetAllPcListingsAdminSchema,
  GetPcListingByIdSchema,
  GetPcListingCommentsSchema,
  GetPcListingForAdminEditSchema,
  GetPcListingReportsSchema,
  GetPcListingsSchema,
  GetPcListingUserVoteSchema,
  GetPcListingVerificationsSchema,
  GetPcPresetsSchema,
  GetPendingPcListingsSchema,
  RejectPcListingSchema,
  RemovePcListingVerificationSchema,
  UpdatePcListingAdminSchema,
  UpdatePcListingCommentSchema,
  UpdatePcListingReportSchema,
  UpdatePcListingUserSchema,
  UpdatePcPresetSchema,
  VerifyPcListingAdminSchema,
  VotePcListingCommentSchema,
  VotePcListingSchema,
  GetPcListingForUserEditSchema,
} from '@/schemas/pcListing'
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import {
  buildPcListingOrderBy,
  buildPcListingWhere,
  pcListingAdminInclude,
  pcListingDetailInclude,
  pcListingInclude,
} from '@/server/api/utils/pcListingHelpers'
import {
  invalidateListPages,
  invalidateSitemap,
  revalidateByTag,
} from '@/server/cache/invalidation'
import { notificationEventEmitter, NOTIFICATION_EVENTS } from '@/server/notifications/eventEmitter'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { UserPcPresetsRepository } from '@/server/repositories/user-pc-presets.repository'
import { listingStatsCache } from '@/server/utils/cache'
import { paginate } from '@/server/utils/pagination'
import { validatePagination, sanitizeInput } from '@/server/utils/security-validation'
import { updatePcListingVoteCounts } from '@/server/utils/vote-counts'
import { PERMISSIONS, roleIncludesRole } from '@/utils/permission-system'
import { canDeleteComment, canEditComment, hasPermission, isModerator } from '@/utils/permissions'
import { type Prisma, ApprovalStatus, Role, ReportStatus, TrustAction } from '@orm'

export const pcListingsRouter = createTRPCRouter({
  // PC Listing procedures
  get: publicProcedure.input(GetPcListingsSchema).query(async ({ ctx, input }) => {
    const repository = new PcListingsRepository(ctx.prisma)
    const canSeeBannedUsers = ctx.session?.user ? isModerator(ctx.session.user.role) : false

    // Validate and sanitize pagination parameters
    const { page, limit } = validatePagination(input.page, input.limit, 50)

    const result = await repository.list({
      ...input,
      sortDirection: input.sortDirection ?? undefined,
      userId: ctx.session?.user?.id,
      userRole: ctx.session?.user?.role,
      showNsfw: ctx.session?.user?.showNsfw,
      canSeeBannedUsers,
      approvalStatus: input.approvalStatus || ApprovalStatus.APPROVED,
      page,
      limit,
    })

    return {
      pcListings: result.pcListings,
      pagination: result.pagination,
    }
  }),

  byId: publicProcedure.input(GetPcListingByIdSchema).query(async ({ ctx, input }) => {
    const repository = new PcListingsRepository(ctx.prisma)
    const canSeeBannedUsers = ctx.session?.user ? isModerator(ctx.session.user.role) : false

    const pcListing = await repository.getByIdWithDetails(
      input.id,
      canSeeBannedUsers,
      ctx.session?.user?.id,
    )

    if (!pcListing) return ResourceError.pcListing.notFound()

    return pcListing
  }),

  canEdit: protectedProcedure.input(GetPcListingForUserEditSchema).query(async ({ ctx, input }) => {
    const EDIT_TIME_LIMIT_MINUTES = 60

    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: input.id },
      select: { authorId: true, status: true, processedAt: true },
    })

    if (!pcListing) {
      return {
        canEdit: false,
        isOwner: false,
        reason: 'PC listing not found',
      }
    }

    // Check ownership
    const isOwner = pcListing.authorId === ctx.session.user.id

    // Moderators and higher can always edit any PC listing (but still reflect true ownership)
    if (hasPermission(ctx.session.user.role, Role.MODERATOR)) {
      return {
        canEdit: true,
        isOwner,
        reason: 'Moderator can edit any PC listing',
      }
    }

    if (!isOwner) {
      return { canEdit: false, isOwner: false, reason: 'Not your PC listing' }
    }

    // PENDING PC listings can always be edited by the author
    if (pcListing.status === ApprovalStatus.PENDING) {
      return {
        canEdit: true,
        isOwner: true,
        reason: 'Pending PC listings can always be edited',
        isPending: true,
      }
    }

    // REJECTED PC listings cannot be edited
    if (pcListing.status === ApprovalStatus.REJECTED) {
      return {
        canEdit: false,
        isOwner: true,
        reason: 'Rejected PC listings cannot be edited. Please create a new listing.',
      }
    }

    // APPROVED PC listings can be edited for 1 hour after approval
    if (pcListing.status === ApprovalStatus.APPROVED) {
      if (!pcListing.processedAt) {
        return {
          canEdit: false,
          isOwner: true,
          reason: 'No approval time found',
        }
      }

      const now = new Date()
      const timeSinceApproval = now.getTime() - pcListing.processedAt.getTime()
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

    return {
      canEdit: false,
      isOwner: true,
      reason: 'Invalid PC listing status',
    }
  }),

  getForUserEdit: protectedProcedure
    .input(GetPcListingForUserEditSchema)
    .query(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.id },
        include: {
          ...pcListingDetailInclude,
          emulator: {
            include: { customFieldDefinitions: { orderBy: { label: 'asc' } } },
          },
        },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      // Only allow owners or moderators to fetch for editing
      if (
        pcListing.authorId !== ctx.session.user.id &&
        !roleIncludesRole(ctx.session.user.role, Role.MODERATOR)
      ) {
        return ResourceError.pcListing.canOnlyEditOwn()
      }

      return pcListing
    }),

  create: protectedProcedure.input(CreatePcListingSchema).mutation(async ({ ctx, input }) => {
    const authorId = ctx.session.user.id
    // Check for existing PC listing with same combination
    const existingPcListing = await ctx.prisma.pcListing.findFirst({
      where: {
        gameId: input.gameId,
        cpuId: input.cpuId,
        ...(input.gpuId ? { gpuId: input.gpuId } : { gpuId: null }),
        emulatorId: input.emulatorId,
        authorId,
      },
    })

    if (existingPcListing) return ResourceError.pcListing.alreadyExists()

    // Validate referenced entities exist
    const [game, cpu, gpu, emulator, performance] = await Promise.all([
      ctx.prisma.game.findUnique({
        where: { id: input.gameId },
        select: { id: true, systemId: true },
      }),
      ctx.prisma.cpu.findUnique({ where: { id: input.cpuId } }),
      input.gpuId ? ctx.prisma.gpu.findUnique({ where: { id: input.gpuId } }) : null,
      ctx.prisma.emulator.findUnique({
        where: { id: input.emulatorId },
        include: { systems: { select: { id: true } } },
      }),
      ctx.prisma.performanceScale.findUnique({
        where: { id: input.performanceId },
      }),
    ])

    if (!game) return ResourceError.game.notFound()
    if (!cpu) return ResourceError.cpu.notFound()
    if (input.gpuId && !gpu) return ResourceError.gpu.notFound() // Only check GPU if provided
    if (!emulator) return ResourceError.emulator.notFound()
    if (!performance) return ResourceError.performanceScale.notFound()

    // Validate that the game's system is compatible with the chosen emulator
    const isSystemCompatible = emulator.systems.some((system) => system.id === game.systemId)

    if (!isSystemCompatible) {
      return AppError.badRequest("The selected emulator does not support this game's system")
    }

    // Check if user can auto-approve
    const canAutoApprove = await canUserAutoApprove(authorId)
    const isAuthorOrHigher = roleIncludesRole(ctx.session.user.role, Role.AUTHOR)
    const listingStatus =
      canAutoApprove || isAuthorOrHigher ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING

    // Create PC listing with custom field values
    const newListing = await ctx.prisma.pcListing.create({
      data: {
        gameId: input.gameId,
        cpuId: input.cpuId,
        ...(input.gpuId ? { gpuId: input.gpuId } : {}), // Handle optional GPU
        emulatorId: input.emulatorId,
        performanceId: input.performanceId,
        memorySize: input.memorySize,
        os: input.os,
        osVersion: input.osVersion,
        notes: input.notes ? sanitizeInput(input.notes) : input.notes,
        authorId: ctx.session.user.id,
        status: listingStatus,
        ...((canAutoApprove || isAuthorOrHigher) && {
          processedByUserId: authorId,
          processedAt: new Date(),
          processedNotes:
            isAuthorOrHigher && !canAutoApprove
              ? 'Auto-approved (Author or higher role)'
              : 'Auto-approved (Trusted user)',
        }),
        customFieldValues: input.customFieldValues?.length
          ? {
              create: input.customFieldValues.map((cfv) => ({
                customFieldDefinitionId: cfv.customFieldDefinitionId,
                value: cfv.value,
              })),
            }
          : undefined,
      },
      include: pcListingInclude,
    })

    // Invalidate stats cache when PC listing is created
    listingStatsCache.delete('pc-listing-stats')

    // Invalidate SEO cache if listing is approved
    if (newListing.status === ApprovalStatus.APPROVED) {
      await invalidateListPages()
      await invalidateSitemap()
      await revalidateByTag('pc-listings')
      await revalidateByTag(`game-${input.gameId}`)
      await revalidateByTag(`cpu-${input.cpuId}`)
      if (input.gpuId) {
        await revalidateByTag(`gpu-${input.gpuId}`)
      }
    }

    return newListing
  }),

  delete: protectedProcedure.input(DeletePcListingSchema).mutation(async ({ ctx, input }) => {
    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: input.id },
    })

    if (!pcListing) return ResourceError.pcListing.notFound()

    // Only author can delete their own PC listing
    if (pcListing.authorId !== ctx.session.user.id) {
      return ResourceError.pcListing.canOnlyDeleteOwn()
    }

    const deletedListing = await ctx.prisma.pcListing.delete({
      where: { id: input.id },
    })

    // Invalidate stats cache when PC listing is deleted
    listingStatsCache.delete('pc-listing-stats')

    return deletedListing
  }),

  update: protectedProcedure.input(UpdatePcListingUserSchema).mutation(async ({ ctx, input }) => {
    const EDIT_TIME_LIMIT_MINUTES = 60

    // First check if user can edit this PC listing
    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: input.id },
      select: { authorId: true, status: true, processedAt: true },
    })

    if (!pcListing) return ResourceError.pcListing.notFound()

    // Only allow owners or moderators to edit
    if (
      pcListing.authorId !== ctx.session.user.id &&
      !hasPermission(ctx.session.user.role, Role.MODERATOR)
    ) {
      return ResourceError.pcListing.canOnlyEditOwn()
    }

    // Check edit permissions based on PC listing status
    switch (pcListing.status) {
      case ApprovalStatus.REJECTED:
        // Moderators can edit rejected listings
        if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
          return ResourceError.pcListing.cannotEditRejected()
        }
        break

      case ApprovalStatus.APPROVED: {
        // Moderators can always edit approved listings
        if (hasPermission(ctx.session.user.role, Role.MODERATOR)) break

        // Regular users have a time limit for editing approved listings
        if (!pcListing.processedAt) return ResourceError.pcListing.approvalTimeNotFound()

        const now = new Date()
        const timeSinceApproval = now.getTime() - pcListing.processedAt.getTime()
        const timeLimit = EDIT_TIME_LIMIT_MINUTES * 60 * 1000

        if (timeSinceApproval > timeLimit) {
          return ResourceError.pcListing.editTimeExpired(EDIT_TIME_LIMIT_MINUTES)
        }
        break
      }

      case ApprovalStatus.PENDING:
        // Pending listings can always be edited by their author
        break

      default:
        return AppError.badRequest('Invalid PC listing status')
    }

    // Validate referenced entities exist
    const [performance] = await Promise.all([
      ctx.prisma.performanceScale.findUnique({ where: { id: input.performanceId } }),
    ])

    if (!performance) return ResourceError.performanceScale.notFound()

    // Update PC listing and handle custom field values
    const { id, customFieldValues, ...updateData } = input

    const updatedPcListing = await ctx.prisma.pcListing.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        game: { include: { system: true } },
        cpu: { include: { brand: true } },
        gpu: { include: { brand: true } },
        emulator: true,
        performance: true,
        author: true,
        customFieldValues: { include: { customFieldDefinition: true } },
      },
    })

    // Handle custom field values if provided
    if (customFieldValues) {
      // Delete existing custom field values
      await ctx.prisma.pcListingCustomFieldValue.deleteMany({ where: { pcListingId: id } })

      // Create new custom field values
      if (customFieldValues.length > 0) {
        await ctx.prisma.pcListingCustomFieldValue.createMany({
          data: customFieldValues.map((cfv) => ({
            pcListingId: id,
            customFieldDefinitionId: cfv.customFieldDefinitionId,
            value: cfv.value,
          })),
        })
      }
    }

    return updatedPcListing
  }),

  // Admin procedures
  pending: protectedProcedure.input(GetPendingPcListingsSchema).query(async ({ ctx, input }) => {
    // Check if user has permission to view pending listings
    const isModerator = hasPermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasPermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isModerator && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToView()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const { search, page = 1, limit = 20, sortField, sortDirection = 'asc' } = input ?? {}

    // For developers, filter by their assigned emulators
    let emulatorIds: string[] | undefined
    if (!isModerator && isDeveloper) {
      emulatorIds = await repository.getVerifiedEmulatorIds(ctx.session.user.id)

      if (emulatorIds.length === 0) {
        // Developer has no assigned emulators, return empty results
        return {
          pcListings: [],
          pagination: paginate({ total: 0, page: page, limit: limit }),
        }
      }
    }

    const result = await repository.getPendingListings({
      emulatorIds,
      search,
      page,
      limit,
      sortField,
      sortDirection: sortDirection ?? 'asc',
      canSeeBannedUsers: true, // Moderators can see listings from banned users
    })

    return {
      pcListings: result.pcListings,
      pagination: result.pagination,
    }
  }),

  approve: protectedProcedure.input(ApprovePcListingSchema).mutation(async ({ ctx, input }) => {
    // Check if user has permission to approve listings
    // Either through MODERATOR role or being a verified developer
    const isModerator = hasPermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasPermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isModerator && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToApprove()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const pcListing = await repository.getById(input.pcListingId)

    if (!pcListing) return ResourceError.pcListing.notFound()

    if (pcListing.status !== ApprovalStatus.PENDING) {
      return ResourceError.pcListing.notPending()
    }

    // For developers, verify they can approve this emulator's listings
    if (!isModerator && isDeveloper) {
      const isVerified = await repository.isDeveloperVerifiedForEmulator(
        ctx.session.user.id,
        pcListing.emulatorId,
      )

      if (!isVerified) {
        return ResourceError.pcListing.mustBeVerifiedToApprove()
      }
    }

    const approvedListing = await repository.approve(input.pcListingId, ctx.session.user.id)

    // Invalidate stats cache when PC listing is approved
    listingStatsCache.delete('pc-listing-stats')

    return approvedListing
  }),

  reject: protectedProcedure.input(RejectPcListingSchema).mutation(async ({ ctx, input }) => {
    // Check if user has permission to reject listings
    // Either through MODERATOR role or being a verified developer
    const isModerator = hasPermission(ctx.session.user.role, Role.MODERATOR)
    const isDeveloper = hasPermission(ctx.session.user.role, Role.DEVELOPER)

    if (!isModerator && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToReject()
    }

    const repository = new PcListingsRepository(ctx.prisma)
    const pcListing = await repository.getById(input.pcListingId)

    if (!pcListing) return ResourceError.pcListing.notFound()

    if (pcListing.status !== ApprovalStatus.PENDING) {
      return ResourceError.pcListing.notPending()
    }

    // For developers, verify they can reject this emulator's listings
    if (!isModerator && isDeveloper) {
      const isVerified = await repository.isDeveloperVerifiedForEmulator(
        ctx.session.user.id,
        pcListing.emulatorId,
      )

      if (!isVerified) {
        return ResourceError.pcListing.mustBeVerifiedToReject()
      }
    }

    const rejectedListing = await repository.reject(
      input.pcListingId,
      ctx.session.user.id,
      input.notes,
    )

    // Invalidate stats cache when PC listing is rejected
    listingStatsCache.delete('pc-listing-stats')

    return rejectedListing
  }),

  bulkApprove: protectedProcedure
    .input(BulkApprovePcListingsSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to approve listings
      // Either through MODERATOR role or being a verified developer
      const isModerator = hasPermission(ctx.session.user.role, Role.MODERATOR)
      const isDeveloper = hasPermission(ctx.session.user.role, Role.DEVELOPER)

      if (!isModerator && !isDeveloper) {
        return ResourceError.pcListing.requiresDeveloperToApprove()
      }
      const result = await ctx.prisma.pcListing.updateMany({
        where: {
          id: { in: input.pcListingIds },
          status: ApprovalStatus.PENDING,
        },
        data: {
          status: ApprovalStatus.APPROVED,
          processedAt: new Date(),
          processedByUserId: ctx.session.user.id,
        },
      })

      // Invalidate stats cache when PC listings are bulk approved
      listingStatsCache.delete('pc-listing-stats')

      return { count: result.count }
    }),

  bulkReject: protectedProcedure
    .input(BulkRejectPcListingsSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to reject listings
      // Either through MODERATOR role or being a verified developer
      const isModerator = hasPermission(ctx.session.user.role, Role.MODERATOR)
      const isDeveloper = hasPermission(ctx.session.user.role, Role.DEVELOPER)

      if (!isModerator && !isDeveloper) {
        return ResourceError.pcListing.requiresDeveloperToReject()
      }
      const result = await ctx.prisma.pcListing.updateMany({
        where: {
          id: { in: input.pcListingIds },
          status: ApprovalStatus.PENDING,
        },
        data: {
          status: ApprovalStatus.REJECTED,
          processedAt: new Date(),
          processedByUserId: ctx.session.user.id,
          processedNotes: input.notes,
        },
      })

      // Invalidate stats cache when PC listings are bulk rejected
      listingStatsCache.delete('pc-listing-stats')

      return { count: result.count }
    }),

  getAll: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(GetAllPcListingsAdminSchema)
    .query(async ({ ctx, input }) => {
      const {
        page = 1,
        limit = 20,
        sortField,
        sortDirection,
        search,
        statusFilter,
        systemFilter,
        emulatorFilter,
        osFilter,
      } = input

      const offset = (page - 1) * limit

      const baseWhere: Prisma.PcListingWhereInput = {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(systemFilter ? { game: { systemId: systemFilter } } : {}),
        ...(emulatorFilter ? { emulatorId: emulatorFilter } : {}),
        ...(osFilter ? { os: osFilter } : {}),
        ...(search
          ? {
              OR: [
                { game: { title: { contains: search, mode: 'insensitive' } } },
                {
                  cpu: { modelName: { contains: search, mode: 'insensitive' } },
                },
                {
                  gpu: { modelName: { contains: search, mode: 'insensitive' } },
                },
                {
                  emulator: { name: { contains: search, mode: 'insensitive' } },
                },
                { author: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      }

      // Moderators can see listings from banned users
      const where = buildPcListingWhere(baseWhere, true)
      const orderBy = buildPcListingOrderBy(sortField, sortDirection ?? undefined)

      const [pcListings, total] = await Promise.all([
        ctx.prisma.pcListing.findMany({
          where,
          include: pcListingAdminInclude,
          orderBy,
          skip: offset,
          take: limit,
        }),
        ctx.prisma.pcListing.count({ where }),
      ])

      return {
        pcListings,
        pagination: paginate({ total: total, page, limit: limit }),
      }
    }),

  getForEdit: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(GetPcListingForAdminEditSchema)
    .query(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.id },
        include: pcListingDetailInclude,
      })

      return pcListing ?? ResourceError.pcListing.notFound()
    }),

  updateAdmin: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(UpdatePcListingAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...data } = input

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id },
        include: { customFieldValues: true },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      // Update PC listing and handle custom field values
      const updatedPcListing = await ctx.prisma.pcListing.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
        include: pcListingDetailInclude,
      })

      // Handle custom field values if provided
      if (customFieldValues) {
        // Delete existing custom field values
        await ctx.prisma.pcListingCustomFieldValue.deleteMany({
          where: { pcListingId: id },
        })

        // Create new custom field values
        if (customFieldValues.length > 0) {
          await ctx.prisma.pcListingCustomFieldValue.createMany({
            data: customFieldValues.map((cfv) => ({
              pcListingId: id,
              customFieldDefinitionId: cfv.customFieldDefinitionId,
              value: cfv.value,
            })),
          })
        }
      }

      return updatedPcListing
    }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const STATS_CACHE_KEY = 'pc-listing-stats'
    const cached = listingStatsCache.get(STATS_CACHE_KEY)
    if (cached) return cached

    const repository = new PcListingsRepository(ctx.prisma)
    const stats = await repository.stats()

    listingStatsCache.set(STATS_CACHE_KEY, stats)
    return stats
  }),

  // PC Preset procedures
  presets: {
    get: protectedProcedure.input(GetPcPresetsSchema).query(async ({ ctx, input }) => {
      const repository = new UserPcPresetsRepository(ctx.prisma)
      const userId = input.userId ?? ctx.session.user.id

      return await repository.listByUserId(userId, {
        requestingUserId: ctx.session.user.id,
        userRole: ctx.session.user.role,
      })
    }),

    create: protectedProcedure.input(CreatePcPresetSchema).mutation(async ({ ctx, input }) => {
      const repository = new UserPcPresetsRepository(ctx.prisma)

      return await repository.create({
        userId: ctx.session.user.id,
        name: input.name,
        cpuId: input.cpuId,
        gpuId: input.gpuId,
        memorySize: input.memorySize,
        os: input.os,
        osVersion: input.osVersion,
      })
    }),

    update: protectedProcedure.input(UpdatePcPresetSchema).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const repository = new UserPcPresetsRepository(ctx.prisma)

      return await repository.update(id, ctx.session.user.id, data, {
        requestingUserRole: ctx.session.user.role,
      })
    }),

    delete: protectedProcedure.input(DeletePcPresetSchema).mutation(async ({ ctx, input }) => {
      const repository = new UserPcPresetsRepository(ctx.prisma)
      await repository.delete(input.id, ctx.session.user.id, {
        requestingUserRole: ctx.session.user.role,
      })
      return { success: true }
    }),
  },

  // Voting endpoints
  vote: protectedProcedure.input(VotePcListingSchema).mutation(async ({ ctx, input }) => {
    const { pcListingId, value } = input
    const userId = ctx.session.user.id

    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: pcListingId },
    })

    if (!pcListing) return ResourceError.pcListing.notFound()

    // Check if user already voted on this PC listing
    const repository = new PcListingsRepository(ctx.prisma)
    const existingVote = await repository.getExistingVote(userId, pcListingId)

    let voteResult

    if (existingVote) {
      // If vote is the same, remove the vote (toggle)
      if (existingVote.value === value) {
        // Delete vote and update counts in transaction
        voteResult = await ctx.prisma.$transaction(async (tx) => {
          await tx.pcListingVote.delete({
            where: { userId_pcListingId: { userId, pcListingId } },
          })

          await updatePcListingVoteCounts(tx, pcListingId, 'delete', undefined, existingVote.value)

          return { message: 'Vote removed' }
        })
      } else {
        // Update vote and counts in transaction
        voteResult = await ctx.prisma.$transaction(async (tx) => {
          const vote = await tx.pcListingVote.update({
            where: { userId_pcListingId: { userId, pcListingId } },
            data: { value },
          })

          await updatePcListingVoteCounts(tx, pcListingId, 'update', value, existingVote.value)

          return vote
        })
      }
    } else {
      // Create new vote and update counts in transaction
      voteResult = await ctx.prisma.$transaction(async (tx) => {
        const vote = await tx.pcListingVote.create({
          data: { userId, pcListingId, value },
        })

        await updatePcListingVoteCounts(tx, pcListingId, 'create', value)

        return vote
      })
    }

    // Emit notification event
    notificationEventEmitter.emitNotificationEvent({
      eventType: value ? NOTIFICATION_EVENTS.LISTING_VOTED : NOTIFICATION_EVENTS.LISTING_VOTED,
      entityType: 'pcListing',
      entityId: pcListingId,
      triggeredBy: userId,
      payload: { pcListingId, voteValue: value },
    })

    const finalVoteValue = existingVote?.value === value ? null : value
    analytics.engagement.vote({
      listingId: pcListingId,
      voteValue: finalVoteValue,
      previousVote: existingVote?.value,
    })

    return voteResult
  }),

  getUserVote: protectedProcedure
    .input(GetPcListingUserVoteSchema)
    .query(async ({ ctx, input }) => {
      const repository = new PcListingsRepository(ctx.prisma)
      const vote = await repository.getUserVote(ctx.session.user.id, input.pcListingId)
      return { vote }
    }),

  // Comments endpoints
  getComments: publicProcedure.input(GetPcListingCommentsSchema).query(async ({ ctx, input }) => {
    const { pcListingId, sortBy = 'newest', limit = 50, offset = 0 } = input

    const comments = await ctx.prisma.pcListingComment.findMany({
      where: {
        pcListingId,
        parentId: null, // Only get top-level comments
        deletedAt: null, // Don't show soft-deleted comments
      },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true, role: true },
        },
        replies: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy:
        sortBy === 'newest'
          ? { createdAt: 'desc' }
          : sortBy === 'oldest'
            ? { createdAt: 'asc' }
            : { score: 'desc' },
      skip: offset,
      take: limit,
    })

    // Get comment votes for the user if logged in
    let userCommentVotes: Record<string, boolean> = {}
    if (ctx.session?.user) {
      const votes = await ctx.prisma.pcListingCommentVote.findMany({
        where: {
          userId: ctx.session.user.id,
          comment: { pcListingId },
        },
        select: { commentId: true, value: true },
      })

      userCommentVotes = votes.reduce(
        (acc, vote) => ({
          ...acc,
          [vote.commentId]: vote.value,
        }),
        {} as Record<string, boolean>,
      )
    }

    const commentsWithVotes = comments.map((comment) => ({
      ...comment,
      userVote: userCommentVotes[comment.id] ?? null,
      replies: comment.replies.map((reply) => ({
        ...reply,
        userVote: userCommentVotes[reply.id] ?? null,
      })),
    }))

    return { comments: commentsWithVotes }
  }),

  createComment: protectedProcedure
    .input(CreatePcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { pcListingId, content, parentId } = input
      const userId = ctx.session.user.id

      // Check if PC listing exists
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      // If parentId is provided, check if parent comment exists
      if (parentId) {
        const parentComment = await ctx.prisma.pcListingComment.findUnique({
          where: { id: parentId },
        })

        if (!parentComment) return ResourceError.comment.parentNotFound()
      }

      const comment = await ctx.prisma.pcListingComment.create({
        data: { content, userId, pcListingId, parentId },
        include: {
          user: {
            select: { id: true, name: true, profileImage: true, role: true },
          },
        },
      })

      notificationEventEmitter.emitNotificationEvent({
        eventType: parentId
          ? NOTIFICATION_EVENTS.COMMENT_REPLIED
          : NOTIFICATION_EVENTS.LISTING_COMMENTED,
        entityType: 'pcListing',
        entityId: pcListingId,
        triggeredBy: userId,
        payload: {
          pcListingId,
          commentId: comment.id,
          parentId,
          commentText: content,
        },
      })

      analytics.engagement.comment({
        action: parentId ? 'reply' : 'created',
        commentId: comment.id,
        listingId: pcListingId,
        isReply: !!parentId,
        contentLength: content.length,
      })

      return comment
    }),

  updateComment: protectedProcedure
    .input(UpdatePcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.pcListingComment.findUnique({
        where: { id: input.commentId },
        include: { user: { select: { id: true } } },
      })

      if (!comment) return ResourceError.comment.notFound()
      if (comment.deletedAt) return ResourceError.comment.cannotEditDeleted()

      const canEdit = canEditComment(ctx.session.user.role, comment.user.id, ctx.session.user.id)

      if (!canEdit) {
        return ResourceError.comment.noPermission('edit')
      }

      return ctx.prisma.pcListingComment.update({
        where: { id: input.commentId },
        data: {
          content: input.content,
          isEdited: true,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, profileImage: true, role: true },
          },
        },
      })
    }),

  deleteComment: protectedProcedure
    .input(DeletePcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.pcListingComment.findUnique({
        where: { id: input.commentId },
        include: { user: { select: { id: true } } },
      })

      if (!comment) return ResourceError.comment.notFound()
      if (comment.deletedAt) return ResourceError.comment.alreadyDeleted()

      const canDelete = canDeleteComment(
        ctx.session.user.role,
        comment.user.id,
        ctx.session.user.id,
      )

      if (!canDelete) {
        return ResourceError.comment.noPermission('delete')
      }

      return ctx.prisma.pcListingComment.update({
        where: { id: input.commentId },
        data: { deletedAt: new Date() },
      })
    }),

  voteComment: protectedProcedure
    .input(VotePcListingCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { commentId, value } = input
      const userId = ctx.session.user.id

      const comment = await ctx.prisma.pcListingComment.findUnique({
        where: { id: commentId },
      })

      if (!comment) {
        return ResourceError.comment.notFound()
      }

      // Check if user already voted on this comment
      const existingVote = await ctx.prisma.pcListingCommentVote.findUnique({
        where: { userId_commentId: { userId, commentId } },
      })

      // Start a transaction to handle both the vote and score update
      return ctx.prisma.$transaction(async (tx) => {
        let voteResult
        let scoreChange: number

        if (existingVote) {
          // If vote is the same, remove the vote (toggle)
          if (existingVote.value === value) {
            await tx.pcListingCommentVote.delete({
              where: { userId_commentId: { userId, commentId } },
            })
            scoreChange = existingVote.value ? -1 : 1
            voteResult = { message: 'Vote removed' }
          } else {
            voteResult = await tx.pcListingCommentVote.update({
              where: { userId_commentId: { userId, commentId } },
              data: { value },
            })
            scoreChange = value ? 2 : -2
          }
        } else {
          voteResult = await tx.pcListingCommentVote.create({
            data: { userId, commentId, value },
          })
          scoreChange = value ? 1 : -1
        }

        // Update the comment score
        await tx.pcListingComment.update({
          where: { id: commentId },
          data: { score: { increment: scoreChange } },
        })

        return voteResult
      })
    }),

  // Reporting endpoints
  createReport: protectedProcedure
    .input(CreatePcListingReportSchema)
    .mutation(async ({ ctx, input }) => {
      const { pcListingId, reason, description } = input
      const userId = ctx.session.user.id

      // Check if PC listing exists
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
        include: { author: true },
      })

      if (!pcListing) {
        return ResourceError.pcListing.notFound()
      }

      // Prevent users from reporting their own listings
      if (pcListing.authorId === userId) {
        AppError.badRequest('You cannot report your own listing')
      }

      // Check if user already reported this listing
      const existingReport = await ctx.prisma.pcListingReport.findUnique({
        where: {
          pcListingId_reportedById: {
            pcListingId,
            reportedById: userId,
          },
        },
      })

      if (existingReport) {
        AppError.badRequest('You have already reported this listing')
      }

      return ctx.prisma.pcListingReport.create({
        data: {
          pcListingId,
          reportedById: userId,
          reason,
          description,
        },
        include: {
          pcListing: {
            include: {
              game: { select: { title: true } },
              author: { select: { name: true } },
            },
          },
        },
      })
    }),

  getReports: permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
    .input(GetPcListingReportsSchema)
    .query(async ({ ctx, input }) => {
      const { status, page = 1, limit = 20 } = input
      const offset = (page - 1) * limit

      const where: Prisma.PcListingReportWhereInput = {}
      if (status) {
        where.status = status
      }

      const [reports, total] = await Promise.all([
        ctx.prisma.pcListingReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          include: {
            pcListing: {
              include: {
                game: { select: { id: true, title: true } },
                author: { select: { id: true, name: true } },
                cpu: true,
                gpu: true,
                emulator: { select: { id: true, name: true } },
              },
            },
            reportedBy: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.prisma.pcListingReport.count({ where }),
      ])

      return {
        reports,
        pagination: paginate({ total: total, page, limit: limit }),
      }
    }),

  updateReport: permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)
    .input(UpdatePcListingReportSchema)
    .mutation(async ({ ctx, input }) => {
      const { reportId, status, reviewNotes } = input
      const reviewerId = ctx.session.user.id

      const report = await ctx.prisma.pcListingReport.findUnique({
        where: { id: reportId },
        include: { pcListing: true },
      })

      if (!report) {
        return ResourceError.listingReport.notFound()
      }

      // If resolving the report and marking listing as rejected
      if (
        status === ReportStatus.RESOLVED &&
        report.pcListing?.status === ApprovalStatus.APPROVED
      ) {
        // Update the listing status to rejected
        await ctx.prisma.pcListing.update({
          where: { id: report.pcListingId },
          data: {
            status: ApprovalStatus.REJECTED,
            processedAt: new Date(),
            processedByUserId: reviewerId,
            processedNotes: `Rejected due to report: ${reviewNotes || 'No additional notes'}`,
          },
        })
      }

      // Award trust points based on report outcome
      const trustService = new TrustService(ctx.prisma)

      if (status === ReportStatus.RESOLVED) {
        // Report was confirmed - reward the reporter
        await trustService.logAction({
          userId: report.reportedById,
          action: TrustAction.REPORT_CONFIRMED,
          metadata: {
            reportId,
            pcListingId: report.pcListingId,
            reviewedBy: reviewerId,
            reason: report.reason,
          },
        })
      } else if (status === ReportStatus.DISMISSED) {
        // Report was false/malicious - penalize the reporter
        await trustService.logAction({
          userId: report.reportedById,
          action: TrustAction.FALSE_REPORT,
          metadata: {
            reportId,
            pcListingId: report.pcListingId,
            reviewedBy: reviewerId,
            reason: report.reason,
            reviewNotes,
          },
        })
      }

      return ctx.prisma.pcListingReport.update({
        where: { id: reportId },
        data: {
          status,
          reviewNotes,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
        include: {
          pcListing: {
            include: {
              game: { select: { title: true } },
              author: { select: { name: true } },
            },
          },
          reportedBy: { select: { name: true } },
          reviewedBy: { select: { name: true } },
        },
      })
    }),

  // Verification endpoints
  verify: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(VerifyPcListingAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { pcListingId, notes } = input
      const verifierId = ctx.session.user.id

      // Check if PC listing exists
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
      })

      if (!pcListing) {
        ResourceError.pcListing.notFound()
      }

      // Check if user already verified this listing
      const existingVerification = await ctx.prisma.pcListingDeveloperVerification.findUnique({
        where: {
          pcListingId_verifiedBy: {
            pcListingId,
            verifiedBy: verifierId,
          },
        },
      })

      if (existingVerification) {
        AppError.badRequest('You have already verified this listing')
      }

      return ctx.prisma.pcListingDeveloperVerification.create({
        data: {
          pcListingId,
          verifiedBy: verifierId,
          notes,
        },
        include: {
          developer: { select: { id: true, name: true } },
        },
      })
    }),

  removeVerification: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(RemovePcListingVerificationSchema)
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.prisma.pcListingDeveloperVerification.findUnique({
        where: { id: input.verificationId },
      })

      if (!verification) {
        return ResourceError.verification.notFound()
      }

      // Only allow the verifier or admin to remove verification
      if (verification.verifiedBy !== ctx.session.user.id && !isModerator(ctx.session.user.role)) {
        return ResourceError.verification.canOnlyRemoveOwn()
      }

      return ctx.prisma.pcListingDeveloperVerification.delete({
        where: { id: input.verificationId },
      })
    }),

  getVerifications: publicProcedure
    .input(GetPcListingVerificationsSchema)
    .query(async ({ ctx, input }) => {
      return ctx.prisma.pcListingDeveloperVerification.findMany({
        where: { pcListingId: input.pcListingId },
        include: {
          developer: { select: { id: true, name: true } },
        },
        orderBy: { verifiedAt: 'desc' },
      })
    }),
})
