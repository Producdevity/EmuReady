// Prerequisites: add_platform_layer migration applied + platforms seeded.
// Usage: ./scripts/db-cmd.sh npx tsx scripts/backfill-pc-listing-platforms.ts
// PcOs.OTHER rows are left untagged — no canonical platform slug exists.

import { config } from 'dotenv'
import { OS_TO_PLATFORM_SLUG } from '@/utils/platform-os-mapping'
import { type PcOs, PrismaClient } from '@orm'

config({ path: '.env.local' })

const prisma = new PrismaClient()

async function backfillPcListingPlatforms() {
  const pendingTotal = await prisma.pcListing.count({ where: { platformId: null } })
  if (pendingTotal === 0) {
    console.info('No PC listings need platform backfill.')
    return
  }

  console.info(`Found ${pendingTotal} PC listings needing backfill.`)

  const platforms = await prisma.platform.findMany({ select: { id: true, slug: true } })
  const platformBySlug = new Map(platforms.map((p) => [p.slug, p.id]))

  let totalUpdated = 0
  let totalSkipped = 0

  for (const [os, slug] of Object.entries(OS_TO_PLATFORM_SLUG) as [PcOs, string | null][]) {
    if (!slug) {
      const skipCount = await prisma.pcListing.count({ where: { os, platformId: null } })
      totalSkipped += skipCount
      if (skipCount > 0) {
        console.info(`  → PcOs.${os}: skipped ${skipCount} listings (no canonical platform)`)
      }
      continue
    }

    const platformId = platformBySlug.get(slug)
    if (!platformId) {
      console.warn(`  ⚠️  Platform with slug "${slug}" not found; skipping PcOs.${os}`)
      continue
    }

    const result = await prisma.pcListing.updateMany({
      where: { os, platformId: null },
      data: { platformId },
    })
    totalUpdated += result.count
    if (result.count > 0) {
      console.info(`  → PcOs.${os} → ${slug}: updated ${result.count} listings`)
    }
  }

  const remaining = await prisma.pcListing.count({ where: { platformId: null } })
  console.info(
    `Updated ${totalUpdated} PC listings, skipped ${totalSkipped} (PcOs.OTHER). ${remaining} still untagged.`,
  )
}

backfillPcListingPlatforms()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
