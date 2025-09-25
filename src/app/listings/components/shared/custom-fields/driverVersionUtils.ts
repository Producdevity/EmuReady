import type { DriverRelease } from './hooks/useDriverVersions'

export function normalizeFilename(input: string | null | undefined): string {
  if (!input) return ''
  const str = String(input).trim()
  if (!str) return ''
  const parts = str.split('/')
  return parts[parts.length - 1] || str
}

export function findDriverReleaseByFilename(
  releases: DriverRelease[] | null | undefined,
  filename: string | null | undefined,
): DriverRelease | null {
  const file = normalizeFilename(filename)
  if (!releases || !file) return null

  for (const rel of releases) {
    if (rel.value && rel.value.includes('|||')) {
      const suffix = rel.value.split('|||')[1]
      if (suffix === file) return rel
    }
    if (rel.assets && rel.assets.some((a) => a.name === file)) return rel
  }

  return null
}

export function reconcileDriverValue(
  currentValue: string | null | undefined,
  releases: DriverRelease[] | null | undefined,
): string | null {
  const current = String(currentValue ?? '').trim()
  if (!current || current.includes('|||')) return null
  const match = findDriverReleaseByFilename(releases, current)
  return match ? match.value : null
}
