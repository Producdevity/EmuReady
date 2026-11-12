import { CustomFieldType } from '@orm'
import { type ConfigEmulatorRecord } from '../server/persistence/config.prisma'

export const TARGET_ID = '00000000-0000-4000-a000-000000000001'
export const SOURCE_ID = '00000000-0000-4000-a000-000000000002'
export const CATEGORY_ID = '00000000-0000-4000-a000-000000000003'

export function configRecord(): ConfigEmulatorRecord {
  return {
    id: TARGET_ID,
    verifiedDevelopers: [],
    customFieldCategories: [
      { id: CATEGORY_ID, name: 'Graphics', displayOrder: 0 },
      { id: '00000000-0000-4000-a000-000000000004', name: 'Advanced', displayOrder: 1 },
    ],
    customFieldDefinitions: [
      {
        name: 'renderer',
        label: 'Renderer',
        type: CustomFieldType.SELECT,
        category: { name: 'Graphics' },
        options: [
          { value: 'vulkan', label: 'Vulkan' },
          { value: 'opengl', label: 'OpenGL' },
        ],
        defaultValue: 'vulkan',
        placeholder: null,
        rangeMin: null,
        rangeMax: null,
        rangeUnit: null,
        rangeDecimals: null,
        isRequired: false,
        displayOrder: 0,
        categoryOrder: 1,
        _count: { listingValues: 0, pcListingValues: 0 },
      },
    ],
  }
}
