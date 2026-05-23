import { describe, it, expect } from 'vitest'
import {
  convertToGameNativeConfig,
  serializeGameNativeConfig,
  type GameNativeConfigInput,
} from './gamenative.converter'

describe('GameNative Converter', () => {
  describe('convertToGameNativeConfig', () => {
    it('should create default config when no custom fields provided', () => {
      const input: GameNativeConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [],
      }

      const config = convertToGameNativeConfig(input)

      expect(config).toMatchObject({
        name: '',
        screenSize: '1280x720',
        graphicsDriver: 'vortek',
        dxwrapper: 'dxvk',
        audioDriver: 'pulseaudio',
        startupSelection: 1,
        box64Version: '0.3.6',
        box86Version: '0.3.2',
        box64Preset: 'COMPATIBILITY',
        box86Preset: 'COMPATIBILITY',
        wow64Mode: true,
        showFPS: false,
        csmt: true,
        containerVariant: 'glibc',
        emulator: 'FEXCore',
        fexcoreVersion: '2603',
        fexcorePreset: 'INTERMEDIATE',
        useSteamInput: false,
        dinputMapperType: 1,
      })
    })

    it('should convert resolution field correctly', () => {
      const testCases = [
        { input: '1920x1080 (16:9)', expected: '1920x1080' },
        { input: '2560x1440', expected: '2560x1440' },
        { input: '854x480 (16:9)', expected: '854x480' },
        { input: 'invalid', expected: '1280x720' },
        { input: '', expected: '1280x720' },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'resolution',
                label: 'Resolution',
                type: 'TEXT',
              },
              value: input,
            },
          ],
        })

        expect(config.screenSize).toBe(expected)
      })
    })

    it('should handle environment variables properly', () => {
      const configEmpty = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'env_variables',
              label: 'Environment Variables',
              type: 'TEXTAREA',
            },
            value: '',
          },
        ],
      })

      expect(configEmpty.envVars).toContain('ZINK_DESCRIPTORS=lazy')
      expect(configEmpty.envVars).toContain('PULSE_LATENCY_MSEC=144')

      const configCustom = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'env_variables',
              label: 'Environment Variables',
              type: 'TEXTAREA',
            },
            value: 'CUSTOM_VAR=value TEST_MODE=1',
          },
        ],
      })

      expect(configCustom.envVars).toBe('CUSTOM_VAR=value TEST_MODE=1')
    })

    it('should map graphics driver names correctly', () => {
      const testCases = [
        { input: 'Vortek (Universal)', expected: 'vortek' },
        { input: 'Turnip (Adreno)', expected: 'turnip' },
        { input: 'VirGL (Universal)', expected: 'virgl' },
        { input: 'Adreno (Adreno)', expected: 'adreno' },
        { input: 'Custom Driver', expected: 'vortek' },
        { input: '', expected: 'vortek' },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'graphics_driver',
                label: 'Graphics Driver',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })

        expect(config.graphicsDriver).toBe(expected)
      })
    })

    it('should map DX wrapper options correctly', () => {
      const testCases = [
        { input: 'WineD3D', expected: 'wined3d' },
        { input: 'DXVK', expected: 'dxvk' },
        { input: 'VKD3D', expected: 'vkd3d' },
        { input: 'CNC DDraw', expected: 'cnc-ddraw' },
        { input: 'Other', expected: 'dxvk' },
        { input: 'Unknown', expected: 'dxvk' },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'dx_wrapper',
                label: 'DX Wrapper',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })

        expect(config.dxwrapper).toBe(expected)
      })
    })

    it('should map audio driver options correctly', () => {
      const testCases = [
        { input: 'alsa', expected: 'alsa' },
        { input: 'pulse', expected: 'pulseaudio' },
        { input: 'other', expected: 'pulseaudio' },
        { input: 'ALSA', expected: 'alsa' },
        { input: 'PulseAudio', expected: 'pulseaudio' },
        { input: 'Unknown', expected: 'pulseaudio' },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'audio_driver',
                label: 'Audio Driver',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })

        expect(config.audioDriver).toBe(expected)
      })
    })

    it('should map startup selection correctly', () => {
      const testCases = [
        { input: 'Normal (Load all services)', expected: 0 },
        { input: 'Essential (Load only essential services)', expected: 1 },
        { input: 'Aggressive (Stop services on startup)', expected: 2 },
        { input: 'Other', expected: 1 },
        { input: 'Unknown', expected: 1 },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'startup_selection',
                label: 'Startup Selection',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })

        expect(config.startupSelection).toBe(expected)
      })
    })

    it('should handle Box64 versions with defaults', () => {
      const configWithValues = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'box64_version',
              label: 'Box64 Version',
              type: 'SELECT',
            },
            value: '0.3.8',
          },
        ],
      })

      expect(configWithValues.box64Version).toBe('0.3.8')

      const configWithEmpty = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'box64_version',
              label: 'Box64 Version',
              type: 'SELECT',
            },
            value: '',
          },
        ],
      })

      expect(configWithEmpty.box64Version).toBe('0.3.6')
    })

    it('should accept bionic-specific Box64 versions', () => {
      const bionicVersions = ['0.3.2', '0.3.7', '0.4.0']

      bionicVersions.forEach((version) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'box64_version',
                label: 'Box64 Version',
                type: 'SELECT',
              },
              value: version,
            },
          ],
        })

        expect(config.box64Version).toBe(version)
      })
    })

    it('should map Box64 presets correctly (lowercase input)', () => {
      const presetOptions = [
        { input: 'stability', expected: 'STABILITY' },
        { input: 'compatibility', expected: 'COMPATIBILITY' },
        { input: 'intermediate', expected: 'INTERMEDIATE' },
        { input: 'performance', expected: 'PERFORMANCE' },
        { input: 'denuvo', expected: 'DENUVO' },
        { input: 'other/custom', expected: 'COMPATIBILITY' },
      ]

      presetOptions.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'box64_preset',
                label: 'Box64 Preset',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })

        expect(config.box64Preset).toBe(expected)
      })
    })

    it('should handle execution arguments properly', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'exec_arguments',
              label: 'Exec Arguments',
              type: 'TEXT',
            },
            value: '-skipmovies -nologo',
          },
        ],
      })

      expect(config.execArgs).toBe('-skipmovies -nologo')
    })

    it('should merge dxvk_version into dxwrapperConfig', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'dxvk_version',
              label: 'DXVK Version',
              type: 'SELECT',
            },
            value: 'async-1.10.3',
          },
        ],
      })

      expect(config.dxwrapperConfig).toContain('version=async-1.10.3')
    })

    it('should merge max_device_memory into graphicsDriverConfig', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'max_device_memory',
              label: 'Max Device Memory',
              type: 'TEXT',
            },
            value: '4096',
          },
        ],
      })

      expect(config.graphicsDriverConfig).toContain('maxDeviceMemory=4096')
    })

    it('should merge use_adrenotools_turnip into graphicsDriverConfig', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'use_adrenotools_turnip',
              label: 'Use Adrenotools Turnip',
              type: 'BOOLEAN',
            },
            value: true,
          },
        ],
      })

      expect(config.graphicsDriverConfig).toContain('adrenotoolsTurnip=1')
    })

    it('should write adrenotoolsTurnip=0 when disabled', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'use_adrenotools_turnip',
              label: 'Use Adrenotools Turnip',
              type: 'BOOLEAN',
            },
            value: false,
          },
        ],
      })

      expect(config.graphicsDriverConfig).toContain('adrenotoolsTurnip=0')
    })

    it('should combine max_device_memory and use_adrenotools_turnip in graphicsDriverConfig', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'max_device_memory',
              label: 'Max Device Memory',
              type: 'TEXT',
            },
            value: '4096',
          },
          {
            customFieldDefinition: {
              name: 'use_adrenotools_turnip',
              label: 'Use Adrenotools Turnip',
              type: 'BOOLEAN',
            },
            value: true,
          },
        ],
      })

      expect(config.graphicsDriverConfig).toContain('maxDeviceMemory=4096')
      expect(config.graphicsDriverConfig).toContain('adrenotoolsTurnip=1')
    })

    it('should map container_variant correctly', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'container_variant',
              label: 'Container Variant',
              type: 'SELECT',
            },
            value: 'bionic',
          },
        ],
      })

      expect(config.containerVariant).toBe('bionic')
    })

    it('should map steam_type with ultra_light conversion', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'steam_type',
              label: 'Steam Type',
              type: 'SELECT',
            },
            value: 'ultra_light',
          },
        ],
      })

      expect(config.steamType).toBe('ultralight')
    })

    it('should map emulator from 64_bit_emulator field', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: '64_bit_emulator',
              label: '64-bit Emulator',
              type: 'SELECT',
            },
            value: 'box',
          },
        ],
      })

      expect(config.emulator).toBe('Box64')
    })

    it('should map fex_core_preset correctly (lowercase input)', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'fex_core_preset',
              label: 'FEXCore Preset',
              type: 'SELECT',
            },
            value: 'performance',
          },
        ],
      })

      expect(config.fexcorePreset).toBe('PERFORMANCE')
    })

    it('should map direct_input_mapper_type string values to numbers', () => {
      const testCases = [
        { input: 'standard', expected: 1 },
        { input: 'xinput_mapper', expected: 2 },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'direct_input_mapper_type',
                label: 'DirectInput Mapper Type',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })

        expect(config.dinputMapperType).toBe(expected)
      })
    })

    it('should convert all fields from a complete listing', () => {
      const input: GameNativeConfigInput = {
        listingId: 'ea4107c5-371b-4030-b42c-4469f251fe8b',
        gameId: 'f097b273-ad3d-4b2b-b6a4-d76856aafabf',
        customFieldValues: [
          {
            customFieldDefinition: { name: 'audio_driver', label: 'Audio Driver', type: 'SELECT' },
            value: 'alsa',
          },
          {
            customFieldDefinition: { name: 'average_fps', label: 'Average FPS', type: 'TEXT' },
            value: '120',
          },
          {
            customFieldDefinition: {
              name: 'box64_preset',
              label: 'Box64 Preset',
              type: 'SELECT',
            },
            value: 'performance',
          },
          {
            customFieldDefinition: {
              name: 'box64_version',
              label: 'Box64 Version',
              type: 'SELECT',
            },
            value: '0.3.6',
          },
          {
            customFieldDefinition: { name: 'dx_wrapper', label: 'DX Wrapper', type: 'SELECT' },
            value: 'DXVK',
          },
          {
            customFieldDefinition: {
              name: 'dx_wrapper_config',
              label: 'DX Wrapper Config',
              type: 'TEXTAREA',
            },
            value: 'async=1',
          },
          {
            customFieldDefinition: {
              name: 'emulator_version',
              label: 'Emulator Version',
              type: 'TEXT',
            },
            value: 'v0.3.0',
          },
          {
            customFieldDefinition: {
              name: 'env_variables',
              label: 'Environment Variables',
              type: 'TEXTAREA',
            },
            value: '',
          },
          {
            customFieldDefinition: {
              name: 'exec_arguments',
              label: 'Exec Arguments',
              type: 'TEXT',
            },
            value: '-skipmovies',
          },
          {
            customFieldDefinition: {
              name: 'graphics_driver',
              label: 'Graphics Driver',
              type: 'SELECT',
            },
            value: 'Vortek (Universal)',
          },
          {
            customFieldDefinition: {
              name: 'resolution',
              label: 'Resolution (Screen Size)',
              type: 'SELECT',
            },
            value: '1920x1080 (16:9)',
          },
          {
            customFieldDefinition: {
              name: 'startup_selection',
              label: 'Startup Selection',
              type: 'SELECT',
            },
            value: 'Aggressive (Stop services on startup)',
          },
          {
            customFieldDefinition: {
              name: 'container_variant',
              label: 'Container Variant',
              type: 'SELECT',
            },
            value: 'bionic',
          },
          {
            customFieldDefinition: {
              name: '64_bit_emulator',
              label: '64-bit Emulator',
              type: 'SELECT',
            },
            value: 'fex',
          },
          {
            customFieldDefinition: {
              name: 'fex_core_preset',
              label: 'FEXCore Preset',
              type: 'SELECT',
            },
            value: 'intermediate',
          },
        ],
      }

      const config = convertToGameNativeConfig(input)

      expect(config.audioDriver).toBe('alsa')
      expect(config.box64Preset).toBe('PERFORMANCE')
      expect(config.box64Version).toBe('0.3.6')
      expect(config.dxwrapper).toBe('dxvk')
      expect(config.dxwrapperConfig).toBe('async=1')
      expect(config.envVars).toContain('ZINK_DESCRIPTORS=lazy')
      expect(config.execArgs).toBe('-skipmovies')
      expect(config.graphicsDriver).toBe('vortek')
      expect(config.screenSize).toBe('1920x1080')
      expect(config.startupSelection).toBe(2)
      expect(config.containerVariant).toBe('bionic')
      expect(config.emulator).toBe('FEXCore')
      expect(config.fexcorePreset).toBe('INTERMEDIATE')

      expect(config.box86Preset).toBe('COMPATIBILITY')
      expect(config.wow64Mode).toBe(true)
      expect(config.showFPS).toBe(false)
      expect(config.launchRealSteam).toBe(false)
      expect(config.enableXInput).toBe(true)
      expect(config.enableDInput).toBe(true)
    })

    it('should ignore unmapped fields', () => {
      const input: GameNativeConfigInput = {
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'emulator_version',
              label: 'Emulator Version',
              type: 'TEXT',
            },
            value: 'v0.3.0',
          },
          {
            customFieldDefinition: { name: 'game_version', label: 'Game Version', type: 'TEXT' },
            value: '1.0.0',
          },
          {
            customFieldDefinition: { name: 'average_fps', label: 'Average FPS', type: 'TEXT' },
            value: '60',
          },
          {
            customFieldDefinition: { name: 'media_url', label: 'Media URL', type: 'URL' },
            value: 'https://example.com',
          },
          {
            customFieldDefinition: { name: 'youtube', label: 'YouTube', type: 'URL' },
            value: 'https://youtube.com/watch?v=123',
          },
        ],
      }

      const config = convertToGameNativeConfig(input)

      expect(config.name).toBe('')
      expect(config.screenSize).toBe('1280x720')
      expect(config.graphicsDriver).toBe('vortek')
      expect(config.dxwrapper).toBe('dxvk')
    })

    it('should handle null and undefined values gracefully', () => {
      const input: GameNativeConfigInput = {
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'resolution',
              label: 'Resolution',
              type: 'TEXT',
            },
            value: null,
          },
          {
            customFieldDefinition: {
              name: 'graphics_driver',
              label: 'Graphics Driver',
              type: 'SELECT',
            },
            value: null,
          },
          {
            customFieldDefinition: {
              name: 'exec_arguments',
              label: 'Exec Arguments',
              type: 'TEXT',
            },
            value: null,
          },
        ],
      }

      const config = convertToGameNativeConfig(input)

      expect(config.screenSize).toBe('1280x720')
      expect(config.graphicsDriver).toBe('vortek')
      expect(config.execArgs).toBe('')
    })
  })

  describe('serializeGameNativeConfig', () => {
    it('should serialize config to valid JSON', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'resolution',
              label: 'Resolution',
              type: 'SELECT',
            },
            value: '1920x1080',
          },
          {
            customFieldDefinition: {
              name: 'graphics_driver',
              label: 'Graphics Driver',
              type: 'SELECT',
            },
            value: 'vortek',
          },
        ],
      })

      const serialized = serializeGameNativeConfig(config)
      const parsed = JSON.parse(serialized)

      expect(parsed).toMatchObject({
        screenSize: '1920x1080',
        graphicsDriver: 'vortek',
        dxwrapper: 'dxvk',
        audioDriver: 'pulseaudio',
      })

      expect(serialized).toContain('\n')
      expect(serialized).toContain('  ')
    })

    it('should produce valid JSON for empty config', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [],
      })

      const serialized = serializeGameNativeConfig(config)
      const parsed = JSON.parse(serialized)

      expect(parsed).toBeDefined()
      expect(parsed.screenSize).toBe('1280x720')
    })
  })

  describe('Edge cases', () => {
    it('should handle mixed case graphics driver names', () => {
      const testCases = [
        { input: 'VORTEK', expected: 'vortek' },
        { input: 'Turnip', expected: 'turnip' },
        { input: 'VIRGL', expected: 'virgl' },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'graphics_driver',
                label: 'Graphics Driver',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })

        expect(config.graphicsDriver).toBe(expected)
      })
    })

    it('should extract resolution from various formats', () => {
      const testCases = [
        { input: 'Resolution: 1920x1080', expected: '1920x1080' },
        { input: '1920x1080 pixels', expected: '1920x1080' },
        { input: 'Use 2560x1440 for best quality', expected: '2560x1440' },
        { input: 'No resolution here', expected: '1280x720' },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToGameNativeConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'resolution',
                label: 'Resolution',
                type: 'TEXT',
              },
              value: input,
            },
          ],
        })

        expect(config.screenSize).toBe(expected)
      })
    })

    it('should preserve whitespace in environment variables', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'env_variables',
              label: 'Environment Variables',
              type: 'TEXTAREA',
            },
            value: '  VAR1=value1   VAR2=value2  ',
          },
        ],
      })

      expect(config.envVars).toBe('VAR1=value1   VAR2=value2')
    })

    it('should handle multiple fields updating simultaneously', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'resolution',
              label: 'Resolution',
              type: 'SELECT',
            },
            value: '2560x1440',
          },
          {
            customFieldDefinition: {
              name: 'graphics_driver',
              label: 'Graphics Driver',
              type: 'SELECT',
            },
            value: 'turnip',
          },
          {
            customFieldDefinition: {
              name: 'dx_wrapper',
              label: 'DX Wrapper',
              type: 'SELECT',
            },
            value: 'VKD3D',
          },
          {
            customFieldDefinition: {
              name: 'audio_driver',
              label: 'Audio Driver',
              type: 'SELECT',
            },
            value: 'pulse',
          },
          {
            customFieldDefinition: {
              name: 'startup_selection',
              label: 'Startup Selection',
              type: 'SELECT',
            },
            value: 'Normal (Load all services)',
          },
          {
            customFieldDefinition: {
              name: 'box64_version',
              label: 'Box64 Version',
              type: 'SELECT',
            },
            value: '0.3.6',
          },
          {
            customFieldDefinition: {
              name: 'box64_preset',
              label: 'Box64 Preset',
              type: 'SELECT',
            },
            value: 'stability',
          },
        ],
      })

      expect(config.screenSize).toBe('2560x1440')
      expect(config.graphicsDriver).toBe('turnip')
      expect(config.dxwrapper).toBe('vkd3d')
      expect(config.audioDriver).toBe('pulseaudio')
      expect(config.startupSelection).toBe(0)
      expect(config.box64Version).toBe('0.3.6')
      expect(config.box64Preset).toBe('STABILITY')
    })
  })
})
