import { AppError, ResourceError } from '@/lib/errors'
import {
  CreateCommentSchema,
  CreateListingSchema,
  DeleteCommentSchema,
  DeleteListingSchema,
  GetListingByIdSchema,
  GetListingCommentsSchema,
  GetListingEmulatorConfigSchema,
  GetListingsByGameSchema,
  GetListingsSchema,
  type GetListingsInput,
  GetUserListingsSchema,
  GetUserVoteSchema,
  UpdateCommentSchema,
  UpdateListingSchema,
  VoteCommentSchema,
  VoteListingSchema,
  GetUserVotesSchema,
  ReportCommentSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { CommentsRepository } from '@/server/repositories/comments.repository'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import {
  convertToEdenConfig,
  serializeEdenConfig,
} from '@/server/utils/emulator-config/eden-converter'
import {
  convertToGameNativeConfig,
  serializeGameNativeConfig,
} from '@/server/utils/emulator-config/gamenative-converter'
import { updateListingVoteCounts } from '@/server/utils/vote-counts'
import { ApprovalStatus, type PrismaClient, Prisma, type Role } from '@orm'

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
    gameId,
    systemId,
    systemIds,
    deviceId,
    emulatorIds,
    performanceIds,
    search,
  } = input ?? {}

  // Handle both single systemId (deprecated) and multiple systemIds
  const effectiveSystemIds = systemIds || (systemId ? [systemId] : undefined)

  // Convert single deviceId to array format for consistency
  const deviceIds = deviceId ? [deviceId] : undefined

  const result = await repository.getListings({
    gameId,
    systemIds: effectiveSystemIds,
    deviceIds,
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
    pagination: {
      total: result.pagination.total,
      pages: result.pagination.pages,
      currentPage: result.pagination.page,
      limit: result.pagination.limit,
      hasNextPage: result.pagination.page < result.pagination.pages,
      hasPreviousPage: result.pagination.page > 1,
    },
  }
}

