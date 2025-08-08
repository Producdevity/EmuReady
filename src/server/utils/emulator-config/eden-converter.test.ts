import { describe, it, expect } from 'vitest'
import { convertToEdenConfig, serializeEdenConfig, type EdenConfigInput } from './eden-converter'
import type { EdenConfigSection } from './types/eden'

describe('Eden Converter', () => {
  describe('GPU Driver Edge Cases', () => {
    it('should handle various driver path formats correctly', () => {
      const testCases = [
        {
          input: '[MrPurple666/purple-turnip] turnip_mrpurple-T19-toasted.adpkg',
          expected:
            '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/turnip_mrpurple-T19-toasted.adpkg.zip',
          description: 'Standard format with brackets',
        },
        {
          input: 'turnip_v24.3.0_R9v2.adpkg',
          expected:
            '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/turnip_v24.3.0_R9v2.adpkg.zip',
          description: 'Just filename with .adpkg',
        },
        {
          input: 'N/A',
          expected: '',
          description: 'N/A should result in empty driver (use system)',
        },
        {
          input: 'Default System Driver',
          expected: '',
          description: 'Default System Driver should result in empty driver',
        },
        {
          input: 'Default',
          expected: '',
          description: 'Default should result in empty driver',
        },
        {
          input: '',
          expected: '',
          description: 'Empty string should remain empty',
        },
        {
          input: 'turnip-driver',
          expected:
            '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/turnip-driver.adpkg.zip',
          description: 'Legacy text field with driver name',
        },
        {
          input:
            '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/custom.zip',
          expected:
            '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/custom.zip',
          description: 'Already formatted path should pass through',
        },
        {
          input: 'some-random-text',
          expected: '',
          description: 'Unrecognized format should default to empty',
        },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'dynamic_driver_version',
                label: 'Driver Version',
                type: 'TEXT',
              },
              value: input,
            },
          ],
        })

        if (expected === '') {
          // Should keep useGlobal=true for empty driver
          expect(config.GpuDriver?.driver_path?.use_global).toBe(true)
          expect(config.GpuDriver?.driver_path?.value).toBe('')
        } else {
          expect(config.GpuDriver?.driver_path?.use_global).toBe(false)
          expect(config.GpuDriver?.driver_path?.value).toBe(expected)
        }
      })
    })

    it('should serialize driver_path correctly in different scenarios', () => {
      // Test with custom driver
      const configWithDriver = convertToEdenConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'dynamic_driver_version',
              label: 'Driver Version',
              type: 'TEXT',
            },
            value: '[Author/Repo] driver.adpkg',
          },
        ],
      })

      const serializedWithDriver = serializeEdenConfig(configWithDriver)
      expect(serializedWithDriver).toContain('driver_path\\use_global=false')
      expect(serializedWithDriver).toContain('driver_path\\default=false')
      expect(serializedWithDriver).toContain(
        'driver_path=/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/driver.adpkg.zip',
      )

      // Test with N/A (system driver)
      const configSystemDriver = convertToEdenConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'dynamic_driver_version',
              label: 'Driver Version',
              type: 'TEXT',
            },
            value: 'N/A',
          },
        ],
      })

      const serializedSystem = serializeEdenConfig(configSystemDriver)
      expect(serializedSystem).toContain('[GpuDriver]')
      expect(serializedSystem).toContain('driver_path\\use_global=true')
      expect(serializedSystem).not.toContain('driver_path\\default')
      expect(serializedSystem).not.toContain('driver_path=/')
    })
  })

  describe('Resolution Field Edge Cases', () => {
    it('should handle various resolution formats', () => {
      const testCases = [
        { input: '1x', expected: 2, description: 'Native resolution' },
        { input: 'Native', expected: 2, description: 'Native text' },
        { input: '2x', expected: 4, description: '2x multiplier' },
        { input: '0.5x', expected: 0, description: '0.5x multiplier' },
        { input: '4x', expected: 6, description: '4x multiplier' },
        { input: '3', expected: 3, description: 'Direct number' },
        { input: '10', expected: 10, description: 'Max value' },
        { input: '1.5x', expected: 3, description: '1.5x multiplier' },
        { input: '2.5 x', expected: 4, description: 'With space' },
        {
          input: 'invalid',
          expected: 2,
          description: 'Invalid defaults to native',
        },
        { input: '', expected: 2, description: 'Empty defaults to native' },
        {
          input: '100x',
          expected: 10,
          description: 'Too high defaults to max',
        },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test',
          gameId: 'game',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'rosolution', // Note the typo in the field name
                label: 'Resolution',
                type: 'TEXT',
              },
              value: input,
            },
          ],
        })

        expect(config.Renderer!.resolution_setup!.value).toBe(expected)
        expect(config.Renderer!.resolution_setup!.use_global).toBe(false)
      })
    })
  })

  describe('TEXT Field Type Detection', () => {
    it('should handle text fields with flexible input formats', () => {
      // Test with TEXT type fields that need smart detection
      const config = convertToEdenConfig({
        listingId: 'test',
        gameId: 'game',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'rosolution',
              label: 'Resolution',
              type: 'TEXT',
            },
            value: '2X', // Mixed case
          },
        ],
      })

      expect(config.Renderer?.resolution_setup?.value).toBe(4)
    })
  })

  describe('convertToEdenConfig - Complete Example from EdenListingByIdExample.ts', () => {
    it('should convert all fields from the complete example listing', () => {
      // This is the exact data from notes/EdenListingByIdExample.ts
      const input: EdenConfigInput = {
        listingId: '87488e65-02f1-4ca0-a5c1-1ed2aa90a7c7',
        gameId: 'ec907cdd-013a-48a1-8bc9-1fc0849389cb',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'accuracy_level',
              label: 'Accuracy Level',
              type: 'SELECT',
            },
            value: 'Normal',
          },
          {
            customFieldDefinition: {
              name: 'anisotropic_filtering',
              label: 'Anisotropic filtering',
              type: 'SELECT',
            },
            value: 'Default',
          },
          {
            customFieldDefinition: {
              name: 'anti_aliasing_method',
              label: 'Anti-aliasing method',
              type: 'SELECT',
            },
            value: 'None',
          },
          {
            customFieldDefinition: {
              name: 'astc_recompression_method',
              label: 'ASTC Recompression Method',
              type: 'SELECT',
            },
            value: 'Uncompressed',
          },
          {
            customFieldDefinition: {
              name: 'audio_output_engine',
              label: 'Audio output engine',
              type: 'SELECT',
            },
            value: 'Auto',
          },
          {
            customFieldDefinition: {
              name: 'average_fps',
              label: 'Average FPS',
              type: 'TEXT',
            },
            value: '30 to 60-ish',
          },
          {
            customFieldDefinition: {
              name: 'cpu_accuracy',
              label: 'CPU accuracy',
              type: 'SELECT',
            },
            value: 'Auto',
          },
          {
            customFieldDefinition: {
              name: 'cpu_backend',
              label: 'CPU backend',
              type: 'SELECT',
            },
            value: 'Native code execution (NCE)',
          },
          {
            customFieldDefinition: {
              name: 'descriptor_indexing',
              label: 'Descriptor Indexing',
              type: 'BOOLEAN',
            },
            value: false,
          },
          {
            customFieldDefinition: {
              name: 'disk_shader_cache',
              label: 'Disk shader cache',
              type: 'BOOLEAN',
            },
            value: true,
          },
          {
            customFieldDefinition: {
              name: 'docked_mode',
              label: 'Docked Mode',
              type: 'BOOLEAN',
            },
            value: false,
          },
          {
            customFieldDefinition: {
              name: 'dynamic_driver_version',
              label: 'Driver Version',
              type: 'TEXT',
            },
            value: '[MrPurple666/purple-turnip] turnip_mrpurple-T19-toasted.adpkg',
          },
          {
            customFieldDefinition: {
              name: 'emulator_version',
              label: 'Emulator Version',
              type: 'TEXT',
            },
            value: '0.0.3-rc2',
          },
          {
            customFieldDefinition: {
              name: 'enable_lru_cache',
              label: 'Enable LRU Cache',
              type: 'BOOLEAN',
            },
            value: false,
          },
          {
            customFieldDefinition: {
              name: 'enhanced_frame_pacing',
              label: 'Enhanced Frame Pacing',
              type: 'BOOLEAN',
            },
            value: true,
          },
          {
            customFieldDefinition: {
              name: 'extended_dynamic_state',
              label: 'Extended Dynamic State',
              type: 'RANGE',
            },
            value: '0',
          },
          {
            customFieldDefinition: {
              name: 'fast_cpu_time',
              label: 'Fast CPU Time',
              type: 'BOOLEAN',
            },
            value: false,
          },
          {
            customFieldDefinition: {
              name: 'game_version',
              label: 'Game Version',
              type: 'TEXT',
            },
            value: '1.3.0',
          },
          {
            customFieldDefinition: {
              name: 'gpu_api',
              label: 'GPU API',
              type: 'SELECT',
            },
            value: 'Vulkan',
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
              name: 'nvdec_emulation',
              label: 'NVDEC Emulation',
              type: 'SELECT',
            },
            value: 'CPU',
          },
          {
            customFieldDefinition: {
              name: 'optimize_spirv_output',
              label: 'Optimize SPIRV output',
              type: 'SELECT',
            },
            value: 'On Load',
          },
          {
            customFieldDefinition: {
              name: 'provoking_vertex',
              label: 'Provoking Vertex',
              type: 'BOOLEAN',
            },
            value: false,
          },
          {
            customFieldDefinition: {
              name: 'rosolution',
              label: 'Resolution',
              type: 'TEXT',
            },
            value: '1280x720',
          },
          {
            customFieldDefinition: {
              name: 'synchronize_core_speed',
              label: 'Syncronize Core Speed',
              type: 'BOOLEAN',
            },
            value: false,
          },
          {
            customFieldDefinition: {
              name: 'use_async_shaders',
              label: 'Use async shaders',
              type: 'BOOLEAN',
            },
            value: true,
          },
          {
            customFieldDefinition: {
              name: 'use_fast_gpu_time',
              label: 'Use Fast GPU Time',
              type: 'BOOLEAN',
            },
            value: false,
          },
          {
            customFieldDefinition: {
              name: 'use_reactive_flushing',
              label: 'Use reactive flushing',
              type: 'BOOLEAN',
            },
            value: false,
          },
          {
            customFieldDefinition: {
              name: 'vram_usage_mode',
              label: 'VRAM Usage Mode',
              type: 'SELECT',
            },
            value: 'Conservative',
          },
          {
            customFieldDefinition: {
              name: 'vsync_mode',
              label: 'VSync Mode',
              type: 'SELECT',
            },
            value: 'FIFO (On)',
          },
          {
            customFieldDefinition: {
              name: 'window_adapting_filter',
              label: 'Window adapting filter',
              type: 'SELECT',
            },
            value: 'Bilinear',
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

      const config = convertToEdenConfig(input)

      // Test all mapped fields - using proper numeric types
      expect(config.Renderer?.gpu_accuracy?.value).toBe(0) // Normal
      expect(config.Renderer?.max_anisotropy?.value).toBe(0) // Default
      expect(config.Renderer?.anti_aliasing?.value).toBe(0) // None
      expect(config.Renderer?.astc_recompression?.value).toBe(0) // Uncompressed
      expect(config.Audio?.output_engine?.value).toBe(0) // Auto
      expect(config.Cpu?.cpu_accuracy?.value).toBe(0) // Auto
      expect(config.Cpu?.cpu_backend?.value).toBe(1) // NCE
      expect(config.Renderer?.descriptor_indexing?.value).toBe(false)
      expect(config.Renderer?.use_disk_shader_cache?.value).toBe(true)
      expect(config.System?.use_docked_mode?.value).toBe(false)
      expect(config.GpuDriver?.driver_path?.value).toBe(
        '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/turnip_mrpurple-T19-toasted.adpkg.zip',
      )
      expect(config.System?.use_lru_cache?.value).toBe(false)
      expect(config.Renderer?.dyna_state?.value).toBe(0)
      expect(config.Cpu?.use_fast_cpu_time?.value).toBe(false)
      expect(config.Cpu?.fast_cpu_time?.value).toBe(0)
      expect(config.Renderer?.backend?.value).toBe(1) // Vulkan
      expect(config.Renderer?.nvdec_emulation?.value).toBe(1) // CPU
      expect(config.Renderer?.optimize_spirv_output?.value).toBe(1) // On Load
      expect(config.Renderer?.provoking_vertex?.value).toBe(false)
      // '1280x720' is not a valid Eden resolution format, it should default to native (2)
      expect(config.Renderer?.resolution_setup?.value).toBe(2)
      expect(config.Core?.sync_core_speed?.value).toBe(false)
      expect(config.Renderer?.use_asynchronous_shaders?.value).toBe(true)
      expect(config.Renderer?.use_fast_gpu_time?.value).toBe(false)
      expect(config.Renderer?.fast_gpu_time?.value).toBe(0)
      expect(config.Renderer?.use_reactive_flushing?.value).toBe(false)
      expect(config.Renderer?.vram_usage_mode?.value).toBe(0) // Conservative
      expect(config.Renderer?.use_vsync?.value).toBe(2) // FIFO
      expect(config.Renderer?.scaling_filter?.value).toBe(1) // Bilinear

      // Verify informational fields don't affect config
      // average_fps, emulator_version, game_version, media_url, youtube, enhanced_frame_pacing should be ignored
      // Check that defaults remain for fields that should not be affected
      expect(config.Core!.use_multi_core!.use_global).toBe(true)
    })
  })

  describe('convertToEdenConfig - Boolean Fields', () => {
    const booleanTestCases = [
      {
        field: 'disk_shader_cache',
        key: 'use_disk_shader_cache',
        section: 'Renderer',
      },
      {
        field: 'use_async_shaders',
        key: 'use_asynchronous_shaders',
        section: 'Renderer',
      },
      {
        field: 'use_reactive_flushing',
        key: 'use_reactive_flushing',
        section: 'Renderer',
      },
      { field: 'docked_mode', key: 'use_docked_mode', section: 'System' },
      { field: 'enable_lru_cache', key: 'use_lru_cache', section: 'System' },
      {
        field: 'descriptor_indexing',
        key: 'descriptor_indexing',
        section: 'Renderer',
      },
      {
        field: 'provoking_vertex',
        key: 'provoking_vertex',
        section: 'Renderer',
      },
      {
        field: 'synchronize_core_speed',
        key: 'sync_core_speed',
        section: 'Core',
      },
      { field: 'fast_cpu_time', key: 'use_fast_cpu_time', section: 'Cpu' },
      {
        field: 'use_fast_gpu_time',
        key: 'use_fast_gpu_time',
        section: 'Renderer',
      },
    ]

    booleanTestCases.forEach(({ field, key, section }) => {
      it(`should convert ${field} true to 'true' string`, () => {
        const input: EdenConfigInput = {
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: field,
                label: field,
                type: 'BOOLEAN',
              },
              value: true,
            },
          ],
        }

        const config = convertToEdenConfig(input)
        const configSection = config[section as keyof typeof config] as any
        expect(configSection![key]!.value).toBe(true)
        expect(configSection![key]!.use_global).toBe(false)
      })

      it(`should convert ${field} false to 'false' string`, () => {
        const input: EdenConfigInput = {
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: field,
                label: field,
                type: 'BOOLEAN',
              },
              value: false,
            },
          ],
        }

        const config = convertToEdenConfig(input)
        const configSection = config[section as keyof typeof config] as any
        expect(configSection![key]!.value).toBe(false)
        expect(configSection![key]!.use_global).toBe(false)
      })
    })
  })

  describe('convertToEdenConfig - Select Fields with Value Transformations', () => {
    it('should transform all CPU backend values', () => {
      const testCases = [
        { input: 'Native code execution (NCE)', expected: 1 },
        { input: 'Dynamic (Slow)', expected: 0 },
        { input: 'Unknown Value', expected: 0 }, // Fallback to Dynarmic
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'cpu_backend',
                label: 'CPU backend',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Cpu!.cpu_backend!.value).toBe(expected)
      })
    })

    it('should transform all CPU accuracy values', () => {
      const testCases = [
        { input: 'Auto', expected: 0 },
        { input: 'Accurate', expected: 1 },
        { input: 'Unsafe', expected: 2 },
        { input: 'Paranoid (Slow)', expected: 1 }, // Maps to Accurate
        { input: 'Custom', expected: 0 }, // Fallback to Auto
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'cpu_accuracy',
                label: 'CPU accuracy',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Cpu!.cpu_accuracy!.value).toBe(expected)
      })
    })

    it('should transform all GPU API values', () => {
      const testCases = [
        { input: 'Vulkan', expected: 1 },
        { input: 'OpenGL', expected: 0 },
        { input: 'Other', expected: 3 }, // Null
        { input: 'DirectX', expected: 1 }, // Fallback to Vulkan
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'gpu_api',
                label: 'GPU API',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.backend!.value).toBe(expected)
      })
    })

    it('should transform all anti-aliasing method values', () => {
      const testCases = [
        { input: 'None', expected: 0 },
        { input: 'FXAA', expected: 1 },
        { input: 'SMAA', expected: 2 },
        { input: 'Other', expected: 0 },
        { input: 'TAA', expected: 0 }, // Fallback
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'anti_aliasing_method',
                label: 'Anti-aliasing method',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.anti_aliasing!.value).toBe(expected)
      })
    })

    it('should transform all anisotropic filtering values', () => {
      const testCases = [
        { input: 'Auto', expected: 0 },
        { input: 'Default', expected: 0 },
        { input: '2x', expected: 1 },
        { input: '4x', expected: 2 },
        { input: '8x', expected: 3 },
        { input: '16x', expected: 4 },
        { input: '32x', expected: 0 }, // Fallback
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'anisotropic_filtering',
                label: 'Anisotropic filtering',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.max_anisotropy!.value).toBe(expected)
      })
    })

    it('should transform all VSync mode values to number', () => {
      const testCases = [
        { input: 'FIFO (On)', expected: 2 },
        { input: 'FIFO Relaxed', expected: 3 },
        { input: 'Mailbox', expected: 1 },
        { input: 'Immediate (Off)', expected: 0 },
        { input: 'N/A', expected: 2 }, // Fallback to FIFO
        { input: 'Custom Mode', expected: 2 }, // Fallback to FIFO
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'vsync_mode',
                label: 'VSync Mode',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.use_vsync!.value).toBe(expected)
      })
    })

    it('should transform all ASTC recompression values', () => {
      const testCases = [
        { input: 'Uncompressed', expected: 0 },
        { input: 'BC1 (Low Quality)', expected: 1 },
        { input: 'BC3 (Medium Quality)', expected: 2 },
        { input: 'BC5', expected: 2 }, // Fallback to BC3
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'astc_recompression_method',
                label: 'ASTC Recompression Method',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.astc_recompression!.value).toBe(expected)
      })
    })

    it('should transform all NVDEC emulation values', () => {
      const testCases = [
        { input: 'None', expected: 0 },
        { input: 'CPU', expected: 1 },
        { input: 'GPU', expected: 2 },
        { input: 'Hardware', expected: 1 }, // Fallback to CPU
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'nvdec_emulation',
                label: 'NVDEC Emulation',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.nvdec_emulation!.value).toBe(expected)
      })
    })

    it('should transform all VRAM usage mode values', () => {
      const testCases = [
        { input: 'Conservative', expected: 0 },
        { input: 'Aggressive', expected: 1 },
        { input: 'Balanced', expected: 1 }, // Fallback to Aggressive
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'vram_usage_mode',
                label: 'VRAM Usage Mode',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.vram_usage_mode!.value).toBe(expected)
      })
    })

    it('should transform all audio output engine values', () => {
      const testCases = [
        { input: 'Auto', expected: 0 },
        { input: 'oboe', expected: 0 }, // Maps to Auto (fallback)
        { input: 'Cubeb', expected: 1 },
        { input: 'Null', expected: 3 },
        { input: 'ALSA', expected: 0 }, // Fallback to Auto
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'audio_output_engine',
                label: 'Audio output engine',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Audio!.output_engine!.value).toBe(expected)
      })
    })

    it('should transform all window adapting filter values', () => {
      const testCases = [
        { input: 'Nearest Neighbor', expected: 0 },
        { input: 'Bilinear', expected: 1 },
        { input: 'Bicubic', expected: 2 },
        { input: 'Gaussian', expected: 3 },
        { input: 'ScaleForce', expected: 4 },
        { input: 'AMD FidelityFX - Super Resolution', expected: 5 },
        { input: 'NVIDIA', expected: 6 },
        { input: 'Other', expected: 1 },
        { input: 'Lanczos', expected: 1 }, // Fallback
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'window_adapting_filter',
                label: 'Window adapting filter',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.scaling_filter!.value).toBe(expected)
      })
    })

    it('should transform all optimize SPIRV output values', () => {
      const testCases = [
        { input: 'Never', expected: 0 },
        { input: 'On Load', expected: 1 },
        { input: 'Always', expected: 2 },
        { input: 'Dynamic', expected: 1 }, // Fallback
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'optimize_spirv_output',
                label: 'Optimize SPIRV output',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.optimize_spirv_output!.value).toBe(expected)
      })
    })

    it('should transform all accuracy level values', () => {
      const testCases = [
        { input: 'Normal', expected: 0 },
        { input: 'High', expected: 1 },
        { input: 'Extreme (Slow)', expected: 2 },
        { input: 'Low', expected: 0 }, // Fallback
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'accuracy_level',
                label: 'Accuracy Level',
                type: 'SELECT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.gpu_accuracy!.value).toBe(expected)
      })
    })
  })

  describe('convertToEdenConfig - Driver Path Transformations', () => {
    it('should extract driver filename from bracketed format', () => {
      const input: EdenConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'dynamic_driver_version',
              label: 'Driver Version',
              type: 'TEXT',
            },
            value: '[MrPurple666/purple-turnip] turnip_mrpurple-T19-toasted.adpkg',
          },
        ],
      }

      const config = convertToEdenConfig(input)
      expect(config.GpuDriver!.driver_path!.value).toBe(
        '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/turnip_mrpurple-T19-toasted.adpkg.zip',
      )
    })

    it('should handle driver path with just .adpkg filename', () => {
      const input: EdenConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'dynamic_driver_version',
              label: 'Driver Version',
              type: 'TEXT',
            },
            value: 'mesa-driver-v24.adpkg',
          },
        ],
      }

      const config = convertToEdenConfig(input)
      expect(config.GpuDriver!.driver_path!.value).toBe(
        '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/mesa-driver-v24.adpkg.zip',
      )
    })

    it('should treat non-driver values as system default', () => {
      const testCases = ['Xclipse Stock', 'Default Driver', 'System Default', '']

      testCases.forEach((value) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'dynamic_driver_version',
                label: 'Driver Version',
                type: 'TEXT',
              },
              value,
            },
          ],
        })
        // These should all result in useGlobal=true (system driver)
        expect(config.GpuDriver?.driver_path?.use_global).toBe(true)
        expect(config.GpuDriver?.driver_path?.value).toBe('')
      })
    })

    it('should handle driver field as SELECT type with new dropdown values', () => {
      const testCases = [
        {
          input: '[MrPurple666/purple-turnip] turnip_mrpurple-T19-toasted.adpkg',
          expected:
            '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/turnip_mrpurple-T19-toasted.adpkg.zip',
        },
        {
          input: '[RandomUser/random-repo] custom-driver.adpkg',
          expected:
            '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/custom-driver.adpkg.zip',
        },
        {
          input: 'N/A',
          expected: '',
        },
        {
          input: 'Default System Driver',
          expected: '',
        },
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'dynamic_driver_version',
                label: 'Graphics Driver',
                type: 'SELECT', // New SELECT type
                options: [
                  'N/A',
                  'Default System Driver',
                  '[MrPurple666/purple-turnip] turnip_mrpurple-T19-toasted.adpkg',
                  '[RandomUser/random-repo] custom-driver.adpkg',
                ],
              },
              value: input,
            },
          ],
        })

        if (expected === '') {
          expect(config.GpuDriver?.driver_path?.use_global).toBe(true)
          expect(config.GpuDriver?.driver_path?.value).toBe('')
        } else {
          expect(config.GpuDriver?.driver_path?.use_global).toBe(false)
          expect(config.GpuDriver?.driver_path?.value).toBe(expected)
        }
      })
    })

    it('should handle mixed legacy TEXT and new SELECT driver fields', () => {
      // Test backwards compatibility - old listings with TEXT field should still work
      const configText = convertToEdenConfig({
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'dynamic_driver_version',
              label: 'Driver Version',
              type: 'TEXT', // Legacy TEXT field
            },
            value: 'turnip-driver.adpkg',
          },
        ],
      })

      expect(configText.GpuDriver?.driver_path?.value).toBe(
        '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/turnip-driver.adpkg.zip',
      )

      // New SELECT field should work the same way
      const configSelect = convertToEdenConfig({
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'dynamic_driver_version',
              label: 'Graphics Driver',
              type: 'SELECT', // New SELECT field
              options: ['N/A', 'turnip-driver.adpkg'],
            },
            value: 'turnip-driver.adpkg',
          },
        ],
      })

      expect(configSelect.GpuDriver?.driver_path?.value).toBe(
        '/storage/emulated/0/Android/data/dev.eden.eden_emulator/files/gpu_drivers/turnip-driver.adpkg.zip',
      )
    })
  })

  describe('convertToEdenConfig - Range Values', () => {
    it('should handle extended dynamic state range values', () => {
      const testCases = ['0', '1', '2', '3']

      testCases.forEach((value) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'extended_dynamic_state',
                label: 'Extended Dynamic State',
                type: 'RANGE',
              },
              value,
            },
          ],
        })
        expect(config.Renderer?.dyna_state?.value).toBe(0) // Disabled is default
      })
    })

    it('should handle numeric range values', () => {
      const config = convertToEdenConfig({
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'extended_dynamic_state',
              label: 'Extended Dynamic State',
              type: 'RANGE',
            },
            value: 2,
          },
        ],
      })
      expect(config.Renderer?.dyna_state?.value).toBe(0) // Default since numeric input maps to 0
    })
  })

  describe('convertToEdenConfig - Special Cases', () => {
    it('should handle fast_cpu_time affecting multiple fields', () => {
      const testCases = [true, false]

      testCases.forEach((value) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'fast_cpu_time',
                label: 'Fast CPU Time',
                type: 'BOOLEAN',
              },
              value,
            },
          ],
        })

        expect(config.Cpu?.use_fast_cpu_time?.value).toBe(value)
        expect(config.Cpu?.fast_cpu_time?.value).toBe(value ? 1 : 0)
        expect(config.Cpu?.use_fast_cpu_time?.use_global).toBe(false)
        expect(config.Cpu?.fast_cpu_time?.use_global).toBe(false)
      })
    })

    it('should handle use_fast_gpu_time affecting multiple fields', () => {
      const testCases = [true, false]

      testCases.forEach((value) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'use_fast_gpu_time',
                label: 'Use Fast GPU Time',
                type: 'BOOLEAN',
              },
              value,
            },
          ],
        })

        expect(config.Renderer?.use_fast_gpu_time?.value).toBe(value)
        expect(config.Renderer?.fast_gpu_time?.value).toBe(value ? 1 : 0)
        expect(config.Renderer?.use_fast_gpu_time?.use_global).toBe(false)
        expect(config.Renderer?.fast_gpu_time?.use_global).toBe(false)
      })
    })

    it('should transform resolution values correctly', () => {
      const testCases = [
        { input: '1280x720', expected: 2 }, // Not a multiplier, defaults to native
        { input: '1920x1080', expected: 2 }, // Not a multiplier, defaults to native
        { input: '1X (720p/1080p)', expected: 2 }, // 1x = native
        { input: '2X (1440p/4K)', expected: 4 }, // 2x multiplier
        { input: 'Native', expected: 2 }, // Native = 1x
      ]

      testCases.forEach(({ input, expected }) => {
        const config = convertToEdenConfig({
          listingId: 'test-id',
          gameId: 'game-id',
          customFieldValues: [
            {
              customFieldDefinition: {
                name: 'rosolution', // Note the typo
                label: 'Resolution',
                type: 'TEXT',
              },
              value: input,
            },
          ],
        })
        expect(config.Renderer!.resolution_setup!.value).toBe(expected)
      })
    })
  })

  describe('convertToEdenConfig - Ignored Fields', () => {
    it('should ignore informational fields', () => {
      const input: EdenConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'emulator_version',
              label: 'Emulator Version',
              type: 'TEXT',
            },
            value: '0.0.3-rc2',
          },
          {
            customFieldDefinition: {
              name: 'game_version',
              label: 'Game Version',
              type: 'TEXT',
            },
            value: '1.3.0',
          },
          {
            customFieldDefinition: {
              name: 'average_fps',
              label: 'Average FPS',
              type: 'TEXT',
            },
            value: '30 to 60-ish',
          },
          {
            customFieldDefinition: {
              name: 'media_url',
              label: 'Screenshots, Blog Post, etc',
              type: 'URL',
            },
            value: 'https://example.com/screenshot.png',
          },
          {
            customFieldDefinition: {
              name: 'youtube',
              label: 'YouTube',
              type: 'URL',
            },
            value: 'https://youtube.com/watch?v=123',
          },
          {
            customFieldDefinition: {
              name: 'enhanced_frame_pacing',
              label: 'Enhanced Frame Pacing',
              type: 'BOOLEAN',
            },
            value: true,
          },
        ],
      }

      const config = convertToEdenConfig(input)

      // These fields should not affect any config values
      // Check that defaults remain unchanged
      expect(config.Core!.use_multi_core!.use_global).toBe(true)
      expect(config.Core!.use_multi_core!.value).toBe(true)
      expect(config.Renderer!.shader_backend!.use_global).toBe(true)
      expect(config.Renderer!.shader_backend!.value).toBe(2)

      // No custom fields should be set
      Object.values(config).forEach((section) => {
        Object.values(section as EdenConfigSection).forEach((setting) => {
          const configValue = setting as any
          if (configValue?.use_global === false) {
            // Should not have any non-global settings from these fields
            expect(configValue).toBeUndefined()
          }
        })
      })
    })

    it('should handle unknown fields gracefully', () => {
      const input: EdenConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'unknown_field_1',
              label: 'Unknown Field 1',
              type: 'TEXT',
            },
            value: 'some value',
          },
          {
            customFieldDefinition: {
              name: 'new_feature_flag',
              label: 'New Feature Flag',
              type: 'BOOLEAN',
            },
            value: true,
          },
        ],
      }

      const config = convertToEdenConfig(input)

      // Should not crash and should return default config
      expect(config).toBeDefined()
      expect(config.Core!.use_multi_core!.use_global).toBe(true)
    })
  })

  describe('convertToEdenConfig - Default Values', () => {
    it('should maintain all default values when no custom fields provided', () => {
      const input: EdenConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [],
      }

      const config = convertToEdenConfig(input)

      // Check key defaults - using proper types
      expect(config.Controls?.vibration_enabled?.value).toBe(true)
      expect(config.Controls?.vibration_enabled?.use_global).toBe(true)

      expect(config.Core?.use_multi_core?.value).toBe(true)
      expect(config.Core?.use_multi_core?.use_global).toBe(true)

      expect(config.Cpu?.cpu_backend?.value).toBe(0) // Dynarmic
      expect(config.Cpu?.cpu_backend?.use_global).toBe(true)

      expect(config.Renderer?.backend?.value).toBe(1) // Vulkan
      expect(config.Renderer?.backend?.use_global).toBe(true)

      expect(config.Audio?.output_engine?.value).toBe(0) // Auto
      expect(config.Audio?.output_engine?.use_global).toBe(true)

      expect(config.System?.use_docked_mode?.value).toBe(true)
      expect(config.System?.use_docked_mode?.use_global).toBe(true)
    })

    it('should override only specified fields and keep others as default', () => {
      const input: EdenConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'gpu_api',
              label: 'GPU API',
              type: 'SELECT',
            },
            value: 'OpenGL',
          },
        ],
      }

      const config = convertToEdenConfig(input)

      // Changed field
      expect(config.Renderer?.backend?.value).toBe(0) // OpenGL
      expect(config.Renderer?.backend?.use_global).toBe(false)

      // Unchanged fields should remain default
      expect(config.Core?.use_multi_core?.value).toBe(true)
      expect(config.Core?.use_multi_core?.use_global).toBe(true)

      expect(config.Cpu?.cpu_backend?.value).toBe(0) // Default value
      expect(config.Cpu?.cpu_backend?.use_global).toBe(true)
    })
  })

  describe('serializeEdenConfig', () => {
    it('should serialize complete config to proper .ini format', () => {
      const input: EdenConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [
          {
            customFieldDefinition: {
              name: 'use_async_shaders',
              label: 'Use async shaders',
              type: 'BOOLEAN',
            },
            value: true,
          },
          {
            customFieldDefinition: {
              name: 'vsync_mode',
              label: 'VSync Mode',
              type: 'SELECT',
            },
            value: 'FIFO (On)',
          },
        ],
      }

      const config = convertToEdenConfig(input)
      const serialized = serializeEdenConfig(config)

      // Check format structure
      expect(serialized).toContain('[Controls]')
      expect(serialized).toContain('[Core]')
      expect(serialized).toContain('[Cpu]')
      expect(serialized).toContain('[Linux]')
      expect(serialized).toContain('[Renderer]')
      expect(serialized).toContain('[Audio]')
      expect(serialized).toContain('[System]')
      expect(serialized).toContain('[GpuDriver]')

      // Check that custom values are written correctly
      expect(serialized).toContain('use_asynchronous_shaders\\use_global=false')
      expect(serialized).toContain('use_asynchronous_shaders\\default=false')
      expect(serialized).toContain('use_asynchronous_shaders=true')

      expect(serialized).toContain('use_vsync\\use_global=false')
      expect(serialized).toContain('use_vsync\\default=false')
      expect(serialized).toContain('use_vsync=2')

      // Check that global values only have use_global line
      expect(serialized).toContain('use_multi_core\\use_global=true')
      expect(serialized).not.toContain('use_multi_core\\default')
      expect(serialized).not.toContain(/^use_multi_core=/m)

      // Check section separators (double newlines)
      const lines = serialized.split('\n')
      const coreIndex = lines.indexOf('[Core]')
      expect(lines[coreIndex - 1]).toBe('')
      expect(lines[coreIndex - 2]).toBe('')
    })

    it('should handle empty sections correctly', () => {
      const input: EdenConfigInput = {
        listingId: 'test-id',
        gameId: 'game-id',
        customFieldValues: [],
      }

      const config = convertToEdenConfig(input)
      const serialized = serializeEdenConfig(config)

      // All sections should be present even with defaults
      expect(serialized).toContain('[Controls]')
      expect(serialized).toContain('[Linux]')

      // All values should be global (use_global=true)
      const useGlobalLines = serialized.match(/\\use_global=true/g)
      expect(useGlobalLines).toBeTruthy()
      expect(useGlobalLines!.length).toBeGreaterThan(50) // Many default settings

      // No custom values should be present
      const customValueLines = serialized.match(/\\use_global=false/g)
      expect(customValueLines).toBeNull()
    })
  })
})
