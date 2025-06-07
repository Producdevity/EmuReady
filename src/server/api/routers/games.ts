import { AppError, ResourceError } from '@/lib/errors'
import {
  ApproveGameSchema,
  CreateGameSchema,
  DeleteGameSchema,
  GetGameByIdSchema,
  GetGamesSchema,
  GetPendingGamesSchema,
  UpdateGameSchema,
} from '@/schemas/game'

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import type { Prisma } from '@orm'
import { ApprovalStatus, Role } from '@orm'
import { hasPermission } from '@/utils/permissions'

// Simple in-memory cache for game statistics
interface GameStatsCache {
  data: {
    pending: number
    approved: number
    rejected: number
    total: number
  } | null
  timestamp: number
}

const gameStatsCache: GameStatsCache = {
  data: null,
  timestamp: 0,
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedGameStats() {
  const now = Date.now()
  if (gameStatsCache.data && now - gameStatsCache.timestamp < CACHE_TTL) {
    return gameStatsCache.data
  }
  return null
}

function setCachedGameStats(stats: GameStatsCache['data']) {
  gameStatsCache.data = stats
  gameStatsCache.timestamp = Date.now()
}

function invalidateGameStatsCache() {
  gameStatsCache.data = null
  gameStatsCache.timestamp = 0
}

export const gamesRouter = createTRPCRouter({
  get: publicProcedure.input(GetGamesSchema).query(async ({ ctx, input }) => {
    const {
      systemId,
      search,
      status,
      submittedBy,
      limit = 100,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = input ?? {}

    // Calculate offset from page if provided
    const actualOffset = page ? (page - 1) * limit : offset

    // Build where clause with optimized search pattern
    let where: Prisma.GameWhereInput = {
      ...(systemId ? { systemId } : {}),
    }

    // Handle game approval status filtering
    if (hasPermission(ctx.session?.user?.role, Role.ADMIN)) {
      // Admins can see all games
      if (status) {
        where.status = status
      }
      if (submittedBy) {
        where.submittedBy = submittedBy
      }
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
                  title: {
                    contains: word,
                    mode: 'insensitive',
                  },
                })),
            },
          ],
        }
      } else {
        // For single words, a simple contains is sufficient
        where = {
          ...where,
          title: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        }
      }
    }

    // Build orderBy based on sortField and sortDirection
    const orderBy: Prisma.GameOrderByWithRelationInput[] = []

    if (sortField && sortDirection) {
      switch (sortField) {
        case 'title':
          orderBy.push({ title: sortDirection })
          break
        case 'system.name':
          orderBy.push({ system: { name: sortDirection } })
          break
        case 'listingsCount':
          orderBy.push({ listings: { _count: sortDirection } })
          break
        case 'submittedAt':
          orderBy.push({ submittedAt: sortDirection })
          break
        case 'status':
          orderBy.push({ status: sortDirection })
          break
      }
    }

    // Default ordering if no sort specified
    if (!orderBy.length) {
      orderBy.push({ title: 'asc' })
    }

    // For empty search with offset 0, we can optimize by returning fewer results initially
    const effectiveLimit =
      !search && actualOffset === 0 ? Math.min(limit, 50) : limit

    // Always run count query for consistent pagination
    const total = await ctx.prisma.game.count({ where })

    // Get games with optimized query - only include essential fields for performance
    const gamesQuery = ctx.prisma.game.findMany({
      where,
      select: {
        id: true,
        title: true,
        systemId: true,
        imageUrl: true,
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
        _count: {
          select: {
            listings: true,
          },
        },
      },
      orderBy,
      skip: actualOffset,
      take: effectiveLimit,
    })

    const games = await gamesQuery

    return {
      games,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: page ?? Math.floor(actualOffset / limit) + 1,
        offset: actualOffset,
        limit: effectiveLimit,
      },
    }
  }),

  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, approved, pending, rejected] = await Promise.all([
      ctx.prisma.game.count(),
      ctx.prisma.game.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.game.count({ where: { status: ApprovalStatus.PENDING } }),
      ctx.prisma.game.count({ where: { status: ApprovalStatus.REJECTED } }),
    ])

    return {
      total,
      approved,
      pending,
      rejected,
    }
  }),

  byId: publicProcedure
    .input(GetGameByIdSchema)
    .query(async ({ ctx, input }) => {
      const game = await ctx.prisma.game.findUnique({
        where: { id: input.id },
        include: {
          system: {
            include: {
              emulators: true,
            },
          },
          listings: {
            include: {
              device: {
                include: {
                  brand: true,
                },
              },
              emulator: true,
              performance: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  votes: true,
                  comments: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      if (!game) ResourceError.game.notFound()

      return game
    }),

  create: protectedProcedure
    .input(CreateGameSchema)
    .mutation(async ({ ctx, input }) => {
      const system = await ctx.prisma.system.findUnique({
        where: { id: input.systemId },
      })

      if (!system) ResourceError.system.notFound()

      // Check if game with same title already exists for this system
      const existingGame = await ctx.prisma.game.findFirst({
        where: {
          title: input.title,
          systemId: input.systemId,
        },
      })

      if (existingGame) {
        ResourceError.game.alreadyExists(input.title, system!.name)
      }

      const isAdmin = hasPermission(ctx.session.user.role, Role.ADMIN)

      try {
        const result = await ctx.prisma.game.create({
          data: {
            ...input,
            status: isAdmin ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
            submittedBy: ctx.session.user.id,
            submittedAt: new Date(),
            ...(isAdmin && {
              approvedBy: ctx.session.user.id,
              approvedAt: new Date(),
            }),
          },
          include: {
            system: true,
            submitter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        // Invalidate cache when new game is created
        invalidateGameStatsCache()

        return result
      } catch (error) {
        if (
          isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)
        ) {
          ResourceError.game.alreadyExists(input.title, system!.name)
        }
        throw error
      }
    }),

  update: adminProcedure
    .input(UpdateGameSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check if game exists
      const existingGame = await ctx.prisma.game.findUnique({
        where: { id },
        include: { system: true },
      })

      if (!existingGame) ResourceError.game.notFound()

      // If changing system, check for title conflicts
      if (data.systemId && data.systemId !== existingGame!.systemId) {
        const systemConflict = await ctx.prisma.game.findFirst({
          where: {
            title: data.title || existingGame!.title,
            systemId: data.systemId,
            NOT: { id },
          },
          include: { system: true },
        })

        if (systemConflict) {
          ResourceError.game.alreadyExists(
            data.title || existingGame!.title,
            systemConflict.system.name,
          )
        }
      }

      // If changing title, check for conflicts within the same system
      if (data.title && data.title !== existingGame!.title) {
        const titleConflict = await ctx.prisma.game.findFirst({
          where: {
            title: data.title,
            systemId: data.systemId || existingGame!.systemId,
            NOT: { id },
          },
        })

        if (titleConflict) {
          ResourceError.game.alreadyExists(
            data.title,
            existingGame!.system.name,
          )
        }
      }

      try {
        return await ctx.prisma.game.update({
          where: { id },
          data,
          include: {
            system: true,
            submitter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      } catch (error) {
        if (
          isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)
        ) {
          ResourceError.game.alreadyExists(
            data.title || existingGame!.title,
            existingGame!.system.name,
          )
        }
        throw error
      }
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

      // If changing system, check for title conflicts
      if (data.systemId && data.systemId !== existingGame!.systemId) {
        const systemConflict = await ctx.prisma.game.findFirst({
          where: {
            title: data.title || existingGame!.title,
            systemId: data.systemId,
            NOT: { id },
          },
          include: { system: true },
        })

        if (systemConflict) {
          ResourceError.game.alreadyExists(
            data.title || existingGame!.title,
            systemConflict.system.name,
          )
        }
      }

      // If changing title, check for conflicts within the same system
      if (data.title && data.title !== existingGame!.title) {
        const titleConflict = await ctx.prisma.game.findFirst({
          where: {
            title: data.title,
            systemId: data.systemId || existingGame!.systemId,
            NOT: { id },
          },
        })

        if (titleConflict) {
          ResourceError.game.alreadyExists(
            data.title,
            existingGame!.system.name,
          )
        }
      }

      try {
        return await ctx.prisma.game.update({
          where: { id },
          data,
          include: {
            system: true,
            submitter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      } catch (error) {
        if (
          isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)
        ) {
          ResourceError.game.alreadyExists(
            data.title || existingGame!.title,
            existingGame!.system.name,
          )
        }
        throw error
      }
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
        invalidateGameStatsCache()

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

  // New endpoints for approval system
  getPendingGames: adminProcedure
    .input(GetPendingGamesSchema)
    .query(async ({ ctx, input }) => {
      const {
        limit = 20,
        offset = 0,
        page,
        sortField = 'submittedAt',
        sortDirection = 'desc',
      } = input ?? {}

      const actualOffset = page ? (page - 1) * limit : offset

      const where: Prisma.GameWhereInput = {
        status: ApprovalStatus.PENDING,
      }

      // Build orderBy
      const orderBy: Prisma.GameOrderByWithRelationInput[] = []

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'title':
            orderBy.push({ title: sortDirection })
            break
          case 'submittedAt':
            orderBy.push({ submittedAt: sortDirection })
            break
          case 'system.name':
            orderBy.push({ system: { name: sortDirection } })
            break
        }
      }

      if (!orderBy.length) {
        orderBy.push({ submittedAt: 'desc' })
      }

      const total = await ctx.prisma.game.count({ where })

      const games = await ctx.prisma.game.findMany({
        where,
        select: {
          id: true,
          title: true,
          systemId: true,
          imageUrl: true,
          status: true,
          submittedBy: true,
          submittedAt: true,
          createdAt: true,
          system: { select: { id: true, name: true } },
          submitter: { select: { id: true, name: true, email: true } },
        },
        orderBy,
        skip: actualOffset,
        take: limit,
      })

      return {
        games,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: page ?? Math.floor(actualOffset / limit) + 1,
          offset: actualOffset,
          limit,
        },
      }
    }),

  approveGame: adminProcedure
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
      invalidateGameStatsCache()

      return result
    }),

  getGameStats: adminProcedure.query(async ({ ctx }) => {
    // Check cache first
    const cached = getCachedGameStats()
    if (cached) return cached

    // Fetch fresh data
    const pendingCount = await ctx.prisma.game.count({
      where: { status: ApprovalStatus.PENDING },
    })

    const approvedCount = await ctx.prisma.game.count({
      where: { status: ApprovalStatus.APPROVED },
    })

    const rejectedCount = await ctx.prisma.game.count({
      where: { status: ApprovalStatus.REJECTED },
    })

    const stats = {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: pendingCount + approvedCount + rejectedCount,
    }

    // Cache the result
    setCachedGameStats(stats)

    return stats
  }),
})
