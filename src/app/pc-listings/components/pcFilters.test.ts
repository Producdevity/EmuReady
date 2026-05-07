import { describe, expect, it } from 'vitest'
import { PlatformScope, type System } from '@orm'
import {
  filterPcEmulators,
  filterPcSystems,
  isPcCompatibleEmulator,
  type EmulatorListItem,
} from './pcFilters'

type EmulatorPlatformEntry = EmulatorListItem['platforms'][number]
type EmulatorSystemEntry = EmulatorListItem['systems'][number]

function makeSystem(id: string, name: string, key: string | null = null) {
  return {
    id,
    name,
    key,
    tgdbPlatformId: null,
  } satisfies System
}

function makeEmulator(
  id: string,
  scopes: PlatformScope[] | null,
  systems: EmulatorSystemEntry[] = [],
): EmulatorListItem {
  const platforms: EmulatorPlatformEntry[] =
    scopes === null
      ? []
      : scopes.map((scope, i) => ({
          id: `ep-${id}-${i}`,
          createdAt: new Date(),
          emulatorId: id,
          platformId: `p-${id}-${i}`,
          platform: {
            id: `p-${id}-${i}`,
            name: scope,
            slug: `${scope.toLowerCase()}-s`,
            scope,
          },
        }))
  return {
    id,
    name: `Emu ${id}`,
    description: null,
    logo: null,
    repositoryUrl: null,
    officialUrl: null,
    androidGithubRepoUrl: null,
    systems,
    verifiedDevelopers: [],
    platforms,
    _count: { listings: 0, systems: systems.length },
  }
}

describe('isPcCompatibleEmulator', () => {
  it('returns true when the emulator has no platforms mapped (fail-open)', () => {
    const emulator = makeEmulator('e1', null)
    expect(isPcCompatibleEmulator(emulator)).toBe(true)
  })

  it('returns true when at least one platform is DESKTOP', () => {
    const emulator = makeEmulator('e1', [PlatformScope.DESKTOP])
    expect(isPcCompatibleEmulator(emulator)).toBe(true)
  })

  it('returns true when at least one platform is UNIVERSAL (e.g., linux-arm)', () => {
    const emulator = makeEmulator('e1', [PlatformScope.MOBILE, PlatformScope.UNIVERSAL])
    expect(isPcCompatibleEmulator(emulator)).toBe(true)
  })

  it('returns false when all platforms are MOBILE', () => {
    const emulator = makeEmulator('e1', [PlatformScope.MOBILE])
    expect(isPcCompatibleEmulator(emulator)).toBe(false)
  })
})

describe('filterPcEmulators', () => {
  it('keeps only emulators with at least one DESKTOP or UNIVERSAL platform', () => {
    const emulators = [
      makeEmulator('desktop-only', [PlatformScope.DESKTOP]),
      makeEmulator('mobile-only', [PlatformScope.MOBILE]),
      makeEmulator('universal', [PlatformScope.UNIVERSAL]),
      makeEmulator('mixed', [PlatformScope.MOBILE, PlatformScope.DESKTOP]),
    ]
    const result = filterPcEmulators(emulators)
    expect(result.map((e) => e.id).sort()).toEqual(['desktop-only', 'mixed', 'universal'])
  })

  it('fail-opens: emulators with no platforms mapped remain visible', () => {
    const emulators = [makeEmulator('unmapped', null)]
    expect(filterPcEmulators(emulators).map((e) => e.id)).toEqual(['unmapped'])
  })
})

describe('filterPcSystems', () => {
  it('excludes systems with no PC-compatible emulators (e.g., Microsoft Windows)', () => {
    const systems = [
      makeSystem('sys-switch', 'Nintendo Switch', 'nintendo_switch'),
      makeSystem('sys-windows', 'Microsoft Windows', 'microsoft_windows'),
    ]
    const emulators = [
      makeEmulator(
        'e1',
        [PlatformScope.DESKTOP, PlatformScope.MOBILE],
        [{ id: 'sys-switch', name: 'Nintendo Switch', key: 'nintendo_switch' }],
      ),
    ]
    const result = filterPcSystems(systems, emulators)
    expect(result.map((s) => s.id)).toEqual(['sys-switch'])
  })

  it('includes systems reachable via a UNIVERSAL emulator (linux-arm-only emulator on Steam Deck)', () => {
    const systems = [
      makeSystem('sys-dreamcast', 'Dreamcast', 'sega_dreamcast'),
      makeSystem('sys-mobile-only', 'Mobile Only', 'mobile_only'),
    ]
    const emulators = [
      makeEmulator(
        'e1',
        [PlatformScope.UNIVERSAL],
        [{ id: 'sys-dreamcast', name: 'Dreamcast', key: 'sega_dreamcast' }],
      ),
      makeEmulator(
        'e2',
        [PlatformScope.MOBILE],
        [{ id: 'sys-mobile-only', name: 'Mobile Only', key: 'mobile_only' }],
      ),
    ]
    const result = filterPcSystems(systems, emulators)
    expect(result.map((s) => s.id)).toEqual(['sys-dreamcast'])
  })

  it('fail-opens when no emulators are loaded yet — does not hide anything', () => {
    const systems = [makeSystem('sys-a', 'A', 'a'), makeSystem('sys-b', 'B', 'b')]
    expect(filterPcSystems(systems, [])).toEqual(systems)
  })

  it('treats unmapped emulators as PC-compatible (fail-open path for systems too)', () => {
    const systems = [makeSystem('sys-a', 'A', 'a')]
    const emulators = [makeEmulator('e1', null, [{ id: 'sys-a', name: 'A', key: 'a' }])]
    expect(filterPcSystems(systems, emulators).map((s) => s.id)).toEqual(['sys-a'])
  })
})
