import { type PrismaClient } from '@orm'

type PlatformSlug = 'android' | 'ios' | 'linux-arm' | 'linux-x86' | 'windows-x86'

export type DeviceClassification = {
  platformSlugs: PlatformSlug[]
  defaultPlatformSlug: PlatformSlug
}

export type DeviceClassificationOrSkip = DeviceClassification | { skip: true }

export interface ClassifyDeviceArgs {
  brand: string
  model: string
  architecture: string | null | undefined
  socName: string | null | undefined
  socManufacturer: string | null | undefined
}

interface MatchCriteria {
  brand?: string | RegExp
  model?: RegExp
  socName?: string
  socNameRegex?: RegExp
  socManufacturer?: string
  architecture?: 'X86' | 'X86_64' | 'ARM32' | 'ARM64'
  archIsArm?: true
}

interface OverrideRule {
  description: string
  match: MatchCriteria
  classification: DeviceClassificationOrSkip
}

const LINUX_ARM_ONLY: DeviceClassification = {
  platformSlugs: ['linux-arm'],
  defaultPlatformSlug: 'linux-arm',
}

const LINUX_ARM_PRIMARY: DeviceClassification = {
  platformSlugs: ['linux-arm', 'android'],
  defaultPlatformSlug: 'linux-arm',
}

const ANDROID_PRIMARY: DeviceClassification = {
  platformSlugs: ['android', 'linux-arm'],
  defaultPlatformSlug: 'android',
}

const ANDROID_ONLY: DeviceClassification = {
  platformSlugs: ['android'],
  defaultPlatformSlug: 'android',
}

const WINDOWS_X86: DeviceClassification = {
  platformSlugs: ['windows-x86', 'linux-x86'],
  defaultPlatformSlug: 'windows-x86',
}

const LINUX_X86: DeviceClassification = {
  platformSlugs: ['linux-x86', 'windows-x86'],
  defaultPlatformSlug: 'linux-x86',
}

