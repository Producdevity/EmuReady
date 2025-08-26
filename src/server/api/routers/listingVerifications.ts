import { ResourceError } from '@/lib/errors'
import { TrustService } from '@/lib/trust/service'
import {
  VerifyListingSchema,
  RemoveVerificationSchema,
  GetListingVerificationsSchema,
  GetMyVerificationsSchema,
} from '@/schemas/listingVerification'
import { TrustAction } from '@orm'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const listingVerificationsRouter = createTRPCRouter({
  verifyListing: protectedProcedure.input(VerifyListingSchema).mutation(async ({ ctx, input }) => {
    const { listingId, notes } = input
    const userId = ctx.session.user.id

    // Get the listing to check the emulator
    const listing = await ctx.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        emulator: { select: { id: true, name: true } },
        game: { select: { title: true } },
        author: { select: { name: true } },
      },
    })

    if (!listing) {
      throw ResourceError.listing.notFound()
    }

    // Check if user is a verified developer for this emulator
    const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
      where: {
        userId_emulatorId: {
          userId,
          emulatorId: listing.emulatorId,
        },
      },
    })

    if (!verifiedDeveloper) {
      throw ResourceError.verifiedDeveloper.mustBeVerifiedToVerify(listing.emulator.name)
    }

    // Check if already verified by this developer
    const existingVerification = await ctx.prisma.listingDeveloperVerification.findUnique({
      where: {
        listingId_verifiedBy: {
          listingId,
          verifiedBy: userId,
        },
      },
    })

    if (existingVerification) {
      throw ResourceError.verifiedDeveloper.alreadyVerifiedListing()
    }

    const verification = await ctx.prisma.listingDeveloperVerification.create({
      data: {
        listingId,
        verifiedBy: userId,
        notes,
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    })

    // Award trust points to the listing author for developer verification
    const trustService = new TrustService(ctx.prisma)
    await trustService.logAction({
      userId: listing.authorId,
      action: TrustAction.LISTING_DEVELOPER_VERIFIED,
      targetUserId: userId, // The developer who verified
      metadata: {
        listingId,
        verifiedBy: userId,
        emulatorId: listing.emulatorId,
        gameTitle: listing.game.title,
      },
    })

    return verification
  }),

  removeVerification: protectedProcedure
    .input(RemoveVerificationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Find the verification and ensure it belongs to the current user
      const verification = await ctx.prisma.listingDeveloperVerification.findUnique({
        where: { id: input.verificationId },
      })

      if (!verification) {
        throw ResourceError.verification.notFound()
      }

      if (verification.verifiedBy !== userId) {
        throw ResourceError.verification.canOnlyRemoveOwn()
      }

      await ctx.prisma.listingDeveloperVerification.delete({
        where: { id: input.verificationId },
      })

      return { message: 'Verification removed successfully' }
    }),

  getListingVerifications: protectedProcedure
    .input(GetListingVerificationsSchema)
    .query(async ({ ctx, input }) => {
      const verifications = await ctx.prisma.listingDeveloperVerification.findMany({
        where: { listingId: input.listingId },
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { verifiedAt: 'desc' },
      })

      return verifications
    }),

  getMyVerifications: protectedProcedure
    .input(GetMyVerificationsSchema)
    .query(async ({ ctx, input }) => {
      const { limit, page } = input ?? {}
      const actualLimit = limit ?? 20
      const actualPage = page ?? 1
      const skip = (actualPage - 1) * actualLimit
      const userId = ctx.session.user.id

      const [verifications, total] = await Promise.all([
        ctx.prisma.listingDeveloperVerification.findMany({
          where: { verifiedBy: userId },
          include: {
            listing: {
              include: {
                game: { select: { title: true } },
                emulator: { select: { name: true } },
                device: {
                  include: {
                    brand: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { verifiedAt: 'desc' },
          skip,
          take: actualLimit,
        }),
        ctx.prisma.listingDeveloperVerification.count({
          where: { verifiedBy: userId },
        }),
      ])

      return {
        verifications,
        pagination: {
          page: actualPage,
          pages: Math.ceil(total / actualLimit),
          total,
          limit: actualLimit,
        },
      }
    }),
})
