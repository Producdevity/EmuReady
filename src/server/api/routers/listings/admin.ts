import { ResourceError } from '@/lib/errors'
import { applyTrustAction } from '@/lib/trust/service'
import {
  ApproveListingSchema,
  RejectListingSchema,
  GetProcessedSchema,
  GetPendingListingsSchema,
  OverrideApprovalStatusSchema,
  DeleteListingSchema,
  BulkApproveListingsSchema,
  BulkRejectListingsSchema,
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
import { listingStatsCache } from '@/server/utils/cache/instances'
import { ApprovalStatus, TrustAction } from '@orm'
import type { Prisma } from '@orm'

const LISTING_STATS_CACHE_KEY = 'listing-stats'

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
        include: { author: { select: { id: true } } },
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

      // Apply trust action for listing approval to the author
      if (listingToApprove.authorId) {
        await applyTrustAction({
          userId: listingToApprove.authorId,
          action: TrustAction.LISTING_APPROVED,
          context: {
            listingId,
            adminUserId,
            reason: 'listing_approved',
          },
        })
      }

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

      // Invalidate listing stats cache
      listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

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
        include: { author: { select: { id: true } } },
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

      // Apply trust action for listing rejection to the author
      if (listingToReject.authorId) {
        await applyTrustAction({
          userId: listingToReject.authorId,
          action: TrustAction.LISTING_REJECTED,
          context: {
            listingId,
            adminUserId,
            reason: notes || 'listing_rejected',
          },
        })
      }

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

      // Invalidate listing stats cache
      listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

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

      // Invalidate listing stats cache
      listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

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

      // Invalidate listing stats cache
      listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

      return { success: true, message: 'Listing deleted successfully' }
    }),

  bulkApprove: adminProcedure
    .input(BulkApproveListingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingIds } = input
      const adminUserId = ctx.session.user.id

      // Verify admin user exists
      const adminUserExists = await ctx.prisma.user.findUnique({
        where: { id: adminUserId },
        select: { id: true },
      })
      if (!adminUserExists) return ResourceError.user.notInDatabase(adminUserId)

      return ctx.prisma.$transaction(async (tx) => {
        // Get all listings to approve and verify they are pending
        const listingsToApprove = await tx.listing.findMany({
          where: {
            id: { in: listingIds },
            status: ApprovalStatus.PENDING,
          },
          include: { author: { select: { id: true } } },
        })

        if (listingsToApprove.length === 0) {
          throw new Error('No valid pending listings found to approve')
        }

        // Update all listings to approved
        await tx.listing.updateMany({
          where: { id: { in: listingsToApprove.map((l) => l.id) } },
          data: {
            status: ApprovalStatus.APPROVED,
            processedByUserId: adminUserId,
            processedAt: new Date(),
            processedNotes: null,
          },
        })

        // Apply trust actions for all approved listings
        for (const listing of listingsToApprove) {
          if (listing.authorId) {
            await applyTrustAction({
              userId: listing.authorId,
              action: TrustAction.LISTING_APPROVED,
              context: {
                listingId: listing.id,
                adminUserId,
                reason: 'bulk_listing_approved',
              },
            })
          }

          // Emit notification event for each listing
          notificationEventEmitter.emitNotificationEvent({
            eventType: NOTIFICATION_EVENTS.LISTING_APPROVED,
            entityType: 'listing',
            entityId: listing.id,
            triggeredBy: adminUserId,
            payload: {
              listingId: listing.id,
              approvedBy: adminUserId,
              approvedAt: new Date(),
              bulk: true,
            },
          })
        }

        // Invalidate listing stats cache
        listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

        return {
          success: true,
          approvedCount: listingsToApprove.length,
          message: `Successfully approved ${listingsToApprove.length} listing(s)`,
        }
      })
    }),

  bulkReject: adminProcedure
    .input(BulkRejectListingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingIds, notes } = input
      const adminUserId = ctx.session.user.id

      // Verify admin user exists
      const adminUserExists = await ctx.prisma.user.findUnique({
        where: { id: adminUserId },
        select: { id: true },
      })
      if (!adminUserExists) return ResourceError.user.notInDatabase(adminUserId)

      return ctx.prisma.$transaction(async (tx) => {
        // Get all listings to reject and verify they are pending
        const listingsToReject = await tx.listing.findMany({
          where: {
            id: { in: listingIds },
            status: ApprovalStatus.PENDING,
          },
          include: { author: { select: { id: true } } },
        })

        if (listingsToReject.length === 0) {
          throw new Error('No valid pending listings found to reject')
        }

        // Update all listings to rejected
        await tx.listing.updateMany({
          where: { id: { in: listingsToReject.map((l) => l.id) } },
          data: {
            status: ApprovalStatus.REJECTED,
            processedByUserId: adminUserId,
            processedAt: new Date(),
            processedNotes: notes,
          },
        })

        // Apply trust actions for all rejected listings
        for (const listing of listingsToReject) {
          if (listing.authorId) {
            await applyTrustAction({
              userId: listing.authorId,
              action: TrustAction.LISTING_REJECTED,
              context: {
                listingId: listing.id,
                adminUserId,
                reason: notes || 'bulk_listing_rejected',
              },
            })
          }

          // Emit notification event for each listing
          notificationEventEmitter.emitNotificationEvent({
            eventType: NOTIFICATION_EVENTS.LISTING_REJECTED,
            entityType: 'listing',
            entityId: listing.id,
            triggeredBy: adminUserId,
            payload: {
              listingId: listing.id,
              rejectedBy: adminUserId,
              rejectedAt: new Date(),
              rejectionReason: notes,
              bulk: true,
            },
          })
        }

        // Invalidate listing stats cache
        listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

        return {
          success: true,
          rejectedCount: listingsToReject.length,
          message: `Successfully rejected ${listingsToReject.length} listing(s)`,
        }
      })
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
