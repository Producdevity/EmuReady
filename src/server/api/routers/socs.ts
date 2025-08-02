import { AppError, ResourceError } from '@/lib/errors'
import {
  GetSoCsSchema,
  GetSoCByIdSchema,
  CreateSoCSchema,
  UpdateSoCSchema,
  DeleteSoCSchema,
} from '@/schemas/soc'
import {
  createTRPCRouter,
  publicProcedure,
  manageDevicesProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { batchQueries } from '@/server/utils/query-performance'
import { Prisma } from '@orm'

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

    const mode = Prisma.QueryMode.insensitive

    // Build where clause for filtering with more restrictive search
    // TODO: look into this, there's no way this is fast
    const where: Prisma.SoCWhereInput = search
      ? {
          OR: [
            // Exact name match (highest priority)
            { name: { equals: search, mode } },
            // Exact manufacturer match
            { manufacturer: { equals: search, mode } },
            // Name starts with search term
            { name: { startsWith: search, mode } },
            // Manufacturer starts with search term
            { manufacturer: { startsWith: search, mode } },
            // Only allow contains search for longer terms (3+ characters)
            ...(search.length >= 3
              ? [
                  { name: { contains: search, mode } },
                  { manufacturer: { contains: search, mode } },
                ]
              : []),
            // Combined manufacturer + name search for multi-word terms only
            ...(search.includes(' ')
              ? [
                  {
                    AND: search.split(' ').map((term) => ({
                      OR: [
                        { manufacturer: { contains: term, mode } },
                        { name: { contains: term, mode } },
                      ],
                    })),
                  },
                ]
              : []),
          ],
        }
      : {}

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
      include: { _count: { select: { devices: true } } },
      orderBy,
      skip: actualOffset,
      take: limit,
    })

    return {
      socs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: page ?? Math.floor(actualOffset / limit) + 1,
        offset: actualOffset,
        limit: limit,
      },
    }
  }),

  byId: publicProcedure
    .input(GetSoCByIdSchema)
    .query(async ({ ctx, input }) => {
      const soc = await ctx.prisma.soC.findUnique({
        where: { id: input.id },
        include: { _count: { select: { devices: true } } },
      })

      return soc ?? ResourceError.soc.notFound()
    }),

  create: manageDevicesProcedure
    .input(CreateSoCSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSoC = await ctx.prisma.soC.findUnique({
        where: { name: input.name },
      })

      if (existingSoC) {
        return AppError.alreadyExists('SoC', `name "${input.name}"`)
      }

      return ctx.prisma.soC.create({
        data: input,
        include: { _count: { select: { devices: true } } },
      })
    }),

  update: manageDevicesProcedure
    .input(UpdateSoCSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const existingSoC = await ctx.prisma.soC.findUnique({ where: { id } })

      if (!existingSoC) return ResourceError.soc.notFound()

      // Check if name is being updated to a name that already exists
      if (updateData.name !== existingSoC.name) {
        const socWithSameName = await ctx.prisma.soC.findUnique({
          where: { name: updateData.name },
        })

        if (socWithSameName) {
          return AppError.alreadyExists('SoC', `name "${updateData.name}"`)
        }
      }

      return ctx.prisma.soC.update({
        where: { id },
        data: updateData,
        include: { _count: { select: { devices: true } } },
      })
    }),

  delete: manageDevicesProcedure
    .input(DeleteSoCSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSoC = await ctx.prisma.soC.findUnique({
        where: { id: input.id },
        include: { _count: { select: { devices: true } } },
      })

      if (!existingSoC) return ResourceError.soc.notFound()

      if (existingSoC._count.devices > 0) {
        AppError.conflict(
          `Cannot delete SoC "${existingSoC.name}" because it is used by ${existingSoC._count.devices} device(s). Please remove the SoC from all devices first.`,
        )
      }

      return ctx.prisma.soC.delete({ where: { id: input.id } })
    }),

  getManufacturers: publicProcedure.query(async ({ ctx }) => {
    const manufacturers = await ctx.prisma.soC.findMany({
      select: { manufacturer: true },
      distinct: ['manufacturer'],
      orderBy: { manufacturer: 'asc' },
    })

    return manufacturers.map((soc) => soc.manufacturer)
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [withDevices, withoutDevices] = await batchQueries([
      ctx.prisma.soC.count({ where: { devices: { some: {} } } }),
      ctx.prisma.soC.count({ where: { devices: { none: {} } } }),
    ])

    return {
      total: withDevices + withoutDevices,
      withDevices,
      withoutDevices,
    }
  }),
})
