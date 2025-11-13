import { ResourceError } from '@/lib/errors'
import { DevicesRepository } from '@/server/repositories/devices.repository'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { catalogCompatibilityCache } from '@/server/utils/cache/instances'
import {
  aggregateBySystem,
  calculateConfidenceLevel,
  type ScoringListingWithMetadata,
} from '@/server/utils/compatibility-scoring'
import type {
  DeviceCompatibilityResponse,
  EmulatorCompatibility,
  SystemCompatibility,
} from '@/schemas/mobile'
import type { Role, PrismaClient } from '@orm'

export interface GetDeviceCompatibilityInput {
  deviceId?: string
  deviceModelName?: string
  deviceBrandName?: string
  systemIds?: string[]
  includeEmulatorBreakdown?: boolean
  minListingCount?: number
}

export interface GetDeviceCompatibilityContext {
  prisma: PrismaClient
  userRole?: Role
  userId?: string
}

/**
 * Get device compatibility scores aggregated by system
 *
 * Returns aggregated compatibility scores (0-100) for each system tested on a device.
 * Scores are calculated from:
 * - Performance ratings from authors
 * - Community votes (Wilson score)
 * - Developer verifications
 *
 * Results are cached for 10 minutes to reduce server load.
 */
export async function getDeviceCompatibility(
  input: GetDeviceCompatibilityInput,
  ctx: GetDeviceCompatibilityContext,
): Promise<DeviceCompatibilityResponse> {
  const devicesRepo = new DevicesRepository(ctx.prisma)
  const listingsRepo = new ListingsRepository(ctx.prisma)

  // Resolve device by ID or by name + brand
  let device
  if (input.deviceId) {
    device = await devicesRepo.byId(input.deviceId)
  } else if (input.deviceModelName && input.deviceBrandName) {
    device = await devicesRepo.findByModelAndBrandName(input.deviceModelName, input.deviceBrandName)
  }

  if (!device) {
    throw ResourceError.device.notFound()
  }

  // Create cache key from device ID and input parameters
  const cacheKey = `device:${device.id}:systems:${input.systemIds?.sort().join(',') ?? 'all'}:breakdown:${input.includeEmulatorBreakdown ?? true}:min:${input.minListingCount ?? 1}`

  // Check cache first
  const cached = catalogCompatibilityCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch all approved listings for this device
  const listings = await listingsRepo.getDeviceCompatibilityData(device.id, {
    systemIds: input.systemIds,
    userRole: ctx.userRole,
  })

  if (listings.length === 0) {
    return {
      device: {
        id: device.id,
        modelName: device.modelName,
        brandName: device.brand.name,
        socName: device.soc?.name ?? null,
      },
      systems: [],
      generatedAt: new Date(),
      cacheExpiresIn: 600, // 10 minutes
    }
  }

  // Get all verified developers for emulators in these listings
  const emulatorIds = [...new Set(listings.map((l) => l.emulatorId))]
  const verifiedDevs = await ctx.prisma.verifiedDeveloper.findMany({
    where: { emulatorId: { in: emulatorIds } },
    select: { userId: true, emulatorId: true },
  })

  // Create a map of verified developers: userId_emulatorId -> true
  const verifiedDevMap = new Set<string>()
  for (const vd of verifiedDevs) {
    verifiedDevMap.add(`${vd.userId}_${vd.emulatorId}`)
  }

  // Enhance listings with isVerifiedDeveloper flag
  const listingsWithMetadata: ScoringListingWithMetadata[] = listings.map((listing) => ({
    ...listing,
    isVerifiedDeveloper: verifiedDevMap.has(`${listing.authorId}_${listing.emulatorId}`),
  }))

  // Aggregate by system
  const systemAggregations = aggregateBySystem(listingsWithMetadata)

  // Filter by minimum listing count
  const filteredSystems = systemAggregations.filter(
    (s) => s.listings.length >= (input.minListingCount ?? 1),
  )

  // Convert to response format
  const systems: SystemCompatibility[] = filteredSystems.map((systemAgg) => {
    const confidence = calculateConfidenceLevel(systemAgg.listings.length, systemAgg.totalVotes)

    const emulators: EmulatorCompatibility[] =
      (input.includeEmulatorBreakdown ?? true)
        ? systemAgg.emulatorBreakdown.map((emulatorAgg) => ({
            id: emulatorAgg.emulator.id,
            name: emulatorAgg.emulator.name,
            key: emulatorAgg.emulator.name.toLowerCase().replace(/\s+/g, '_'),
            logoOption: emulatorAgg.emulator.logo,
            listingCount: emulatorAgg.listings.length,
            avgCompatibilityScore: emulatorAgg.avgCompatibilityScore,
            avgPerformanceRank: Math.round(emulatorAgg.avgPerformanceRank * 100) / 100,
            avgSuccessRate: Math.round(emulatorAgg.avgSuccessRate * 100) / 100,
            developerVerifiedCount: emulatorAgg.developerVerifiedCount,
          }))
        : []

    return {
      id: systemAgg.system.id,
      name: systemAgg.system.name,
      key: systemAgg.system.key ?? systemAgg.system.name.toLowerCase().replace(/\s+/g, '_'),
      compatibilityScore: systemAgg.compatibilityScore,
      confidence,
      metrics: {
        totalListings: systemAgg.listings.length,
        uniqueGames: systemAgg.uniqueGames.size,
        avgPerformanceRank: Math.round(systemAgg.avgPerformanceRank * 100) / 100,
        avgSuccessRate: Math.round(systemAgg.avgSuccessRate * 100) / 100,
        developerVerifiedCount: systemAgg.developerVerifiedCount,
        totalVotes: systemAgg.totalVotes,
        authoredByDeveloperCount: systemAgg.authoredByDeveloperCount,
      },
      emulators,
      lastUpdated: systemAgg.lastUpdated,
    }
  })

  const response: DeviceCompatibilityResponse = {
    device: {
      id: device.id,
      modelName: device.modelName,
      brandName: device.brand.name,
      socName: device.soc?.name ?? null,
    },
    systems,
    generatedAt: new Date(),
    cacheExpiresIn: 600, // 10 minutes
  }

  // Cache the response
  catalogCompatibilityCache.set(cacheKey, response)

  return response
}
