/**
 * Tests for Emulator Detection and Config Generator Selection
 */

import { describe, it, expect } from 'vitest'
import { type EmulatorConfigType } from './constants'
import {
  detectEmulatorConfigType,
  generateEmulatorConfig,
  getSupportedEmulators,
  isConfigGenerationSupported,
  getConfigFileExtension,
} from './emulator-detector'

describe('Emulator Detector', () => {
  describe('detectEmulatorConfigType', () => {
    it('should detect Eden-compatible emulators', () => {
      expect(detectEmulatorConfigType('Eden')).toBe('eden')
    })

    it('should detect GameNative-compatible emulators', () => {
      expect(detectEmulatorConfigType('GameNative')).toBe('gamenative')
    })

    it('should throw error for unsupported emulators', () => {
      expect(() => detectEmulatorConfigType('AetherSX2')).toThrow(
        'Config generation not supported for emulator: AetherSX2',
      )
      expect(() => detectEmulatorConfigType('PPSSPP')).toThrow(
        'Config generation not supported for emulator: PPSSPP',
      )
      expect(() => detectEmulatorConfigType('Dolphin')).toThrow(
        'Config generation not supported for emulator: Dolphin',
      )
      expect(() => detectEmulatorConfigType('PCSX2')).toThrow(
        'Config generation not supported for emulator: PCSX2',
      )
      expect(() => detectEmulatorConfigType('Yuzu')).toThrow(
        'Config generation not supported for emulator: Yuzu',
      )
      expect(() => detectEmulatorConfigType('RetroArch')).toThrow(
        'Config generation not supported for emulator: RetroArch',
      )
    })

    it('should handle case-insensitive matching', () => {
      expect(detectEmulatorConfigType('eden')).toBe('eden')
      expect(detectEmulatorConfigType('EDEN')).toBe('eden')
      expect(detectEmulatorConfigType('GAMENATIVE')).toBe('gamenative')
      expect(detectEmulatorConfigType('gamenative')).toBe('gamenative')
    })

    it('should throw error for unknown emulators', () => {
      expect(() => detectEmulatorConfigType('UnknownEmulator')).toThrow(
        'Config generation not supported for emulator: UnknownEmulator',
      )
      expect(() => detectEmulatorConfigType('RandomName')).toThrow(
        'Config generation not supported for emulator: RandomName',
      )
      expect(() => detectEmulatorConfigType('')).toThrow(
        'Config generation not supported for emulator: ',
      )
    })
  })

  describe('generateEmulatorConfig', () => {
    const mockCustomFieldValues = [
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
          name: 'cpu_backend',
          label: 'CPU Backend',
          type: 'SELECT',
        },
        value: 'Native code execution (NCE)',
      },
    ]

    it('should generate Eden config for Eden emulator', () => {
      const result = generateEmulatorConfig({
        listingId: 'test-listing-123',
        gameId: 'test-game-456',
        emulatorName: 'Eden',
        customFieldValues: mockCustomFieldValues,
      })

      expect(result.type).toBe('eden')
      expect(result.filename).toBe('eden-test-listing-123.ini')
      expect(result.serialized).toContain('[Controls]')
      expect(result.serialized).toContain('[Renderer]')
      expect(typeof result.config).toBe('object')
    })

    it('should generate GameNative config for GameNative emulator', () => {
      const gameNativeFields = [
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
            type: 'SELECT',
          },
          value: 'Vortek (Universal)',
        },
      ]

      const result = generateEmulatorConfig({
        listingId: 'test-listing-789',
        gameId: 'test-game-012',
        emulatorName: 'GameNative',
        customFieldValues: gameNativeFields,
      })

      expect(result.type).toBe('gamenative')
      expect(result.filename).toBe('gamenative-test-listing-789.json')
      expect(() => JSON.parse(result.serialized)).not.toThrow()
      expect(typeof result.config).toBe('object')
    })

    it('should throw error for unsupported emulators', () => {
      expect(() => {
        generateEmulatorConfig({
          listingId: 'test-listing-unsupported',
          gameId: 'test-game-unsupported',
          emulatorName: 'PPSSPP',
          customFieldValues: [],
        })
      }).toThrow('Config generation not supported for emulator: PPSSPP')
    })

    it('should throw error for unknown emulators', () => {
      expect(() => {
        generateEmulatorConfig({
          listingId: 'test-listing-unknown',
          gameId: 'test-game-unknown',
          emulatorName: 'UnknownEmulator',
          customFieldValues: [],
        })
      }).toThrow(
        'Config generation not supported for emulator: UnknownEmulator',
      )
    })
  })

  describe('getSupportedEmulators', () => {
    it('should return categorized list of emulators', () => {
      const supported = getSupportedEmulators()

      expect(supported.eden).toContain('Eden')
      expect(supported.gamenative).toContain('GameNative')

      // Only these two are currently supported
      expect(supported.eden).toHaveLength(1)
      expect(supported.gamenative).toHaveLength(1)

      // Ensure no overlap
      const allEmulators = [...supported.eden, ...supported.gamenative]
      const uniqueEmulators = [...new Set(allEmulators)]
      expect(allEmulators.length).toBe(uniqueEmulators.length)
    })
  })

  describe('isConfigGenerationSupported', () => {
    it('should return true for supported emulators', () => {
      expect(isConfigGenerationSupported('Eden')).toBe(true)
      expect(isConfigGenerationSupported('GameNative')).toBe(true)
    })

    it('should return false for unsupported emulators', () => {
      expect(isConfigGenerationSupported('PPSSPP')).toBe(false)
      expect(isConfigGenerationSupported('Dolphin')).toBe(false)
      expect(isConfigGenerationSupported('UnknownEmulator')).toBe(false)
      expect(isConfigGenerationSupported('Yuzu')).toBe(false)
      expect(isConfigGenerationSupported('Winlator')).toBe(false)
    })

    it('should handle case-insensitive input', () => {
      expect(isConfigGenerationSupported('eden')).toBe(true)
      expect(isConfigGenerationSupported('GAMENATIVE')).toBe(true)
      expect(isConfigGenerationSupported('ppsspp')).toBe(false)
    })
  })

  describe('getConfigFileExtension', () => {
    it('should return correct extensions for config types', () => {
      expect(getConfigFileExtension('eden')).toBe('.ini')
      expect(getConfigFileExtension('gamenative')).toBe('.json')
    })

    it('should throw error for unknown type', () => {
      expect(() => {
        getConfigFileExtension('unknown' as EmulatorConfigType)
      }).toThrow('Unknown config type: unknown')
    })
  })
})
