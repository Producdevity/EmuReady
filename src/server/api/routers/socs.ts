import type { Prisma } from '@orm'
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from '@/server/api/trpc'
import {
  GetSoCsSchema,
  GetSoCByIdSchema,
  CreateSoCSchema,
  UpdateSoCSchema,
  DeleteSoCSchema,
} from '@/schemas/soc'

export const socsRouter = createTRPCRouter({
  get: publicProcedure.input(GetSoCsSchema).query(async ({ ctx, input }) => {
    const {
      search,
      limit = 20,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = input ?? {}

    // Calculate actual offset based on page or use provided offset
    const actualOffset = page ? (page - 1) * limit : offset
    const effectiveLimit = Math.min(limit, 100) // Cap at 100 items per page

    // Build where clause for filtering
    const where: Prisma.SoCWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { manufacturer: { contains: search, mode: 'insensitive' } },
            { architecture: { contains: search, mode: 'insensitive' } },
            { processNode: { contains: search, mode: 'insensitive' } },
            { gpuModel: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    // Build orderBy based on sortField and sortDirection
    const orderBy: Prisma.SoCOrderByWithRelationInput[] = []

    if (sortField && sortDirection) {
      switch (sortField) {
        case 'name':
          orderBy.push({ name: sortDirection })
          break
        case 'manufacturer':
          orderBy.push({ manufacturer: sortDirection })
          break
        case 'devicesCount':
          orderBy.push({ devices: { _count: sortDirection } })
          break
      }
    }

    // Default ordering if no sort specified
    if (!orderBy.length) {
      orderBy.push({ manufacturer: 'asc' }, { name: 'asc' })
    }

    // Always run count query for consistent pagination
    const total = await ctx.prisma.soC.count({ where })

    // Get SoCs with pagination
    const socs = await ctx.prisma.soC.findMany({
      where,
      include: {
        _count: { select: { devices: true } },
      },
      orderBy,
      skip: actualOffset,
      take: effectiveLimit,
    })

    return {
      socs,
      pagination: {
        total,
        pages: Math.ceil(total / effectiveLimit),
        page: page ?? Math.floor(actualOffset / effectiveLimit) + 1,
        offset: actualOffset,
        limit: effectiveLimit,
      },
    }
  }),

  byId: publicProcedure
    .input(GetSoCByIdSchema)
    .query(async ({ ctx, input }) => {
      const soc = await ctx.prisma.soC.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              devices: true,
            },
          },
        },
      })

      if (!soc) {
        throw new Error('SoC not found')
      }

      return soc
    }),

  create: adminProcedure
    .input(CreateSoCSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSoC = await ctx.prisma.soC.findUnique({
        where: { name: input.name },
      })

      if (existingSoC) {
        throw new Error(`SoC with name "${input.name}" already exists`)
      }

      return ctx.prisma.soC.create({
        data: input,
        include: {
          _count: {
            select: {
              devices: true,
            },
          },
        },
      })
    }),

  update: adminProcedure
    .input(UpdateSoCSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const existingSoC = await ctx.prisma.soC.findUnique({
        where: { id },
      })

      if (!existingSoC) {
        throw new Error('SoC not found')
      }

      // Check if name is being updated to a name that already exists
      if (updateData.name !== existingSoC.name) {
        const socWithSameName = await ctx.prisma.soC.findUnique({
          where: { name: updateData.name },
        })

        if (socWithSameName) {
          throw new Error(`SoC with name "${updateData.name}" already exists`)
        }
      }

      return ctx.prisma.soC.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              devices: true,
            },
          },
        },
      })
    }),

  delete: adminProcedure
    .input(DeleteSoCSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSoC = await ctx.prisma.soC.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              devices: true,
            },
          },
        },
      })

      if (!existingSoC) {
        throw new Error('SoC not found')
      }

      if (existingSoC._count.devices > 0) {
        throw new Error(
          `Cannot delete SoC "${existingSoC.name}" because it is used by ${existingSoC._count.devices} device(s). Please remove the SoC from all devices first.`,
        )
      }

      return ctx.prisma.soC.delete({
        where: { id: input.id },
      })
    }),

  getManufacturers: publicProcedure.query(async ({ ctx }) => {
    const manufacturers = await ctx.prisma.soC.findMany({
      select: {
        manufacturer: true,
      },
      distinct: ['manufacturer'],
      orderBy: {
        manufacturer: 'asc',
      },
    })

    return manufacturers.map((soc) => soc.manufacturer)
  }),
})
