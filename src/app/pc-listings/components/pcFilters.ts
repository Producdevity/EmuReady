import { type RouterOutput } from '@/types/trpc'
import { PlatformScope, type System } from '@orm'

export type EmulatorListItem = RouterOutput['emulators']['get']['emulators'][number]
export type CpuListItem = RouterOutput['cpus']['get']['cpus'][number]
export type GpuListItem = RouterOutput['gpus']['get']['gpus'][number]

export function isPcCompatibleEmulator(emulator: EmulatorListItem): boolean {
  if (!emulator.platforms || emulator.platforms.length === 0) return true
  return emulator.platforms.some(
    (entry) =>
      entry.platform.scope === PlatformScope.DESKTOP ||
      entry.platform.scope === PlatformScope.UNIVERSAL,
  )
}

export function filterPcEmulators(emulators: EmulatorListItem[]): EmulatorListItem[] {
  return emulators.filter(isPcCompatibleEmulator)
}

function collectPcCompatibleSystemIds(emulators: EmulatorListItem[]): Set<string> {
  const ids = new Set<string>()
  for (const emulator of emulators) {
    if (!isPcCompatibleEmulator(emulator)) continue
    for (const system of emulator.systems) ids.add(system.id)
  }
  return ids
}

export function filterPcSystems(systems: System[], emulators: EmulatorListItem[]): System[] {
  const pcSystemIds = collectPcCompatibleSystemIds(emulators)
  if (pcSystemIds.size === 0) return systems
  return systems.filter((system) => pcSystemIds.has(system.id))
}
