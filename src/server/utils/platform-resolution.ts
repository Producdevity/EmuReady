import { ResourceError } from '@/lib/errors'
import { isPlatformSlugCompatibleWithOs } from '@/utils/platform-os-mapping'
import { type PcOs } from '@orm'

// Precedence: explicit `requested` → device default → null.
// An empty support set means "supports any" (fail-open), not "none".
export function resolveHandheldPlatformId(args: {
  requested: string | null | undefined
  deviceSupported: ReadonlySet<string>
  emulatorSupported: ReadonlySet<string>
  deviceDefault: string | null
}): string | null {
  const { requested, deviceSupported, emulatorSupported, deviceDefault } = args

  if (requested) {
    if (deviceSupported.size > 0 && !deviceSupported.has(requested)) {
      throw ResourceError.platform.notAvailableForDevice()
    }
    if (emulatorSupported.size > 0 && !emulatorSupported.has(requested)) {
      throw ResourceError.platform.notSupportedByEmulator()
    }
    return requested
  }

  if (!deviceDefault) return null
  // If the seeded default isn't actually in its own support set, drop it.
  if (deviceSupported.size > 0 && !deviceSupported.has(deviceDefault)) return null
  if (emulatorSupported.size > 0 && !emulatorSupported.has(deviceDefault)) return null
  return deviceDefault
}

// Precedence: explicit `requested` → OS-derived fallback → null.
// Empty emulatorSupported means "supports any" (fail-open).
// Contract: when `requested` is set, the caller MUST have resolved the
// platform row and pass `requestedSlug` as string-or-null. Passing
// `undefined` alongside a non-null `requested` silently skips OS
// compatibility validation.
export function resolvePcPlatformId(args: {
  requested: string | null | undefined
  requestedSlug: string | null | undefined
  emulatorSupported: ReadonlySet<string>
  os: PcOs
  osDerivedFallback: { id: string } | null
}): string | null {
  const { requested, requestedSlug, emulatorSupported, os, osDerivedFallback } = args

  if (requested) {
    if (emulatorSupported.size > 0 && !emulatorSupported.has(requested)) {
      throw ResourceError.platform.notSupportedByEmulator()
    }
    // `null` = caller confirmed the platform id doesn't exist in the DB.
    if (requestedSlug === null) throw ResourceError.platform.notFound()
    if (!isPlatformSlugCompatibleWithOs(requestedSlug ?? null, os)) {
      throw ResourceError.platform.inconsistentWithOs()
    }
    return requested
  }

  if (!osDerivedFallback) return null
  if (emulatorSupported.size > 0 && !emulatorSupported.has(osDerivedFallback.id)) return null
  return osDerivedFallback.id
}
