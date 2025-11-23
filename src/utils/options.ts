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

export function deviceOptions(
  devices: { id: string; modelName: string; brand: { name: string } }[],
): Option[] {
  return devices.map((d) => ({
    id: d.id,
    name: `${d.brand.name} ${d.modelName}`,
    badgeName: d.modelName,
  }))
}

export function cpuOptions(
  cpus: { id: string; modelName: string; brand: { name: string } }[],
): Option[] {
  return deviceOptions(cpus)
}

export function gpuOptions(
  gpus: { id: string; modelName: string; brand: { name: string } }[],
): Option[] {
  return deviceOptions(gpus)
}

export function socOptions(socs: { id: string; name: string; manufacturer: string }[]): Option[] {
  return socs.map((s) => ({ id: s.id, name: `${s.manufacturer} ${s.name}`, badgeName: s.name }))
}

// Variant used in v2 filters where the display format is "Name (Manufacturer)"
export function socOptionsParens(
  socs: { id: string; name: string; manufacturer: string }[],
): Option[] {
  return socs.map((s) => ({ id: s.id, name: `${s.name} (${s.manufacturer})` }))
}
