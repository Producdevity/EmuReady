// Re-runs the classifyDevice logic from devicePlatformsSeeder against
// existing devices and prints a diff. Optionally applies the proposed
// changes when --apply is passed.
//
// Usage (dry-run):
//   ./scripts/db-cmd.sh npx tsx scripts/reclassify-device-platforms.ts
// Apply changes:
//   ./scripts/db-cmd.sh npx tsx scripts/reclassify-device-platforms.ts --apply
// Filter to a single brand or SoC name:
//   --brand="Anbernic"
//   --soc="Allwinner H700"
//
// Default platform writes go through prisma.device.update; many-to-many
// platform changes use deleteMany + createMany so the result is
// deterministic regardless of prior state.

import { config } from 'dotenv'
import { PrismaClient } from '@orm'
import { classifyDevice, isSkipResult } from '../prisma/seeders/devicePlatformsSeeder'

config({ path: '.env.local' })

const prisma = new PrismaClient()

interface CliOptions {
  apply: boolean
  brand: string | null
  soc: string | null
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { apply: false, brand: null, soc: null }
  for (const arg of argv) {
    if (arg === '--apply') options.apply = true
    else if (arg.startsWith('--brand=')) options.brand = arg.slice('--brand='.length)
    else if (arg.startsWith('--soc=')) options.soc = arg.slice('--soc='.length)
  }
  return options
}

interface DeviceDiff {
  deviceId: string
  brand: string
  model: string
  socName: string | null
  currentPlatformIds: Set<string>
  currentDefaultId: string | null
  nextPlatformIds: Set<string>
  nextDefaultId: string | null
  skip: boolean
}

function diffsAreEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) if (!b.has(value)) return false
  return true
}

function formatPlatformList(ids: Iterable<string>, idToSlug: Map<string, string>): string {
  const slugs = Array.from(ids, (id) => idToSlug.get(id) ?? id).sort()
  return slugs.length > 0 ? slugs.join(', ') : '(none)'
}

async function reclassifyDevicePlatforms() {
  const options = parseArgs(process.argv.slice(2))

  const platforms = await prisma.platform.findMany({ select: { id: true, slug: true } })
  const platformBySlug = new Map(platforms.map((p) => [p.slug, p.id]))
  const slugByPlatformId = new Map(platforms.map((p) => [p.id, p.slug]))

  const requiredSlugs = ['android', 'ios', 'linux-arm', 'linux-x86', 'windows-x86']
  const missing = requiredSlugs.filter((slug) => !platformBySlug.has(slug))
  if (missing.length > 0) {
    console.error(
      `Required platforms not found: ${missing.join(', ')}. Run platforms seeder first.`,
    )
    process.exit(1)
  }

  const devices = await prisma.device.findMany({
    where: {
      ...(options.brand ? { brand: { name: options.brand } } : {}),
      ...(options.soc ? { soc: { name: options.soc } } : {}),
    },
    select: {
      id: true,
      modelName: true,
      defaultPlatformId: true,
      brand: { select: { name: true } },
      soc: { select: { name: true, manufacturer: true, architecture: true } },
      platforms: { select: { platformId: true } },
    },
    orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
  })

  console.info(`Inspecting ${devices.length} device${devices.length === 1 ? '' : 's'}.`)
  if (options.brand) console.info(`  Filter: brand="${options.brand}"`)
  if (options.soc) console.info(`  Filter: soc="${options.soc}"`)

  const diffs: DeviceDiff[] = []
  for (const device of devices) {
    const classification = classifyDevice({
      brand: device.brand.name,
      model: device.modelName,
      architecture: device.soc?.architecture,
      socName: device.soc?.name,
      socManufacturer: device.soc?.manufacturer,
    })

    const currentPlatformIds = new Set(device.platforms.map((p) => p.platformId))

    if (isSkipResult(classification)) {
      // Console rows we don't classify. Only record as a diff if the
      // device currently has platforms tagged that we'd need to clear.
      if (currentPlatformIds.size === 0 && device.defaultPlatformId === null) continue
      diffs.push({
        deviceId: device.id,
        brand: device.brand.name,
        model: device.modelName,
        socName: device.soc?.name ?? null,
        currentPlatformIds,
        currentDefaultId: device.defaultPlatformId,
        nextPlatformIds: new Set<string>(),
        nextDefaultId: null,
        skip: true,
      })
      continue
    }

    const nextPlatformIds = new Set<string>()
    for (const slug of classification.platformSlugs) {
      const platformId = platformBySlug.get(slug)
      if (platformId) nextPlatformIds.add(platformId)
    }

    const nextDefaultId = platformBySlug.get(classification.defaultPlatformSlug) ?? null

    const platformsChanged = !diffsAreEqual(currentPlatformIds, nextPlatformIds)
    const defaultChanged = device.defaultPlatformId !== nextDefaultId
    if (!platformsChanged && !defaultChanged) continue

    diffs.push({
      deviceId: device.id,
      brand: device.brand.name,
      model: device.modelName,
      socName: device.soc?.name ?? null,
      currentPlatformIds,
      currentDefaultId: device.defaultPlatformId,
      nextPlatformIds,
      nextDefaultId,
      skip: false,
    })
  }

  if (diffs.length === 0) {
    console.info('✅ No changes needed — every device already matches its computed classification.')
    return
  }

  console.info(`\n${diffs.length} device${diffs.length === 1 ? '' : 's'} would change:\n`)
  for (const diff of diffs) {
    const skipMarker = diff.skip ? ' (skip — console)' : ''
    console.info(
      `  • ${diff.brand} ${diff.model}${diff.socName ? ` [${diff.socName}]` : ''}${skipMarker}`,
    )
    console.info(
      `      platforms: ${formatPlatformList(diff.currentPlatformIds, slugByPlatformId)} → ${formatPlatformList(diff.nextPlatformIds, slugByPlatformId)}`,
    )
    const currentDefaultSlug = diff.currentDefaultId
      ? (slugByPlatformId.get(diff.currentDefaultId) ?? diff.currentDefaultId)
      : '(none)'
    const nextDefaultSlug = diff.nextDefaultId
      ? (slugByPlatformId.get(diff.nextDefaultId) ?? diff.nextDefaultId)
      : '(none)'
    console.info(`      default:   ${currentDefaultSlug} → ${nextDefaultSlug}`)
  }

  if (!options.apply) {
    console.info('\nDry-run only. Re-run with --apply to commit these changes.')
    return
  }

  console.info('\nApplying changes...')
  let updatedCount = 0
  for (const diff of diffs) {
    await prisma.$transaction(async (tx) => {
      await tx.devicePlatform.deleteMany({ where: { deviceId: diff.deviceId } })
      if (diff.nextPlatformIds.size > 0) {
        await tx.devicePlatform.createMany({
          data: Array.from(diff.nextPlatformIds, (platformId) => ({
            deviceId: diff.deviceId,
            platformId,
          })),
        })
      }
      await tx.device.update({
        where: { id: diff.deviceId },
        data: { defaultPlatformId: diff.nextDefaultId },
      })
    })
    updatedCount += 1
  }

  console.info(`✅ Applied changes to ${updatedCount} device${updatedCount === 1 ? '' : 's'}.`)
}

reclassifyDevicePlatforms()
  .catch((error) => {
    console.error('Reclassification failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
