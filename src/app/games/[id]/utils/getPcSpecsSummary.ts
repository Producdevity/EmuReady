import { getCpuLabel } from '@/features/hardware/cpu/shared/cpu-format'
import { getGpuLabel } from '@/features/hardware/gpu/shared/gpu-format'
import type { RouterOutput } from '@/types/trpc'

type Game = NonNullable<RouterOutput['games']['byId']>
type PcListing = Game['pcListings'][number]

interface PcSpecsSummary {
  summary: string
  details: { label: string; value: string }[]
}

export function getPcSpecsSummary(listing: PcListing): PcSpecsSummary {
  const details = (
    [
      listing.cpu && { label: 'CPU', value: getCpuLabel(listing.cpu) },
      listing.gpu && { label: 'GPU', value: getGpuLabel(listing.gpu) },
      listing.memorySize !== null && listing.memorySize !== undefined
        ? { label: 'Memory', value: `${listing.memorySize}GB RAM` }
        : null,
      listing.os ? { label: 'OS', value: listing.os } : null,
    ] satisfies (PcSpecsSummary['details'][number] | null)[]
  ).filter((spec): spec is PcSpecsSummary['details'][number] => spec !== null)

  const summary =
    details
      .slice(0, 2)
      .map((detail) => detail.value)
      .join(' • ') || 'Specs unavailable'

  return { summary, details }
}
