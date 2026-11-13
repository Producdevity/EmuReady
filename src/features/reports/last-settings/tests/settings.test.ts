import { describe, expect, it } from 'vitest'
import { CustomFieldType } from '@orm'
import { customField, fieldId } from './fixtures'
import {
  applyReusableEmulatorSettings,
  createLastEmulatorSettings,
  getReusableEmulatorSettings,
  hasCustomSettingsDraft,
} from '../shared/settings'
import { LastEmulatorSettingsSchema } from '../shared/settings.schemas'

describe('saved emulator settings', () => {
  it('retains false and zero while excluding empty, invalid and structured values', () => {
    const snapshot = createLastEmulatorSettings(
      [false, 0, 'Turnip V15', '', ' ', null, undefined, {}, [], Infinity].map((value, index) => ({
        customFieldDefinitionId: fieldId(index + 10),
        value,
      })),
    )
    expect(snapshot.values.map((entry) => entry.value)).toEqual([false, 0, 'Turnip V15'])
    expect(LastEmulatorSettingsSchema.safeParse(snapshot).success).toBe(true)
  })

  it('drops removed fields, options, changed types, invalid URLs and out-of-range numbers', () => {
    const fields = [
      customField(10, CustomFieldType.BOOLEAN),
      customField(11, CustomFieldType.RANGE, { rangeMin: 0, rangeMax: 10 }),
      customField(12, CustomFieldType.SELECT, { parsedOptions: [{ value: 'new', label: 'New' }] }),
      customField(13, CustomFieldType.URL),
      customField(14, CustomFieldType.RANGE),
      customField(15, CustomFieldType.TEXT),
    ]
    const snapshot = createLastEmulatorSettings(
      [
        false,
        11,
        'removed-option',
        'invalid URL',
        'old text value',
        'driver-v15',
        'removed-field',
      ].map((value, index) => ({ customFieldDefinitionId: fieldId(index + 10), value })),
    )
    expect(getReusableEmulatorSettings(snapshot, fields)).toEqual([
      { customFieldDefinitionId: fieldId(10), value: false },
      { customFieldDefinitionId: fieldId(15), value: 'driver-v15' },
    ])
  })

  it('keeps inclusive range bounds and validates select options from the current definitions', () => {
    const fields = [
      customField(10, CustomFieldType.RANGE, { rangeMin: 0, rangeMax: 10 }),
      customField(11, CustomFieldType.RANGE, { rangeMin: 0, rangeMax: 10 }),
      customField(12, CustomFieldType.SELECT, { options: [{ value: 'vulkan', label: 'Vulkan' }] }),
    ]
    const snapshot = createLastEmulatorSettings(
      [0, 10, 'vulkan'].map((value, index) => ({
        customFieldDefinitionId: fieldId(index + 10),
        value,
      })),
    )
    expect(getReusableEmulatorSettings(snapshot, fields)).toEqual(snapshot.values)
  })

  it('does not reuse a select value after all options are removed', () => {
    const snapshot = createLastEmulatorSettings([
      { customFieldDefinitionId: fieldId(10), value: 'vulkan' },
    ])
    expect(
      getReusableEmulatorSettings(snapshot, [customField(10, CustomFieldType.SELECT)]),
    ).toEqual([])
  })

  it('keeps defaults for new fields when applying the remaining saved settings', () => {
    const fields = [
      customField(10),
      customField(11, CustomFieldType.BOOLEAN, { defaultValue: true }),
    ]
    const current = [{ customFieldDefinitionId: fieldId(10), value: '' }]
    const saved = [{ customFieldDefinitionId: fieldId(10), value: '1.2.3' }]
    expect(applyReusableEmulatorSettings(current, saved, fields)).toEqual([
      { customFieldDefinitionId: fieldId(10), value: '1.2.3' },
      { customFieldDefinitionId: fieldId(11), value: true },
    ])
    expect(current[0].value).toBe('')
  })

  it('matches definition IDs after fields are reordered', () => {
    const fields = [customField(11, CustomFieldType.BOOLEAN), customField(10)]
    const snapshot = createLastEmulatorSettings([
      { customFieldDefinitionId: fieldId(10), value: '1.2.3' },
      { customFieldDefinitionId: fieldId(11), value: false },
    ])
    expect(getReusableEmulatorSettings(snapshot, fields)).toEqual([
      { customFieldDefinitionId: fieldId(11), value: false },
      { customFieldDefinitionId: fieldId(10), value: '1.2.3' },
    ])
  })

  it('recognizes manual false and zero values as drafts instead of empty defaults', () => {
    const fields = [
      customField(10, CustomFieldType.BOOLEAN, { defaultValue: true }),
      customField(11, CustomFieldType.RANGE, { rangeMin: 5 }),
    ]
    expect(
      hasCustomSettingsDraft(
        [
          { customFieldDefinitionId: fieldId(10), value: false },
          { customFieldDefinitionId: fieldId(11), value: 0 },
        ],
        fields,
      ),
    ).toBe(true)
    expect(hasCustomSettingsDraft([], fields)).toBe(false)
  })

  it('returns an empty snapshot after a successful submission without custom values', () => {
    expect(createLastEmulatorSettings(undefined)).toEqual({ version: 1, values: [] })
  })

  it.each([
    { version: 2, values: [] },
    { version: 1, values: [{ customFieldDefinitionId: 'invalid', value: 'text' }] },
    { version: 1, values: [{ customFieldDefinitionId: fieldId(10), value: {} }] },
  ])('rejects incompatible stored settings: %j', (snapshot) => {
    expect(LastEmulatorSettingsSchema.safeParse(snapshot).success).toBe(false)
  })
})
