import type { Prisma } from '@orm'
import { ListingApprovalStatus } from '@orm'
import { ResourceError } from '@/lib/errors'
import {
  ApproveListingSchema,
  RejectListingSchema,
  GetProcessedSchema,
  GetPendingListingsSchema,
  OverrideApprovalStatusSchema,
  DeleteListingSchema,
} from '@/schemas/listing'
import {
  createTRPCRouter,
  adminProcedure,
  superAdminProcedure,
} from '@/server/api/trpc'

export const adminRouter = createTRPCRouter({
  getPending: adminProcedure
    .input(GetPendingListingsSchema)
    .query(async ({ ctx, input }) => {
      const { search, sortField, sortDirection } = input ?? {}

      // Build where clause for search
      let where: Prisma.ListingWhereInput = {
        status: ListingApprovalStatus.PENDING,
      }

      if (search && search.trim() !== '') {
        const searchTerm = search.trim()
        where = {
          ...where,
          OR: [
            {
              game: {
                title: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
            {
              game: {
                system: {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive',
                  },
                },
              },
            },
            {
              device: {
                modelName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
            {
              device: {
                brand: {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive',
                  },
                },
              },
            },
            {
              emulator: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
            {
              author: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }
      }

      // Build orderBy based on sortField and sortDirection
      const orderBy: Prisma.ListingOrderByWithRelationInput[] = []

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'game.title':
            orderBy.push({ game: { title: sortDirection } })
            break
          case 'game.system.name':
            orderBy.push({ game: { system: { name: sortDirection } } })
            break
          case 'device':
            orderBy.push({ device: { modelName: sortDirection } })
            break
          case 'emulator.name':
            orderBy.push({ emulator: { name: sortDirection } })
            break
          case 'author.name':
            orderBy.push({ author: { name: sortDirection } })
            break
          case 'createdAt':
            orderBy.push({ createdAt: sortDirection })
            break
        }
      }

      // Default ordering if no sort specified
      if (!orderBy.length) {
        orderBy.push({ createdAt: 'asc' })
      }

      return ctx.prisma.listing.findMany({
        where,
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true } },
          emulator: true,
          author: { select: { id: true, name: true, email: true } },
          performance: true,
        },
        orderBy,
      })
    }),

  approve: adminProcedure
    .input(ApproveListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId } = input
      const adminUserId = ctx.session.user.id

      // Verify admin user exists
      const adminUserExists = await ctx.prisma.user.findUnique({
        where: { id: adminUserId },
        select: { id: true },
      })
      if (!adminUserExists) {
        ResourceError.user.notInDatabase(adminUserId)
      }

      const listingToApprove = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (
        !listingToApprove ||
        listingToApprove.status !== ListingApprovalStatus.PENDING
      ) {
        ResourceError.listing.notPending()
      }

      return ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingApprovalStatus.APPROVED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          processedNotes: null,
        },
      })
    }),

  reject: adminProcedure
    .input(RejectListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, notes } = input
      const adminUserId = ctx.session.user.id

      // Verify admin user exists
      const adminUserExists = await ctx.prisma.user.findUnique({
        where: { id: adminUserId },
        select: { id: true },
      })
      if (!adminUserExists) {
        ResourceError.user.notInDatabase(adminUserId)
      }

      const listingToReject = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (
        !listingToReject ||
        listingToReject.status !== ListingApprovalStatus.PENDING
      ) {
        ResourceError.listing.notPending()
      }

      return ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingApprovalStatus.REJECTED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          processedNotes: notes,
        },
      })
    }),

  getProcessed: superAdminProcedure
    .input(GetProcessedSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, filterStatus } = input
      const skip = (page - 1) * limit

      const whereClause = {
        NOT: { status: ListingApprovalStatus.PENDING }, // Exclude PENDING listings
        ...(filterStatus && { status: filterStatus }),
      }

      const listings = await ctx.prisma.listing.findMany({
        where: whereClause,
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true } },
          emulator: true,
          author: { select: { id: true, name: true, email: true } },
          performance: true,
          processedByUser: { select: { id: true, name: true, email: true } }, // Admin who processed
        },
        orderBy: {
          processedAt: 'desc', // Show most recently processed first
        },
        skip,
        take: limit,
      })

      const totalListings = await ctx.prisma.listing.count({
        where: whereClause,
      })

      return {
        listings,
        pagination: {
          total: totalListings,
          pages: Math.ceil(totalListings / limit),
          currentPage: page,
          limit,
        },
      }
    }),

  overrideStatus: superAdminProcedure
    .input(OverrideApprovalStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, newStatus, overrideNotes } = input
      const superAdminUserId = ctx.session.user.id

      const listingToOverride = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listingToOverride) {
        ResourceError.listing.notFound()
        return // This will never be reached, but helps TypeScript
      }

      return ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: newStatus,
          processedByUserId: superAdminUserId, // Log the SUPER_ADMIN as the latest processor
          processedAt: new Date(), // Update timestamp to the override time
          processedNotes: overrideNotes ?? listingToOverride.processedNotes, // Keep old notes if no new ones
        },
      })
    }),

  delete: adminProcedure
    .input(DeleteListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input

      const listing = await ctx.prisma.listing.findUnique({ where: { id } })

      if (!listing) {
        ResourceError.listing.notFound()
      }

      await ctx.prisma.listing.delete({ where: { id } })

      return { success: true }
    }),
})