// First-match-wins. Order matters: most specific rules at the top.
// Each rule cites its source in `description` so future maintainers can
// re-verify if the manufacturer changes their default-OS strategy.
const OVERRIDE_RULES: OverrideRule[] = [
  // === Consoles that don't map to any of our platform slugs ===
  {
    description: 'Microsoft Xbox One generation consoles run Xbox OS — not classifiable',
    match: { brand: 'Microsoft', model: /xbox one/i },
    classification: { skip: true },
  },
  {
    description: 'Sony PlayStation consoles run proprietary OS — not classifiable',
    match: { brand: 'Sony', model: /playstation/i },
    classification: { skip: true },
  },

  // === x86 SteamOS-shipped handhelds ===
  {
    description: 'Steam Deck (Aerith / Sephiroth APU) ships with SteamOS',
    match: { brand: /^(Valve|Steam Deck)$/, model: /steam deck|oled/i },
    classification: LINUX_X86,
  },
  {
    description: 'Zotac Zone 2 ships with Zotac Manjaro Linux',
    match: { brand: 'Zotac', model: /zone 2/i },
    classification: LINUX_X86,
  },
  {
    description: 'Lenovo Legion Go S 8APU1 Z1 Extreme / 32GB is the SteamOS SKU (Nebula Violet)',
    match: { brand: 'Lenovo', model: /legion go s.*8apu1.*z1 extreme.*32 ?gb/i },
    classification: LINUX_X86,
  },
  {
    description: 'Generic SteamOS-edition naming → linux-x86',
    match: { model: /steam\s*os/i, architecture: 'X86_64' },
    classification: LINUX_X86,
  },

  // === Brand-specific ARM rules (must precede SoC-only rules) ===
  {
    description: 'Trimui handhelds are exclusively Linux (Smart Pro, Brick, etc.)',
    match: { brand: 'Trimui' },
    classification: LINUX_ARM_ONLY,
  },
  {
    description: 'Khadas Edge2 / Edge2 Pro on RK3588S are Linux-first SBCs',
    match: { brand: 'Khadas', socNameRegex: /^RK3588/i },
    classification: LINUX_ARM_PRIMARY,
  },
  {
    description: 'MagicX Zero 40 is Android-only (capacitive touchscreen DS emulator)',
    match: { brand: 'MagicX', model: /zero 40/i },
    classification: ANDROID_ONLY,
  },
  {
    description: 'MINILOONG Pocket on RK3566 ships Linux-only (LoongOS)',
    match: { brand: 'MINILOONG', socName: 'RK3566' },
    classification: LINUX_ARM_ONLY,
  },
  {
    description:
      'Anbernic + Allwinner SoCs are Linux-first retro handhelds (RG35XX, RG40XX, RG CubeXX, etc.)',
    match: { brand: 'Anbernic', socManufacturer: 'Allwinner' },
    classification: LINUX_ARM_ONLY,
  },
  {
    description:
      'Anbernic + Unisoc Tiger SoCs ship Android (RG505, RG405M, RG556, RG406H/V, RG476H, RG Cube, RG Slide, RG VITA)',
    match: { brand: 'Anbernic', socNameRegex: /^Tiger T/i },
    classification: ANDROID_PRIMARY,
  },
  {
    description: 'Anbernic RG DS on RK3568 ships Android 14',
    match: { brand: 'Anbernic', socName: 'RK3568' },
    classification: ANDROID_PRIMARY,
  },
  {
    description: 'Anbernic + RK3566 (RG353 series) — Linux boots from SD by default',
    match: { brand: 'Anbernic', socName: 'RK3566' },
    classification: LINUX_ARM_PRIMARY,
  },
  {
    description: 'PowKiddy + RK3566 (RGB30 etc.) ships JELOS (Linux)',
    match: { brand: 'PowKiddy', socName: 'RK3566' },
    classification: LINUX_ARM_PRIMARY,
  },
  {
    description:
      'Retroid is Android-first; community Linux ports (ROCKNIX) keep linux-arm supported',
    match: { brand: 'Retroid', archIsArm: true },
    classification: ANDROID_PRIMARY,
  },
  {
    description: 'AYN handhelds default to Android with Linux community support',
    match: { brand: 'AYN', archIsArm: true },
    classification: ANDROID_PRIMARY,
  },

  // === SoC-only ARM rules (catch-alls for any brand using these chips) ===
  {
    description: 'Allwinner H700 — Anbernic-exclusive Linux retro handhelds',
    match: { socName: 'H700', socManufacturer: 'Allwinner' },
    classification: LINUX_ARM_ONLY,
  },
  {
    description:
      'Allwinner A133 / A133P — budget Linux retro handhelds (Trimui, Anbernic, Powkiddy V90S)',
    match: { socNameRegex: /^A133P?$/, socManufacturer: 'Allwinner' },
    classification: LINUX_ARM_ONLY,
  },
  {
    description:
      'Allwinner A527 — newer Mali-G57 chip used by Android handhelds (RGB50, GameMT E6 Max)',
    match: { socName: 'A527', socManufacturer: 'Allwinner' },
    classification: ANDROID_PRIMARY,
  },
  {
    description:
      'Rockchip RK3326 — exclusively Linux ecosystem (RG350/RG351, RGB10/20, Miyoo Mini)',
    match: { socName: 'RK3326' },
    classification: LINUX_ARM_ONLY,
  },
  {
    description:
      'Rockchip RK3399 — Linux-primary higher-end older handhelds (RG552, ODROID Go Super)',
    match: { socName: 'RK3399' },
    classification: LINUX_ARM_PRIMARY,
  },
  {
    description:
      'Rockchip RK3566 — Linux-primary retro handheld ecosystem (catchall after brand rules)',
    match: { socName: 'RK3566' },
    classification: LINUX_ARM_PRIMARY,
  },
  {
    description: 'Rockchip RK3568 — Android-targeted handheld SoC',
    match: { socName: 'RK3568' },
    classification: ANDROID_PRIMARY,
  },
  {
    description: 'Rockchip RK3588 / RK3588S — Linux-primary SBCs and premium handhelds',
    match: { socNameRegex: /^RK3588/, socManufacturer: 'Rockchip' },
    classification: LINUX_ARM_PRIMARY,
  },
]

const IOS_BRANDS = new Set(['Apple'])

function socNameEquals(
  rule: string,
  socName: string | null | undefined,
  mfr: string | null | undefined,
): boolean {
  if (!socName) return false
  if (socName === rule) return true
  // Local seed data sometimes prefixes the name with the manufacturer
  // ("Allwinner H700"); production stores just "H700" + manufacturer
  // separately. Accept either shape.
  if (mfr && socName === `${mfr} ${rule}`) return true
  return false
}