export const mobileListingsRouter = createMobileTRPCRouter({
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
    return await repository.getFeaturedListings(10)
  }),

  /**
   * Get listings by game
   */
  byGame: mobilePublicProcedure.input(GetListingsByGameSchema).query(async ({ ctx, input }) => {
    const repository = new ListingsRepository(ctx.prisma)
    const result = await repository.getListingsByGame(input.gameId, ctx.session?.user?.id)
    return result.listings
  }),

  /**
   * Get listing by ID
   */
  byId: mobilePublicProcedure.input(GetListingByIdSchema).query(async ({ ctx, input }) => {
    const repository = new ListingsRepository(ctx.prisma)
    return await repository.getListingById(input.id, ctx.session?.user?.id)
  }),

  /**
   * Get user listings
   */
  byUser: mobileProtectedProcedure.input(GetUserListingsSchema).query(async ({ ctx, input }) => {
    const repository = new ListingsRepository(ctx.prisma)
    const result = await repository.getUserListings(input.userId, false)
    return result.listings
  }),

  /**
   * Create a new listing
   */
  create: mobileProtectedProcedure.input(CreateListingSchema).mutation(async ({ ctx, input }) => {
    return await ctx.prisma.listing.create({
      data: {
        gameId: input.gameId,
        deviceId: input.deviceId,
        emulatorId: input.emulatorId,
        performanceId: input.performanceId,
        notes: input.notes,
        authorId: ctx.session.user.id,
        status: ApprovalStatus.PENDING,
        customFieldValues: input.customFieldValues
          ? {
              create: input.customFieldValues.map((cfv) => ({
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

    if (existing.authorId !== ctx.session.user.id) {
      return AppError.forbidden('You can only edit your own listings')
    }

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
        game: {
          include: {
            system: { select: { id: true, name: true, key: true } },
          },
        },
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
      ? AppError.forbidden('You can only delete your own listings')
      : await ctx.prisma.listing.delete({ where: { id: input.id } })
  }),

  /**
   * Vote on a listing
   */
  vote: mobileProtectedProcedure.input(VoteListingSchema).mutation(async ({ ctx, input }) => {
    return await ctx.prisma.$transaction(async (tx) => {
      // Check if user already voted
      const existingVote = await tx.vote.findUnique({
        where: {
          userId_listingId: {
            userId: ctx.session.user.id,
            listingId: input.listingId,
          },
        },
      })

      let vote

      if (existingVote) {
        if (existingVote.value === input.value) {
          // Same vote = toggle off (remove vote)
          await tx.vote.delete({
            where: { id: existingVote.id },
          })

          // Update counts for deletion
          await updateListingVoteCounts(
            tx,
            input.listingId,
            'delete',
            undefined,
            existingVote.value,
          )

          return { id: existingVote.id, value: null, removed: true }
        } else {
          // Different vote = update
          vote = await tx.vote.update({
            where: { id: existingVote.id },
            data: { value: input.value },
          })

          // Update counts for change
          await updateListingVoteCounts(
            tx,
            input.listingId,
            'update',
            input.value,
            existingVote.value,
          )
        }
      } else {
        // New vote
        vote = await tx.vote.create({
          data: {
            value: input.value,
            listingId: input.listingId,
            userId: ctx.session.user.id,
          },
        })

        // Update counts for new vote
        await updateListingVoteCounts(tx, input.listingId, 'create', input.value)
      }

      return vote
    })
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
    return repository.getForListing(input.listingId, ctx.session?.user?.role)
  }),

  /**
   * Create a comment
   */
  createComment: mobileProtectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.comment.create({
        data: {
          content: input.content,
          listingId: input.listingId,
          userId: ctx.session.user.id,
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
        return AppError.forbidden('You can only edit your own comments')
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
        ? AppError.forbidden('You can only delete your own comments')
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
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.listingId },
        include: {
          game: {
            select: {
              id: true,
              title: true,
              system: { select: { id: true, name: true, key: true } },
            },
          },
          emulator: { select: { id: true, name: true } },
          customFieldValues: {
            include: {
              customFieldDefinition: {
                select: { id: true, name: true, label: true, type: true, options: true },
              },
            },
          },
        },
      })

      if (!listing) return ResourceError.listing.notFound()

      // Determine emulator type
      const emulatorName = listing.emulator.name.toLowerCase()
      const emulatorType =
        input.emulatorType ??
        (emulatorName.includes('eden')
          ? 'eden'
          : emulatorName.includes('gamenative')
            ? 'gamenative'
            : null)

      if (emulatorType === 'eden') {
        // Convert to Eden configuration
        const edenConfig = convertToEdenConfig({
          listingId: listing.id,
          gameId: listing.game.id,
          customFieldValues: listing.customFieldValues.map((cfv) => ({
            customFieldDefinition: cfv.customFieldDefinition,
            value: cfv.value,
          })),
        })

        // Serialize to .ini format
        const configContent = serializeEdenConfig(edenConfig)

        return {
          type: 'eden',
          filename: `${listing.game.id}.ini`,
          content: configContent,
          mimeType: 'text/plain',
          metadata: {
            gameTitle: listing.game.title,
            systemName: listing.game.system.name,
            emulatorName: listing.emulator.name,
          },
        }
      } else if (emulatorType === 'gamenative') {
        // Convert to GameNative configuration
        const gameNativeConfig = convertToGameNativeConfig({
          listingId: listing.id,
          gameId: listing.game.id,
          customFieldValues: listing.customFieldValues.map((cfv) => ({
            customFieldDefinition: cfv.customFieldDefinition,
            value: cfv.value,
          })),
        })

        // Serialize to JSON format
        const configContent = serializeGameNativeConfig(gameNativeConfig)

        return {
          type: 'gamenative',
          filename: `${listing.game.id}.json`,
          content: configContent,
          mimeType: 'application/json',
          metadata: {
            gameTitle: listing.game.title,
            systemName: listing.game.system.name,
            emulatorName: listing.emulator.name,
          },
        }
      }
      return AppError.badRequest('Unsupported emulator type')
    }),

  /**
   * Vote on a comment
   */
  voteComment: mobileProtectedProcedure
    .input(VoteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { commentId, value } = input

      // Check if comment exists
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: commentId },
        select: { userId: true },
      })

      if (!comment) {
        throw ResourceError.comment.notFound()
      }

      // Check for existing vote
      const existingVote = await ctx.prisma.commentVote.findUnique({
        where: { userId_commentId: { userId: ctx.session.user.id, commentId } },
      })

      // Remove vote if value is null or same as existing
      if (value === null || (existingVote && existingVote.value === value)) {
        if (existingVote) {
          await ctx.prisma.commentVote.delete({
            where: { userId_commentId: { userId: ctx.session.user.id, commentId } },
          })
        }
        return { message: 'Vote removed' }
      }

      // Update or create vote
      if (existingVote) {
        return await ctx.prisma.commentVote.update({
          where: { userId_commentId: { userId: ctx.session.user.id, commentId } },
          data: { value },
        })
      } else {
        return await ctx.prisma.commentVote.create({
          data: { value, userId: ctx.session.user.id, commentId },
        })
      }
    }),

  /**
   * Get user votes for multiple comments
   */
  getUserCommentVotes: mobileProtectedProcedure
    .input(GetUserVotesSchema)
    .query(async ({ ctx, input }) => {
      const votes = await ctx.prisma.commentVote.findMany({
        where: {
          userId: ctx.session.user.id,
          commentId: { in: input.commentIds },
        },
        select: {
          commentId: true,
          value: true,
        },
      })

      const voteMap: Record<string, boolean | null> = {}
      input.commentIds.forEach((id) => {
        voteMap[id] = null
      })
      votes.forEach((vote) => {
        voteMap[vote.commentId] = vote.value
      })

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

      if (!comment) {
        throw ResourceError.comment.notFound()
      }

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
