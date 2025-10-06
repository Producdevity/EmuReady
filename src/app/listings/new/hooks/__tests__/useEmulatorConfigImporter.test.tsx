import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseEmulatorConfig, registerEmulatorConfigMapper } from '@/shared/emulator-config'
import { CustomFieldType } from '@orm'
import { useEmulatorConfigImporter } from '../useEmulatorConfigImporter'
import type { CustomFieldDefinitionWithOptions } from '../../form-schemas/createDynamicListingSchema'
import type * as EmulatorConfigModule from '@/shared/emulator-config'

vi.mock('@/shared/emulator-config', async () => {
  const actual = await vi.importActual<typeof EmulatorConfigModule>('@/shared/emulator-config')
  return {
    ...actual,
    parseEmulatorConfig: vi.fn(),
  }
})

const mockedParse = vi.mocked(parseEmulatorConfig)

beforeEach(() => {
  mockedParse.mockReset()
  registerEmulatorConfigMapper({
    slug: 'eden',
    fileTypes: ['ini'],
    parse: (raw, fields) => mockedParse('eden', raw, fields),
  })
})

function buildField(
  overrides: Pick<CustomFieldDefinitionWithOptions, 'id' | 'name' | 'label' | 'type'> &
    Partial<CustomFieldDefinitionWithOptions>,
): CustomFieldDefinitionWithOptions {
  const timestamp = new Date('2025-01-01T00:00:00.000Z')

  return {
    emulatorId: overrides.emulatorId ?? 'eden-emulator-id',
    categoryId: overrides.categoryId ?? null,
    categoryOrder: overrides.categoryOrder ?? 0,
    options: overrides.options ?? null,
    placeholder: overrides.placeholder ?? null,
    rangeMin: overrides.rangeMin ?? null,
    rangeMax: overrides.rangeMax ?? null,
    rangeUnit: overrides.rangeUnit ?? null,
    rangeDecimals: overrides.rangeDecimals ?? null,
    isRequired: overrides.isRequired ?? false,
    displayOrder: overrides.displayOrder ?? 0,
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
    defaultValue: overrides.defaultValue ?? null,
    parsedOptions: overrides.parsedOptions,
    ...overrides,
  }
}

describe('useEmulatorConfigImporter', () => {
  it('reads Eden config files and normalises values', async () => {
    mockedParse.mockReturnValue({
      values: [
        { id: 'bool-field', value: 'true' },
        { id: 'range-field', value: '42' },
        { id: 'enhanced_frame_pacing', value: 'true' },
      ],
      missing: ['Manual field'],
      warnings: [],
    })

    const onResult = vi.fn()

    const { result } = renderHook(() =>
      useEmulatorConfigImporter({
        emulatorSlug: 'eden',
        fields: [
          buildField({
            id: 'bool-field',
            name: 'bool-field',
            label: 'Boolean Field',
            type: CustomFieldType.BOOLEAN,
          }),
          buildField({
            id: 'range-field',
            name: 'range-field',
            label: 'Range Field',
            type: CustomFieldType.RANGE,
          }),
          buildField({
            id: 'extended_dynamic_state',
            name: 'extended_dynamic_state',
            label: 'Extended Dynamic State',
            type: CustomFieldType.RANGE,
          }),
          buildField({
            id: 'enhanced_frame_pacing',
            name: 'enhanced_frame_pacing',
            label: 'Enhanced Frame Pacing',
            type: CustomFieldType.BOOLEAN,
          }),
        ],
        onResult,
      }),
    )

    expect(result.current.supportedFileTypes).toEqual(['ini'])

    const file = new File(['[Renderer]\nbackend=1'], 'config.ini', { type: 'text/plain' })
    ;(file as File & { text: () => Promise<string> }).text = () =>
      Promise.resolve('[Renderer]\nbackend=1')

    await act(async () => {
      await result.current.importFile(file)
    })

    expect(mockedParse).toHaveBeenCalledWith(
      'eden',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ id: 'bool-field' }),
        expect.objectContaining({ id: 'range-field' }),
        expect.objectContaining({ id: 'extended_dynamic_state' }),
        expect.objectContaining({ id: 'enhanced_frame_pacing' }),
      ]),
    )

    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult.mock.calls[0][0]).toMatchObject({
      values: [
        { id: 'bool-field', value: true },
        { id: 'range-field', value: 42 },
        { id: 'enhanced_frame_pacing', value: true },
      ],
      missing: ['Manual field'],
    })
  })

  it('rejects non-INI files', async () => {
    const onResult = vi.fn()
    const { result } = renderHook(() =>
      useEmulatorConfigImporter({
        emulatorSlug: 'eden',
        fields: [],
        onResult,
      }),
    )

    expect(result.current.supportedFileTypes).toEqual(['ini'])

    const file = new File(['{}'], 'config.json', { type: 'application/json' })
    ;(file as File & { text: () => Promise<string> }).text = () => Promise.resolve('{}')

    await expect(
      act(async () => {
        await result.current.importFile(file)
      }),
    ).rejects.toThrow('Only Eden .ini configuration files are supported right now.')
    expect(onResult).not.toHaveBeenCalled()
  })

  it('supports Azahar imports with the correct messaging', async () => {
    registerEmulatorConfigMapper({
      slug: 'azahar',
      fileTypes: ['ini'],
      parse: (raw, fields) => mockedParse('azahar', raw, fields),
    })

    mockedParse.mockReturnValueOnce({
      values: [],
      missing: [],
      warnings: [],
    })

    const onResult = vi.fn()
    const { result } = renderHook(() =>
      useEmulatorConfigImporter({
        emulatorSlug: 'azahar',
        fields: [],
        onResult,
      }),
    )

    expect(result.current.supportedFileTypes).toEqual(['ini'])

    const iniFile = new File(['[Renderer]\ngraphics_api=2'], 'config.ini', { type: 'text/plain' })
    ;(iniFile as File & { text: () => Promise<string> }).text = () =>
      Promise.resolve('[Renderer]\ngraphics_api=2')

    await act(async () => {
      await result.current.importFile(iniFile)
    })

    expect(mockedParse).toHaveBeenCalledWith('azahar', expect.any(String), expect.any(Array))

    const invalidFile = new File(['{}'], 'config.json', { type: 'application/json' })
    ;(invalidFile as File & { text: () => Promise<string> }).text = () => Promise.resolve('{}')

    await expect(
      act(async () => {
        await result.current.importFile(invalidFile)
      }),
    ).rejects.toThrow('Only Azahar .ini configuration files are supported right now.')
  })
})
