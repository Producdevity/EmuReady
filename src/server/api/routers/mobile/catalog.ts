import { GetDeviceCompatibilitySchema, type DeviceCompatibilityResponse } from '@/schemas/mobile'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { getDeviceCompatibility } from '@/server/services/catalog.service'

/**
 * Catalog Router for RetroCatalog Integration
 *
 * Provides device compatibility scores aggregated by system.
 * Used by RetroCatalog (retrocatalog.com) to display EmuReady compatibility data.
 */
export const mobileCatalogRouter = createMobileTRPCRouter({
  /**
   * Get device compatibility scores by system
   *
   * Returns aggregated compatibility scores (0-100) for each system tested on a device.
   * Scores are calculated from:
   * - Performance ratings from authors
   * - Community votes (Wilson score)
   * - Developer verifications
   *
   * Results are cached for 10 minutes to reduce server load.
   */
  getDeviceCompatibility: mobilePublicProcedure
    .input(GetDeviceCompatibilitySchema)
    .query(async ({ ctx, input }): Promise<DeviceCompatibilityResponse> => {
      return getDeviceCompatibility(input, {
        prisma: ctx.prisma,
        userRole: ctx.session?.user?.role,
        userId: ctx.session?.user?.id,
      })
    }),
})
