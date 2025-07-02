import { ResourceError, AppError } from '@/lib/errors'
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
  GetListingForEditSchema,
  UpdateListingAdminSchema,
  GetAllListingsAdminSchema,
} from '@/schemas/listing'
import {
  createTRPCRouter,
  superAdminProcedure,
  moderatorProcedure,
} from '@/server/api/trpc'
import {
  notificationEventEmitter,
  NOTIFICATION_EVENTS,
} from '@/server/notifications/eventEmitter'
import { listingStatsCache } from '@/server/utils/cache/instances'
import { ApprovalStatus, TrustAction, ReportStatus } from '@orm'
import type { Prisma } from '@orm'

const LISTING_STATS_CACHE_KEY = 'listing-stats'

export const adminRouter = createTRPCRouter({
  getPending: moderatorProcedure
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

      // Get report statistics for each unique author
      const uniqueAuthorIds = [...new Set(listings.map((l) => l.authorId))]
      const authorReportStats = await Promise.all(
        uniqueAuthorIds.map(async (authorId) => {
          const [reportedListingsCount, totalReports] = await Promise.all([
            ctx.prisma.listingReport.count({
              where: {
                listing: {
                  authorId,
                },
              },
            }),
            ctx.prisma.listingReport.count({
              where: {
                listing: {
                  authorId,
                },
                status: {
                  in: [ReportStatus.RESOLVED, ReportStatus.UNDER_REVIEW],
                },
              },
            }),
          ])

          return {
            authorId,
            reportedListingsCount,
            totalReports,
            hasReports: totalReports > 0,
          }
        }),
      )

      // Create a map for quick lookup
      const reportStatsMap = new Map(
        authorReportStats.map((stat) => [stat.authorId, stat]),
      )

      // Add report statistics to each listing
      const listingsWithReports = listings.map((listing) => ({
        ...listing,
        authorReportStats: reportStatsMap.get(listing.authorId) || {
          authorId: listing.authorId,
          reportedListingsCount: 0,
          totalReports: 0,
          hasReports: false,
        },
      }))

      const totalListings = await ctx.prisma.listing.count({ where })

      return {
        listings: listingsWithReports,
        pagination: {
          total: totalListings,
          pages: Math.ceil(totalListings / limit),
          currentPage: page,
          limit,
        },
      }
    }),

  approve: moderatorProcedure
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
        include: {
          author: {
            select: {
              id: true,
              userBans: {
                where: {
                  isActive: true,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
                select: { reason: true },
              },
            },
          },
        },
      })

      if (
        !listingToApprove ||
        listingToApprove.status !== ApprovalStatus.PENDING
      ) {
        return ResourceError.listing.notPending()
      }

      // Auto-reject if user is banned
      if (listingToApprove.author.userBans.length > 0) {
        const banReason = listingToApprove.author.userBans[0].reason
        await ctx.prisma.listing.update({
          where: { id: listingId },
          data: {
            status: ApprovalStatus.REJECTED,
            processedByUserId: adminUserId,
            processedAt: new Date(),
            processedNotes: `Automatically rejected: User is currently banned (${banReason})`,
          },
        })

        AppError.badRequest(
          `Cannot approve listing: Author is currently banned (${banReason})`,
        )
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

  reject: moderatorProcedure
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

  bulkApprove: moderatorProcedure
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
          include: {
            author: {
              select: {
                id: true,
                userBans: {
                  where: {
                    isActive: true,
                    OR: [
                      { expiresAt: null },
                      { expiresAt: { gt: new Date() } },
                    ],
                  },
                  select: { reason: true },
                },
              },
            },
          },
        })

        // Get the IDs of listings that were not found or not pending
        const notFoundOrNotPendingIds = listingIds.filter(
          (id) => !listingsToApprove.some((listing) => listing.id === id),
        )

        if (listingsToApprove.length === 0) {
          return AppError.badRequest(
            'No valid pending listings found to approve. The listings may have already been processed.',
          )
        }

        // Separate listings by banned/non-banned authors
        const bannedUserListings = listingsToApprove.filter(
          (l) => l.author.userBans.length > 0,
        )
        const validListings = listingsToApprove.filter(
          (l) => l.author.userBans.length === 0,
        )

        // Auto-reject listings from banned users
        if (bannedUserListings.length > 0) {
          for (const listing of bannedUserListings) {
            const banReason = listing.author.userBans[0].reason
            await tx.listing.update({
              where: { id: listing.id },
              data: {
                status: ApprovalStatus.REJECTED,
                processedByUserId: adminUserId,
                processedAt: new Date(),
                processedNotes: `Automatically rejected during bulk approval: User is currently banned (${banReason})`,
              },
            })
          }
        }

        // Update valid listings to approved
        if (validListings.length > 0) {
          await tx.listing.updateMany({
            where: { id: { in: validListings.map((l) => l.id) } },
            data: {
              status: ApprovalStatus.APPROVED,
              processedByUserId: adminUserId,
              processedAt: new Date(),
              processedNotes: null,
            },
          })
        }

        // Apply trust actions for approved listings only
        for (const listing of validListings) {
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

          // Emit notification event for each approved listing
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

        let message = `Successfully approved ${validListings.length} listing(s).`

        if (bannedUserListings.length > 0) {
          message += ` ${bannedUserListings.length} listing(s) were automatically rejected due to banned users.`
        }

        if (notFoundOrNotPendingIds.length > 0) {
          message += ` ${notFoundOrNotPendingIds.length} listing(s) were skipped because they were already processed.`
        }

        return {
          success: true,
          approvedCount: validListings.length,
          rejectedCount: bannedUserListings.length,
          skippedCount: notFoundOrNotPendingIds.length,
          message,
          hasReportedUsers: bannedUserListings.length > 0,
        }
      })
    }),

  bulkReject: moderatorProcedure
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

        // Get the IDs of listings that were not found or not pending
        const notFoundOrNotPendingIds = listingIds.filter(
          (id) => !listingsToReject.some((listing) => listing.id === id),
        )

        if (listingsToReject.length === 0) {
          return AppError.badRequest(
            'No valid pending listings found to reject. The listings may have already been processed.',
          )
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

        const message =
          notFoundOrNotPendingIds.length > 0
            ? `Successfully rejected ${listingsToReject.length} listing(s). ${notFoundOrNotPendingIds.length} listing(s) were skipped because they were already processed.`
            : `Successfully rejected ${listingsToReject.length} listing(s).`

        return {
          success: true,
          rejectedCount: listingsToReject.length,
          skippedCount: notFoundOrNotPendingIds.length,
          message,
        }
      })
    }),

  getStats: moderatorProcedure.query(async ({ ctx }) => {
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

  // Super admin procedures for listing management
  getAll: superAdminProcedure
    .input(GetAllListingsAdminSchema)
    .query(async ({ ctx, input }) => {
      const {
        page,
        limit,
        sortField,
        sortDirection,
        search,
        statusFilter,
        systemFilter,
        emulatorFilter,
      } = input
      const skip = (page - 1) * limit

      const baseWhere: Prisma.ListingWhereInput = {
        ...(statusFilter && { status: statusFilter }),
        ...(systemFilter && { game: { systemId: systemFilter } }),
        ...(emulatorFilter && { emulatorId: emulatorFilter }),
      }

      const searchWhere: Prisma.ListingWhereInput = search
        ? {
            OR: [
              { game: { title: { contains: search, mode: 'insensitive' } } },
              { author: { name: { contains: search, mode: 'insensitive' } } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}

      const whereClause: Prisma.ListingWhereInput = {
        ...baseWhere,
        ...searchWhere,
      }

      // Handle sorting
      let orderBy: Prisma.ListingOrderByWithRelationInput = {
        createdAt: 'desc',
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
          case 'performance.rank':
            orderBy = { performance: { rank: sortDirection } }
            break
          case 'author.name':
            orderBy = { author: { name: sortDirection } }
            break
          case 'status':
            orderBy = { status: sortDirection }
            break
          case 'createdAt':
            orderBy = { createdAt: sortDirection }
            break
        }
      }

      const listings = await ctx.prisma.listing.findMany({
        where: whereClause,
        include: {
          game: {
            include: {
              system: true,
            },
          },
          device: {
            include: {
              brand: true,
              soc: true,
            },
          },
          emulator: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          performance: true,
        },
        orderBy,
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
          totalPages: Math.ceil(totalListings / limit),
          currentPage: page,
          limit,
        },
      }
    }),

  getForEdit: superAdminProcedure
    .input(GetListingForEditSchema)
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true, soc: true } },
          emulator: {
            include: {
              customFieldDefinitions: { orderBy: { displayOrder: 'asc' } },
            },
          },
          author: { select: { id: true, name: true, email: true } },
          performance: true,
          customFieldValues: { include: { customFieldDefinition: true } },
        },
      })

      if (!listing) return ResourceError.listing.notFound()

      return listing
    }),

  updateListing: superAdminProcedure
    .input(UpdateListingAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...updateData } = input
      const adminUserId = ctx.session.user.id

      const existingListing = await ctx.prisma.listing.findUnique({
        where: { id },
        include: { customFieldValues: true },
      })

      if (!existingListing) return ResourceError.listing.notFound()

      return ctx.prisma.$transaction(async (tx) => {
        // Update the main listing fields
        const updatedListing = await tx.listing.update({
          where: { id },
          data: {
            ...updateData,
            processedByUserId: adminUserId,
            processedAt: new Date(),
          },
        })

        // Handle custom field values
        if (customFieldValues) {
          // Delete existing custom field values
          await tx.listingCustomFieldValue.deleteMany({
            where: { listingId: id },
          })

          // Create new custom field values
          if (customFieldValues.length > 0) {
            await tx.listingCustomFieldValue.createMany({
              data: customFieldValues.map((cfv) => ({
                listingId: id,
                customFieldDefinitionId: cfv.customFieldDefinitionId,
                value: cfv.value ?? null,
              })),
            })
          }
        }

        // Invalidate listing stats cache
        listingStatsCache.delete(LISTING_STATS_CACHE_KEY)

        return updatedListing
      })
    }),
})
