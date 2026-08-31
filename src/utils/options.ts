export type Option = { id: string; name: string; badgeName?: string }

export function systemOptions(systems: { id: string; name: string }[]): Option[] {
  return systems.map((s) => ({ id: s.id, name: s.name }))
}

export function emulatorOptions(emulators: { id: string; name: string }[]): Option[] {
  return emulators.map((e) => ({ id: e.id, name: e.name }))
}

export function performanceOptions(performance: { id: number; label: string }[]): Option[] {
  return performance.map(({ id, label }) => ({ id: id.toString(), name: label }))
}
