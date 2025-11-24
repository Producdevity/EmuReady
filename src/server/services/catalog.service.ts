import { ResourceError } from '@/lib/errors'
import { DevicesRepository } from '@/server/repositories/devices.repository'
import { ListingsRepository } from '@/server/repositories/listings.repository'
import { catalogCompatibilityCache } from '@/server/utils/cache/instances'
import {
  aggregateBySystem,
  calculateConfidenceLevel,
  MINIMUM_DEVICE_LISTINGS,
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
 * - Community votes (Wilson score) - only when votes exist
 * - User trust scores (positive impact only)
 * - Developer verifications
 *
 * SoC Fallback:
 * - When a system has < MINIMUM_DEVICE_LISTINGS (5) on the device,
 *   data from other devices with the same SoC is included
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

  // Create cache key from device ID and input parameters (include SoC in key)
  const cacheKey = `device:${device.id}:systems:${input.systemIds?.sort().join(',') ?? 'all'}:breakdown:${input.includeEmulatorBreakdown ?? true}:min:${input.minListingCount ?? 1}:soc:${device.socId ?? 'none'}`

  // Check cache first
  const cached = catalogCompatibilityCache.get(cacheKey)
  if (cached) return cached

  // Fetch device-specific listings
  const deviceListings = await listingsRepo.getDeviceCompatibilityData(device.id, {
    systemIds: input.systemIds,
    userRole: ctx.userRole,
  })

  if (deviceListings.length === 0) {
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
  const allListings = [...deviceListings]
  const emulatorIds = [...new Set(allListings.map((l) => l.emulatorId))]
  const verifiedDevs = await ctx.prisma.verifiedDeveloper.findMany({
    where: { emulatorId: { in: emulatorIds } },
    select: { userId: true, emulatorId: true },
  })

  // Create a map of verified developers: userId_emulatorId -> true
  const verifiedDevMap = new Set<string>()
  for (const vd of verifiedDevs) {
    verifiedDevMap.add(`${vd.userId}_${vd.emulatorId}`)
  }

  let listingsWithMetadata: ScoringListingWithMetadata[] = deviceListings.map((listing) => ({
    ...listing,
    isVerifiedDeveloper: verifiedDevMap.has(`${listing.authorId}_${listing.emulatorId}`),
  }))

  const deviceSystemAggregations = aggregateBySystem(listingsWithMetadata)

  // Track data source info per system
  const dataSourceMap = new Map<
    string,
    { dataSource: 'device' | 'soc'; deviceCount: number; socCount: number; deviceIds: Set<string> }
  >()

  // Initialize all device systems as 'device' source
  for (const sysAgg of deviceSystemAggregations) {
    dataSourceMap.set(sysAgg.system.id, {
      dataSource: 'device',
      deviceCount: sysAgg.listings.length,
      socCount: 0,
      deviceIds: new Set(),
    })
  }

  // Identify systems needing SoC fallback
  const systemsNeedingFallback = deviceSystemAggregations.filter(
    (s) => s.listings.length < MINIMUM_DEVICE_LISTINGS,
  )

  // If device has SoC AND some systems need fallback, fetch SoC data
  if (device.socId && systemsNeedingFallback.length > 0) {
    const socListings = await listingsRepo.getSocCompatibilityData(device.socId, device.id, {
      systemIds: systemsNeedingFallback.map((s) => s.system.id),
      userRole: ctx.userRole,
    })

    if (socListings.length > 0) {
      // Track unique devices contributing SoC data per system
      const socDevicesBySystem = new Map<string, Set<string>>()

      for (const listing of socListings) {
        const systemId = listing.game?.system.id
        if (!systemId) continue

        if (!socDevicesBySystem.has(systemId)) socDevicesBySystem.set(systemId, new Set())
        socDevicesBySystem.get(systemId)!.add(listing.deviceId)
      }

      // Enhance SoC listings with metadata
      const socListingsWithMetadata: ScoringListingWithMetadata[] = socListings.map((listing) => ({
        ...listing,
        isVerifiedDeveloper: verifiedDevMap.has(`${listing.authorId}_${listing.emulatorId}`),
      }))

      // Combine device + SoC listings
      listingsWithMetadata = [...listingsWithMetadata, ...socListingsWithMetadata]

      // Update data source info for systems that used SoC fallback
      for (const sysAgg of systemsNeedingFallback) {
        const systemId = sysAgg.system.id
        const socDevices = socDevicesBySystem.get(systemId)
        const socListingCount = socListings.filter((l) => l.game?.system.id === systemId).length

        dataSourceMap.set(systemId, {
          dataSource: 'soc',
          deviceCount: sysAgg.listings.length,
          socCount: socListingCount,
          deviceIds: socDevices ?? new Set(),
        })
      }
    }
  }

  // Re-aggregate with combined listings
  const systemAggregations = aggregateBySystem(listingsWithMetadata)

  // Filter by minimum listing count
  const filteredSystems = systemAggregations.filter(
    (s) => s.listings.length >= (input.minListingCount ?? 1),
  )

  // Convert to response format
  const systems: SystemCompatibility[] = filteredSystems.map((systemAgg) => {
    const confidence = calculateConfidenceLevel(systemAgg.listings.length, systemAgg.totalVotes)
    const sourceInfo = dataSourceMap.get(systemAgg.system.id)

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
            avgSuccessRate:
              emulatorAgg.avgSuccessRate !== null
                ? Math.round(emulatorAgg.avgSuccessRate * 100) / 100
                : null,
            developerVerifiedCount: emulatorAgg.developerVerifiedCount,
          }))
        : []

    return {
      id: systemAgg.system.id,
      name: systemAgg.system.name,
      key: systemAgg.system.key ?? systemAgg.system.name.toLowerCase().replace(/\s+/g, '_'),
      compatibilityScore: systemAgg.compatibilityScore,
      confidence,
      dataSource: sourceInfo?.dataSource ?? 'device',
      dataSourceInfo:
        sourceInfo?.dataSource === 'soc'
          ? {
              deviceListingCount: sourceInfo.deviceCount,
              socListingCount: sourceInfo.socCount,
              otherDevicesUsed: sourceInfo.deviceIds.size,
            }
          : undefined,
      metrics: {
        totalListings: systemAgg.listings.length,
        uniqueGames: systemAgg.uniqueGames.size,
        avgPerformanceRank: Math.round(systemAgg.avgPerformanceRank * 100) / 100,
        avgSuccessRate:
          systemAgg.avgSuccessRate !== null
            ? Math.round(systemAgg.avgSuccessRate * 100) / 100
            : null,
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
