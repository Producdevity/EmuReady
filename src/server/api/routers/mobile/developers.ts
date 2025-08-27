import { AppError, ResourceError } from '@/lib/errors'
import {
  GetListingVerificationsSchema,
  GetMyVerificationsSchema,
  IsVerifiedDeveloperSchema,
  RemoveVerificationSchema,
  VerifyListingSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobileDeveloperProcedure,
  mobileProtectedProcedure,
} from '@/server/api/mobileContext'

export const mobileDevelopersRouter = createMobileTRPCRouter({
  /**
   * Get current user's verified emulators
   */
  getMyVerifiedEmulators: mobileDeveloperProcedure.query(async ({ ctx }) => {
    const verifiedDevelopers = await ctx.prisma.verifiedDeveloper.findMany({
      where: { userId: ctx.session.user.id },
      include: { emulator: { select: { id: true, name: true, logo: true } } },
      orderBy: { verifiedAt: 'desc' },
    })

    return verifiedDevelopers.map((vd) => vd.emulator)
  }),

  /**
   * Check if a user is a verified developer for an emulator
   */
  isVerifiedDeveloper: mobileProtectedProcedure
    .input(IsVerifiedDeveloperSchema)
    .query(async ({ ctx, input }) => {
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: {
            userId: input.userId,
            emulatorId: input.emulatorId,
          },
        },
      })

      return !!verifiedDeveloper
    }),

  /**
   * Verify a listing as a developer
   */
  verifyListing: mobileDeveloperProcedure
    .input(VerifyListingSchema)
    .mutation(async ({ ctx, input }) => {
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

      if (!listing) return ResourceError.listing.notFound()

      // Check if user is a verified developer for this emulator
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: { userId, emulatorId: listing.emulatorId },
        },
      })

      if (!verifiedDeveloper) {
        return ResourceError.verifiedDeveloper.mustBeVerifiedToVerify(listing.emulator.name)
      }

      // Check if already verified by this developer
      const existingVerification = await ctx.prisma.listingDeveloperVerification.findUnique({
        where: { listingId_verifiedBy: { listingId, verifiedBy: userId } },
      })

      if (existingVerification) {
        return AppError.conflict('You have already verified this listing')
      }

      return await ctx.prisma.listingDeveloperVerification.create({
        data: { listingId, verifiedBy: userId, notes },
        include: {
          developer: { select: { id: true, name: true, profileImage: true } },
        },
      })
    }),

  /**
   * Remove a verification
   */
  removeVerification: mobileDeveloperProcedure
    .input(RemoveVerificationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Find the verification and ensure it belongs to the current user
      const verification = await ctx.prisma.listingDeveloperVerification.findUnique({
        where: { id: input.verificationId },
      })

      if (!verification) return ResourceError.verification.notFound()

      if (verification.verifiedBy !== userId) {
        return ResourceError.verification.canOnlyRemoveOwn()
      }

      await ctx.prisma.listingDeveloperVerification.delete({
        where: { id: input.verificationId },
      })

      return { message: 'Verification removed successfully' }
    }),

  /**
   * Get verifications for a listing
   */
  getListingVerifications: mobileDeveloperProcedure
    .input(GetListingVerificationsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.listingDeveloperVerification.findMany({
        where: { listingId: input.listingId },
        include: {
          developer: { select: { id: true, name: true, profileImage: true } },
        },
        orderBy: { verifiedAt: 'desc' },
      })
    }),

  /**
   * Get current user's verifications
   */
  getMyVerifications: mobileDeveloperProcedure
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
                device: { include: { brand: { select: { name: true } } } },
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
