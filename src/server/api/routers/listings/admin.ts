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
import {
  notificationEventEmitter,
  NOTIFICATION_EVENTS,
} from '@/server/notifications/eventEmitter'
import { ApprovalStatus } from '@orm'
import type { Prisma } from '@orm'

export const adminRouter = createTRPCRouter({
  getPending: adminProcedure
    .input(GetPendingListingsSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        page = 1,
        limit = 20,
        sortField,
        sortDirection,
      } = input ?? {}
      const skip = (page - 1) * limit

      // Build where clause for search
      let where: Prisma.ListingWhereInput = {
        status: ApprovalStatus.PENDING,
      }

      if (search && search.trim() !== '') {
        where = {
          ...where,
          OR: [
            { game: { title: { contains: search, mode: 'insensitive' } } },
            {
              game: {
                system: { name: { contains: search, mode: 'insensitive' } },
              },
            },
            {
              device: { modelName: { contains: search, mode: 'insensitive' } },
            },
            {
              device: {
                brand: { name: { contains: search, mode: 'insensitive' } },
              },
            },
            {
              emulator: { name: { contains: search, mode: 'insensitive' } },
            },
            {
              author: { name: { contains: search, mode: 'insensitive' } },
            },
          ],
        }
      }

      // Build orderBy clause
      let orderBy: Prisma.ListingOrderByWithRelationInput = {
        createdAt: 'desc', // Default sorting
      }

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'game.title':
            orderBy = { game: { title: sortDirection } }
            break
          case 'game.system.name':
            orderBy = { game: { system: { name: sortDirection } } }
            break
          case 'device':
            orderBy = { device: { modelName: sortDirection } }
            break
          case 'emulator.name':
            orderBy = { emulator: { name: sortDirection } }
            break
          case 'author.name':
            orderBy = { author: { name: sortDirection } }
            break
          case 'createdAt':
            orderBy = { createdAt: sortDirection }
            break
        }
      }

      const listings = await ctx.prisma.listing.findMany({
        where,
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true } },
          emulator: true,
          author: { select: { id: true, name: true, email: true } },
          performance: true,
        },
        orderBy,
        skip,
        take: limit,
      })

      const totalListings = await ctx.prisma.listing.count({ where })

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
      if (!adminUserExists) return ResourceError.user.notInDatabase(adminUserId)

      const listingToApprove = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (
        !listingToApprove ||
        listingToApprove.status !== ApprovalStatus.PENDING
      ) {
        return ResourceError.listing.notPending()
      }

      const updatedListing = await ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ApprovalStatus.APPROVED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          processedNotes: null,
        },
      })

      // Emit notification event
      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.LISTING_APPROVED,
        entityType: 'listing',
        entityId: listingId,
        triggeredBy: adminUserId,
        payload: {
          listingId,
          approvedBy: adminUserId,
          approvedAt: updatedListing.processedAt,
        },
      })

      return updatedListing
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
      if (!adminUserExists) return ResourceError.user.notInDatabase(adminUserId)

      const listingToReject = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (
        !listingToReject ||
        listingToReject.status !== ApprovalStatus.PENDING
      ) {
        return ResourceError.listing.notPending()
      }

      const updatedListing = await ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ApprovalStatus.REJECTED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          processedNotes: notes,
        },
      })

      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.LISTING_REJECTED,
        entityType: 'listing',
        entityId: listingId,
        triggeredBy: adminUserId,
        payload: {
          listingId,
          rejectedBy: adminUserId,
          rejectedAt: updatedListing.processedAt,
          rejectionReason: notes,
        },
      })

      return updatedListing
    }),

  getProcessed: superAdminProcedure
    .input(GetProcessedSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, filterStatus, search } = input
      const skip = (page - 1) * limit

      const baseWhere: Prisma.ListingWhereInput = {
        NOT: { status: ApprovalStatus.PENDING },
        ...(filterStatus && { status: filterStatus }),
      }

      const searchWhere: Prisma.ListingWhereInput = search
        ? {
            OR: [
              { game: { title: { contains: search, mode: 'insensitive' } } },
              { author: { name: { contains: search, mode: 'insensitive' } } },
              { processedNotes: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}

      const whereClause: Prisma.ListingWhereInput = {
        ...baseWhere,
        ...searchWhere,
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

      if (!listingToOverride) return ResourceError.listing.notFound()

      const updatedListing = await ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: newStatus,
          processedByUserId: superAdminUserId, // Log the SUPER_ADMIN as the latest processor
          processedAt: new Date(), // Update timestamp to the override time
          processedNotes: overrideNotes ?? listingToOverride.processedNotes, // Keep old notes if no new ones
        },
      })

      // Emit notification event
      notificationEventEmitter.emitNotificationEvent({
        eventType: NOTIFICATION_EVENTS.LISTING_STATUS_OVERRIDDEN,
        entityType: 'listing',
        entityId: listingId,
        triggeredBy: superAdminUserId,
        payload: {
          listingId,
          overriddenBy: superAdminUserId,
          newStatus,
          overriddenAt: updatedListing.processedAt,
          overrideNotes: overrideNotes,
        },
      })

      return updatedListing
    }),

  delete: superAdminProcedure
    .input(DeleteListingSchema)
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        select: { id: true, game: { select: { title: true } } },
      })

      if (!listing) return ResourceError.listing.notFound()

      await ctx.prisma.listing.delete({ where: { id: input.id } })

      return { success: true, message: 'Listing deleted successfully' }
    }),

  getStats: adminProcedure.query(async ({ ctx }) => {
    const [pending, approved, rejected] = await Promise.all([
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.PENDING } }),
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.REJECTED } }),
    ])

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    }
  }),
})
