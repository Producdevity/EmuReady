import { AppError, ResourceError } from '@/lib/errors'
import {
  ApproveGameSchema,
  CheckExistingByTgdbIdsSchema,
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
import {
  adminProcedure,
  createTRPCRouter,
  moderatorProcedure,
  protectedProcedure,
  publicProcedure,
  superAdminProcedure,
} from '@/server/api/trpc'
import {
  invalidateGame,
  invalidateGameRelatedContent,
  invalidateListPages,
  invalidateSitemap,
} from '@/server/cache/invalidation'
import {
  notificationEventEmitter,
  NOTIFICATION_EVENTS,
} from '@/server/notifications/eventEmitter'
import { gameStatsCache } from '@/server/utils/cache'
import {
  calculateOffset,
  createPaginationResult,
  buildOrderBy,
} from '@/server/utils/pagination'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import {
  createCountQuery,
  analyzeQueryComplexity,
} from '@/server/utils/query-performance'
import {
  findTitleIdForGameName,
  getBestTitleIdMatch,
  getSwitchGamesStats,
} from '@/server/utils/switchGameSearch'
import { roleIncludesRole } from '@/utils/permission-system'
import { hasPermission } from '@/utils/permissions'
import { ApprovalStatus, Role } from '@orm'
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
      ResourceError.game.alreadyExists(data.title, existingGame.system.name)
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
      ResourceError.game.alreadyExists(
        data.title ?? existingGame.title,
        existingGame.system.name,
      )
    }
    throw error
  }
}

