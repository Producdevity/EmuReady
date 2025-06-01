import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomFieldType } from '@orm'
import { type RouterInput } from '@/types/trpc'
import validateCustomFields from './validateCustomFields'

// Mock toast
vi.mock('@/lib/toast', () => ({
  default: {
    error: vi.fn(),
  },
}))

// Mock DOM methods
Object.defineProperty(document, 'querySelector', {
  value: vi.fn(() => ({
    closest: vi.fn(() => ({
      scrollIntoView: vi.fn(),
    })),
  })),
  writable: true,
})

type ListingFormValues = RouterInput['listings']['create']

interface CustomFieldDefinitionWithOptions {
  id: string
  name: string
  label: string
  type: CustomFieldType
  isRequired: boolean
  parsedOptions?: Array<{ value: string; label: string }>
}

describe('validateCustomFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when there are no custom fields', () => {
    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [],
    }

    const result = validateCustomFields(data, [])

    expect(result).toBe(true)
  })

  it('should return true when all required fields are filled', () => {
    const customFields: CustomFieldDefinitionWithOptions[] = [
      {
        id: 'field-1',
        name: 'driver_version',
        label: 'Driver Version',
        type: CustomFieldType.TEXT,
        isRequired: true,
      },
      {
        id: 'field-2',
        name: 'graphics_settings',
        label: 'Graphics Settings',
        type: CustomFieldType.SELECT,
        isRequired: true,
        parsedOptions: [
          { value: 'low', label: 'Low' },
          { value: 'high', label: 'High' },
        ],
      },
    ]

    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [
        {
          customFieldDefinitionId: 'field-1',
          value: 'v1.0',
        },
        {
          customFieldDefinitionId: 'field-2',
          value: 'high',
        },
      ],
    }

    const result = validateCustomFields(data, customFields)

    expect(result).toBe(true)
  })

  it('should return false and show toast when required TEXT field is missing', async () => {
    const toast = await import('@/lib/toast')

    const customFields: CustomFieldDefinitionWithOptions[] = [
      {
        id: 'field-1',
        name: 'driver_version',
        label: 'Driver Version',
        type: CustomFieldType.TEXT,
        isRequired: true,
      },
    ]

    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [],
    }

    const result = validateCustomFields(data, customFields)

    expect(result).toBe(false)
    expect(toast.default.error).toHaveBeenCalledWith(
      'Please fill in all required fields: Driver Version',
    )
  })

  it('should return false when required TEXT field is empty string', async () => {
    const toast = await import('@/lib/toast')

    const customFields: CustomFieldDefinitionWithOptions[] = [
      {
        id: 'field-1',
        name: 'driver_version',
        label: 'Driver Version',
        type: CustomFieldType.TEXT,
        isRequired: true,
      },
    ]

    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [
        {
          customFieldDefinitionId: 'field-1',
          value: '   ', // Whitespace only
        },
      ],
    }

    const result = validateCustomFields(data, customFields)

    expect(result).toBe(false)
    expect(toast.default.error).toHaveBeenCalledWith(
      'Please fill in all required fields: Driver Version',
    )
  })

  it('should return false when required SELECT field is empty', async () => {
    const toast = await import('@/lib/toast')

    const customFields: CustomFieldDefinitionWithOptions[] = [
      {
        id: 'field-1',
        name: 'graphics_settings',
        label: 'Graphics Settings',
        type: CustomFieldType.SELECT,
        isRequired: true,
        parsedOptions: [
          { value: 'low', label: 'Low' },
          { value: 'high', label: 'High' },
        ],
      },
    ]

    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [
        {
          customFieldDefinitionId: 'field-1',
          value: '',
        },
      ],
    }

    const result = validateCustomFields(data, customFields)

    expect(result).toBe(false)
    expect(toast.default.error).toHaveBeenCalledWith(
      'Please fill in all required fields: Graphics Settings',
    )
  })

  it('should return true for BOOLEAN fields regardless of value', () => {
    const customFields: CustomFieldDefinitionWithOptions[] = [
      {
        id: 'field-1',
        name: 'enable_feature',
        label: 'Enable Feature',
        type: CustomFieldType.BOOLEAN,
        isRequired: true,
      },
    ]

    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [
        {
          customFieldDefinitionId: 'field-1',
          value: false, // Even false should be valid for boolean
        },
      ],
    }

    const result = validateCustomFields(data, customFields)

    expect(result).toBe(true)
  })

  it('should skip non-required fields', () => {
    const customFields: CustomFieldDefinitionWithOptions[] = [
      {
        id: 'field-1',
        name: 'optional_field',
        label: 'Optional Field',
        type: CustomFieldType.TEXT,
        isRequired: false,
      },
    ]

    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [], // Empty is OK for non-required fields
    }

    const result = validateCustomFields(data, customFields)

    expect(result).toBe(true)
  })

  it('should handle multiple missing required fields', async () => {
    const toast = await import('@/lib/toast')

    const customFields: CustomFieldDefinitionWithOptions[] = [
      {
        id: 'field-1',
        name: 'driver_version',
        label: 'Driver Version',
        type: CustomFieldType.TEXT,
        isRequired: true,
      },
      {
        id: 'field-2',
        name: 'graphics_settings',
        label: 'Graphics Settings',
        type: CustomFieldType.SELECT,
        isRequired: true,
      },
    ]

    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [],
    }

    const result = validateCustomFields(data, customFields)

    expect(result).toBe(false)
    expect(toast.default.error).toHaveBeenCalledWith(
      'Please fill in all required fields: Driver Version, Graphics Settings',
    )
  })

  it('should trigger scroll to error after timeout', async () => {
    const customFields: CustomFieldDefinitionWithOptions[] = [
      {
        id: 'field-1',
        name: 'driver_version',
        label: 'Driver Version',
        type: CustomFieldType.TEXT,
        isRequired: true,
      },
    ]

    const data: ListingFormValues = {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      customFieldValues: [],
    }

    validateCustomFields(data, customFields)

    // Wait for the timeout to complete
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(document.querySelector).toHaveBeenCalledWith('.text-red-500')
  })
})
