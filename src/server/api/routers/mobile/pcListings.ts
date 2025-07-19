import { AppError, ResourceError } from '@/lib/errors'
import {
  CreatePcListingSchema,
  CreatePcPresetSchema,
  DeletePcPresetSchema,
  GetCpusSchema,
  GetGpusSchema,
  GetPcListingsSchema,
  GetPcPresetsSchema,
  UpdatePcListingSchema,
  UpdatePcPresetSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobileProtectedProcedure,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import {
  pcListingInclude,
  buildPcListingWhere,
  buildPaginationResponse,
} from '@/server/api/utils/pcListingHelpers'
import { isModerator } from '@/utils/permissions'
import { ApprovalStatus } from '@orm'

export const mobilePcListingsRouter = createMobileTRPCRouter({
  /**
   * Get PC listings with pagination and filtering
   */
  getPcListings: mobilePublicProcedure
    .input(GetPcListingsSchema)
    .query(async ({ ctx, input }) => {
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
      const skip = (page - 1) * limit

      const canSeeBannedUsers = ctx.session?.user
        ? isModerator(ctx.session.user.role)
        : false

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
          ...(baseWhere.game as Record<string, unknown>),
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
          {
            game: {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            notes: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ]
      }

      // Apply banned user filtering
      const where = buildPcListingWhere(baseWhere, canSeeBannedUsers)

      const [pcListings, total] = await Promise.all([
        ctx.prisma.pcListing.findMany({
          where,
          skip,
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
      const pages = Math.ceil(total / limit)

      return {
        listings: listingsWithStats,
        pagination: {
          ...buildPaginationResponse(total, page, limit),
          hasNextPage: page < pages,
          hasPreviousPage: page > 1,
        },
      }
    }),

  /**
   * Create a new PC listing
   */
  createPcListing: mobileProtectedProcedure
    .input(CreatePcListingSchema)
    .mutation(async ({ ctx, input }) => {
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
                  value: cfv.value,
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
  updatePcListing: mobileProtectedProcedure
    .input(UpdatePcListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...updateData } = input

      // Check if user owns the listing
      const existing = await ctx.prisma.pcListing.findUnique({
        where: { id },
        select: { authorId: true },
      })

      if (!existing) return AppError.notFound('PC Listing')

      if (existing.authorId !== ctx.session.user.id) {
        return AppError.forbidden('You can only edit your own PC listings')
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
                  value: cfv.value,
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
   * Get CPUs for mobile
   */
  getCpus: mobilePublicProcedure
    .input(GetCpusSchema)
    .query(async ({ ctx, input }) => {
      const { search, brandId, limit } = input

      const where = {
        ...(search && {
          OR: [
            { modelName: { contains: search, mode: 'insensitive' as const } },
            {
              brand: {
                name: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }),
        ...(brandId && { brandId }),
      }

      const cpus = await ctx.prisma.cpu.findMany({
        where,
        take: limit,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })

      return { cpus }
    }),

  /**
   * Get GPUs for mobile
   */
  getGpus: mobilePublicProcedure
    .input(GetGpusSchema)
    .query(async ({ ctx, input }) => {
      const { search, brandId, limit } = input

      const where = {
        ...(search && {
          OR: [
            { modelName: { contains: search, mode: 'insensitive' as const } },
            {
              brand: {
                name: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }),
        ...(brandId && { brandId }),
      }

      const gpus = await ctx.prisma.gpu.findMany({
        where,
        take: limit,
        orderBy: { modelName: 'asc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      })

      return { gpus }
    }),

  /**
   * PC Presets nested router
   */
  presets: createMobileTRPCRouter({
    get: mobileProtectedProcedure
      .input(GetPcPresetsSchema)
      .query(async ({ ctx, input }) => {
        return await ctx.prisma.userPcPreset.findMany({
          where: { userId: ctx.session.user.id },
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            cpu: { include: { brand: { select: { id: true, name: true } } } },
            gpu: { include: { brand: { select: { id: true, name: true } } } },
          },
        })
      }),

    create: mobileProtectedProcedure
      .input(CreatePcPresetSchema)
      .mutation(async ({ ctx, input }) => {
        return await ctx.prisma.userPcPreset.create({
          data: {
            ...input,
            userId: ctx.session.user.id,
          },
          include: {
            cpu: { include: { brand: { select: { id: true, name: true } } } },
            gpu: { include: { brand: { select: { id: true, name: true } } } },
          },
        })
      }),

    update: mobileProtectedProcedure
      .input(UpdatePcPresetSchema)
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input

        // Check if user owns the preset
        const existing = await ctx.prisma.userPcPreset.findUnique({
          where: { id },
          select: { userId: true },
        })

        if (!existing) return ResourceError.pcPreset.notFound()

        if (existing.userId !== ctx.session.user.id) {
          return AppError.forbidden('You can only edit your own PC presets')
        }

        return await ctx.prisma.userPcPreset.update({
          where: { id },
          data: updateData,
          include: {
            cpu: { include: { brand: { select: { id: true, name: true } } } },
            gpu: { include: { brand: { select: { id: true, name: true } } } },
          },
        })
      }),

    delete: mobileProtectedProcedure
      .input(DeletePcPresetSchema)
      .mutation(async ({ ctx, input }) => {
        // Check if user owns the preset
        const existing = await ctx.prisma.userPcPreset.findUnique({
          where: { id: input.id },
          select: { userId: true },
        })

        if (!existing) return ResourceError.pcPreset.notFound()

        return existing.userId !== ctx.session.user.id
          ? AppError.forbidden('You can only delete your own PC presets')
          : await ctx.prisma.userPcPreset.delete({ where: { id: input.id } })
      }),
  }),
})
