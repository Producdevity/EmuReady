import { TRPCError } from '@trpc/server'
import { ResourceError, AppError } from '@/lib/errors'
import {
  CreatePcListingSchema,
  GetPcListingsSchema,
  GetPcListingByIdSchema,
  GetPendingPcListingsSchema,
  DeletePcListingSchema,
  ApprovePcListingSchema,
  RejectPcListingSchema,
  BulkApprovePcListingsSchema,
  BulkRejectPcListingsSchema,
  GetAllPcListingsAdminSchema,
  UpdatePcListingAdminSchema,
  GetPcListingForEditSchema,
  CreatePcPresetSchema,
  UpdatePcPresetSchema,
  DeletePcPresetSchema,
  GetPcPresetsSchema,
} from '@/schemas/pcListing'
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  moderatorProcedure,
} from '@/server/api/trpc'
import {
  pcListingInclude,
  pcListingDetailInclude,
  pcListingAdminInclude,
  buildPcListingOrderBy,
  buildPcListingWhere,
  buildPaginationResponse,
} from '@/server/api/utils/pcListingHelpers'
import { isModerator } from '@/utils/permissions'
import { ApprovalStatus } from '@orm'
import type { Prisma } from '@orm'

export const pcListingsRouter = createTRPCRouter({
  // PC Listing procedures
  get: publicProcedure
    .input(GetPcListingsSchema)
    .query(async ({ ctx, input }) => {
      const {
        systemIds,
        cpuIds,
        gpuIds,
        emulatorIds,
        performanceIds,
        osFilter,
        memoryMin,
        memoryMax,
        searchTerm,
        page = 1,
        limit = 10,
        sortField,
        sortDirection,
        approvalStatus = ApprovalStatus.APPROVED,
        myListings = false,
      } = input

      const offset = (page - 1) * limit
      const canSeeBannedUsers = ctx.session?.user
        ? isModerator(ctx.session.user.role)
        : false

      // Build base where clause
      const baseWhere: Prisma.PcListingWhereInput = {
        status: approvalStatus,
        ...(myListings && ctx.session?.user
          ? { authorId: ctx.session.user.id }
          : {}),
        ...(systemIds?.length ? { game: { systemId: { in: systemIds } } } : {}),
        ...(cpuIds?.length ? { cpuId: { in: cpuIds } } : {}),
        ...(gpuIds?.length ? { gpuId: { in: gpuIds } } : {}),
        ...(emulatorIds?.length ? { emulatorId: { in: emulatorIds } } : {}),
        ...(performanceIds?.length
          ? { performanceId: { in: performanceIds } }
          : {}),
        ...(osFilter?.length ? { os: { in: osFilter } } : {}),
        ...(memoryMin ? { memorySize: { gte: memoryMin } } : {}),
        ...(memoryMax ? { memorySize: { lte: memoryMax } } : {}),
        ...(searchTerm
          ? {
              OR: [
                {
                  game: {
                    title: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
                {
                  cpu: {
                    modelName: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
                {
                  gpu: {
                    modelName: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
                {
                  emulator: {
                    name: { contains: searchTerm, mode: 'insensitive' },
                  },
                },
                { notes: { contains: searchTerm, mode: 'insensitive' } },
              ],
            }
          : {}),
      }

      // Apply banned user filtering and get final where clause
      const where = buildPcListingWhere(baseWhere, canSeeBannedUsers)
      const orderBy = buildPcListingOrderBy(
        sortField,
        sortDirection ?? undefined,
      )

      const [pcListings, total] = await Promise.all([
        ctx.prisma.pcListing.findMany({
          where,
          include: pcListingInclude,
          orderBy,
          skip: offset,
          take: limit,
        }),
        ctx.prisma.pcListing.count({ where }),
      ])

      return {
        pcListings,
        pagination: buildPaginationResponse(total, page, limit),
      }
    }),

  byId: publicProcedure
    .input(GetPcListingByIdSchema)
    .query(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.id },
        include: pcListingDetailInclude,
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      return pcListing
    }),

  create: protectedProcedure
    .input(CreatePcListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for existing PC listing with same combination
      const existingPcListing = await ctx.prisma.pcListing.findFirst({
        where: {
          gameId: input.gameId,
          cpuId: input.cpuId,
          gpuId: input.gpuId,
          emulatorId: input.emulatorId,
          authorId: ctx.session.user.id,
        },
      })

      if (existingPcListing) {
        return ResourceError.pcListing.alreadyExists()
      }

      // Validate referenced entities exist
      const [game, cpu, gpu, emulator, performance] = await Promise.all([
        ctx.prisma.game.findUnique({ where: { id: input.gameId } }),
        ctx.prisma.cpu.findUnique({ where: { id: input.cpuId } }),
        ctx.prisma.gpu.findUnique({ where: { id: input.gpuId } }),
        ctx.prisma.emulator.findUnique({ where: { id: input.emulatorId } }),
        ctx.prisma.performanceScale.findUnique({
          where: { id: input.performanceId },
        }),
      ])

      if (!game) return ResourceError.game.notFound()
      if (!cpu) return ResourceError.cpu.notFound()
      if (!gpu) return ResourceError.gpu.notFound()
      if (!emulator) return ResourceError.emulator.notFound()
      if (!performance) return ResourceError.performanceScale.notFound()

      // Create PC listing with custom field values
      const pcListing = await ctx.prisma.pcListing.create({
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
          customFieldValues: input.customFieldValues?.length
            ? {
                create: input.customFieldValues.map((cfv) => ({
                  customFieldDefinitionId: cfv.customFieldDefinitionId,
                  value: cfv.value,
                })),
              }
            : undefined,
        },
        include: pcListingInclude,
      })

      return pcListing
    }),

  delete: protectedProcedure
    .input(DeletePcListingSchema)
    .mutation(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.id },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      // Only author can delete their own PC listing
      if (pcListing.authorId !== ctx.session.user.id) {
        return AppError.forbidden('You can only delete your own PC listings')
      }

      return ctx.prisma.pcListing.delete({
        where: { id: input.id },
      })
    }),

  // Admin procedures
  pending: moderatorProcedure
    .input(GetPendingPcListingsSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        page = 1,
        limit = 20,
        sortField,
        sortDirection,
      } = input ?? {}
      const offset = (page - 1) * limit

      const baseWhere: Prisma.PcListingWhereInput = {
        status: ApprovalStatus.PENDING,
        ...(search
          ? {
              OR: [
                { game: { title: { contains: search, mode: 'insensitive' } } },
                {
                  cpu: { modelName: { contains: search, mode: 'insensitive' } },
                },
                {
                  gpu: { modelName: { contains: search, mode: 'insensitive' } },
                },
                {
                  emulator: { name: { contains: search, mode: 'insensitive' } },
                },
                { author: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      }

      // Moderators can see listings from banned users
      const where = buildPcListingWhere(baseWhere, true)
      const orderBy = buildPcListingOrderBy(
        sortField,
        sortDirection ?? undefined,
      )

      // Default to ascending for pending items
      if (!sortField) {
        orderBy[0] = { createdAt: 'asc' }
      }

      const [pcListings, total] = await Promise.all([
        ctx.prisma.pcListing.findMany({
          where,
          include: pcListingInclude,
          orderBy,
          skip: offset,
          take: limit,
        }),
        ctx.prisma.pcListing.count({ where }),
      ])

      return {
        pcListings,
        pagination: buildPaginationResponse(total, page, limit),
      }
    }),

  approve: moderatorProcedure
    .input(ApprovePcListingSchema)
    .mutation(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.pcListingId },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      if (pcListing.status !== ApprovalStatus.PENDING) {
        return ResourceError.pcListing.notPending()
      }

      return ctx.prisma.pcListing.update({
        where: { id: input.pcListingId },
        data: {
          status: ApprovalStatus.APPROVED,
          processedAt: new Date(),
          processedByUserId: ctx.session.user.id,
        },
      })
    }),

  reject: moderatorProcedure
    .input(RejectPcListingSchema)
    .mutation(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.pcListingId },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      if (pcListing.status !== ApprovalStatus.PENDING) {
        return ResourceError.pcListing.notPending()
      }

      return ctx.prisma.pcListing.update({
        where: { id: input.pcListingId },
        data: {
          status: ApprovalStatus.REJECTED,
          processedAt: new Date(),
          processedByUserId: ctx.session.user.id,
          processedNotes: input.notes,
        },
      })
    }),

  bulkApprove: moderatorProcedure
    .input(BulkApprovePcListingsSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.pcListing.updateMany({
        where: {
          id: { in: input.pcListingIds },
          status: ApprovalStatus.PENDING,
        },
        data: {
          status: ApprovalStatus.APPROVED,
          processedAt: new Date(),
          processedByUserId: ctx.session.user.id,
        },
      })

      return { count: result.count }
    }),

  bulkReject: moderatorProcedure
    .input(BulkRejectPcListingsSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.pcListing.updateMany({
        where: {
          id: { in: input.pcListingIds },
          status: ApprovalStatus.PENDING,
        },
        data: {
          status: ApprovalStatus.REJECTED,
          processedAt: new Date(),
          processedByUserId: ctx.session.user.id,
          processedNotes: input.notes,
        },
      })

      return { count: result.count }
    }),

  getAll: moderatorProcedure
    .input(GetAllPcListingsAdminSchema)
    .query(async ({ ctx, input }) => {
      const {
        page = 1,
        limit = 20,
        sortField,
        sortDirection,
        search,
        statusFilter,
        systemFilter,
        emulatorFilter,
        osFilter,
      } = input

      const offset = (page - 1) * limit

      const baseWhere: Prisma.PcListingWhereInput = {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(systemFilter ? { game: { systemId: systemFilter } } : {}),
        ...(emulatorFilter ? { emulatorId: emulatorFilter } : {}),
        ...(osFilter ? { os: osFilter } : {}),
        ...(search
          ? {
              OR: [
                { game: { title: { contains: search, mode: 'insensitive' } } },
                {
                  cpu: { modelName: { contains: search, mode: 'insensitive' } },
                },
                {
                  gpu: { modelName: { contains: search, mode: 'insensitive' } },
                },
                {
                  emulator: { name: { contains: search, mode: 'insensitive' } },
                },
                { author: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      }

      // Moderators can see listings from banned users
      const where = buildPcListingWhere(baseWhere, true)
      const orderBy = buildPcListingOrderBy(
        sortField,
        sortDirection ?? undefined,
      )

      const [pcListings, total] = await Promise.all([
        ctx.prisma.pcListing.findMany({
          where,
          include: pcListingAdminInclude,
          orderBy,
          skip: offset,
          take: limit,
        }),
        ctx.prisma.pcListing.count({ where }),
      ])

      return {
        pcListings,
        pagination: buildPaginationResponse(total, page, limit),
      }
    }),

  getForEdit: moderatorProcedure
    .input(GetPcListingForEditSchema)
    .query(async ({ ctx, input }) => {
      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: input.id },
        include: pcListingDetailInclude,
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      return pcListing
    }),

  updateAdmin: moderatorProcedure
    .input(UpdatePcListingAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...data } = input

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id },
        include: { customFieldValues: true },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      // Update PC listing and handle custom field values
      const updatedPcListing = await ctx.prisma.pcListing.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: pcListingDetailInclude,
      })

      // Handle custom field values if provided
      if (customFieldValues) {
        // Delete existing custom field values
        await ctx.prisma.pcListingCustomFieldValue.deleteMany({
          where: { pcListingId: id },
        })

        // Create new custom field values
        if (customFieldValues.length > 0) {
          await ctx.prisma.pcListingCustomFieldValue.createMany({
            data: customFieldValues.map((cfv) => ({
              pcListingId: id,
              customFieldDefinitionId: cfv.customFieldDefinitionId,
              value: cfv.value,
            })),
          })
        }
      }

      return updatedPcListing
    }),

  stats: moderatorProcedure.query(async ({ ctx }) => {
    const [total, pending, approved, rejected] = await Promise.all([
      ctx.prisma.pcListing.count(),
      ctx.prisma.pcListing.count({ where: { status: ApprovalStatus.PENDING } }),
      ctx.prisma.pcListing.count({
        where: { status: ApprovalStatus.APPROVED },
      }),
      ctx.prisma.pcListing.count({
        where: { status: ApprovalStatus.REJECTED },
      }),
    ])

    return {
      total,
      pending,
      approved,
      rejected,
    }
  }),

  // PC Preset procedures
  presets: {
    get: protectedProcedure
      .input(GetPcPresetsSchema)
      .query(async ({ ctx, input }) => {
        const userId = input.userId ?? ctx.session.user.id

        // Only allow users to see their own presets unless admin
        if (
          userId !== ctx.session.user.id &&
          ctx.session.user.role !== 'ADMIN' &&
          ctx.session.user.role !== 'SUPER_ADMIN'
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view your own PC presets',
          })
        }

        const presets = await ctx.prisma.userPcPreset.findMany({
          where: { userId },
          include: {
            cpu: {
              include: { brand: true },
            },
            gpu: {
              include: { brand: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        return presets
      }),

    create: protectedProcedure
      .input(CreatePcPresetSchema)
      .mutation(async ({ ctx, input }) => {
        // Check if user already has a preset with this name
        const existingPreset = await ctx.prisma.userPcPreset.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: input.name,
          },
        })

        if (existingPreset) {
          return ResourceError.pcPreset.alreadyExists(input.name)
        }

        // Validate CPU and GPU exist
        const [cpu, gpu] = await Promise.all([
          ctx.prisma.cpu.findUnique({ where: { id: input.cpuId } }),
          ctx.prisma.gpu.findUnique({ where: { id: input.gpuId } }),
        ])

        if (!cpu) return ResourceError.cpu.notFound()
        if (!gpu) return ResourceError.gpu.notFound()

        return ctx.prisma.userPcPreset.create({
          data: {
            ...input,
            userId: ctx.session.user.id,
          },
          include: {
            cpu: {
              include: { brand: true },
            },
            gpu: {
              include: { brand: true },
            },
          },
        })
      }),

    update: protectedProcedure
      .input(UpdatePcPresetSchema)
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input

        const preset = await ctx.prisma.userPcPreset.findUnique({
          where: { id },
        })

        if (!preset) return ResourceError.pcPreset.notFound()

        // Only allow users to edit their own presets
        if (preset.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only edit your own PC presets',
          })
        }

        // Check if name conflicts with another preset
        const existingPreset = await ctx.prisma.userPcPreset.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: data.name,
            id: { not: id },
          },
        })

        if (existingPreset) {
          return ResourceError.pcPreset.alreadyExists(data.name)
        }

        // Validate CPU and GPU exist
        const [cpu, gpu] = await Promise.all([
          ctx.prisma.cpu.findUnique({ where: { id: data.cpuId } }),
          ctx.prisma.gpu.findUnique({ where: { id: data.gpuId } }),
        ])

        if (!cpu) return ResourceError.cpu.notFound()
        if (!gpu) return ResourceError.gpu.notFound()

        return ctx.prisma.userPcPreset.update({
          where: { id },
          data,
          include: {
            cpu: {
              include: { brand: true },
            },
            gpu: {
              include: { brand: true },
            },
          },
        })
      }),

    delete: protectedProcedure
      .input(DeletePcPresetSchema)
      .mutation(async ({ ctx, input }) => {
        const preset = await ctx.prisma.userPcPreset.findUnique({
          where: { id: input.id },
        })

        if (!preset) return ResourceError.pcPreset.notFound()

        // Only allow users to delete their own presets
        if (preset.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own PC presets',
          })
        }

        return ctx.prisma.userPcPreset.delete({
          where: { id: input.id },
        })
      }),
  },
})
