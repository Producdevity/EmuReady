import { ResourceError } from '@/lib/errors'
import {
  GetPcListingVerificationsSchema,
  RemovePcListingVerificationSchema,
  VerifyPcListingAdminSchema,
} from '@/schemas/pcListing'
import { createTRPCRouter, permissionProcedure, publicProcedure } from '@/server/api/trpc'
import { PERMISSIONS } from '@/utils/permission-system'
import { isModerator } from '@/utils/permissions'

export const verificationsRouter = createTRPCRouter({
  verify: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(VerifyPcListingAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { pcListingId, notes } = input
      const verifierId = ctx.session.user.id

      const pcListing = await ctx.prisma.pcListing.findUnique({
        where: { id: pcListingId },
      })

      if (!pcListing) return ResourceError.pcListing.notFound()

      const existingVerification = await ctx.prisma.pcListingDeveloperVerification.findUnique({
        where: {
          pcListingId_verifiedBy: { pcListingId, verifiedBy: verifierId },
        },
      })

      if (existingVerification) {
        return ResourceError.verifiedDeveloper.alreadyVerifiedListing()
      }

      return await ctx.prisma.pcListingDeveloperVerification.create({
        data: { pcListingId, verifiedBy: verifierId, notes },
        include: { developer: { select: { id: true, name: true } } },
      })
    }),

  removeVerification: permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)
    .input(RemovePcListingVerificationSchema)
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.prisma.pcListingDeveloperVerification.findUnique({
        where: { id: input.verificationId },
      })

      if (!verification) return ResourceError.verification.notFound()

      if (verification.verifiedBy !== ctx.session.user.id && !isModerator(ctx.session.user.role)) {
        return ResourceError.verification.canOnlyRemoveOwn()
      }

      return await ctx.prisma.pcListingDeveloperVerification.delete({
        where: { id: input.verificationId },
      })
    }),

  getVerifications: publicProcedure
    .input(GetPcListingVerificationsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.pcListingDeveloperVerification.findMany({
        where: { pcListingId: input.pcListingId },
        include: { developer: { select: { id: true, name: true } } },
        orderBy: { verifiedAt: 'desc' },
      })
    }),
})
