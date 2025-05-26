import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomFieldType } from '@orm'

const mockPrisma = {
  $transaction: vi.fn(),
  customFieldDefinition: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  listing: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  listingCustomFieldValue: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}

const mockContext = {
  prisma: mockPrisma,
  session: {
    user: {
      id: 'user-1',
      role: 'AUTHOR',
    },
  },
}

describe('Listings Router Custom Field Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate required custom fields', async () => {
    // Mock custom field definitions with a required field
    const mockCustomFields = [
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        label: 'Required Field',
        name: 'required_field',
        type: CustomFieldType.TEXT,
        isRequired: true,
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      },
    ]

    // Mock the transaction function
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      // Mock the transaction context
      const txContext = {
        customFieldDefinition: {
          findMany: vi.fn().mockResolvedValue(mockCustomFields),
          findUnique: vi.fn(),
        },
        listing: {
          create: vi.fn(),
        },
        listingCustomFieldValue: {
          create: vi.fn(),
        },
      }

      return callback(txContext)
    })

    // Mock user exists
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })

    // Mock no existing listing
    mockPrisma.listing.findFirst.mockResolvedValue(null)

    // Import the router after mocking
    const { listingsRouter } = await import('./listings')

    // Create a caller with the mocked context
    const caller = listingsRouter.createCaller(mockContext as any)

    // Test data without required custom field
    const listingData = {
      gameId: '123e4567-e89b-12d3-a456-426614174000',
      deviceId: '123e4567-e89b-12d3-a456-426614174001',
      emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      performanceId: 1,
      customFieldValues: [], // Missing required field
    }

    // Should throw an error for missing required field
    await expect(caller.create(listingData)).rejects.toThrow(
      "Required custom field 'Required Field' is missing",
    )
  })

  it('should validate required text field values', async () => {
    const mockCustomFields = [
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        label: 'Required Text Field',
        name: 'required_text',
        type: CustomFieldType.TEXT,
        isRequired: true,
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      },
    ]

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const txContext = {
        customFieldDefinition: {
          findMany: vi.fn().mockResolvedValue(mockCustomFields),
          findUnique: vi.fn(),
        },
        listing: {
          create: vi.fn(),
        },
        listingCustomFieldValue: {
          create: vi.fn(),
        },
      }
      return callback(txContext)
    })

    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    mockPrisma.listing.findFirst.mockResolvedValue(null)

    const { listingsRouter } = await import('./listings')
    const caller = listingsRouter.createCaller(mockContext as any)

    // Test with empty string value
    const listingData = {
      gameId: '123e4567-e89b-12d3-a456-426614174000',
      deviceId: '123e4567-e89b-12d3-a456-426614174001',
      emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      performanceId: 1,
      customFieldValues: [
        {
          customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174003',
          value: '', // Empty value
        },
      ],
    }

    await expect(caller.create(listingData)).rejects.toThrow(
      "Required custom field 'Required Text Field' cannot be empty",
    )
  })

  it('should validate select field options', async () => {
    const mockCustomFields = [
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        label: 'Required Select Field',
        name: 'required_select',
        type: CustomFieldType.SELECT,
        isRequired: true,
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ],
      },
    ]

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const txContext = {
        customFieldDefinition: {
          findMany: vi.fn().mockResolvedValue(mockCustomFields),
          findUnique: vi.fn(),
        },
        listing: {
          create: vi.fn(),
        },
        listingCustomFieldValue: {
          create: vi.fn(),
        },
      }
      return callback(txContext)
    })

    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    mockPrisma.listing.findFirst.mockResolvedValue(null)

    const { listingsRouter } = await import('./listings')
    const caller = listingsRouter.createCaller(mockContext as any)

    // Test with invalid option value
    const listingData = {
      gameId: '123e4567-e89b-12d3-a456-426614174000',
      deviceId: '123e4567-e89b-12d3-a456-426614174001',
      emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      performanceId: 1,
      customFieldValues: [
        {
          customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174003',
          value: 'invalid_option', // Invalid option
        },
      ],
    }

    await expect(caller.create(listingData)).rejects.toThrow(
      "Invalid value for custom field 'Required Select Field'. Must be one of: option1, option2",
    )
  })

  it('should allow valid custom field values', async () => {
    const mockCustomFields = [
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        label: 'Required Text Field',
        name: 'required_text',
        type: CustomFieldType.TEXT,
        isRequired: true,
        emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      },
    ]

    const mockListing = { id: 'listing-1' }

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const txContext = {
        customFieldDefinition: {
          findMany: vi.fn().mockResolvedValue(mockCustomFields),
          findUnique: vi.fn().mockResolvedValue(mockCustomFields[0]),
        },
        listing: {
          create: vi.fn().mockResolvedValue(mockListing),
        },
        listingCustomFieldValue: {
          create: vi.fn(),
        },
      }
      return callback(txContext)
    })

    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    mockPrisma.listing.findFirst.mockResolvedValue(null)

    const { listingsRouter } = await import('./listings')
    const caller = listingsRouter.createCaller(mockContext as any)

    // Test with valid data
    const listingData = {
      gameId: '123e4567-e89b-12d3-a456-426614174000',
      deviceId: '123e4567-e89b-12d3-a456-426614174001',
      emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      performanceId: 1,
      customFieldValues: [
        {
          customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174003',
          value: 'Valid text value',
        },
      ],
    }

    const result = await caller.create(listingData)
    expect(result).toEqual(mockListing)
  })
})
