export function getSystemNames(systems: { id: string; name: string }[], ids: string[]): string[] {
  const idSet = new Set(ids)
  return systems.filter((s) => idSet.has(s.id)).map((s) => s.name)
}

export function getDeviceNames(
  devices: { id: string; modelName: string; brand: { name: string } }[],
  ids: string[],
): string[] {
  const idSet = new Set(ids)
  return devices.filter((d) => idSet.has(d.id)).map((d) => `${d.brand.name} ${d.modelName}`)
}

export function getSocNames(
  socs: { id: string; name: string; manufacturer: string }[],
  ids: string[],
): string[] {
  const idSet = new Set(ids)
  return socs.filter((s) => idSet.has(s.id)).map((s) => `${s.manufacturer} ${s.name}`)
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

// PC-only helpers
export function getCpuNames(
  cpus: { id: string; modelName: string; brand: { name: string } }[],
  ids: string[],
): string[] {
  return getDeviceNames(
    cpus.map((c) => ({ id: c.id, modelName: c.modelName, brand: { name: c.brand.name } })),
    ids,
  )
}

export function getGpuNames(
  gpus: { id: string; modelName: string; brand: { name: string } }[],
  ids: string[],
): string[] {
  return getDeviceNames(
    gpus.map((g) => ({ id: g.id, modelName: g.modelName, brand: { name: g.brand.name } })),
    ids,
  )
}
