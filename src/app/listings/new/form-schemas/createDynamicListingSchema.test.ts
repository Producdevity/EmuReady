import { describe, it, expect } from 'vitest'
import { CustomFieldType } from '@orm'
import createDynamicListingSchema, {
  type CustomFieldDefinitionWithOptions,
} from './createDynamicListingSchema'

describe('createDynamicListingSchema - Custom Field Validation', () => {
  const baseValidData = {
    gameId: '123e4567-e89b-12d3-a456-426614174000',
    emulatorId: '123e4567-e89b-12d3-a456-426614174001',
    deviceId: '123e4567-e89b-12d3-a456-426614174002',
    performanceId: 1,
  }

  const createField = (
    type: CustomFieldType,
    isRequired: boolean,
    label: string,
    id = '123e4567-e89b-12d3-a456-426614174010',
  ): CustomFieldDefinitionWithOptions => ({
    id,
    emulatorId: '123e4567-e89b-12d3-a456-426614174001',
    name: `test_${type.toLowerCase()}`,
    label,
    type,
    isRequired,
    displayOrder: 0,
    categoryId: null,
    categoryOrder: 0,
    defaultValue: null,
    rangeMin: null,
    rangeMax: null,
    options: null,
    placeholder: null,
    rangeUnit: null,
    rangeDecimals: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  describe('BOOLEAN field validation', () => {
    it('should accept true for required boolean field', () => {
      const customFields = [createField(CustomFieldType.BOOLEAN, true, 'Test Boolean')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: true,
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept false for required boolean field', () => {
      const customFields = [createField(CustomFieldType.BOOLEAN, true, 'Test Boolean')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: false,
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject undefined for required boolean field', () => {
      const customFields = [createField(CustomFieldType.BOOLEAN, true, 'Test Boolean')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: undefined,
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.errors.find((e) => e.message === 'Test Boolean is required')
        expect(error).toBeDefined()
      }
    })

    it('should reject null for required boolean field', () => {
      const customFields = [createField(CustomFieldType.BOOLEAN, true, 'Test Boolean')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: null,
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.errors.find((e) => e.message === 'Test Boolean is required')
        expect(error).toBeDefined()
      }
    })

    it('should reject missing field for required boolean', () => {
      const customFields = [createField(CustomFieldType.BOOLEAN, true, 'Test Boolean')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.errors.find((e) => e.message === 'Test Boolean is required')
        expect(error).toBeDefined()
      }
    })

    it('should allow undefined for optional boolean field', () => {
      const customFields = [createField(CustomFieldType.BOOLEAN, false, 'Test Boolean')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('TEXT field validation', () => {
    it('should reject empty string for required text field', () => {
      const customFields = [createField(CustomFieldType.TEXT, true, 'Test Text')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: '',
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject whitespace-only string for required text field', () => {
      const customFields = [createField(CustomFieldType.TEXT, true, 'Test Text')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: '   ',
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept valid string for required text field', () => {
      const customFields = [createField(CustomFieldType.TEXT, true, 'Test Text')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: 'Valid text',
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('SELECT field validation', () => {
    it('should reject empty string for required select field', () => {
      const customFields = [createField(CustomFieldType.SELECT, true, 'Test Select')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: '',
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept valid option for required select field', () => {
      const customFields = [createField(CustomFieldType.SELECT, true, 'Test Select')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: 'option1',
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('RANGE field validation', () => {
    it('should reject undefined for required range field', () => {
      const customFields = [createField(CustomFieldType.RANGE, true, 'Test Range')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: undefined,
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept number for required range field', () => {
      const customFields = [createField(CustomFieldType.RANGE, true, 'Test Range')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: 50,
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept 0 for required range field', () => {
      const customFields = [createField(CustomFieldType.RANGE, true, 'Test Range')]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: 0,
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('Multiple custom fields', () => {
    it('should validate multiple required fields correctly', () => {
      const customFields = [
        createField(
          CustomFieldType.BOOLEAN,
          true,
          'Test Boolean',
          '123e4567-e89b-12d3-a456-426614174010',
        ),
        createField(
          CustomFieldType.TEXT,
          true,
          'Test Text',
          '123e4567-e89b-12d3-a456-426614174011',
        ),
      ]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174010',
            value: true,
          },
          {
            customFieldDefinitionId: '123e4567-e89b-12d3-a456-426614174011',
            value: 'Valid text',
          },
        ],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should show errors for all invalid required fields', () => {
      const customFields = [
        createField(
          CustomFieldType.BOOLEAN,
          true,
          'Test Boolean',
          '123e4567-e89b-12d3-a456-426614174010',
        ),
        createField(
          CustomFieldType.TEXT,
          true,
          'Test Text',
          '123e4567-e89b-12d3-a456-426614174011',
        ),
      ]
      const schema = createDynamicListingSchema(customFields)

      const data = {
        ...baseValidData,
        customFieldValues: [],
      }

      const result = schema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.length).toBe(2)
        expect(result.error.errors.some((e) => e.message === 'Test Boolean is required')).toBe(true)
        expect(result.error.errors.some((e) => e.message === 'Test Text is required')).toBe(true)
      }
    })
  })

  describe('No custom fields', () => {
    it('should return base schema when no custom fields', () => {
      const schema = createDynamicListingSchema([])
      const data = baseValidData

      const result = schema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})
