import { describe, it, expect } from 'vitest'
import { CustomFieldType } from '@orm'
import {
  CreateCustomFieldDefinitionSchema,
  GetCustomFieldDefinitionsByEmulatorSchema,
  GetCustomFieldDefinitionByIdSchema,
  UpdateCustomFieldDefinitionSchema,
  DeleteCustomFieldDefinitionSchema,
  UpdateCustomFieldDefinitionOrderSchema,
} from './customFieldDefinition'

describe('CustomFieldDefinition Schemas', () => {
  describe('CreateCustomFieldDefinitionSchema', () => {
    const validData = {
      emulatorId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'driver_version',
      label: 'Driver Version',
      type: CustomFieldType.TEXT,
      isRequired: false,
      displayOrder: 0,
    }

    it('should validate valid data', () => {
      const result = CreateCustomFieldDefinitionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require emulatorId to be a valid UUID', () => {
      const result = CreateCustomFieldDefinitionSchema.safeParse({
        ...validData,
        emulatorId: 'invalid-uuid',
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.message).toContain('Invalid uuid')
    })

    it('should validate name format (lowercase alphanumeric with underscores)', () => {
      const validNames = ['driver_version', 'test123', 'simple_name_123']
      const invalidNames = [
        'Driver_Version',
        'test-name',
        'test name',
        'test@name',
      ]

      validNames.forEach((name) => {
        const result = CreateCustomFieldDefinitionSchema.safeParse({
          ...validData,
          name,
        })
        expect(result.success).toBe(true)
      })

      invalidNames.forEach((name) => {
        const result = CreateCustomFieldDefinitionSchema.safeParse({
          ...validData,
          name,
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toContain(
          'Name must be lowercase alphanumeric with underscores only.',
        )
      })
    })

    it('should require name to be non-empty', () => {
      const result = CreateCustomFieldDefinitionSchema.safeParse({
        ...validData,
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('should require label to be non-empty', () => {
      const result = CreateCustomFieldDefinitionSchema.safeParse({
        ...validData,
        label: '',
      })
      expect(result.success).toBe(false)
    })

    it('should validate CustomFieldType enum', () => {
      Object.values(CustomFieldType).forEach((type) => {
        const result = CreateCustomFieldDefinitionSchema.safeParse({
          ...validData,
          type,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should validate options for SELECT type', () => {
      const validOptions = [
        { value: 'v1', label: 'Version 1' },
        { value: 'v2', label: 'Version 2' },
      ]

      const result = CreateCustomFieldDefinitionSchema.safeParse({
        ...validData,
        type: CustomFieldType.SELECT,
        options: validOptions,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid options format', () => {
      const invalidOptions = [
        { value: '', label: 'Empty value' },
        { value: 'v1', label: '' },
      ]

      invalidOptions.forEach((option) => {
        const result = CreateCustomFieldDefinitionSchema.safeParse({
          ...validData,
          type: CustomFieldType.SELECT,
          options: [option],
        })
        expect(result.success).toBe(false)
      })
    })

    it('should set default values for optional fields', () => {
      const result = CreateCustomFieldDefinitionSchema.parse({
        emulatorId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'test_field',
        label: 'Test Field',
        type: CustomFieldType.TEXT,
      })

      expect(result.isRequired).toBe(false)
      expect(result.displayOrder).toBe(0)
    })
  })

  describe('GetCustomFieldDefinitionsByEmulatorSchema', () => {
    it('should validate valid emulator ID', () => {
      const result = GetCustomFieldDefinitionsByEmulatorSchema.safeParse({
        emulatorId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = GetCustomFieldDefinitionsByEmulatorSchema.safeParse({
        emulatorId: 'invalid-uuid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('GetCustomFieldDefinitionByIdSchema', () => {
    it('should validate valid ID', () => {
      const result = GetCustomFieldDefinitionByIdSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = GetCustomFieldDefinitionByIdSchema.safeParse({
        id: 'invalid-uuid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateCustomFieldDefinitionSchema', () => {
    const validData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'updated_field',
      label: 'Updated Field',
      type: CustomFieldType.TEXTAREA,
    }

    it('should validate valid update data', () => {
      const result = UpdateCustomFieldDefinitionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow partial updates', () => {
      const result = UpdateCustomFieldDefinitionSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        label: 'New Label Only',
      })
      expect(result.success).toBe(true)
    })

    it('should validate name format when provided', () => {
      const result = UpdateCustomFieldDefinitionSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Invalid-Name',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('DeleteCustomFieldDefinitionSchema', () => {
    it('should validate valid ID', () => {
      const result = DeleteCustomFieldDefinitionSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = DeleteCustomFieldDefinitionSchema.safeParse({
        id: 'invalid-uuid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateCustomFieldDefinitionOrderSchema', () => {
    it('should validate valid order array', () => {
      const validOrder = [
        { id: '123e4567-e89b-12d3-a456-426614174000', displayOrder: 0 },
        { id: '123e4567-e89b-12d3-a456-426614174001', displayOrder: 1 },
      ]

      const result =
        UpdateCustomFieldDefinitionOrderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUIDs in order array', () => {
      const invalidOrder = [{ id: 'invalid-uuid', displayOrder: 0 }]

      const result =
        UpdateCustomFieldDefinitionOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })

    it('should reject non-integer display orders', () => {
      const invalidOrder = [
        { id: '123e4567-e89b-12d3-a456-426614174000', displayOrder: 1.5 },
      ]

      const result =
        UpdateCustomFieldDefinitionOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
    })

    it('should validate empty array', () => {
      const result = UpdateCustomFieldDefinitionOrderSchema.safeParse([])
      expect(result.success).toBe(true)
    })
  })
})
