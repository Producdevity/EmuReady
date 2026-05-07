// Prerequisites: add_platform_layer migration applied + platforms seeded.
// Usage: ./scripts/db-cmd.sh npx tsx scripts/backfill-listing-platforms.ts

import { config } from 'dotenv'
import { PrismaClient } from '@orm'

config({ path: '.env.local' })

const prisma = new PrismaClient()

const SOC_PLATFORM_OVERRIDES: { socName: string; platformSlug: string }[] = [
  { socName: 'Allwinner H700', platformSlug: 'linux-arm' },
]

async function backfillListingPlatforms() {
  const pendingTotal = await prisma.listing.count({ where: { platformId: null } })
  if (pendingTotal === 0) {
    console.info('No listings need platform backfill.')
    return
  }

  console.info(`Found ${pendingTotal} listings needing backfill.`)

  const platforms = await prisma.platform.findMany({ select: { id: true, slug: true } })
  const platformBySlug = new Map(platforms.map((p) => [p.slug, p.id]))

  const devices = await prisma.device.findMany({
    where: { defaultPlatformId: { not: null } },
    select: {
      id: true,
      defaultPlatformId: true,
      soc: { select: { name: true } },
    },
  })

  const devicesByPlatform = new Map<string, string[]>()
  let overriddenDeviceCount = 0
  for (const device of devices) {
    if (!device.defaultPlatformId) continue
    const override = SOC_PLATFORM_OVERRIDES.find((rule) => rule.socName === device.soc?.name)
    const targetPlatformId = override
      ? (platformBySlug.get(override.platformSlug) ?? device.defaultPlatformId)
      : device.defaultPlatformId
    if (override && platformBySlug.get(override.platformSlug)) overriddenDeviceCount += 1
    const bucket = devicesByPlatform.get(targetPlatformId) ?? []
    bucket.push(device.id)
    devicesByPlatform.set(targetPlatformId, bucket)
  }
  if (overriddenDeviceCount > 0) {
    console.info(
      `  ↪ Applied SoC-based platform overrides to ${overriddenDeviceCount} device${overriddenDeviceCount === 1 ? '' : 's'}.`,
    )
  }

  let totalUpdated = 0
  for (const [platformId, deviceIds] of devicesByPlatform) {
    const result = await prisma.listing.updateMany({
      where: { platformId: null, deviceId: { in: deviceIds } },
      data: { platformId },
    })
    totalUpdated += result.count
    console.info(
      `  → platform ${platformId.slice(0, 8)}…: updated ${result.count} listings (${deviceIds.length} devices)`,
    )
  }

  const remaining = await prisma.listing.count({ where: { platformId: null } })
  console.info(
    `Updated ${totalUpdated} listings; ${remaining} still untagged (device has no default platform).`,
  )
}

backfillListingPlatforms()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
