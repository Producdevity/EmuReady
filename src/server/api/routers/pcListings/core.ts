import analytics from '@/lib/analytics'
import { RECAPTCHA_CONFIG } from '@/lib/captcha/config'
import { getClientIP, verifyRecaptcha } from '@/lib/captcha/verify'
import { AppError, ResourceError } from '@/lib/errors'
import { applyTrustAction } from '@/lib/trust/service'
import {
  CreatePcListingReportSchema,
  CreatePcListingSchema,
  DeletePcListingSchema,
  GetPcListingByIdSchema,
  GetPcListingForUserEditSchema,
  GetPcListingsSchema,
  GetPcListingUserVoteSchema,
  UpdatePcListingUserSchema,
  VotePcListingSchema,
} from '@/schemas/pcListing'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { pcListingDetailInclude } from '@/server/api/utils/pcListingHelpers'
import {
  invalidateListPages,
  invalidateSitemap,
  revalidateByTag,
} from '@/server/cache/invalidation'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { listingStatsCache } from '@/server/utils/cache'
import { isUserBanned } from '@/server/utils/query-builders'
import { validatePagination } from '@/server/utils/security-validation'
import { updatePcListingVoteCounts } from '@/server/utils/vote-counts'
import { handleListingVoteTrustEffects } from '@/server/utils/vote-trust-effects'
import { roleIncludesRole } from '@/utils/permission-system'
import { hasRolePermission, isModerator } from '@/utils/permissions'
import { ApprovalStatus, Prisma, Role, TrustAction } from '@orm'

