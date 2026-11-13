// Eden's ResolutionSetup enum order: eden-emulator/mirror@63e957b1, src/common/settings_enums.h.
export const EDEN_RESOLUTION_SCALES = [
  { setup: 0, multiplier: 0.25 },
  { setup: 1, multiplier: 0.5 },
  { setup: 2, multiplier: 0.75 },
  { setup: 3, multiplier: 1 },
  { setup: 4, multiplier: 1.25 },
  { setup: 5, multiplier: 1.5 },
  { setup: 6, multiplier: 2 },
  { setup: 7, multiplier: 3 },
  { setup: 8, multiplier: 4 },
  { setup: 9, multiplier: 5 },
  { setup: 10, multiplier: 6 },
  { setup: 11, multiplier: 7 },
  { setup: 12, multiplier: 8 },
] as const

type ResolutionScale = (typeof EDEN_RESOLUTION_SCALES)[number]
export type ResolutionSetup = ResolutionScale['setup']
export const DEFAULT_RESOLUTION_SETUP: ResolutionSetup = 3

export function parseEdenResolutionMultiplier(value: string): ResolutionSetup | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'native') return DEFAULT_RESOLUTION_SETUP
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return (
      EDEN_RESOLUTION_SCALES.find((scale) => scale.multiplier === Number(normalized))?.setup ?? null
    )
  }

  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*x(?:\s|$|\()/)
  if (!match) return null
  const multiplier = Number(match[1])
  const maximum = EDEN_RESOLUTION_SCALES[EDEN_RESOLUTION_SCALES.length - 1]
  if (multiplier >= maximum.multiplier) return maximum.setup
  let closest: ResolutionScale = EDEN_RESOLUTION_SCALES[0]
  for (const scale of EDEN_RESOLUTION_SCALES) {
    if (Math.abs(scale.multiplier - multiplier) < Math.abs(closest.multiplier - multiplier)) {
      closest = scale
    }
  }
  return closest.setup
}

export function formatEdenResolutionMultiplier(setup: number): string {
  const multiplier = EDEN_RESOLUTION_SCALES.find((scale) => scale.setup === setup)?.multiplier ?? 1
  return `${Number.isInteger(multiplier) ? multiplier.toFixed(1) : multiplier}x`
}
