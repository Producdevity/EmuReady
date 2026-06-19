export function getSystemNames(systems: { id: string; name: string }[], ids: string[]): string[] {
  const idSet = new Set(ids)
  return systems.filter((s) => idSet.has(s.id)).map((s) => s.name)
}

export function getEmulatorNames(
  emulators: { id: string; name: string }[],
  ids: string[],
): string[] {
  const idSet = new Set(ids)
  return emulators.filter((e) => idSet.has(e.id)).map((e) => e.name)
}

export function getPerformanceLabels(
  scales: { id: number; label: string }[],
  ids: number[],
): string[] {
  const idSet = new Set(ids)
  return scales.filter((p) => idSet.has(p.id)).map((p) => p.label)
}