export const gamesRouter = createTRPCRouter({
  get: publicProcedure.input(GetGamesSchema).query(async ({ ctx, input }) => {
    const {
      systemId,
      search,
      status,
      submittedBy,
      hideGamesWithNoListings = false,
      listingFilter = 'withListings',
      limit = 100,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = input ?? {}

    // Build where clause with optimized search pattern
    let where: Prisma.GameWhereInput = {
      ...(systemId ? { systemId } : {}),
    }

    // Handle listing filter - use listingFilter if provided, otherwise fall back to hideGamesWithNoListings for backward compatibility
    if (
      listingFilter === 'withListings' ||
      (listingFilter === undefined && hideGamesWithNoListings)
    ) {
      where.listings = { some: {} }
    } else if (listingFilter === 'noListings') {
      where.listings = { none: {} }
    }
    // If listingFilter === 'all', no additional filter is needed

    // Handle game approval status filtering
    if (hasPermission(ctx.session?.user?.role, Role.ADMIN)) {
      // Admins can see all games
      if (status) where.status = status
      if (submittedBy) where.submittedBy = submittedBy
    } else if (ctx.session?.user) {
      // Authenticated users see approved games + their own pending games
      if (status === ApprovalStatus.PENDING) {
        where = {
          ...where,
          status: ApprovalStatus.PENDING,
          submittedBy: ctx.session.user.id,
        }
      } else {
        where = {
          ...where,
          OR: [
            { status: ApprovalStatus.APPROVED },
            {
              status: ApprovalStatus.PENDING,
              submittedBy: ctx.session.user.id,
            },
          ],
        }
      }
    } else {
      // Public users only see approved games
      where.status = ApprovalStatus.APPROVED
    }

    if (search) {
      const searchTerm = search.trim()

      // For multi-word searches, we use a more sophisticated approach
      if (searchTerm.includes(' ')) {
        where = {
          ...where,
          AND: [
            {
              AND: searchTerm
                .split(/\s+/)
                .filter((word) => word.length >= 2)
                .map((word) => ({
                  title: { contains: word, mode: 'insensitive' },
                })),
            },
          ],
        }
      } else {
        // For single words, a simple contains is sufficient
        where = {
          ...where,
          title: { contains: searchTerm, mode: 'insensitive' },
        }
      }
    }

    const sortConfig = {
      title: (dir: 'asc' | 'desc') => ({ title: dir }),
      'system.name': (dir: 'asc' | 'desc') => ({ system: { name: dir } }),
      listingsCount: (dir: 'asc' | 'desc') => ({ listings: { _count: dir } }),
      submittedAt: (dir: 'asc' | 'desc') => ({ submittedAt: dir }),
      status: (dir: 'asc' | 'desc') => ({ status: dir }),
    }

    const orderBy = buildOrderBy(sortConfig, sortField, sortDirection, {
      title: 'asc',
    })

    // For empty search with offset 0, we can optimize by returning fewer results initially
    const effectiveLimit =
      !search && offset === 0 && !page ? Math.min(limit, 50) : limit

    // Calculate actual offset
    const actualOffset = calculateOffset(
      { limit: effectiveLimit, offset, page },
      effectiveLimit,
    )

    // Execute count and findMany in parallel
    const [total, games] = await Promise.all([
      createCountQuery(ctx.prisma.game, where),
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
          isErotic: true,
          status: true,
          submittedBy: true,
          submittedAt: true,
          approvedBy: true,
          approvedAt: true,
          createdAt: true,
          system: { select: { id: true, name: true } },
          submitter: hasPermission(ctx.session?.user?.role, Role.ADMIN)
            ? { select: { id: true, name: true, email: true } }
            : false,
          _count: { select: { listings: true, pcListings: true } },
        },
        orderBy: orderBy as Prisma.GameOrderByWithRelationInput,
        skip: actualOffset,
        take: effectiveLimit,
      }),
    ])

    // Create pagination result
    const pagination = createPaginationResult(
      total,
      { limit: effectiveLimit, offset, page },
      effectiveLimit,
      actualOffset,
    )

    return {
      games,
      pagination,
    }
  }),

  getStats: moderatorProcedure.query(async ({ ctx }) => {
    const cached = gameStatsCache.get(GAME_STATS_CACHE_KEY)
    if (cached) return cached

    const [pending, approved, rejected] = await Promise.all([
      createCountQuery(ctx.prisma.game, { status: ApprovalStatus.PENDING }),
      createCountQuery(ctx.prisma.game, { status: ApprovalStatus.APPROVED }),
      createCountQuery(ctx.prisma.game, { status: ApprovalStatus.REJECTED }),
    ])

    const stats = {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    }

    gameStatsCache.set(GAME_STATS_CACHE_KEY, stats)

    return stats
  }),

  byId: publicProcedure
    .input(GetGameByIdSchema)
    .query(async ({ ctx, input }) => {
      // Shadow ban logic: Hide listings from banned users for non-moderators
      const userRole = ctx.session?.user?.role
      const canSeeBannedUsers = roleIncludesRole(userRole, Role.MODERATOR)

      // Build the listings where clause with shadow ban filtering and approval status
      const listingsWhere: Prisma.ListingWhereInput = {}

      // Build the PC listings where clause with shadow ban filtering and approval status
      const pcListingsWhere: Prisma.PcListingWhereInput = {}

      // CRITICAL: Filter by approval status - REJECTED listings should NEVER be visible to regular users
      if (canSeeBannedUsers) {
        // Moderators can see all statuses including rejected
        // No additional filtering needed for approval status
      } else {
        // Regular users can ONLY see approved listings
        listingsWhere.status = ApprovalStatus.APPROVED
        pcListingsWhere.status = ApprovalStatus.APPROVED
      }

      if (!canSeeBannedUsers) {
        // For regular users, exclude listings from banned users
        listingsWhere.author = {
          userBans: {
            none: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        }
        pcListingsWhere.author = {
          userBans: {
            none: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        }
      }

      // Define include configuration for reusability and complexity analysis
      const includeConfig = {
        submitter: { select: { id: true, name: true } },
        system: { include: { emulators: true } },
        listings: {
          where: listingsWhere,
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true,
            deviceId: true,
            gameId: true,
            emulatorId: true,
            performanceId: true,
            authorId: true,
            processedAt: true,
            processedNotes: true,
            processedByUserId: true,
            device: {
              select: {
                id: true,
                modelName: true,
                brand: { select: { id: true, name: true } },
              },
            },
            emulator: {
              select: {
                id: true,
                name: true,
                logo: true,
                description: true,
                repositoryUrl: true,
                officialUrl: true,
              },
            },
            performance: {
              select: {
                id: true,
                label: true,
                rank: true,
                description: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
                ...(canSeeBannedUsers && { email: true }),
                ...(canSeeBannedUsers && {
                  userBans: {
                    where: {
                      isActive: true,
                      OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                      ],
                    },
                    select: { id: true },
                  },
                }),
              },
            },
            _count: { select: { votes: true, comments: true } },
          },
          orderBy: { createdAt: 'desc' as const },
        },
        pcListings: {
          where: pcListingsWhere,
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true,
            gameId: true,
            authorId: true,
            processedAt: true,
            processedNotes: true,
            processedByUserId: true,
            performance: {
              select: {
                id: true,
                label: true,
                rank: true,
                description: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
                ...(canSeeBannedUsers && { email: true }),
                ...(canSeeBannedUsers && {
                  userBans: {
                    where: {
                      isActive: true,
                      OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                      ],
                    },
                    select: { id: true },
                  },
                }),
              },
            },
            _count: { select: { votes: true, comments: true } },
          },
          orderBy: { createdAt: 'desc' as const },
        },
      }

      // Analyze query complexity for performance monitoring
      const complexity = analyzeQueryComplexity(includeConfig)
      if (complexity.complexity === 'high') {
        console.warn(
          `[Games Router] High complexity query detected for game ${input.id}:`,
          complexity.warnings,
        )
      }

      const game = await ctx.prisma.game.findUnique({
        where: { id: input.id },
        include: includeConfig,
      })
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
      const existingGames = await ctx.prisma.game.findMany({
        where: { tgdbGameId: { in: input.tgdbGameIds } },
        select: {
          id: true,
          tgdbGameId: true,
          title: true,
          system: { select: { name: true } },
        },
      })

      // Return a map for easy lookup
      return existingGames.reduce(
        (acc, game) => {
          return !game.tgdbGameId
            ? acc
            : {
                ...acc,
                [game.tgdbGameId]: {
                  id: game.id,
                  title: game.title,
                  systemName: game.system.name,
                },
              }
        },
        {} as Record<number, { id: string; title: string; systemName: string }>,
      )
    }),

  create: protectedProcedure
    .input(CreateGameSchema)
    .mutation(async ({ ctx, input }) => {
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
          `A game titled "${input.title}" already exists for the system "${system!.name}"`,
        )
        // Add cause information for frontend duplicate handling
        ;(error as Error & { cause?: Record<string, unknown> }).cause = {
          existingGameId: existingGame.id,
          existingGameTitle: existingGame.title,
          systemName: system!.name,
        }
        throw error
      }

      const isAuthor = hasPermission(ctx.session.user.role, Role.AUTHOR)

      try {
        const result = await ctx.prisma.game.create({
          data: {
            ...input,
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
          Promise.all([invalidateListPages(), invalidateSitemap()]).catch(
            (error) => {
              console.error('[Games Router] Cache invalidation failed:', error)
            },
          )
        }

        return result
      } catch (error) {
        if (
          isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)
        ) {
          return ResourceError.game.alreadyExists(input.title, system!.name)
        }
        throw error
      }
    }),

  update: moderatorProcedure
    .input(UpdateGameSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if game exists
      const existingGame = await ctx.prisma.game.findUnique({
        where: { id },
        include: { system: true },
      })

      if (!existingGame) ResourceError.game.notFound()

      await validateGameConflicts(ctx.prisma, id, data, existingGame!)

      const result = await performGameUpdate(
        ctx.prisma,
        id,
        data,
        existingGame!,
      )

      // Queue SEO cache invalidation (non-blocking)
      Promise.all([invalidateGame(id), invalidateListPages()]).catch(
        (error) => {
          console.error(
            '[Games Router] Cache invalidation failed after update:',
            error,
          )
        },
      )

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

      if (!existingGame) ResourceError.game.notFound()

      // Verify ownership and pending status
      if (existingGame!.submittedBy !== ctx.session.user.id) {
        AppError.forbidden('You can only edit your own games')
      }

      if (existingGame!.status !== ApprovalStatus.PENDING) {
        AppError.forbidden('You can only edit pending games')
      }

      await validateGameConflicts(ctx.prisma, id, data, existingGame!)

      const result = await performGameUpdate(
        ctx.prisma,
        id,
        data,
        existingGame!,
      )

      // Queue SEO cache invalidation (non-blocking)
      Promise.all([invalidateGame(id), invalidateListPages()]).catch(
        (error) => {
          console.error(
            '[Games Router] Cache invalidation failed after update:',
            error,
          )
        },
      )

      return result
    }),

  delete: adminProcedure
    .input(DeleteGameSchema)
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.prisma.game.findUnique({
        where: { id: input.id },
        include: {
          listings: true,
        },
      })

      if (!game) ResourceError.game.notFound()

      if (game!.listings.length > 0) {
        ResourceError.game.inUse(game!.listings.length)
      }

      try {
        const result = await ctx.prisma.game.delete({
          where: { id: input.id },
        })

        // Invalidate cache when game is deleted
        gameStatsCache.delete(GAME_STATS_CACHE_KEY)

        return result
      } catch (error) {
        if (
          isPrismaError(
            error,
            PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION,
          )
        ) {
          ResourceError.game.inUse(0)
        }
        throw error
      }
    }),

  // endpoints for an approval system
  getPendingGames: moderatorProcedure
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

      const where: Prisma.GameWhereInput = {
        status: ApprovalStatus.PENDING,
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { system: { name: { contains: search, mode: 'insensitive' } } },
          { submitter: { name: { contains: search, mode: 'insensitive' } } },
        ]
      }

      const sortConfig = {
        title: (dir: 'asc' | 'desc') => ({ title: dir }),
        submittedAt: (dir: 'asc' | 'desc') => ({ submittedAt: dir }),
        'system.name': (dir: 'asc' | 'desc') => ({ system: { name: dir } }),
      }

      const orderBy = buildOrderBy(sortConfig, sortField, sortDirection, {
        submittedAt: 'desc',
      })

      const actualOffset = calculateOffset({ limit, offset, page }, limit)

      const [total, games] = await Promise.all([
        createCountQuery(ctx.prisma.game, where),
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

      const pagination = createPaginationResult(
        total,
        { limit, offset, page },
        limit,
        actualOffset,
      )

      return {
        games,
        pagination,
      }
    }),

  approveGame: moderatorProcedure
    .input(ApproveGameSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input

      const game = await ctx.prisma.game.findUnique({ where: { id } })

      if (!game) return ResourceError.game.notFound()

      if (game.status !== ApprovalStatus.PENDING) {
        return ResourceError.game.alreadyProcessed()
      }

      const result = await ctx.prisma.$transaction(
        async (tx) =>
          await tx.game.update({
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
          }),
      )

      // Invalidate cache when game status changes
      gameStatsCache.delete(GAME_STATS_CACHE_KEY)

      // Invalidate SEO cache
      await invalidateGameRelatedContent(id)
      if (status === ApprovalStatus.APPROVED) {
        await invalidateSitemap()
      }

      return result
    }),

  bulkApproveGames: moderatorProcedure
    .input(BulkApproveGamesSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameIds } = input
      const adminUserId = ctx.session.user.id

      // First validate games exist and are pending
      const gamesToApprove = await ctx.prisma.game.findMany({
        where: {
          id: { in: gameIds },
          status: ApprovalStatus.PENDING,
        },
      })

      if (gamesToApprove.length === 0) {
        throw AppError.badRequest('No valid pending games found to approve')
      }

      // Then approve them in a transaction
      await ctx.prisma.game.updateMany({
        where: { id: { in: gameIds }, status: ApprovalStatus.PENDING },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedBy: adminUserId,
          approvedAt: new Date(),
        },
      })

      // Cache invalidation after successful approval
      gameStatsCache.delete(GAME_STATS_CACHE_KEY)
      // Non-blocking cache invalidation
      Promise.all([
        ...gameIds.map((id) => invalidateGameRelatedContent(id)),
        invalidateSitemap(),
      ]).catch((error) => {
        console.error('[Games Router] Cache invalidation failed:', error)
      })

      return {
        success: true,
        approvedCount: gamesToApprove.length,
        message: `Successfully approved ${gamesToApprove.length} game(s)`,
      }
    }),

  bulkRejectGames: moderatorProcedure
    .input(BulkRejectGamesSchema)
    .mutation(async ({ ctx, input }) => {
      const { gameIds } = input
      const adminUserId = ctx.session.user.id

      return ctx.prisma.$transaction(async (tx) => {
        // Get all games to reject and verify they are pending
        const gamesToReject = await tx.game.findMany({
          where: {
            id: { in: gameIds },
            status: ApprovalStatus.PENDING,
          },
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
  findSwitchTitleId: publicProcedure
    .input(FindSwitchTitleIdSchema)
    .query(async ({ input }) => {
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

  getSwitchGamesStats: publicProcedure
    .input(GetSwitchGamesStatsSchema)
    .query(async () => {
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
        overrideNotes, // Include the notes in the response
      }
    }),

  // ADMIN and SUPER_ADMIN: Update game status (same as override but with role check)
  updateStatus: adminProcedure
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
      }

      return {
        ...updatedGame,
        notes: overrideNotes,
      }
    }),
})
