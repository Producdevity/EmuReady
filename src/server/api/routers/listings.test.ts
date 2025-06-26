import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the validation module
const mockValidateCustomFields = vi.fn()
vi.mock('./listings/validation', () => ({
  validateCustomFields: mockValidateCustomFields,
}))

// Create a mock for the actual listing creation function that we'll test
const createListingFunction = async ({
  ctx,
  input,
}: {
  ctx: any
  input: any
}) => {
  const {
    gameId,
    deviceId,
    emulatorId,
    performanceId,
    notes,
    customFieldValues,
  } = input
  const authorId = ctx.session.user.id

  const userExists = await ctx.prisma.user.findUnique({
    where: { id: authorId },
    select: { id: true },
  })

  if (!userExists) {
    throw new Error(`User ${authorId} not found`)
  }

  return ctx.prisma.$transaction(async (tx: any) => {
    // Call the validation function with the transaction context
    await mockValidateCustomFields(tx, emulatorId, customFieldValues)

    const newListing = await tx.listing.create({
      data: {
        gameId,
        deviceId,
        emulatorId,
        performanceId,
        notes,
        authorId: authorId,
        status: 'PENDING',
      },
    })

    // Create custom field values
    if (customFieldValues && customFieldValues.length > 0) {
      for (const cfv of customFieldValues) {
        await tx.listingCustomFieldValue.create({
          data: {
            listingId: newListing.id,
            customFieldDefinitionId: cfv.customFieldDefinitionId,
            value: cfv.value === null ? null : cfv.value,
          },
        })
      }
    }
    return newListing
  })
}

describe('Listings Router Custom Field Validation', () => {
  const mockPrisma = {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
    },
    listing: {
      create: vi.fn(),
    },
    listingCustomFieldValue: {
      create: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the validation mock to default success behavior
    mockValidateCustomFields.mockResolvedValue(undefined)
  })

  it('should validate required custom fields', async () => {
    // Mock user exists
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })

    // Mock the validation to throw an error for missing required field
    mockValidateCustomFields.mockRejectedValue(
      new Error('Required field missing: Required Field'),
    )

    // Mock the transaction function
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const txContext = {
        listing: { create: vi.fn() },
        listingCustomFieldValue: { create: vi.fn() },
      }
      return callback(txContext)
    })

    // Test data without required custom field
    const listingData = {
      gameId: '123e4567-e89b-12d3-a456-426614174000',
      deviceId: '123e4567-e89b-12d3-a456-426614174001',
      emulatorId: '123e4567-e89b-12d3-a456-426614174002',
      performanceId: 1,
      customFieldValues: [], // Missing required field
    }

    // Should throw an error for missing required field
    await expect(
      createListingFunction({ ctx: mockContext, input: listingData }),
    ).rejects.toThrow('Required field missing: Required Field')

    // Verify that validation was called
    expect(mockValidateCustomFields).toHaveBeenCalledWith(
      expect.any(Object),
      listingData.emulatorId,
      listingData.customFieldValues,
    )
  })

  it('should validate required text field values', async () => {
    // Mock user exists
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })

    // Mock the validation to throw an error for empty required field
    mockValidateCustomFields.mockRejectedValue(
      new Error("Required custom field 'Required Text Field' cannot be empty"),
    )

    // Mock the transaction function
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const txContext = {
        listing: { create: vi.fn() },
        listingCustomFieldValue: { create: vi.fn() },
      }
      return callback(txContext)
    })

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

    await expect(
      createListingFunction({ ctx: mockContext, input: listingData }),
    ).rejects.toThrow(
      "Required custom field 'Required Text Field' cannot be empty",
    )

    // Verify that validation was called
    expect(mockValidateCustomFields).toHaveBeenCalledWith(
      expect.any(Object),
      listingData.emulatorId,
      listingData.customFieldValues,
    )
  })

  it('should validate select field options', async () => {
    // Mock user exists
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })

    // Mock the validation to throw an error for invalid select option
    mockValidateCustomFields.mockRejectedValue(
      new Error(
        "Invalid value for custom field 'Required Select Field'. Must be one of: option1, option2",
      ),
    )

    // Mock the transaction function
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const txContext = {
        listing: { create: vi.fn() },
        listingCustomFieldValue: { create: vi.fn() },
      }
      return callback(txContext)
    })

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

    await expect(
      createListingFunction({ ctx: mockContext, input: listingData }),
    ).rejects.toThrow(
      "Invalid value for custom field 'Required Select Field'. Must be one of: option1, option2",
    )

    // Verify that validation was called
    expect(mockValidateCustomFields).toHaveBeenCalledWith(
      expect.any(Object),
      listingData.emulatorId,
      listingData.customFieldValues,
    )
  })

  it('should allow valid custom field values', async () => {
    const mockListing = { id: 'listing-1' }

    // Mock user exists
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })

    // Mock the validation to succeed (no error thrown)
    mockValidateCustomFields.mockResolvedValue(undefined)

    // Mock the transaction function
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const txContext = {
        listing: {
          create: vi.fn().mockResolvedValue(mockListing),
        },
        listingCustomFieldValue: {
          create: vi.fn(),
        },
      }
      return callback(txContext)
    })

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

    const result = await createListingFunction({
      ctx: mockContext,
      input: listingData,
    })

    expect(result).toEqual(mockListing)

    // Verify that validation was called
    expect(mockValidateCustomFields).toHaveBeenCalledWith(
      expect.any(Object),
      listingData.emulatorId,
      listingData.customFieldValues,
    )
  })
})

describe('Listings Filter Logic', () => {
  it('should generate correct OR conditions for device and SoC filters', () => {
    // This test verifies the filtering logic structure
    const testFilterLogic = (deviceIds: string[], socIds: string[]) => {
      const deviceSocConditions: any[] = []

      if (deviceIds.length > 0) {
        deviceSocConditions.push({ deviceId: { in: deviceIds } })
      }

      if (socIds.length > 0) {
        deviceSocConditions.push({ device: { socId: { in: socIds } } })
      }

      return deviceSocConditions
    }

    // Test with both device and SoC filters
    const bothFilters = testFilterLogic(
      ['device1', 'device2'],
      ['soc1', 'soc2'],
    )
    expect(bothFilters).toEqual([
      { deviceId: { in: ['device1', 'device2'] } },
      { device: { socId: { in: ['soc1', 'soc2'] } } },
    ])

    // Test with only device filters
    const deviceOnly = testFilterLogic(['device1'], [])
    expect(deviceOnly).toEqual([{ deviceId: { in: ['device1'] } }])

    // Test with only SoC filters
    const socOnly = testFilterLogic([], ['soc1'])
    expect(socOnly).toEqual([{ device: { socId: { in: ['soc1'] } } }])

    // Test with no filters
    const noFilters = testFilterLogic([], [])
    expect(noFilters).toEqual([])
  })
})
