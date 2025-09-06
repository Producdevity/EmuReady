import { AppError, ResourceError } from '@/lib/errors'
import { TrustService } from '@/lib/trust/service'
import {
  ApproveGameSchema,
  CheckExistingByTgdbIdsSchema,
  CheckExistingByNamesAndSystemsSchema,
  CreateGameSchema,
  DeleteGameSchema,
  GetGameByIdSchema,
  GetGamesSchema,
  GetPendingGamesSchema,
  UpdateGameSchema,
  BulkApproveGamesSchema,
  BulkRejectGamesSchema,
  FindSwitchTitleIdSchema,
  GetBestSwitchTitleIdSchema,
  GetSwitchGamesStatsSchema,
  OverrideGameStatusSchema,
} from '@/schemas/game'
import { createGameMetadata, getTgdbGameId } from '@/schemas/gameMetadata'
import {
  approveGamesProcedure,
  createTRPCRouter,
  editGamesProcedure,
  deleteGamesProcedure,
  protectedProcedure,
  publicProcedure,
  superAdminProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import {
  invalidateGame,
  invalidateGameRelatedContent,
  invalidateListPages,
  invalidateSitemap,
  revalidateByTag,
} from '@/server/cache/invalidation'
import { notificationEventEmitter, NOTIFICATION_EVENTS } from '@/server/notifications/eventEmitter'
import { GamesRepository } from '@/server/repositories/games.repository'
import { gameStatsCache } from '@/server/utils/cache'
import { buildOrderBy, paginate } from '@/server/utils/pagination'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { buildSearchFilter } from '@/server/utils/query-builders'
import {
  validatePagination,
  sanitizeInput,
  validateNonEmptyArray,
} from '@/server/utils/security-validation'
import {
  findTitleIdForGameName,
  getBestTitleIdMatch,
  getSwitchGamesStats,
} from '@/server/utils/switchGameSearch'
import { transactionalBatch } from '@/server/utils/transactions'
import { roleIncludesRole } from '@/utils/permission-system'
import { ApprovalStatus, Role, TrustAction } from '@orm'
import type { Prisma } from '@orm'

const GAME_STATS_CACHE_KEY = 'game-stats'

// Helper function to validate game conflicts
async function validateGameConflicts(
  prisma: Prisma.TransactionClient,
  id: string,
  data: { title?: string; systemId?: string },
  existingGame: { title: string; systemId: string; system: { name: string } },
) {
  // If changing system, check for title conflicts
  if (data.systemId && data.systemId !== existingGame.systemId) {
    const systemConflict = await prisma.game.findFirst({
      where: {
        title: data.title ?? existingGame.title,
        systemId: data.systemId,
        NOT: { id },
      },
      include: { system: true },
    })

    if (systemConflict) {
      return ResourceError.game.alreadyExists(
        data.title ?? existingGame.title,
        systemConflict.system.name,
      )
    }
  }

  // If changing title, check for conflicts within the same system
  if (data.title && data.title !== existingGame.title) {
    const titleConflict = await prisma.game.findFirst({
      where: {
        title: data.title,
        systemId: data.systemId ?? existingGame.systemId,
        NOT: { id },
      },
    })

    if (titleConflict) {
      return ResourceError.game.alreadyExists(data.title, existingGame.system.name)
    }
  }
}

// Helper function to perform the game update
async function performGameUpdate(
  prisma: Prisma.TransactionClient,
  id: string,
  data: Omit<typeof UpdateGameSchema._type, 'id'>,
  existingGame: { title: string; system: { name: string } },
) {
  try {
    return await prisma.game.update({
      where: { id },
      data,
      include: {
        system: true,
        submitter: { select: { id: true, name: true, email: true } },
      },
    })
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
      return ResourceError.game.alreadyExists(
        data.title ?? existingGame.title,
        existingGame.system.name,
      )
    }
    throw error
  }
}

