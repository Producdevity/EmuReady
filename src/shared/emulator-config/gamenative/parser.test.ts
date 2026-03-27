import { describe, expect, it } from 'vitest'
import { CustomFieldType } from '@orm'
import { parseGameNativeConfigFromJson } from './parser'
import type { CustomFieldImportDefinition } from '../types'

const baseFields: CustomFieldImportDefinition[] = [
  {
    id: 'resolution',
    name: 'resolution',
    label: 'Resolution',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: '854x480', label: '854x480' },
      { value: '1280x720', label: '1280x720' },
      { value: '1920x1080', label: '1920x1080' },
    ],
  },
  {
    id: 'graphics_driver',
    name: 'graphics_driver',
    label: 'Graphics Driver',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'VirGL (Universal)', label: 'VirGL (Universal)' },
      { value: 'Turnip (Adreno)', label: 'Turnip (Adreno)' },
      { value: 'Vortek (Universal)', label: 'Vortek (Universal)' },
    ],
  },
  {
    id: 'dx_wrapper',
    name: 'dx_wrapper',
    label: 'DX Wrapper',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'WineD3D', label: 'WineD3D' },
      { value: 'DXVK', label: 'DXVK' },
      { value: 'VKD3D', label: 'VKD3D' },
    ],
  },
  {
    id: 'dxvk_version',
    name: 'dxvk_version',
    label: 'DXVK Version',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: '2.6.1-gplasync', label: '2.6.1-gplasync' },
      { value: 'async-1.10.3', label: 'async-1.10.3' },
    ],
  },
  {
    id: 'audio_driver',
    name: 'audio_driver',
    label: 'Audio Driver',
    type: CustomFieldType.SELECT,
    isRequired: true,
    options: [
      { value: 'alsa', label: 'ALSA' },
      { value: 'pulse', label: 'PulseAudio' },
    ],
  },
  {
    id: 'startup_selection',
    name: 'startup_selection',
    label: 'Startup Selection',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: 'Normal (Load all services)', label: 'Normal (Load all services)' },
      { value: 'Essential (Load only essential services)', label: 'Essential' },
      { value: 'Aggressive (Stop services on startup)', label: 'Aggressive' },
    ],
  },
  {
    id: 'box64_version',
    name: 'box64_version',
    label: 'Box64 Version',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: '0.3.6', label: '0.3.6' },
      { value: '0.3.8', label: '0.3.8' },
    ],
  },
  {
    id: 'box64_preset',
    name: 'box64_preset',
    label: 'Box64 Preset',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: 'stability', label: 'Stability' },
      { value: 'compatibility', label: 'Compatibility' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'performance', label: 'Performance' },
    ],
  },
  {
    id: 'env_variables',
    name: 'env_variables',
    label: 'Environment Variables',
    type: CustomFieldType.TEXTAREA,
    isRequired: false,
  },
  {
    id: 'exec_arguments',
    name: 'exec_arguments',
    label: 'Execution Arguments',
    type: CustomFieldType.TEXT,
    isRequired: false,
  },
  {
    id: 'container_variant',
    name: 'container_variant',
    label: 'Container Variant',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: 'glibc', label: 'Glibc' },
      { value: 'bionic', label: 'Bionic' },
    ],
  },
  {
    id: 'wine_version',
    name: 'wine_version',
    label: 'Wine Version',
    type: CustomFieldType.TEXT,
    isRequired: false,
  },
  {
    id: 'steam_type',
    name: 'steam_type',
    label: 'Steam Type',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'light', label: 'Light' },
      { value: 'ultra_light', label: 'Ultra Light' },
    ],
  },
  {
    id: 'dynamic_driver_version',
    name: 'dynamic_driver_version',
    label: 'Graphics Driver Version',
    type: CustomFieldType.TEXT,
    isRequired: false,
  },
  {
    id: 'fex_core_version',
    name: 'fex_core_version',
    label: 'FEXCore Version',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [{ value: '2603', label: '2603' }],
  },
  {
    id: '32_bit_emulator',
    name: '32_bit_emulator',
    label: '32-bit Emulator',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: 'fex', label: 'FEXCore' },
      { value: 'box', label: 'Box64' },
    ],
  },
  {
    id: '64_bit_emulator',
    name: '64_bit_emulator',
    label: '64-bit Emulator',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: 'fex', label: 'FEXCore' },
      { value: 'box', label: 'Box64' },
    ],
  },
  {
    id: 'fex_core_preset',
    name: 'fex_core_preset',
    label: 'FEXCore Preset',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: 'stability', label: 'Stability' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'performance', label: 'Performance' },
    ],
  },
  {
    id: 'use_steam_input',
    name: 'use_steam_input',
    label: 'Use Steam Input',
    type: CustomFieldType.BOOLEAN,
    isRequired: false,
  },
  {
    id: 'enable_x_input_api',
    name: 'enable_x_input_api',
    label: 'Enable XInput API',
    type: CustomFieldType.BOOLEAN,
    isRequired: false,
  },
  {
    id: 'enable_direct_input_api',
    name: 'enable_direct_input_api',
    label: 'Enable DirectInput API',
    type: CustomFieldType.BOOLEAN,
    isRequired: false,
  },
  {
    id: 'direct_input_mapper_type',
    name: 'direct_input_mapper_type',
    label: 'DirectInput Mapper Type',
    type: CustomFieldType.SELECT,
    isRequired: false,
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'xinput_mapper', label: 'XInput Mapper' },
    ],
  },
  {
    id: 'use_adrenotools_turnip',
    name: 'use_adrenotools_turnip',
    label: 'Use Adrenotools Turnip',
    type: CustomFieldType.BOOLEAN,
    isRequired: false,
  },
  {
    id: 'max_device_memory',
    name: 'max_device_memory',
    label: 'Max Device Memory',
    type: CustomFieldType.TEXT,
    isRequired: false,
  },
]

