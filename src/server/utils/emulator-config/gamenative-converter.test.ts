import { describe, it, expect } from 'vitest'
import {
  convertToGameNativeConfig,
  serializeGameNativeConfig,
  getMissingImportantFields,
  type GameNativeConfigInput,
} from './gamenative-converter'

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
        screenSize: '854x480',
        graphicsDriver: 'vortek',
        dxwrapper: 'dxvk',
        audioDriver: 'alsa',
        startupSelection: 1,
        box64Version: '0.3.6',
        box86Version: '0.3.2',
        box64Preset: 'COMPATIBILITY',
        box86Preset: 'COMPATIBILITY',
        wow64Mode: true,
        showFPS: false,
        csmt: true,
      })
    })

    it('should convert resolution field correctly', () => {
      const testCases = [
        { input: '1920x1080 (16:9)', expected: '1920x1080' },
        { input: '2560x1440', expected: '2560x1440' },
        { input: '854x480 (16:9)', expected: '854x480' },
        { input: 'invalid', expected: '854x480' }, // Default fallback
        { input: '', expected: '854x480' }, // Empty fallback
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
      // Test with empty value - should use default
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
      expect(configEmpty.envVars).toContain('MESA_VK_WSI_PRESENT_MODE=mailbox')

      // Test with custom value
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
        { input: 'Mesa Turnip', expected: 'turnip' },
        { input: 'VirGL', expected: 'virgl' },
        { input: 'Freedreno', expected: 'vortek' }, // Not a valid driver, defaults to vortek
        { input: 'Custom Driver', expected: 'vortek' }, // Unknown defaults to vortek
        { input: '', expected: 'vortek' }, // Default when empty
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
                type: 'TEXT',
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
        { input: 'Unknown', expected: 'dxvk' }, // Default fallback
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
        { input: 'ALSA', expected: 'alsa' },
        { input: 'PulseAudio', expected: 'pulse' }, // Correct value is 'pulse'
        { input: 'Other', expected: 'alsa' },
        { input: 'Unknown', expected: 'alsa' }, // Default fallback
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
        { input: 'Unknown', expected: 1 }, // Default fallback
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

    it('should handle Box64 and Box86 versions with defaults', () => {
      // Test with provided values
      const configWithValues = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'box64_version',
              label: 'Box64 Version',
              type: 'TEXT',
            },
            value: '0.3.6',
          },
          {
            customFieldDefinition: {
              name: 'box86_version',
              label: 'Box86 Version',
              type: 'TEXT',
            },
            value: '0.3.4',
          },
        ],
      })

      expect(configWithValues.box64Version).toBe('0.3.6') // Invalid version defaults to 0.3.6
      expect(configWithValues.box86Version).toBe('0.3.2') // Invalid version defaults to 0.3.2

      // Test with empty values - should use defaults
      const configWithEmpty = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'box64_version',
              label: 'Box64 Version',
              type: 'TEXT',
            },
            value: '',
          },
          {
            customFieldDefinition: {
              name: 'box86_version',
              label: 'Box86 Version',
              type: 'TEXT',
            },
            value: null,
          },
        ],
      })

      expect(configWithEmpty.box64Version).toBe('0.3.6')
      expect(configWithEmpty.box86Version).toBe('0.3.2')
    })

    it('should map Box64 and Box86 presets correctly', () => {
      const presetOptions = [
        { input: 'Stability', expected: 'STABILITY' },
        { input: 'Compatibility', expected: 'COMPATIBILITY' },
        { input: 'Intermediate', expected: 'INTERMEDIATE' },
        { input: 'Performance', expected: 'PERFORMANCE' },
        { input: 'Other/Custom', expected: 'COMPATIBILITY' },
        { input: 'Unknown', expected: 'COMPATIBILITY' }, // Default fallback
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
            {
              customFieldDefinition: {
                name: 'box86_preset',
                label: 'Box86 Preset',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })

        expect(config.box64Preset).toBe(expected)
        expect(config.box86Preset).toBe(expected)
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

      // Test with empty value
      const configEmpty = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'exec_arguments',
              label: 'Exec Arguments',
              type: 'TEXT',
            },
            value: '',
          },
        ],
      })

      expect(configEmpty.execArgs).toBe('')
    })

    it('should handle DX wrapper config properly', () => {
      const config = convertToGameNativeConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'dx_wrapper_config',
              label: 'DX Wrapper Config',
              type: 'TEXTAREA',
            },
            value: '2.6.1-gplasync',
          },
        ],
      })

      expect(config.dxwrapperConfig).toBe('2.6.1-gplasync')
    })

    it('should convert all fields from the complete example listing', () => {
      // Using exact data from notes/GameNativeListingByIdExample.ts
      const input: GameNativeConfigInput = {
        listingId: 'ea4107c5-371b-4030-b42c-4469f251fe8b',
        gameId: 'f097b273-ad3d-4b2b-b6a4-d76856aafabf',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'audio_driver',
              label: 'Audio Driver',
              type: 'SELECT',
            },
            value: 'ALSA',
          },
          {
            customFieldDefinition: {
              name: 'average_fps',
              label: 'Average FPS',
              type: 'TEXT',
            },
            value: '120',
          },
          {
            customFieldDefinition: {
              name: 'box64_preset',
              label: 'Box64 Preset',
              type: 'SELECT',
            },
            value: 'Performance',
          },
          {
            customFieldDefinition: {
              name: 'box64_version',
              label: 'Box64 Version',
              type: 'TEXT',
            },
            value: '0.3.6',
          },
          {
            customFieldDefinition: {
              name: 'dx_wrapper',
              label: 'DX Wrapper',
              type: 'SELECT',
            },
            value: 'DXVK',
          },
          {
            customFieldDefinition: {
              name: 'dx_wrapper_config',
              label: 'DX Wrapper Config',
              type: 'TEXTAREA',
            },
            value: '2.6.1-gplasync',
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
              name: 'game_version',
              label: 'Game Version',
              type: 'TEXT',
            },
            value: '',
          },
          {
            customFieldDefinition: {
              name: 'graphics_driver',
              label: 'Graphics Driver',
              type: 'TEXT',
            },
            value: 'Vortek (Universal)',
          },
          {
            customFieldDefinition: {
              name: 'media_url',
              label: 'Screenshots, Blog Post, etc',
              type: 'URL',
            },
            value: '',
          },
          {
            customFieldDefinition: {
              name: 'resolution',
              label: 'Resolution (Screen Size)',
              type: 'TEXT',
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
              name: 'youtube',
              label: 'YouTube',
              type: 'URL',
            },
            value: '',
          },
        ],
      }

      const config = convertToGameNativeConfig(input)

      // Verify all mapped fields
      expect(config.audioDriver).toBe('alsa')
      expect(config.box64Preset).toBe('PERFORMANCE')
      expect(config.box64Version).toBe('0.3.6')
      expect(config.dxwrapper).toBe('dxvk')
      expect(config.dxwrapperConfig).toBe('2.6.1-gplasync')
      expect(config.envVars).toContain('ZINK_DESCRIPTORS=lazy') // Default since empty
      expect(config.execArgs).toBe('-skipmovies')
      expect(config.graphicsDriver).toBe('vortek')
      expect(config.screenSize).toBe('1920x1080')
      expect(config.startupSelection).toBe(2)

      // Verify default values for missing fields
      expect(config.box86Version).toBe('0.3.2')
      expect(config.box86Preset).toBe('COMPATIBILITY')
      expect(config.wow64Mode).toBe(true)
      expect(config.showFPS).toBe(false)
      expect(config.launchRealSteam).toBe(false)
      expect(config.cpuList).toBe('0,1,2,3,4,5,6,7')
      expect(config.csmt).toBe(true)
      expect(config.sdlControllerAPI).toBe(true)
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
            customFieldDefinition: {
              name: 'game_version',
              label: 'Game Version',
              type: 'TEXT',
            },
            value: '1.0.0',
          },
          {
            customFieldDefinition: {
              name: 'average_fps',
              label: 'Average FPS',
              type: 'TEXT',
            },
            value: '60',
          },
          {
            customFieldDefinition: {
              name: 'media_url',
              label: 'Media URL',
              type: 'URL',
            },
            value: 'https://example.com',
          },
          {
            customFieldDefinition: {
              name: 'youtube',
              label: 'YouTube',
              type: 'URL',
            },
            value: 'https://youtube.com/watch?v=123',
          },
        ],
      }

      const config = convertToGameNativeConfig(input)

      // These fields should not affect the config
      // Config should still have default values
      expect(config.name).toBe('')
      expect(config.screenSize).toBe('854x480')
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
              type: 'TEXT',
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

      expect(config.screenSize).toBe('854x480') // Default
      expect(config.graphicsDriver).toBe('vortek') // Default
      expect(config.execArgs).toBe('') // Empty string default
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
              type: 'TEXT',
            },
            value: '1920x1080',
          },
          {
            customFieldDefinition: {
              name: 'graphics_driver',
              label: 'Graphics Driver',
              type: 'TEXT',
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
        audioDriver: 'alsa',
      })

      // Check formatting (should be pretty-printed)
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
      expect(parsed.screenSize).toBe('854x480')
    })
  })

  describe('getMissingImportantFields', () => {
    it('should return list of missing important fields', () => {
      const missing = getMissingImportantFields()

      expect(missing).toBeInstanceOf(Array)
      expect(missing.length).toBeGreaterThan(0)

      // Check for some important missing fields
      expect(missing.some((f) => f.includes('box86_version'))).toBe(true)
      expect(missing.some((f) => f.includes('wincomponents'))).toBe(true)
      expect(missing.some((f) => f.includes('cpuList'))).toBe(true)
      expect(missing.some((f) => f.includes('wow64Mode'))).toBe(true)
      expect(missing.some((f) => f.includes('showFPS'))).toBe(true)
      expect(missing.some((f) => f.includes('sdlControllerAPI'))).toBe(true)
      expect(missing.some((f) => f.includes('csmt'))).toBe(true)
      expect(missing.some((f) => f.includes('videoMemorySize'))).toBe(true)
    })
  })

  describe('Edge cases and special scenarios', () => {
    it('should handle mixed case graphics driver names', () => {
      const testCases = [
        { input: 'VORTEK', expected: 'vortek' },
        { input: 'Turnip', expected: 'turnip' },
        { input: 'VIRGL', expected: 'virgl' },
        { input: 'FREEDRENO', expected: 'vortek' }, // Not valid, defaults to vortek
        { input: 'MeSa', expected: 'vortek' }, // Not valid, defaults to vortek
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
                type: 'TEXT',
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
        { input: 'No resolution here', expected: '854x480' }, // Default
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

      expect(config.envVars).toBe('VAR1=value1   VAR2=value2') // Trimmed but internal spacing preserved
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
              type: 'TEXT',
            },
            value: '2560x1440',
          },
          {
            customFieldDefinition: {
              name: 'graphics_driver',
              label: 'Graphics Driver',
              type: 'TEXT',
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
            value: 'PulseAudio',
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
              type: 'TEXT',
            },
            value: '0.3.6',
          },
          {
            customFieldDefinition: {
              name: 'box64_preset',
              label: 'Box64 Preset',
              type: 'SELECT',
            },
            value: 'Stability',
          },
        ],
      })

      expect(config.screenSize).toBe('2560x1440')
      expect(config.graphicsDriver).toBe('turnip')
      expect(config.dxwrapper).toBe('vkd3d')
      expect(config.audioDriver).toBe('pulse')
      expect(config.startupSelection).toBe(0)
      expect(config.box64Version).toBe('0.3.6')
      expect(config.box64Preset).toBe('STABILITY')
    })
  })
})
