import { ResourceError } from '@/lib/errors'
import {
  GetCpusSchema,
  GetGpusSchema,
  GetPcListingsSchema,
  UpdatePcListingSchema,
} from '@/schemas/mobile'
import { CreatePcListingSchema, GetPcListingByIdSchema } from '@/schemas/pcListing'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { pcListingInclude, buildPcListingWhere } from '@/server/api/utils/pcListingHelpers'
import {
  invalidateListPages,
  invalidateSitemap,
  revalidateByTag,
} from '@/server/cache/invalidation'
import { PcListingsRepository } from '@/server/repositories/pc-listings.repository'
import { listingStatsCache } from '@/server/utils/cache'
import { paginate } from '@/server/utils/pagination'
import { isModerator } from '@/utils/permissions'
import { Prisma, ApprovalStatus } from '@orm'

export const mobilePcListingsRouter = createMobileTRPCRouter({
  /**
   * Get a single PC listing by ID (mobile)
   * Matches web visibility rules and returns materialized stats + userVote
   */
  byId: mobilePublicProcedure.input(GetPcListingByIdSchema).query(async ({ ctx, input }) => {
    const canSeeBannedUsers = ctx.session?.user ? isModerator(ctx.session.user.role) : false

    const repository = new PcListingsRepository(ctx.prisma)
    const pcListing = await repository.getByIdWithDetails(
      input.id,
      canSeeBannedUsers,
      ctx.session?.user?.id,
    )

    if (!pcListing) return ResourceError.pcListing.notFound()

    // Return as-is; forDetails include already provides _count with votes/comments and successRate.
    // We expose userVote from repository computation, no raw votes array here.
    return pcListing
  }),
  /**
   * Get PC listings with pagination and filtering
   */
  get: mobilePublicProcedure.input(GetPcListingsSchema).query(async ({ ctx, input }) => {
    const {
      page,
      limit,
      gameId,
      systemId,
      cpuId,
      gpuId,
      emulatorId,
      os,
      search,
      minMemory,
      maxMemory,
    } = input
    const actualOffset = (page - 1) * limit
    const mode = Prisma.QueryMode.insensitive

    const canSeeBannedUsers = ctx.session?.user ? isModerator(ctx.session.user.role) : false

    // Build where clause with proper search filtering
    const baseWhere: Record<string, unknown> = {
      status: ApprovalStatus.APPROVED,
      game: {
        status: ApprovalStatus.APPROVED,
        // Filter NSFW content based on user preferences
        ...(ctx.session?.user?.showNsfw ? {} : { isErotic: false }),
      },
    }

    if (gameId) baseWhere.gameId = gameId
    if (cpuId) baseWhere.cpuId = cpuId
    if (gpuId) baseWhere.gpuId = gpuId
    if (emulatorId) baseWhere.emulatorId = emulatorId
    if (os) baseWhere.os = os
    if (systemId) {
      baseWhere.game = {
        ...(baseWhere.game || {}),
        systemId,
      }
    }

    // Add memory filtering
    if (minMemory !== undefined || maxMemory !== undefined) {
      baseWhere.memorySize = {
        ...(minMemory !== undefined ? { gte: minMemory } : {}),
        ...(maxMemory !== undefined ? { lte: maxMemory } : {}),
      }
    }

    // Add search filtering at database level
    if (search) {
      baseWhere.OR = [
        { game: { title: { contains: search, mode } } },
        { notes: { contains: search, mode } },
      ]
    }

    // Apply banned user filtering
    const where = buildPcListingWhere(baseWhere, canSeeBannedUsers)

    const [pcListings, total] = await Promise.all([
      ctx.prisma.pcListing.findMany({
        where,
        skip: actualOffset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: pcListingInclude,
      }),
      ctx.prisma.pcListing.count({ where }),
    ])

    // Compute verified developer flags
    const verifiedPairs = pcListings.length
      ? await ctx.prisma.verifiedDeveloper.findMany({
          where: {
            OR: pcListings.map((l) => ({ userId: l.authorId, emulatorId: l.emulatorId })),
          },
          select: { userId: true, emulatorId: true },
        })
      : []
    const verifiedSet = new Set(verifiedPairs.map((v) => `${v.userId}_${v.emulatorId}`))

    // PC listings don't have votes array in mobile; add derived fields
    const listingsWithStats = pcListings.map((listing) => ({
      ...listing,
      verificationCount: 0,
      reportCount: listing._count.reports,
      isVerifiedDeveloper: verifiedSet.has(`${listing.authorId}_${listing.emulatorId}`),
      upVotes: listing.upvoteCount,
      downVotes: listing.downvoteCount,
    }))
    return {
      listings: listingsWithStats,
      pagination: paginate({ total: total, page, limit: limit }),
    }
  }),

  /**
   * Create a new PC listing
   */
  create: mobileProtectedProcedure.input(CreatePcListingSchema).mutation(async ({ ctx, input }) => {
    const repository = new PcListingsRepository(ctx.prisma)
    const created = await repository.create({
      authorId: ctx.session.user.id,
      userRole: ctx.session.user.role,
      gameId: input.gameId,
      cpuId: input.cpuId,
      gpuId: input.gpuId ?? null,
      emulatorId: input.emulatorId,
      performanceId: input.performanceId,
      memorySize: input.memorySize,
      os: input.os,
      osVersion: input.osVersion,
      notes: input.notes ?? null,
      customFieldValues: (input.customFieldValues
        ? (input.customFieldValues as { customFieldDefinitionId: string; value: unknown }[])
        : null) as { customFieldDefinitionId: string; value: unknown }[] | null,
    })

    // Invalidate stats cache
    listingStatsCache.delete('pc-listing-stats')

    // Invalidate pages if approved
    if (created.status === ApprovalStatus.APPROVED) {
      await invalidateListPages()
      await invalidateSitemap()
      await revalidateByTag('pc-listings')
    }

    return created
  }),

  /**
   * Update a PC listing
   */
  update: mobileProtectedProcedure.input(UpdatePcListingSchema).mutation(async ({ ctx, input }) => {
    const { id, customFieldValues, ...updateData } = input

    // Check if user owns the listing
    const existing = await ctx.prisma.pcListing.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!existing) return ResourceError.pcListing.notFound()

    if (existing.authorId !== ctx.session.user.id) {
      return ResourceError.pcListing.canOnlyEditOwn()
    }

    return await ctx.prisma.pcListing.update({
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
        cpu: { include: { brand: { select: { id: true, name: true } } } },
        gpu: { include: { brand: { select: { id: true, name: true } } } },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true } },
        author: { select: { id: true, name: true } },
        _count: { select: { reports: true, developerVerifications: true } },
      },
    })
  }),

  /**
   * Get CPUs for mobile
   */
  cpus: mobilePublicProcedure.input(GetCpusSchema).query(async ({ ctx, input }) => {
    const mode = Prisma.QueryMode.insensitive

    const where = {
      ...(input.search && {
        OR: [
          { modelName: { contains: input.search, mode } },
          { brand: { name: { contains: input.search, mode } } },
        ],
      }),
      ...(input.brandId && { brandId: input.brandId }),
    }

    const cpus = await ctx.prisma.cpu.findMany({
      where,
      take: input.limit,
      orderBy: { modelName: 'asc' },
      include: { brand: { select: { id: true, name: true } } },
    })

    return { cpus }
  }),

  /**
   * Get GPUs for mobile
   */
  gpus: mobilePublicProcedure.input(GetGpusSchema).query(async ({ ctx, input }) => {
    const mode = Prisma.QueryMode.insensitive
    const { search, brandId, limit } = input

    const where = {
      ...(search && {
        OR: [
          { modelName: { contains: search, mode } },
          { brand: { name: { contains: search, mode } } },
        ],
      }),
      ...(brandId && { brandId }),
    }

    const gpus = await ctx.prisma.gpu.findMany({
      where,
      take: limit,
      orderBy: { modelName: 'asc' },
      include: { brand: { select: { id: true, name: true } } },
    })

    return { gpus }
  }),
})
