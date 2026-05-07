// Prerequisites: add_platform_layer migration applied + platforms seeded.
// Usage: ./scripts/db-cmd.sh npx tsx scripts/backfill-pc-preset-platforms.ts
// PcOs.OTHER rows are left untagged — no canonical platform slug exists.

import { config } from 'dotenv'
import { OS_TO_PLATFORM_SLUG } from '@/utils/platform-os-mapping'
import { type PcOs, PrismaClient } from '@orm'

config({ path: '.env.local' })

const prisma = new PrismaClient()

async function backfillPcPresetPlatforms() {
  const pendingTotal = await prisma.userPcPreset.count({ where: { platformId: null } })
  if (pendingTotal === 0) {
    console.info('No PC presets need platform backfill.')
    return
  }

  console.info(`Found ${pendingTotal} PC presets needing backfill.`)

  const platforms = await prisma.platform.findMany({ select: { id: true, slug: true } })
  const platformBySlug = new Map(platforms.map((p) => [p.slug, p.id]))

  let totalUpdated = 0
  let totalSkipped = 0

  for (const [os, slug] of Object.entries(OS_TO_PLATFORM_SLUG) as [PcOs, string | null][]) {
    if (!slug) {
      const skipCount = await prisma.userPcPreset.count({ where: { os, platformId: null } })
      totalSkipped += skipCount
      if (skipCount > 0) {
        console.info(`  → PcOs.${os}: skipped ${skipCount} presets (no canonical platform)`)
      }
      continue
    }

    const platformId = platformBySlug.get(slug)
    if (!platformId) {
      console.warn(`  ⚠️  Platform with slug "${slug}" not found; skipping PcOs.${os}`)
      continue
    }

    const result = await prisma.userPcPreset.updateMany({
      where: { os, platformId: null },
      data: { platformId },
    })
    totalUpdated += result.count
    if (result.count > 0) {
      console.info(`  → PcOs.${os} → ${slug}: updated ${result.count} presets`)
    }
  }

  const remaining = await prisma.userPcPreset.count({ where: { platformId: null } })
  console.info(
    `Updated ${totalUpdated} PC presets, skipped ${totalSkipped} (PcOs.OTHER). ${remaining} still untagged.`,
  )
}

backfillPcPresetPlatforms()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
