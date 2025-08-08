import { AppError } from '@/lib/errors'
import {
  VerifyListingSchema,
  RemoveVerificationSchema,
  GetListingVerificationsSchema,
  GetMyVerificationsSchema,
} from '@/schemas/listingVerification'
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
      throw AppError.notFound('Listing not found')
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
      throw AppError.forbidden(`You are not a verified developer for ${listing.emulator.name}`)
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
      throw AppError.conflict('You have already verified this listing')
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
        throw AppError.notFound('Verification not found')
      }

      if (verification.verifiedBy !== userId) {
        throw AppError.forbidden('You can only remove your own verifications')
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
