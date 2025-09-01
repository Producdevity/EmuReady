import { ResourceError } from '@/lib/errors'
import {
  CreatePcListingSchema,
  GetCpusSchema,
  GetGpusSchema,
  GetPcListingsSchema,
  UpdatePcListingSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { pcListingInclude, buildPcListingWhere } from '@/server/api/utils/pcListingHelpers'
import { paginate } from '@/server/utils/pagination'
import { isModerator } from '@/utils/permissions'
import { Prisma, ApprovalStatus } from '@orm'

export const mobilePcListingsRouter = createMobileTRPCRouter({
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

    // PC listings don't have votes, just return as is (search filtering now done at database level)
    const listingsWithStats = pcListings.map((listing) => ({
      ...listing,
      verificationCount: 0, // PC listings use developer verifications differently
      reportCount: listing._count.reports,
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
    return await ctx.prisma.pcListing.create({
      data: {
        gameId: input.gameId,
        cpuId: input.cpuId,
        gpuId: input.gpuId,
        emulatorId: input.emulatorId,
        performanceId: input.performanceId,
        memorySize: input.memorySize,
        os: input.os,
        osVersion: input.osVersion,
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
        game: {
          include: {
            system: { select: { id: true, name: true, key: true } },
          },
        },
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
