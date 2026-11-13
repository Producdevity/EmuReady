import { type Prisma } from '@orm/client'

export const CONFIG_EMULATOR_SELECT = {
  id: true,
  verifiedDevelopers: { select: { userId: true } },
  customFieldCategories: {
    select: { id: true, name: true, displayOrder: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  },
  customFieldDefinitions: {
    select: {
      id: true,
      name: true,
      label: true,
      type: true,
      category: { select: { name: true } },
      options: true,
      defaultValue: true,
      placeholder: true,
      rangeMin: true,
      rangeMax: true,
      rangeUnit: true,
      rangeDecimals: true,
      isRequired: true,
      displayOrder: true,
      categoryOrder: true,
      _count: { select: { listingValues: true, pcListingValues: true } },
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  },
} satisfies Prisma.EmulatorSelect

export type ConfigEmulatorRecord = Prisma.EmulatorGetPayload<{
  select: typeof CONFIG_EMULATOR_SELECT
}>