function socNameMatchesRegex(
  rule: RegExp,
  socName: string | null | undefined,
  mfr: string | null | undefined,
): boolean {
  if (!socName) return false
  if (rule.test(socName)) return true
  if (mfr && socName.startsWith(`${mfr} `)) {
    return rule.test(socName.slice(mfr.length + 1))
  }
  return false
}

function ruleMatches(rule: OverrideRule, args: ClassifyDeviceArgs): boolean {
  const arch = args.architecture?.toUpperCase()
  if (rule.match.architecture && rule.match.architecture !== arch) return false
  if (rule.match.archIsArm && !arch?.startsWith('ARM')) return false
  if (rule.match.brand) {
    if (rule.match.brand instanceof RegExp) {
      if (!rule.match.brand.test(args.brand)) return false
    } else if (rule.match.brand !== args.brand) {
      return false
    }
  }
  if (rule.match.model && !rule.match.model.test(args.model)) return false
  if (rule.match.socManufacturer && rule.match.socManufacturer !== args.socManufacturer) {
    return false
  }
  if (
    rule.match.socName &&
    !socNameEquals(rule.match.socName, args.socName, args.socManufacturer)
  ) {
    return false
  }
  if (
    rule.match.socNameRegex &&
    !socNameMatchesRegex(rule.match.socNameRegex, args.socName, args.socManufacturer)
  ) {
    return false
  }
  return true
}

export function classifyDevice(args: ClassifyDeviceArgs): DeviceClassificationOrSkip {
  if (IOS_BRANDS.has(args.brand)) {
    return { platformSlugs: ['ios'], defaultPlatformSlug: 'ios' }
  }

  for (const rule of OVERRIDE_RULES) {
    if (ruleMatches(rule, args)) return rule.classification
  }

  const arch = args.architecture?.toUpperCase()

  if (arch === 'X86_64' || arch === 'X86') return WINDOWS_X86

  // ARM32/ARM64 or unknown architecture: Android is the primary target
  // unless an override rule above declared otherwise.
  return ANDROID_ONLY
}

export function isSkipResult(result: DeviceClassificationOrSkip): result is { skip: true } {
  return 'skip' in result
}

async function devicePlatformsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding device platforms...')

  const platforms = await prisma.platform.findMany({ select: { id: true, slug: true } })
  const platformBySlug = new Map(platforms.map((p) => [p.slug, p.id]))

  const requiredSlugs: PlatformSlug[] = ['android', 'ios', 'linux-arm', 'linux-x86', 'windows-x86']
  const missing = requiredSlugs.filter((slug) => !platformBySlug.has(slug))
  if (missing.length > 0) {
    console.warn(
      `⚠️  Required platforms not found: ${missing.join(', ')}. Run platforms seeder first.`,
    )
    return
  }

  // Production-safe: skip any device that already has platform data —
  // presence of rows or a non-null defaultPlatformId means "initial
  // seed already ran" or "admin has customized this". Never overwrite.
  const devices = await prisma.device.findMany({
    where: {
      AND: [{ platforms: { none: {} } }, { defaultPlatformId: null }],
    },
    select: {
      id: true,
      modelName: true,
      brand: { select: { name: true } },
      soc: { select: { name: true, manufacturer: true, architecture: true } },
    },
  })

  let processed = 0
  let skipped = 0

  for (const device of devices) {
    const classification = classifyDevice({
      brand: device.brand.name,
      model: device.modelName,
      architecture: device.soc?.architecture,
      socName: device.soc?.name,
      socManufacturer: device.soc?.manufacturer,
    })

    if (isSkipResult(classification)) {
      skipped += 1
      continue
    }

    for (const slug of classification.platformSlugs) {
      const platformId = platformBySlug.get(slug)
      if (!platformId) continue
      await prisma.devicePlatform.create({
        data: { deviceId: device.id, platformId },
      })
    }

    const defaultPlatformId = platformBySlug.get(classification.defaultPlatformSlug)
    if (defaultPlatformId) {
      await prisma.device.update({
        where: { id: device.id },
        data: { defaultPlatformId },
      })
    }

    processed += 1
  }

  const skippedSuffix = skipped > 0 ? `, ${skipped} skipped (consoles)` : ''
  console.info(
    `✅ Device platforms seeded successfully (${processed} new device${processed === 1 ? '' : 's'} tagged${skippedSuffix})`,
  )
}

export default devicePlatformsSeeder
