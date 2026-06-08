import analytics from '@/lib/analytics'
import { AppError, ResourceError } from '@/lib/errors'
import { applyTrustAction } from '@/lib/trust/service'
import {
  CreatePcListingSchema,
  CreatePcPresetSchema,
  DeletePcListingSchema,
  DeletePcPresetSchema,
  GetPcListingByIdSchema,
  GetPcListingForUserEditSchema,
  GetPcListingUserVoteSchema,
  GetPcListingVerificationsSchema,
  GetPcListingsSchema,
  GetPcPresetsSchema,
  RemovePcListingVerificationSchema,
  UpdatePcListingUserSchema,
  UpdatePcPresetSchema,
  VerifyPcListingAdminSchema,
  VotePcListingSchema,
} from '@/schemas/pcListing'
import {
  createListingProcedure,
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { pcListingDetailInclude } from '@/server/api/utils/pcListingHelpers'
import {
  invalidatePcListingSeo,
  invalidatePcListingSeoForUpdate,
} from '@/server/cache/invalidation'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { UserPcPresetsRepository } from '@/server/repositories/user-pc-presets.repository'
import { attachReviewRiskProfileForViewer } from '@/server/services/review-risk.service'
import { normalizeCustomFieldValues } from '@/server/utils/custom-field-values'
import { isUserBanned } from '@/server/utils/query-builders'
import { validatePagination } from '@/server/utils/security-validation'
import { checkSpamContent } from '@/server/utils/spam-check'
import { updatePcListingVoteCounts } from '@/server/utils/vote-counts'
import { handleListingVoteTrustEffects } from '@/server/utils/vote-trust-effects'
import { PERMISSIONS, roleIncludesRole } from '@/utils/permission-system'
import { hasRolePermission, isModerator } from '@/utils/permissions'
import { ApprovalStatus, Role, TrustAction } from '@orm'
import { invalidatePcListingStatsCache, toPrismaCustomFieldValue } from './utils'

export const coreRouter = createTRPCRouter({
  get: publicProcedure.input(GetPcListingsSchema).query(async ({ ctx, input }) => {
    const repository = new PcListingsRepository(ctx.prisma)
    const canSeeBannedUsers = ctx.session?.user ? isModerator(ctx.session.user.role) : false

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
    const userRole = ctx.session?.user?.role
    const canSeeBannedUsers = userRole ? isModerator(userRole) : false

    const pcListing = await repository.getByIdWithDetails(
      input.id,
      canSeeBannedUsers,
      ctx.session?.user?.id,
    )

    if (!pcListing) return ResourceError.pcListing.notFound()

    return await attachReviewRiskProfileForViewer({
      prisma: ctx.prisma,
      listing: pcListing,
      userRole,
    })
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

    const isOwner = pcListing.authorId === ctx.session.user.id

    if (hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
      return {
        canEdit: true,
        isOwner,
        reason: 'Moderator can edit any PC listing',
      }
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

  create: createListingProcedure.input(CreatePcListingSchema).mutation(async ({ ctx, input }) => {
    const { humanVerificationToken, ...payload } = input
    const authorId = ctx.session.user.id

    await checkSpamContent({
      prisma: ctx.prisma,
      userId: authorId,
      content: payload.notes ?? '',
      entityType: 'pcListing',
      challengeMode: 'challenge',
      humanVerificationToken,
      headers: ctx.headers,
    })

    const repository = new PcListingsRepository(ctx.prisma)
    const newListing = await repository.create({
      authorId,
      userRole: ctx.session.user.role,
      gameId: payload.gameId,
      cpuId: payload.cpuId,
      gpuId: payload.gpuId ?? null,
      emulatorId: payload.emulatorId,
      performanceId: payload.performanceId,
      memorySize: payload.memorySize,
      os: payload.os,
      osVersion: payload.osVersion,
      notes: payload.notes ?? null,
      customFieldValues: normalizeCustomFieldValues(payload.customFieldValues),
    })

    await applyTrustAction({
      userId: authorId,
      action: TrustAction.LISTING_CREATED,
      context: { pcListingId: newListing.id },
    })

    invalidatePcListingStatsCache()

    if (newListing.status === ApprovalStatus.APPROVED) {
      await invalidatePcListingSeo({
        id: newListing.id,
        gameId: payload.gameId,
        cpuId: payload.cpuId,
        gpuId: payload.gpuId ?? null,
      })
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

    invalidatePcListingStatsCache()

    if (pcListing.status === ApprovalStatus.APPROVED) {
      await invalidatePcListingSeo(pcListing)
    }

    return deletedListing
  }),

  update: protectedProcedure.input(UpdatePcListingUserSchema).mutation(async ({ ctx, input }) => {
    const EDIT_TIME_LIMIT_MINUTES = 60

    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: input.id },
      select: {
        authorId: true,
        status: true,
        processedAt: true,
        gameId: true,
        cpuId: true,
        gpuId: true,
      },
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
            value: toPrismaCustomFieldValue(cfv.value),
          })),
        })
      }
    }

    if (pcListing.status === ApprovalStatus.APPROVED) {
      await invalidatePcListingSeoForUpdate(
        {
          id,
          gameId: pcListing.gameId,
          cpuId: pcListing.cpuId,
          gpuId: pcListing.gpuId,
        },
        {
          id,
          gameId: updatedPcListing.gameId,
          cpuId: updatedPcListing.cpuId,
          gpuId: updatedPcListing.gpuId,
        },
      )
    }

    return updatedPcListing
  }),

  vote: protectedProcedure.input(VotePcListingSchema).mutation(async ({ ctx, input }) => {
    const { pcListingId, value } = input
    const userId = ctx.session.user.id

    if (await isUserBanned(ctx.prisma, userId)) {
      return AppError.shadowBanned()
    }

    const pcListing = await ctx.prisma.pcListing.findUnique({
      where: { id: pcListingId },
    })

    if (!pcListing) return ResourceError.pcListing.notFound()

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
          payload: {
            pcListingId,
            voteValue: value,
          },
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

  // Verification
  verify: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(VerifyPcListingAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { pcListingId, notes } = input
      const verifierId = ctx.session.user.id

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
      })

      if (!pcListing) {
        return ResourceError.pcListing.notFound()
      }

      const existingVerification = await ctx.prisma.pcListingDeveloperVerification.findUnique({
        where: {
          pcListingId_verifiedBy: {
            pcListingId,
            verifiedBy: verifierId,
          },
        },
      })

      if (existingVerification) {
        return AppError.badRequest('You have already verified this listing')
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
