import type { Prisma } from '@orm'

// Factory for building typed select objects from field names
const buildSelect =
  <T extends object>() =>
  (fields: readonly (keyof T)[]) =>
    fields.reduce(
      (select, field) => {
        ;(select as Record<string, true>)[field as string] = true
        return select
      },
      {} as Record<keyof T, true>,
    )

// Model-specific pickers
export const userSelect = buildSelect<Prisma.UserSelect>()
export const gameSelect = buildSelect<Prisma.GameSelect>()
export const systemSelect = buildSelect<Prisma.SystemSelect>()
export const emulatorSelect = buildSelect<Prisma.EmulatorSelect>()
export const performanceSelect = buildSelect<Prisma.PerformanceSelect>()
export const brandSelect = buildSelect<Prisma.DeviceBrandSelect>()

// Commonly reused selections
export const userIdNameSelect = userSelect(['id', 'name'])
export const userNameSelect = userSelect(['name'])
export const gameTitleSelect = gameSelect(['id', 'title'])
export const systemBasicSelect = systemSelect(['id', 'name', 'key'])
export const systemIdSelect = systemSelect(['id'])
export const emulatorBasicSelect = emulatorSelect(['id', 'name', 'logo'])
export const performanceBasicSelect = performanceSelect(['id', 'label', 'rank'])
export const brandBasicSelect = brandSelect(['id', 'name'])

export const listingSummarySelect: Prisma.ListingSelect = {
  id: true,
  title: true,
  system: { select: systemBasicSelect },
  emulator: { select: emulatorBasicSelect },
  performance: { select: performanceBasicSelect },
  _count: { select: { votes: true, comments: true } },
}
