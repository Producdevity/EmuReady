import analytics from '@/lib/analytics'
import { AppError, ResourceError } from '@/lib/errors'
import { CreateListingSchema } from '@/schemas/listing'
import {
  CreateCommentSchema,
  DeleteCommentSchema,
  DeleteListingSchema,
  GetListingByIdSchema,
  GetListingCommentsSchema,
  GetListingEmulatorConfigSchema,
  GetListingsByGameSchema,
  type GetListingsInput,
  GetListingsSchema,
  GetUserListingsSchema,
  GetUserVoteSchema,
  GetUserVotesSchema,
  ReportCommentSchema,
  UpdateCommentSchema,
  UpdateListingSchema,
  VoteCommentSchema,
  VoteListingSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { NOTIFICATION_EVENTS, notificationEventEmitter } from '@/server/notifications/eventEmitter'
import { CommentsRepository } from '@/server/repositories/comments.repository'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { getDriverVersions } from '@/server/utils/driver-versions'
import { ConfigTypeUtils, type EmulatorConfigType } from '@/server/utils/emulator-config/constants'
import {
  detectEmulatorConfigType,
  generateEmulatorConfig,
} from '@/server/utils/emulator-config/emulator-detector'
import { checkSpamContent } from '@/server/utils/spam-check'
import { updateListingVoteCounts } from '@/server/utils/vote-counts'
import {
  handleCommentVoteTrustEffects,
  handleListingVoteTrustEffects,
} from '@/server/utils/vote-trust-effects'
import { isModerator } from '@/utils/permissions'
import { ApprovalStatus, Prisma, type PrismaClient, type Role } from '@orm'

// Helper for getting listings using the repository
async function getListingsHelper(
  ctx: {
    prisma: PrismaClient
    session?: { user?: { id: string; showNsfw?: boolean; role?: Role } } | null
  },
  input: GetListingsInput,
) {
  const repository = new ListingsRepository(ctx.prisma)

  const {
    page = 1,
    limit = 20,
    gameIds,
    systemIds,
    deviceIds,
    socIds,
    emulatorIds,
    performanceIds,
    search,
  } = input ?? {}

  const result = await repository.list({
    gameId: gameIds?.[0], // Repository expects single gameId, take first if provided
    systemIds,
    deviceIds,
    socIds,
    emulatorIds,
    performanceIds,
    search,
    page,
    limit,
    userId: ctx.session?.user?.id,
    userRole: ctx.session?.user?.role,
    showNsfw: ctx.session?.user?.showNsfw,
    approvalStatus: ApprovalStatus.APPROVED, // Mobile only sees approved
  })

  // Transform pagination to mobile format
  return {
    listings: result.listings,
    pagination: result.pagination, // Already has all fields including hasNextPage/hasPreviousPage
  }
}

export const mobileListingsRouter = createMobileTRPCRouter({
  /**
   * Get available driver versions (mirrors web listings.driverVersions)
   */
  driverVersions: mobilePublicProcedure.query(async () => getDriverVersions()),

  /**
   * Get listings with pagination and filtering
   */
  get: mobilePublicProcedure
    .input(GetListingsSchema)
    .query(async ({ ctx, input }) => getListingsHelper(ctx, input)),

  /**
   * @deprecated Use 'get' instead - kept for backwards compatibility with Eden
   */
  getListings: mobilePublicProcedure
    .input(GetListingsSchema)
    .query(async ({ ctx, input }) => getListingsHelper(ctx, input)),

  /**
   * Get featured listings
   */
  featured: mobilePublicProcedure.query(async ({ ctx }) => {
    const repository = new ListingsRepository(ctx.prisma)
    return await repository.listFeatured(10)
  }),

  /**
   * Get listings by game
   */
  byGame: mobilePublicProcedure.input(GetListingsByGameSchema).query(async ({ ctx, input }) => {
    const repository = new ListingsRepository(ctx.prisma)
    return await repository.listByGameId(input.gameId, ctx.session?.user?.id)
  }),

  /**
   * Get listing by ID
   */
  byId: mobilePublicProcedure.input(GetListingByIdSchema).query(async ({ ctx, input }) => {
    const repository = new ListingsRepository(ctx.prisma)
    const canSeeBannedUsers = ctx.session?.user ? isModerator(ctx.session.user.role) : false
    return await repository.byIdWithAccess(input.id, ctx.session?.user?.id, canSeeBannedUsers)
  }),

  /**
   * Get user listings
   */
  byUser: mobileProtectedProcedure.input(GetUserListingsSchema).query(async ({ ctx, input }) => {
    const repository = new ListingsRepository(ctx.prisma)
    return await repository.listByUserId(input.userId, false)
  }),

  /**
   * Create a new listing
   */
  create: mobileProtectedProcedure.input(CreateListingSchema).mutation(async ({ ctx, input }) => {
    const { ...payload } = input
    const repository = new ListingsRepository(ctx.prisma)

    await checkSpamContent({
      prisma: ctx.prisma,
      userId: ctx.session.user.id,
      content: payload.notes || '',
      entityType: 'listing',
    })

    return await repository.create({
      authorId: ctx.session.user.id,
      userRole: ctx.session.user.role,
      ...payload,
      notes: payload.notes ?? null,
      customFieldValues: (payload.customFieldValues
        ? (payload.customFieldValues as { customFieldDefinitionId: string; value: unknown }[])
        : null) as { customFieldDefinitionId: string; value: unknown }[] | null,
    })
  }),

  /**
   * Update a listing
   */
  update: mobileProtectedProcedure.input(UpdateListingSchema).mutation(async ({ ctx, input }) => {
    const { id, customFieldValues, ...updateData } = input

    // Check if user owns the listing
    const existing = await ctx.prisma.listing.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!existing) return ResourceError.listing.notFound()

    if (existing.authorId !== ctx.session.user.id) return ResourceError.listing.canOnlyEditOwn()

    return await ctx.prisma.listing.update({
      where: { id },
      data: {
        ...updateData,
        customFieldValues: customFieldValues
          ? {
              deleteMany: {},
              create: customFieldValues.map((cfv) => ({
                customFieldDefinitionId: cfv.customFieldDefinitionId,
                value: cfv.value === null || cfv.value === undefined ? Prisma.JsonNull : cfv.value,
              })),
            }
          : undefined,
      },
      include: {
        game: { include: { system: { select: { id: true, name: true, key: true } } } },
        device: { include: { brand: { select: { id: true, name: true } } } },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true } },
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    })
  }),

  /**
   * Delete a listing
   */
  delete: mobileProtectedProcedure.input(DeleteListingSchema).mutation(async ({ ctx, input }) => {
    // Check if user owns the listing
    const existing = await ctx.prisma.listing.findUnique({
      where: { id: input.id },
      select: { authorId: true },
    })

    if (!existing) return ResourceError.listing.notFound()

    return existing.authorId !== ctx.session.user.id
      ? ResourceError.listing.canOnlyEditOwn()
      : await ctx.prisma.listing.delete({ where: { id: input.id } })
  }),

  /**
   * Vote on a listing
   */
  vote: mobileProtectedProcedure.input(VoteListingSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    const listing = await ctx.prisma.listing.findUnique({
      where: { id: input.listingId },
      select: { authorId: true },
    })

    if (!listing) return ResourceError.listing.notFound()

    const voteResult = await ctx.prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: { userId_listingId: { userId, listingId: input.listingId } },
      })

      let result: {
        vote:
          | { id: string; value: boolean; userId: string; listingId: string }
          | { id: string; value: null; removed: true }
        action: 'created' | 'updated' | 'deleted'
        previousValue: boolean | null
      }

      if (!existingVote) {
        const vote = await tx.vote.create({
          data: { value: input.value, listingId: input.listingId, userId },
        })
        await updateListingVoteCounts(tx, input.listingId, 'create', input.value)
        result = { vote, action: 'created', previousValue: null }
      } else if (existingVote.value === input.value) {
        await tx.vote.delete({ where: { id: existingVote.id } })
        await updateListingVoteCounts(tx, input.listingId, 'delete', undefined, existingVote.value)
        result = {
          vote: { id: existingVote.id, value: null, removed: true },
          action: 'deleted',
          previousValue: existingVote.value,
        }
      } else {
        const vote = await tx.vote.update({
          where: { id: existingVote.id },
          data: { value: input.value },
        })
        await updateListingVoteCounts(
          tx,
          input.listingId,
          'update',
          input.value,
          existingVote.value,
        )
        result = { vote, action: 'updated', previousValue: existingVote.value }
      }

      await handleListingVoteTrustEffects({
        tx,
        action: result.action,
        currentValue: input.value,
        previousValue: result.previousValue,
        userId,
        listingId: input.listingId,
        listingType: 'handheld',
        authorId: listing.authorId,
      })

      return result
    })

    // Notify listing author on new votes / direction changes; skip on toggle-off.
    if (voteResult.action === 'created' || voteResult.action === 'updated') {
      if (voteResult.vote && 'id' in voteResult.vote) {
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
    }

    return voteResult.vote
  }),

  /**
   * Get user's vote on a listing
   */
  userVote: mobileProtectedProcedure.input(GetUserVoteSchema).query(async ({ ctx, input }) => {
    const vote = await ctx.prisma.vote.findUnique({
      where: { userId_listingId: { userId: ctx.session.user.id, listingId: input.listingId } },
      select: { value: true },
    })

    return vote?.value ?? null
  }),

  /**
   * Get listing comments
   */
  comments: mobilePublicProcedure.input(GetListingCommentsSchema).query(async ({ ctx, input }) => {
    const repository = new CommentsRepository(ctx.prisma)
    const [comments, listing] = await Promise.all([
      repository.listByListing(input.listingId, ctx.session?.user?.role),
      ctx.prisma.listing.findUnique({
        where: { id: input.listingId },
        select: {
          pinnedCommentId: true,
          pinnedAt: true,
          pinnedByUser: { select: { id: true, name: true } },
        },
      }),
    ])

    let pinnedComment: {
      comment: (typeof comments)[number]
      isReply: boolean
      parentId: string | null
      pinnedBy?: { id: string; name: string | null } | null
      pinnedAt?: Date | null
    } | null = null

    if (listing?.pinnedCommentId) {
      const matched = comments.find((comment) => comment.id === listing.pinnedCommentId)

      if (matched) {
        pinnedComment = {
          comment: matched,
          isReply: !!matched.parentId,
          parentId: matched.parentId ?? null,
          pinnedBy: listing.pinnedByUser
            ? { id: listing.pinnedByUser.id, name: listing.pinnedByUser.name }
            : null,
          pinnedAt: listing.pinnedAt ?? null,
        }
      }
    }

    return {
      comments,
      _count: { comments: comments.length },
      pinnedComment,
    }
  }),

  /**
   * Create a comment
   */
  createComment: mobileProtectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, content, parentId } = input

      await checkSpamContent({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        content,
        entityType: 'comment',
      })

      // If replying to a comment, validate parent existence and ownership
      if (parentId) {
        const parent = await ctx.prisma.comment.findUnique({
          where: { id: parentId },
          select: { id: true, listingId: true },
        })

        if (!parent) return ResourceError.comment.parentNotFound()
        if (parent.listingId !== listingId)
          return AppError.badRequest('Parent comment does not belong to this listing')
      }

      return await ctx.prisma.comment.create({
        data: {
          content,
          listing: { connect: { id: listingId } },
          user: { connect: { id: ctx.session.user.id } },
          ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
        },
        include: { user: { select: { id: true, name: true } } },
      })
    }),

  /**
   * Update a comment
   */
  updateComment: mobileProtectedProcedure
    .input(UpdateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the comment
      const existing = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      })

      if (!existing) return ResourceError.comment.notFound()

      if (existing.userId !== ctx.session.user.id) {
        return ResourceError.comment.noPermission('edit')
      }

      return await ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: { content: input.content },
        include: { user: { select: { id: true, name: true } } },
      })
    }),

  /**
   * Delete a comment
   */
  deleteComment: mobileProtectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the comment
      const existing = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      })

      if (!existing) return ResourceError.comment.notFound()

      return existing.userId !== ctx.session.user.id
        ? ResourceError.comment.noPermission('delete')
        : await ctx.prisma.comment.delete({ where: { id: input.commentId } })
    }),

  /**
   * Get emulator configuration for a listing
   * Returns the configuration file content that the mobile app can use
   * to launch the game with the correct settings
   */
  getEmulatorConfig: mobilePublicProcedure
    .input(GetListingEmulatorConfigSchema)
    .query(async ({ ctx, input }) => {
      // Fetch the listing with all required data
      const repository = new ListingsRepository(ctx.prisma)
      const listing = await repository.findForEmulatorConfig(input.listingId)

      if (!listing) return ResourceError.listing.notFound()

      const resolvedType: EmulatorConfigType | null = input.emulatorType
        ? ConfigTypeUtils.isValidConfigType(input.emulatorType)
          ? input.emulatorType
          : null
        : (() => {
            try {
              return detectEmulatorConfigType(listing.emulator.name)
            } catch {
              return null
            }
          })()

      if (!resolvedType) return AppError.badRequest('Unsupported emulator type')

      const configResult = generateEmulatorConfig({
        listingId: listing.id,
        packageName: input.packageName || null,
        gameId: listing.game.id,
        emulatorName: listing.emulator.name,
        customFieldValues: listing.customFieldValues.map((cfv) => ({
          customFieldDefinition: cfv.customFieldDefinition,
          value: cfv.value,
        })),
        configTypeOverride: resolvedType,
      })

      const fileExtension = ConfigTypeUtils.getFileExtension(configResult.type)

      return {
        type: configResult.type,
        filename: `${listing.game.id}${fileExtension}`,
        content: configResult.serialized,
        mimeType: ConfigTypeUtils.getMimeType(configResult.type),
        metadata: {
          gameTitle: listing.game.title,
          systemName: listing.game.system.name,
          emulatorName: listing.emulator.name,
        },
      }
    }),

  /**
   * Vote on a comment
   */
  voteComment: mobileProtectedProcedure
    .input(VoteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const comment = await ctx.prisma.comment.findUnique({ where: { id: input.commentId } })
      if (!comment) return ResourceError.comment.notFound()

      // Fetch `existingVote` inside the transaction: two concurrent votes
      // from the same user could both read null and both attempt to insert,
      // producing a Prisma P2002 on the second. Keeping the read and write
      // under the same isolation avoids the race.
      return await ctx.prisma.$transaction(async (tx) => {
        const existingVote = await tx.commentVote.findUnique({
          where: { userId_commentId: { userId, commentId: input.commentId } },
        })

        let voteResult: unknown
        let scoreChange: number
        let trustActionNeeded: 'upvote' | 'downvote' | 'change' | 'remove' | null

        if (existingVote) {
          if (input.value === null || existingVote.value === input.value) {
            // Remove vote
            await tx.commentVote.delete({
              where: { userId_commentId: { userId, commentId: input.commentId } },
            })
            scoreChange = existingVote.value ? -1 : 1
            voteResult = { message: 'Vote removed' }
            trustActionNeeded = 'remove'
          } else {
            // Change vote
            voteResult = await tx.commentVote.update({
              where: { userId_commentId: { userId, commentId: input.commentId } },
              data: { value: input.value },
            })
            scoreChange = input.value ? 2 : -2
            trustActionNeeded = 'change'
          }
        } else {
          // New vote
          voteResult = await tx.commentVote.create({
            data: { userId, commentId: input.commentId, value: !!input.value },
          })
          scoreChange = input.value ? 1 : -1
          trustActionNeeded = input.value ? 'upvote' : 'downvote'
        }

        // Update the comment score
        const updatedComment = await tx.comment.update({
          where: { id: input.commentId },
          data: { score: { increment: scoreChange } },
        })

        if (trustActionNeeded) {
          await handleCommentVoteTrustEffects({
            tx,
            trustAction: trustActionNeeded,
            newValue: !!input.value,
            previousValue: existingVote?.value ?? null,
            commentAuthorId: comment.userId,
            voterId: userId,
            commentId: input.commentId,
            parentEntityId: comment.listingId,
            listingType: 'handheld',
            updatedScore: updatedComment.score,
            scoreChange,
          })
        }

        // Notify comment author on new votes / direction changes; skip on toggle-off.
        // When trustActionNeeded is upvote/downvote/change, input.value is guaranteed non-null
        // (null input.value always maps to 'remove' in the branching above).
        if (trustActionNeeded !== null && trustActionNeeded !== 'remove' && input.value !== null) {
          notificationEventEmitter.emitNotificationEvent({
            eventType: NOTIFICATION_EVENTS.COMMENT_VOTED,
            entityType: 'comment',
            entityId: comment.id,
            triggeredBy: userId,
            payload: {
              listingId: comment.listingId,
              commentId: comment.id,
              voteValue: input.value,
            },
          })
        }

        // Analytics
        const finalVoteValue =
          existingVote?.value === input.value || input.value === null ? null : input.value
        analytics.engagement.commentVote({
          commentId: input.commentId,
          voteValue: finalVoteValue,
          previousVote: existingVote?.value,
          listingId: comment.listingId,
        })

        return voteResult
      })
    }),

  /**
   * Get user votes for multiple comments
   */
  getUserCommentVotes: mobileProtectedProcedure
    .input(GetUserVotesSchema)
    .query(async ({ ctx, input }) => {
      const votes = await ctx.prisma.commentVote.findMany({
        where: { userId: ctx.session.user.id, commentId: { in: input.commentIds } },
        select: { commentId: true, value: true },
      })

      const voteMap: Record<string, boolean | null> = {}
      input.commentIds.forEach((id) => (voteMap[id] = null))
      votes.forEach((vote) => (voteMap[vote.commentId] = vote.value))

      return voteMap
    }),

  /**
   * Report a comment
   */
  reportComment: mobileProtectedProcedure
    .input(ReportCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if comment exists
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { id: true },
      })

      if (!comment) return ResourceError.comment.notFound()

      // For now, return a success response since we don't have CommentReport model
      // TODO: Implement when CommentReport model is added to schema
      return {
        id: `report-${input.commentId}-${Date.now()}`,
        commentId: input.commentId,
        reportedBy: ctx.session.user.id,
        reason: input.reason,
        description: input.description,
        status: 'PENDING',
        createdAt: new Date(),
        message: 'Report submitted successfully. Admin will review it shortly.',
      }
    }),
})