const SAMPLE_CONFIG = {
  screenSize: '1920x1080',
  graphicsDriver: 'turnip',
  graphicsDriverVersion: '25.2.0',
  graphicsDriverConfig: 'adrenotoolsTurnip=1,maxDeviceMemory=4096',
  dxwrapper: 'dxvk',
  dxwrapperConfig: 'version=async-1.10.3,maxDeviceMemory=0',
  audioDriver: 'pulseaudio',
  startupSelection: 1,
  box64Version: '0.3.6',
  box64Preset: 'COMPATIBILITY',
  envVars: 'ZINK_DESCRIPTORS=lazy MESA_SHADER_CACHE_DISABLE=false',
  execArgs: '-windowed',
  containerVariant: 'glibc',
  wineVersion: 'wine-9.2-x86_64',
  steamType: 'ultralight',
  emulator: 'FEXCore',
  fexcoreVersion: '2603',
  fexcorePreset: 'INTERMEDIATE',
  useSteamInput: false,
  enableXInput: true,
  enableDInput: true,
  dinputMapperType: 1,
}

describe('parseGameNativeConfigFromJson', () => {
  it('parses a full config and maps all known fields', () => {
    const raw = JSON.stringify(SAMPLE_CONFIG)
    const result = parseGameNativeConfigFromJson(raw, baseFields)

    expect(result.warnings).toHaveLength(0)

    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))

    expect(valueMap.get('resolution')).toBe('1920x1080')
    expect(valueMap.get('graphics_driver')).toBe('Turnip (Adreno)')
    expect(valueMap.get('dx_wrapper')).toBe('DXVK')
    expect(valueMap.get('dxvk_version')).toBe('async-1.10.3')
    expect(valueMap.get('audio_driver')).toBe('pulse')
    expect(valueMap.get('startup_selection')).toBe('Essential (Load only essential services)')
    expect(valueMap.get('box64_version')).toBe('0.3.6')
    expect(valueMap.get('box64_preset')).toBe('compatibility')
    expect(valueMap.get('env_variables')).toBe(
      'ZINK_DESCRIPTORS=lazy MESA_SHADER_CACHE_DISABLE=false',
    )
    expect(valueMap.get('exec_arguments')).toBe('-windowed')
    expect(valueMap.get('container_variant')).toBe('glibc')
    expect(valueMap.get('wine_version')).toBe('wine-9.2-x86_64')
    expect(valueMap.get('steam_type')).toBe('ultra_light')
    expect(valueMap.get('dynamic_driver_version')).toBe('25.2.0')
    expect(valueMap.get('fex_core_version')).toBe('2603')
    expect(valueMap.get('32_bit_emulator')).toBe('fex')
    expect(valueMap.get('64_bit_emulator')).toBe('fex')
    expect(valueMap.get('fex_core_preset')).toBe('intermediate')
    expect(valueMap.get('use_steam_input')).toBe(false)
    expect(valueMap.get('enable_x_input_api')).toBe(true)
    expect(valueMap.get('enable_direct_input_api')).toBe(true)
    expect(valueMap.get('direct_input_mapper_type')).toBe('standard')
    expect(valueMap.get('use_adrenotools_turnip')).toBe(true)
    expect(valueMap.get('max_device_memory')).toBe('4096')
  })

  it('extracts dxvk_version from dxwrapperConfig string', () => {
    const raw = JSON.stringify({ dxwrapperConfig: 'version=2.6.1-gplasync,async=1' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'dxvk_version',
        name: 'dxvk_version',
        label: 'DXVK Version',
        type: CustomFieldType.SELECT,
        isRequired: false,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('dxvk_version')).toBe('2.6.1-gplasync')
  })

  it('falls back to top-level dxvkVersion for old configs', () => {
    const raw = JSON.stringify({ dxvkVersion: '1.10.3', dxwrapperConfig: 'async=1' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'dxvk_version',
        name: 'dxvk_version',
        label: 'DXVK Version',
        type: CustomFieldType.SELECT,
        isRequired: false,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('dxvk_version')).toBe('1.10.3')
  })

  it('handles audio driver backward compatibility with "pulse"', () => {
    const raw = JSON.stringify({ audioDriver: 'pulse' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'audio_driver',
        name: 'audio_driver',
        label: 'Audio Driver',
        type: CustomFieldType.SELECT,
        isRequired: false,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('audio_driver')).toBe('pulse')
  })

  it('handles minimal config with missing optional fields', () => {
    const minimalConfig = {
      graphicsDriver: 'vortek',
      dxwrapper: 'wined3d',
      audioDriver: 'alsa',
    }
    const raw = JSON.stringify(minimalConfig)
    const result = parseGameNativeConfigFromJson(raw, baseFields)

    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))

    expect(valueMap.get('graphics_driver')).toBe('Vortek (Universal)')
    expect(valueMap.get('dx_wrapper')).toBe('WineD3D')
    expect(valueMap.get('audio_driver')).toBe('alsa')
    expect(valueMap.has('resolution')).toBe(false)
  })

  it('returns warning for invalid JSON', () => {
    const result = parseGameNativeConfigFromJson('not valid json{', baseFields)

    expect(result.values).toHaveLength(0)
    expect(result.warnings).toContain('Failed to parse JSON configuration file.')
  })

  it('marks required fields as missing when not in JSON and no default', () => {
    const raw = JSON.stringify({})
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'graphics_driver',
        name: 'graphics_driver',
        label: 'Graphics Driver',
        type: CustomFieldType.SELECT,
        isRequired: true,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)

    expect(result.missing).toContain('Graphics Driver')
  })

  it('uses defaultValue for unmapped fields', () => {
    const raw = JSON.stringify(SAMPLE_CONFIG)
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'unknown_field',
        name: 'unknown_field',
        label: 'Unknown Field',
        type: CustomFieldType.TEXT,
        isRequired: false,
        defaultValue: 'fallback',
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))

    expect(valueMap.get('unknown_field')).toBe('fallback')
  })

  it('uses defaultValue when mapped JSON key is absent', () => {
    const raw = JSON.stringify({})
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'resolution',
        name: 'resolution',
        label: 'Resolution',
        type: CustomFieldType.SELECT,
        isRequired: false,
        defaultValue: '854x480',
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))

    expect(valueMap.get('resolution')).toBe('854x480')
  })

  it('reverse-maps startup_selection numeric values', () => {
    const configs = [
      { startupSelection: 0, expected: 'Normal (Load all services)' },
      { startupSelection: 1, expected: 'Essential (Load only essential services)' },
      { startupSelection: 2, expected: 'Aggressive (Stop services on startup)' },
    ]

    for (const { startupSelection, expected } of configs) {
      const raw = JSON.stringify({ startupSelection })
      const fields: CustomFieldImportDefinition[] = [
        {
          id: 'startup_selection',
          name: 'startup_selection',
          label: 'Startup Selection',
          type: CustomFieldType.SELECT,
          isRequired: false,
        },
      ]
      const result = parseGameNativeConfigFromJson(raw, fields)
      const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
      expect(valueMap.get('startup_selection')).toBe(expected)
    }
  })

  it('reverse-maps box64 presets from uppercase to lowercase', () => {
    const presets = [
      { preset: 'STABILITY', expected: 'stability' },
      { preset: 'COMPATIBILITY', expected: 'compatibility' },
      { preset: 'INTERMEDIATE', expected: 'intermediate' },
      { preset: 'PERFORMANCE', expected: 'performance' },
    ]

    for (const { preset, expected } of presets) {
      const raw = JSON.stringify({ box64Preset: preset })
      const fields: CustomFieldImportDefinition[] = [
        {
          id: 'box64_preset',
          name: 'box64_preset',
          label: 'Box64 Preset',
          type: CustomFieldType.SELECT,
          isRequired: false,
        },
      ]
      const result = parseGameNativeConfigFromJson(raw, fields)
      const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
      expect(valueMap.get('box64_preset')).toBe(expected)
    }
  })

  it('handles all graphics driver reverse mappings', () => {
    const drivers = [
      { config: 'virgl', expected: 'VirGL (Universal)' },
      { config: 'turnip', expected: 'Turnip (Adreno)' },
      { config: 'vortek', expected: 'Vortek (Universal)' },
    ]

    for (const { config, expected } of drivers) {
      const raw = JSON.stringify({ graphicsDriver: config })
      const fields: CustomFieldImportDefinition[] = [
        {
          id: 'graphics_driver',
          name: 'graphics_driver',
          label: 'Graphics Driver',
          type: CustomFieldType.SELECT,
          isRequired: true,
        },
      ]
      const result = parseGameNativeConfigFromJson(raw, fields)
      const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
      expect(valueMap.get('graphics_driver')).toBe(expected)
    }
  })

  it('passes through unknown graphics driver values', () => {
    const raw = JSON.stringify({ graphicsDriver: 'future_driver' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'graphics_driver',
        name: 'graphics_driver',
        label: 'Graphics Driver',
        type: CustomFieldType.SELECT,
        isRequired: true,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('graphics_driver')).toBe('future_driver')
  })

  it('reverse-maps dinputMapperType numbers to strings', () => {
    const raw = JSON.stringify({ dinputMapperType: 2 })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'direct_input_mapper_type',
        name: 'direct_input_mapper_type',
        label: 'DirectInput Mapper Type',
        type: CustomFieldType.SELECT,
        isRequired: false,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('direct_input_mapper_type')).toBe('xinput_mapper')
  })

  it('reverse-maps emulator field to fex/box values', () => {
    const raw = JSON.stringify({ emulator: 'Box64' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: '64_bit_emulator',
        name: '64_bit_emulator',
        label: '64-bit Emulator',
        type: CustomFieldType.SELECT,
        isRequired: false,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('64_bit_emulator')).toBe('box')
  })

  it('detects use_adrenotools_turnip from graphicsDriverConfig', () => {
    const configEnabled = JSON.stringify({
      graphicsDriverConfig: 'adrenotoolsTurnip=1,vulkanVersion=1.3',
    })
    const configDisabled = JSON.stringify({
      graphicsDriverConfig: 'adrenotoolsTurnip=0,vulkanVersion=1.3',
    })
    const configMissing = JSON.stringify({ graphicsDriverConfig: 'vulkanVersion=1.3' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'use_adrenotools_turnip',
        name: 'use_adrenotools_turnip',
        label: 'Use Adrenotools Turnip',
        type: CustomFieldType.BOOLEAN,
        isRequired: false,
      },
    ]

    const resultEnabled = parseGameNativeConfigFromJson(configEnabled, fields)
    const mapEnabled = new Map(resultEnabled.values.map((v) => [v.id, v.value]))
    expect(mapEnabled.get('use_adrenotools_turnip')).toBe(true)

    const resultDisabled = parseGameNativeConfigFromJson(configDisabled, fields)
    const mapDisabled = new Map(resultDisabled.values.map((v) => [v.id, v.value]))
    expect(mapDisabled.get('use_adrenotools_turnip')).toBe(false)

    const resultMissing = parseGameNativeConfigFromJson(configMissing, fields)
    const mapMissing = new Map(resultMissing.values.map((v) => [v.id, v.value]))
    expect(mapMissing.get('use_adrenotools_turnip')).toBe(false)
  })

  it('parses max_device_memory from graphicsDriverConfig', () => {
    const raw = JSON.stringify({ graphicsDriverConfig: 'vulkanVersion=1.3,maxDeviceMemory=8192' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'max_device_memory',
        name: 'max_device_memory',
        label: 'Max Device Memory',
        type: CustomFieldType.TEXT,
        isRequired: false,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('max_device_memory')).toBe('8192')
  })

  it('reverse-maps FEXCore presets from uppercase to lowercase', () => {
    const raw = JSON.stringify({ fexcorePreset: 'PERFORMANCE' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'fex_core_preset',
        name: 'fex_core_preset',
        label: 'FEXCore Preset',
        type: CustomFieldType.SELECT,
        isRequired: false,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('fex_core_preset')).toBe('performance')
  })

  it('reverse-maps steam_type ultralight to ultra_light', () => {
    const raw = JSON.stringify({ steamType: 'ultralight' })
    const fields: CustomFieldImportDefinition[] = [
      {
        id: 'steam_type',
        name: 'steam_type',
        label: 'Steam Type',
        type: CustomFieldType.SELECT,
        isRequired: false,
      },
    ]
    const result = parseGameNativeConfigFromJson(raw, fields)
    const valueMap = new Map(result.values.map((v) => [v.id, v.value]))
    expect(valueMap.get('steam_type')).toBe('ultra_light')
  })
})