export const coreRouter = createTRPCRouter({
  get: publicProcedure.input(GetPcListingsSchema).query(async ({ ctx, input }) => {
    const repository = new PcListingsRepository(ctx.prisma)
    const canSeeBannedUsers = ctx.session?.user ? isModerator(ctx.session.user.role) : false

    const { page, limit } = validatePagination(input.page, input.limit, 50)

    const result = await repository.list({
      gameId: undefined,
      systemIds: input.systemIds ?? undefined,
      cpuIds: input.cpuIds ?? undefined,
      gpuIds: input.gpuIds ?? undefined,
      emulatorIds: input.emulatorIds ?? undefined,
      performanceIds: input.performanceIds ?? undefined,
      platformIds: input.platformIds ?? undefined,
      searchTerm: input.searchTerm ?? undefined,
      osFilter: input.osFilter,
      memoryMin: input.memoryMin,
      memoryMax: input.memoryMax,
      sortField: input.sortField,
      sortDirection: input.sortDirection ?? undefined,
      myListings: input.myListings ?? undefined,
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
      return { canEdit: false, isOwner: false, reason: 'PC listing not found' }
    }

    const isOwner = pcListing.authorId === ctx.session.user.id

    if (hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
      return { canEdit: true, isOwner, reason: 'Moderator can edit any PC listing' }
    }

    if (!isOwner) {
      return { canEdit: false, isOwner: false, reason: 'Not your PC listing' }
    }

    if (pcListing.status === ApprovalStatus.PENDING) {
      return {
        canEdit: true,
        isOwner: true,
        reason: 'Pending PC listings can always be edited',
        isPending: true,
      }
    }

    if (pcListing.status === ApprovalStatus.REJECTED) {
      return {
        canEdit: false,
        isOwner: true,
        reason: 'Rejected PC listings cannot be edited. Please create a new listing.',
      }
    }

    if (pcListing.status === ApprovalStatus.APPROVED) {
      if (!pcListing.processedAt) {
        return { canEdit: false, isOwner: true, reason: 'No approval time found' }
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

    return { canEdit: false, isOwner: true, reason: 'Invalid PC listing status' }
  }),

  getForUserEdit: protectedProcedure
    .input(GetPcListingForUserEditSchema)
    .query(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.id },
        include: {
          ...pcListingDetailInclude,
          emulator: {
            include: {
              customFieldDefinitions: {
                orderBy: [{ categoryId: 'asc' }, { categoryOrder: 'asc' }, { displayOrder: 'asc' }],
              },
            },
          },
        },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      if (
        pcListing.authorId !== ctx.session.user.id &&
        !roleIncludesRole(ctx.session.user.role, Role.MODERATOR)
      ) {
        return ResourceError.pcListing.canOnlyEditOwn()
      }

      return pcListing
    }),

  create: protectedProcedure.input(CreatePcListingSchema).mutation(async ({ ctx, input }) => {
    // TODO: Add spam detection via `checkSpamContent` from
    // `@/server/utils/spam-check` (currently only applied in mobile routes).
    // Block: UX/product sign-off needed since existing web users would start
    // seeing spam-block errors. Mirror mobile: `{ userId, content: notes, entityType: 'listing' }`.
    const authorId = ctx.session.user.id
    const repository = new PcListingsRepository(ctx.prisma)
    const newListing = await repository.create({
      authorId,
      userRole: ctx.session.user.role,
      gameId: input.gameId,
      cpuId: input.cpuId,
      gpuId: input.gpuId ?? null,
      emulatorId: input.emulatorId,
      performanceId: input.performanceId,
      memorySize: input.memorySize,
      os: input.os,
      osVersion: input.osVersion,
      platformId: input.platformId ?? null,
      notes: input.notes ?? null,
      customFieldValues: (input.customFieldValues
        ? (input.customFieldValues as { customFieldDefinitionId: string; value: unknown }[])
        : null) as { customFieldDefinitionId: string; value: unknown }[] | null,
    })

    await applyTrustAction({
      userId: authorId,
      action: TrustAction.LISTING_CREATED,
      context: { pcListingId: newListing.id },
    })

    listingStatsCache.delete('pc-listing-stats')

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

    if (pcListing.authorId !== ctx.session.user.id) {
      return ResourceError.pcListing.canOnlyDeleteOwn()
    }

    const deletedListing = await ctx.prisma.pcListing.delete({
      where: { id: input.id },
    })

    listingStatsCache.delete('pc-listing-stats')

    return deletedListing
  }),

  update: protectedProcedure.input(UpdatePcListingUserSchema).mutation(async ({ ctx, input }) => {
    const EDIT_TIME_LIMIT_MINUTES = 60

    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: input.id },
      select: { authorId: true, status: true, processedAt: true },
    })

    if (!pcListing) return ResourceError.pcListing.notFound()

    if (
      pcListing.authorId !== ctx.session.user.id &&
      !hasRolePermission(ctx.session.user.role, Role.MODERATOR)
    ) {
      return ResourceError.pcListing.canOnlyEditOwn()
    }

    switch (pcListing.status) {
      case ApprovalStatus.REJECTED:
        if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
          return ResourceError.pcListing.cannotEditRejected()
        }
        break

      case ApprovalStatus.APPROVED: {
        if (hasRolePermission(ctx.session.user.role, Role.MODERATOR)) break

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
        break

      default:
        return AppError.badRequest('Invalid PC listing status')
    }

    const [performance] = await Promise.all([
      ctx.prisma.performanceScale.findUnique({ where: { id: input.performanceId } }),
    ])

    if (!performance) return ResourceError.performanceScale.notFound()

    const { id, customFieldValues, ...updateData } = input

    const pcRepository = new PcListingsRepository(ctx.prisma)
    await pcRepository.validatePlatformForUpdate({
      platformId: updateData.platformId,
      pcListingId: id,
      os: updateData.os,
    })

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
        customFieldValues: {
          include: { customFieldDefinition: { include: { category: true } } },
        },
      },
    })

    if (customFieldValues) {
      await ctx.prisma.pcListingCustomFieldValue.deleteMany({ where: { pcListingId: id } })

      if (customFieldValues.length > 0) {
        await ctx.prisma.pcListingCustomFieldValue.createMany({
          data: customFieldValues.map((cfv) => ({
            pcListingId: id,
            customFieldDefinitionId: cfv.customFieldDefinitionId,
            value: (cfv.value ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          })),
        })
      }
    }

    return updatedPcListing
  }),

  vote: protectedProcedure.input(VotePcListingSchema).mutation(async ({ ctx, input }) => {
    const { pcListingId, value } = input
    const userId = ctx.session.user.id

    if (await isUserBanned(ctx.prisma, userId)) {
      return AppError.shadowBanned()
    }

    if (input.recaptchaToken) {
      const clientIP = ctx.headers ? getClientIP(ctx.headers) : undefined
      const captchaResult = await verifyRecaptcha({
        token: input.recaptchaToken,
        expectedAction: RECAPTCHA_CONFIG.actions.VOTE,
        userIP: clientIP,
      })

      if (!captchaResult.success) return AppError.captcha(captchaResult.error)
    }

    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: pcListingId },
    })

    if (!pcListing) return ResourceError.pcListing.notFound()

    // Fetch existingVote INSIDE the transaction to avoid race conditions between
    // concurrent votes on the same (user, pcListing) pair.
    const voteResult = await ctx.prisma.$transaction(async (tx) => {
      const existingVote = await tx.pcListingVote.findUnique({
        where: { userId_pcListingId: { userId, pcListingId } },
      })

      let result: {
        vote: { userId: string; pcListingId: string; value: boolean } | null
        action: 'created' | 'updated' | 'deleted'
        previousValue: boolean | null
      }

      if (!existingVote) {
        const vote = await tx.pcListingVote.create({
          data: { userId, pcListingId, value },
        })
        await updatePcListingVoteCounts(tx, pcListingId, 'create', value)
        result = { vote, action: 'created', previousValue: null }
      } else if (existingVote.value === value) {
        await tx.pcListingVote.delete({
          where: { userId_pcListingId: { userId, pcListingId } },
        })
        await updatePcListingVoteCounts(tx, pcListingId, 'delete', undefined, existingVote.value)
        result = { vote: null, action: 'deleted', previousValue: existingVote.value }
      } else {
        const vote = await tx.pcListingVote.update({
          where: { userId_pcListingId: { userId, pcListingId } },
          data: { value },
        })
        await updatePcListingVoteCounts(tx, pcListingId, 'update', value, existingVote.value)
        result = { vote, action: 'updated', previousValue: existingVote.value }
      }

      await handleListingVoteTrustEffects({
        tx,
        action: result.action,
        currentValue: value,
        previousValue: result.previousValue,
        userId,
        listingId: pcListingId,
        listingType: 'pc',
        authorId: pcListing.authorId,
      })

      return result
    })

    if (voteResult.action === 'created' || voteResult.action === 'updated') {
      if (voteResult.vote) {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.LISTING_VOTED,
          entityType: 'pcListing',
          entityId: pcListingId,
          triggeredBy: userId,
          payload: { pcListingId, voteValue: value },
        })
      }
    }

    const finalVoteValue = voteResult.action === 'deleted' ? null : value
    analytics.engagement.vote({
      listingId: pcListingId,
      voteValue: finalVoteValue,
      previousVote: voteResult.previousValue,
    })

    return voteResult.vote
  }),

  getUserVote: protectedProcedure
    .input(GetPcListingUserVoteSchema)
    .query(async ({ ctx, input }) => {
      const repository = new PcListingsRepository(ctx.prisma)
      const vote = await repository.getUserVote(ctx.session.user.id, input.pcListingId)
      return { vote }
    }),

  createReport: protectedProcedure
    .input(CreatePcListingReportSchema)
    .mutation(async ({ ctx, input }) => {
      const { pcListingId, reason, description } = input
      const userId = ctx.session.user.id

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
        include: { author: true },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      if (pcListing.authorId === userId) {
        return AppError.badRequest('You cannot report your own listing')
      }

      const existingReport = await ctx.prisma.pcListingReport.findUnique({
        where: {
          pcListingId_reportedById: { pcListingId, reportedById: userId },
        },
      })

      if (existingReport) {
        return AppError.badRequest('You have already reported this listing')
      }

      return await ctx.prisma.pcListingReport.create({
        data: { pcListingId, reportedById: userId, reason, description },
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
})