export const gamesRouter = createTRPCRouter({
  get: publicProcedure.input(GetGamesSchema).query(async ({ ctx, input }) => {
    const repository = new GamesRepository(ctx.prisma)

    // Handle backward compatibility for hideGamesWithNoListings
    const effectiveListingFilter =
      input?.listingFilter ?? (input?.hideGamesWithNoListings ? 'withListings' : 'all')

    // Validate pagination
    const { limit } = validatePagination(undefined, input?.limit, 100)

    // For empty search with offset 0, we can optimize by returning fewer results initially
    const effectiveLimit =
      !input?.search && input?.offset === 0 && !input?.page ? Math.min(limit, 50) : limit

    // Sanitize search term (plain text, not markdown)
    const sanitizedSearch = input?.search ? sanitizeInput(input.search) : undefined

    const filters = {
      ...input,
      search: sanitizedSearch,
      listingFilter: effectiveListingFilter,
      limit: effectiveLimit,
      userRole: ctx.session?.user?.role,
      userId: ctx.session?.user?.id,
    }

    return repository.list(filters)
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const cached = gameStatsCache.get(GAME_STATS_CACHE_KEY)
    if (cached) return cached

    const repository = new GamesRepository(ctx.prisma)
    const stats = await repository.stats()

    gameStatsCache.set(GAME_STATS_CACHE_KEY, stats)

    return stats
  }),

  byId: publicProcedure.input(GetGameByIdSchema).query(async ({ ctx, input }) => {
    // Shadow ban logic: Hide listings from banned users for non-moderators
    const userRole = ctx.session?.user?.role
    const canSeeBannedUsers = roleIncludesRole(userRole, Role.MODERATOR)

    // Use repository to get game with built-in filtering
    const repository = new GamesRepository(ctx.prisma)
    const game = await repository.byId(input.id, canSeeBannedUsers)

    if (!game) return ResourceError.game.notFound()

    // Admins and moderators can always see all games
    const isAdmin = roleIncludesRole(ctx.session?.user?.role, Role.ADMIN)

    // For regular users, check NSFW preference
    if (!isAdmin && !ctx.session?.user?.showNsfw && game.isErotic) {
      return ResourceError.game.notFound()
    }

    return game
  }),

  checkExistingByTgdbIds: publicProcedure
    .input(CheckExistingByTgdbIdsSchema)
    .query(async ({ ctx, input }) => {
      // Check both tgdbGameId field and metadata.tgdbId for backward compatibility
      const existingGames = await ctx.prisma.game.findMany({
        where: {
          OR: [
            { tgdbGameId: { in: input.tgdbGameIds } },
            // Check games where metadata contains tgdbId (backward compatibility)
            ...input.tgdbGameIds.map((id) => ({
              metadata: {
                path: ['tgdbId'],
                equals: id,
              },
            })),
          ],
        },
        select: {
          id: true,
          tgdbGameId: true,
          metadata: true,
          title: true,
          system: { select: { name: true } },
        },
      })

      // Return a map for easy lookup using the helper function
      return existingGames.reduce(
        (acc, game) => {
          const tgdbId = getTgdbGameId(game)
          return !tgdbId
            ? acc
            : {
                ...acc,
                [tgdbId]: {
                  id: game.id,
                  title: game.title,
                  systemName: game.system.name,
                },
              }
        },
        {} as Record<number, { id: string; title: string; systemName: string }>,
      )
    }),

  checkExistingByNamesAndSystems: publicProcedure
    .input(CheckExistingByNamesAndSystemsSchema)
    .query(async ({ ctx, input }) => {
      // Build where clause that includes approval status filtering
      const where: Prisma.GameWhereInput = {
        OR: input.games.map((game) => ({
          title: game.name,
          systemId: game.systemId,
        })),
      }

      // Apply same approval logic as the get query
      if (roleIncludesRole(ctx.session?.user?.role, Role.ADMIN)) {
        // Admins can see all games including pending/rejected
      } else if (ctx.session?.user) {
        // Authenticated users see approved games + their own pending games
        where.AND = {
          OR: [
            { status: ApprovalStatus.APPROVED },
            {
              status: ApprovalStatus.PENDING,
              submittedBy: ctx.session.user.id,
            },
          ],
        }
      } else {
        // Public users only see approved games
        where.status = ApprovalStatus.APPROVED
      }

      const existingGames = await ctx.prisma.game.findMany({
        where,
        select: { id: true, title: true, systemId: true },
      })

      // Return a map with composite key for easy lookup
      return existingGames.reduce(
        (acc, game) => {
          const key = `${game.title}_${game.systemId}`
          return { ...acc, [key]: game.id }
        },
        {} as Record<string, string>,
      )
    }),

  create: protectedProcedure.input(CreateGameSchema).mutation(async ({ ctx, input }) => {
    const system = await ctx.prisma.system.findUnique({
      where: { id: input.systemId },
    })

    if (!system) return ResourceError.system.notFound()

    // Check if game with same title already exists for this system
    const existingGame = await ctx.prisma.game.findFirst({
      where: { title: input.title, systemId: input.systemId },
    })

    if (existingGame) {
      // Use AppError.conflict with cause for duplicate game error
      const error = AppError.conflict(
        `A game titled "${input.title}" already exists for the system "${system.name}"`,
      )
      // Add cause information for frontend duplicate handling
      ;(error as Error & { cause?: Record<string, unknown> }).cause = {
        existingGameId: existingGame.id,
        existingGameTitle: existingGame.title,
        systemName: system.name,
      }
      throw error
    }

    const isAuthor = roleIncludesRole(ctx.session.user.role, Role.AUTHOR)

    try {
      const { igdbGameId, ...gameData } = input

      // Build metadata object for external provider IDs
      const metadata = createGameMetadata({
        ...(gameData.tgdbGameId && { tgdbId: gameData.tgdbGameId }),
        ...(igdbGameId && { igdbId: igdbGameId }),
      })

      const result = await ctx.prisma.game.create({
        data: {
          ...gameData,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          status: isAuthor ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
          submittedBy: ctx.session.user.id,
          submittedAt: new Date(),
          ...(isAuthor && {
            approvedBy: ctx.session.user.id,
            approvedAt: new Date(),
          }),
        },
        include: {
          system: true,
          submitter: { select: { id: true, name: true } },
        },
      })

      // Invalidate cache when new game is created
      gameStatsCache.delete(GAME_STATS_CACHE_KEY)

      // Queue SEO cache invalidation (non-blocking)
      if (result.status === ApprovalStatus.APPROVED) {
        Promise.all([
          invalidateListPages(),
          invalidateSitemap(),
          revalidateByTag('games'),
          revalidateByTag(`system-${input.systemId}`),
        ]).catch((error) => {
          console.error('[Games Router] Cache invalidation failed:', error)
        })
      }

      return result
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
        return ResourceError.game.alreadyExists(input.title, system.name)
      }
      throw error
    }
  }),

  update: editGamesProcedure.input(UpdateGameSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input

    // Check if game exists
    const existingGame = await ctx.prisma.game.findUnique({
      where: { id },
      include: { system: true },
    })

    if (!existingGame) return ResourceError.game.notFound()

    await validateGameConflicts(ctx.prisma, id, data, existingGame!)

    const result = await performGameUpdate(ctx.prisma, id, data, existingGame!)

    // Queue SEO cache invalidation (non-blocking)
    Promise.all([
      invalidateGame(id),
      invalidateListPages(),
      revalidateByTag('games'),
      revalidateByTag(`game-${id}`),
      revalidateByTag(`system-${result.systemId}`),
    ]).catch((error) => {
      console.error('[Games Router] Cache invalidation failed after update:', error)
    })

    return result
  }),

  updateOwnPendingGame: protectedProcedure
    .input(UpdateGameSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if game exists and user owns it
      const existingGame = await ctx.prisma.game.findUnique({
        where: { id },
        include: { system: true },
      })

      if (!existingGame) return ResourceError.game.notFound()

      // Verify ownership and pending status
      if (existingGame!.submittedBy !== ctx.session.user.id) {
        return ResourceError.game.canOnlyEditOwn()
      }

      if (existingGame!.status !== ApprovalStatus.PENDING) {
        return ResourceError.game.canOnlyEditPending()
      }

      await validateGameConflicts(ctx.prisma, id, data, existingGame!)

      const result = await performGameUpdate(ctx.prisma, id, data, existingGame!)

      // Queue SEO cache invalidation (non-blocking)
      Promise.all([
        invalidateGame(id),
        invalidateListPages(),
        revalidateByTag('games'),
        revalidateByTag(`game-${id}`),
        revalidateByTag(`system-${result.systemId}`),
      ]).catch((error) => {
        console.error('[Games Router] Cache invalidation failed after update:', error)
      })

      return result
    }),

  delete: deleteGamesProcedure.input(DeleteGameSchema).mutation(async ({ ctx, input }) => {
    const game = await ctx.prisma.game.findUnique({
      where: { id: input.id },
      include: { listings: true },
    })

    if (!game) return ResourceError.game.notFound()

    if (game.listings.length > 0) {
      return ResourceError.game.inUse(game.listings.length)
    }

    try {
      const result = await ctx.prisma.game.delete({
        where: { id: input.id },
      })

      // Invalidate cache when game is deleted
      gameStatsCache.delete(GAME_STATS_CACHE_KEY)

      return result
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION)) {
        return ResourceError.game.inUse(0)
      }
      throw error
    }
  }),

  // endpoints for an approval system
  getPendingGames: approveGamesProcedure
    .input(GetPendingGamesSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        limit = 20,
        offset = 0,
        page,
        sortField = 'submittedAt',
        sortDirection = 'desc',
      } = input ?? {}

      const where: Prisma.GameWhereInput = { status: ApprovalStatus.PENDING }

      const searchConditions = buildSearchFilter(search, ['title', 'system.name', 'submitter.name'])
      if (searchConditions) where.OR = searchConditions

      const sortConfig = {
        title: (dir: 'asc' | 'desc') => ({ title: dir }),
        submittedAt: (dir: 'asc' | 'desc') => ({ submittedAt: dir }),
        'system.name': (dir: 'asc' | 'desc') => ({ system: { name: dir } }),
      }

      const orderBy = buildOrderBy<Prisma.GameOrderByWithRelationInput>(
        sortConfig,
        sortField,
        sortDirection,
        { submittedAt: 'desc' },
      )

      const actualOffset = page ? (page - 1) * limit : (offset ?? 0)

      const [total, games] = await Promise.all([
        ctx.prisma.game.count({ where }),
        ctx.prisma.game.findMany({
          where,
          select: {
            id: true,
            title: true,
            systemId: true,
            imageUrl: true,
            boxartUrl: true,
            bannerUrl: true,
            tgdbGameId: true,
            metadata: true,
            isErotic: true,
            status: true,
            submittedBy: true,
            submittedAt: true,
            approvedBy: true,
            approvedAt: true,
            createdAt: true,
            system: {
              select: { id: true, name: true, key: true, tgdbPlatformId: true },
            },
            submitter: {
              select: { id: true, name: true, email: true, profileImage: true },
            },
            approver: {
              select: { id: true, name: true, email: true, profileImage: true },
            },
          },
          orderBy: orderBy as Prisma.GameOrderByWithRelationInput,
          skip: actualOffset,
          take: limit,
        }),
      ])

      const pagination = paginate({
        total: total,
        page: page ?? Math.floor(actualOffset / limit) + 1,
        limit: limit,
      })

      return { games, pagination }
    }),

  approveGame: approveGamesProcedure.input(ApproveGameSchema).mutation(async ({ ctx, input }) => {
    const { id, status } = input

    const game = await ctx.prisma.game.findUnique({ where: { id } })

    if (!game) return ResourceError.game.notFound()

    if (game.status !== ApprovalStatus.PENDING) {
      return ResourceError.game.alreadyProcessed()
    }

    const result = await ctx.prisma.$transaction(async (tx) => {
      const updatedGame = await tx.game.update({
        where: { id },
        data: {
          status: status as ApprovalStatus,
          approvedBy: ctx.session.user.id,
          approvedAt: new Date(),
        },
        include: {
          system: true,
          submitter: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
        },
      })

      // Award trust points to the game submitter
      if (game.submittedBy) {
        const trustService = new TrustService(tx)

        if (status === ApprovalStatus.APPROVED) {
          await trustService.logAction({
            userId: game.submittedBy,
            action: TrustAction.GAME_SUBMISSION_APPROVED,
            metadata: {
              gameId: id,
              gameTitle: updatedGame.title,
              systemId: updatedGame.systemId,
              approvedBy: ctx.session.user.id,
            },
          })
        } else if (status === ApprovalStatus.REJECTED) {
          await trustService.logAction({
            userId: game.submittedBy,
            action: TrustAction.GAME_SUBMISSION_REJECTED,
            metadata: {
              gameId: id,
              gameTitle: updatedGame.title,
              systemId: updatedGame.systemId,
              rejectedBy: ctx.session.user.id,
            },
          })
        }
      }

      return updatedGame
    })

    // Invalidate cache when game status changes
    gameStatsCache.delete(GAME_STATS_CACHE_KEY)

    // Invalidate SEO cache
    await invalidateGameRelatedContent(id)
    if (status === ApprovalStatus.APPROVED) {
      await invalidateSitemap()
      await revalidateByTag('games')
      await revalidateByTag(`game-${id}`)
      await revalidateByTag(`system-${game.systemId}`)
    }

    return result
  }),

  bulkApproveGames: approveGamesProcedure
    .input(BulkApproveGamesSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameIds } = input
      const adminUserId = ctx.session.user.id

      // Validate array is not empty
      validateNonEmptyArray(gameIds, 'gameIds')

      // First validate games exist and are pending
      const gamesToApprove = await ctx.prisma.game.findMany({
        where: {
          id: { in: gameIds },
          status: ApprovalStatus.PENDING,
        },
      })

      if (gamesToApprove.length === 0) {
        return AppError.badRequest('No valid pending games found to approve')
      }

      await transactionalBatch(ctx.prisma, [
        {
          name: 'approve-games',
          execute: async (tx) => {
            const result = await tx.game.updateMany({
              where: { id: { in: gameIds }, status: ApprovalStatus.PENDING },
              data: {
                status: ApprovalStatus.APPROVED,
                approvedBy: adminUserId,
                approvedAt: new Date(),
              },
            })

            // Award trust points to submitters
            const trustService = new TrustService(tx)
            for (const game of gamesToApprove) {
              if (game.submittedBy) {
                await trustService.logAction({
                  userId: game.submittedBy,
                  action: TrustAction.GAME_SUBMISSION_APPROVED,
                  metadata: {
                    gameId: game.id,
                    gameTitle: game.title,
                    systemId: game.systemId,
                    approvedBy: adminUserId,
                    bulkOperation: true,
                  },
                })
              }
            }

            return result
          },
        },
        {
          name: 'clear-cache',
          execute: async () => {
            gameStatsCache.delete(GAME_STATS_CACHE_KEY)
            return Promise.resolve()
          },
        },
      ])
      Promise.all([
        ...gameIds.map((id) => invalidateGameRelatedContent(id)),
        ...gameIds.map((id) => revalidateByTag(`game-${id}`)),
        invalidateSitemap(),
        revalidateByTag('games'),
      ]).catch((error) => {
        console.error('[Games Router] Cache invalidation failed:', error)
      })

      return {
        success: true,
        approvedCount: gamesToApprove.length,
        message: `Successfully approved ${gamesToApprove.length} game(s)`,
      }
    }),

  bulkRejectGames: approveGamesProcedure
    .input(BulkRejectGamesSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameIds } = input
      const adminUserId = ctx.session.user.id

      // Validate array is not empty
      validateNonEmptyArray(gameIds, 'gameIds')

      return ctx.prisma.$transaction(async (tx) => {
        // Get all games to reject and verify they are pending
        const gamesToReject = await tx.game.findMany({
          where: { id: { in: gameIds }, status: ApprovalStatus.PENDING },
        })

        if (gamesToReject.length === 0) {
          return AppError.badRequest('No valid pending games found to reject')
        }

        // Reject all games to
        await tx.game.updateMany({
          where: { id: { in: gamesToReject.map((g) => g.id) } },
          data: {
            status: ApprovalStatus.REJECTED,
            approvedBy: adminUserId,
            approvedAt: new Date(),
            // TODO: Add rejectionNotes
            // Note: There's no rejectionNotes field in the schema, we should add it
          },
        })

        // Apply trust penalties to submitters
        const trustService = new TrustService(tx)
        for (const game of gamesToReject) {
          if (game.submittedBy) {
            await trustService.logAction({
              userId: game.submittedBy,
              action: TrustAction.GAME_SUBMISSION_REJECTED,
              metadata: {
                gameId: game.id,
                gameTitle: game.title,
                systemId: game.systemId,
                rejectedBy: adminUserId,
                bulkOperation: true,
              },
            })
          }
        }

        // Invalidate cache
        gameStatsCache.delete(GAME_STATS_CACHE_KEY)

        return {
          success: true,
          rejectedCount: gamesToReject.length,
          message: `Successfully rejected ${gamesToReject.length} game(s)`,
        }
      })
    }),

  // Nintendo Switch Title ID lookup endpoints
  findSwitchTitleId: publicProcedure.input(FindSwitchTitleIdSchema).query(async ({ input }) => {
    const { gameName, maxResults } = input

    try {
      const results = await findTitleIdForGameName(gameName, maxResults)
      return {
        success: true,
        results,
        query: gameName,
        totalResults: results.length,
      }
    } catch (error) {
      console.error('Error finding Switch title ID:', error)
      return AppError.internalError('Failed to search for Switch title ID')
    }
  }),

  getBestSwitchTitleId: publicProcedure
    .input(GetBestSwitchTitleIdSchema)
    .query(async ({ input }) => {
      const { gameName } = input

      try {
        const titleId = await getBestTitleIdMatch(gameName)
        return {
          success: true,
          titleId,
          query: gameName,
          found: titleId !== null,
        }
      } catch (error) {
        console.error('Error getting Switch title ID match:', error)
        return AppError.internalError('Failed to find Switch title ID match')
      }
    }),

  getSwitchGamesStats: publicProcedure.input(GetSwitchGamesStatsSchema).query(async () => {
    try {
      const stats = await getSwitchGamesStats()
      return {
        success: true,
        ...stats,
      }
    } catch (error) {
      console.error('Error getting Switch games stats:', error)
      return AppError.internalError('Failed to get Switch games statistics')
    }
  }),

  // SUPER_ADMIN only: Override game status regardless of current state
  overrideStatus: superAdminProcedure
    .input(OverrideGameStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameId, newStatus, overrideNotes } = input
      const superAdminUserId = ctx.session.user.id

      const gameToOverride = await ctx.prisma.game.findUnique({
        where: { id: gameId },
      })

      if (!gameToOverride) return ResourceError.game.notFound()

      const updatedGame = await ctx.prisma.game.update({
        where: { id: gameId },
        data: {
          status: newStatus,
          approvedBy: superAdminUserId,
          approvedAt: new Date(),
        },
        include: {
          system: true,
          submitter: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
        },
      })

      // Invalidate cache when game status changes
      gameStatsCache.delete(GAME_STATS_CACHE_KEY)

      // Invalidate SEO cache
      await invalidateGameRelatedContent(gameId)
      if (newStatus === ApprovalStatus.APPROVED) {
        await invalidateSitemap()
        await revalidateByTag('games')
        await revalidateByTag(`game-${gameId}`)
        await revalidateByTag(`system-${gameToOverride.systemId}`)
      }

      // Emit notification event for game status override
      if (gameToOverride.submittedBy) {
        notificationEventEmitter.emitNotificationEvent({
          eventType: NOTIFICATION_EVENTS.GAME_STATUS_OVERRIDDEN,
          entityType: 'game',
          entityId: gameId,
          triggeredBy: superAdminUserId,
          payload: {
            gameId,
            overriddenBy: superAdminUserId,
            overriddenAt: updatedGame.approvedAt,
            newStatus,
            overrideNotes,
          },
        })
      }

      return {
        ...updatedGame,
        overrideNotes,
      }
    }),

  // ADMIN and SUPER_ADMIN: Update game status (same as override but with role check)
  updateStatus: approveGamesProcedure
    .input(OverrideGameStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameId, newStatus, overrideNotes } = input
      const adminUserId = ctx.session.user.id

      const gameToUpdate = await ctx.prisma.game.findUnique({
        where: { id: gameId },
      })

      if (!gameToUpdate) return ResourceError.game.notFound()

      const updatedGame = await ctx.prisma.game.update({
        where: { id: gameId },
        data: {
          status: newStatus,
          approvedBy: adminUserId,
          approvedAt: new Date(),
        },
        include: {
          system: true,
          submitter: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
        },
      })

      // Invalidate cache when game status changes
      gameStatsCache.delete(GAME_STATS_CACHE_KEY)

      // Invalidate SEO cache
      await invalidateGameRelatedContent(gameId)
      if (newStatus === ApprovalStatus.APPROVED) {
        await invalidateSitemap()
        await revalidateByTag('games')
        await revalidateByTag(`game-${gameId}`)
        await revalidateByTag(`system-${gameToUpdate.systemId}`)
      }

      return {
        ...updatedGame,
        notes: overrideNotes,
      }
    }),
})
