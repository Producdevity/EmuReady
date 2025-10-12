import { describe, it, expect } from 'vitest'
import { CustomFieldType } from '@orm'
import { parseCustomFieldOptions, getCustomFieldDefaultValue } from './custom-fields'

describe('parseCustomFieldOptions', () => {
  it('should return undefined for non-SELECT field types', () => {
    const textField = { type: CustomFieldType.TEXT, options: ['value1', 'value2'] }
    expect(parseCustomFieldOptions(textField)).toBeUndefined()

    const booleanField = { type: CustomFieldType.BOOLEAN, options: ['value1', 'value2'] }
    expect(parseCustomFieldOptions(booleanField)).toBeUndefined()

    const rangeField = { type: CustomFieldType.RANGE, options: ['value1', 'value2'] }
    expect(parseCustomFieldOptions(rangeField)).toBeUndefined()
  })

  it('should return undefined if options is not an array', () => {
    const field = { type: CustomFieldType.SELECT, options: null }
    expect(parseCustomFieldOptions(field)).toBeUndefined()

    const field2 = { type: CustomFieldType.SELECT, options: undefined }
    expect(parseCustomFieldOptions(field2)).toBeUndefined()

    const field3 = { type: CustomFieldType.SELECT, options: 'not-an-array' }
    expect(parseCustomFieldOptions(field3)).toBeUndefined()
  })

  it('should parse valid SELECT options correctly', () => {
    const field = {
      type: CustomFieldType.SELECT,
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    }

    const result = parseCustomFieldOptions(field)

    expect(result).toEqual([
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ])
  })

  it('should skip invalid option objects', () => {
    const field = {
      type: CustomFieldType.SELECT,
      options: [
        { value: 'option1', label: 'Option 1' },
        { invalidKey: 'should-be-skipped' },
        null,
        undefined,
        'string-should-be-skipped',
        { value: 'option2', label: 'Option 2' },
      ],
    }

    const result = parseCustomFieldOptions(field)

    expect(result).toEqual([
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ])
  })

  it('should convert values to strings', () => {
    const field = {
      type: CustomFieldType.SELECT,
      options: [
        { value: 123, label: 456 },
        { value: true, label: false },
      ],
    }

    const result = parseCustomFieldOptions(field)

    expect(result).toEqual([
      { value: '123', label: '456' },
      { value: 'true', label: 'false' },
    ])
  })

  it('should handle empty options array', () => {
    const field = { type: CustomFieldType.SELECT, options: [] }
    expect(parseCustomFieldOptions(field)).toEqual([])
  })
})

describe('getCustomFieldDefaultValue', () => {
  describe('BOOLEAN type', () => {
    it('should return undefined when no default value is set', () => {
      const field = { type: CustomFieldType.BOOLEAN }
      expect(getCustomFieldDefaultValue(field)).toBeUndefined()
    })

    it('should return undefined when defaultValue is null', () => {
      const field = { type: CustomFieldType.BOOLEAN, defaultValue: null }
      expect(getCustomFieldDefaultValue(field)).toBeUndefined()
    })

    it('should return undefined when defaultValue is undefined', () => {
      const field = { type: CustomFieldType.BOOLEAN, defaultValue: undefined }
      expect(getCustomFieldDefaultValue(field)).toBeUndefined()
    })

    it('should return true when defaultValue is true', () => {
      const field = { type: CustomFieldType.BOOLEAN, defaultValue: true }
      expect(getCustomFieldDefaultValue(field)).toBe(true)
    })

    it('should return false when defaultValue is false', () => {
      const field = { type: CustomFieldType.BOOLEAN, defaultValue: false }
      expect(getCustomFieldDefaultValue(field)).toBe(false)
    })
  })

  describe('SELECT type', () => {
    it('should return first option value when no default is set', () => {
      const field = { type: CustomFieldType.SELECT }
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]
      expect(getCustomFieldDefaultValue(field, options)).toBe('option1')
    })

    it('should return undefined when no default and no options', () => {
      const field = { type: CustomFieldType.SELECT }
      expect(getCustomFieldDefaultValue(field)).toBeUndefined()
    })

    it('should return actual defaultValue when set', () => {
      const field = { type: CustomFieldType.SELECT, defaultValue: 'custom-default' }
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]
      expect(getCustomFieldDefaultValue(field, options)).toBe('custom-default')
    })

    it('should fall back to first option if defaultValue is null', () => {
      const field = { type: CustomFieldType.SELECT, defaultValue: null }
      const options = [{ value: 'option1', label: 'Option 1' }]
      expect(getCustomFieldDefaultValue(field, options)).toBe('option1')
    })
  })

  describe('RANGE type', () => {
    it('should return rangeMin when set', () => {
      const field = { type: CustomFieldType.RANGE, rangeMin: 10 }
      expect(getCustomFieldDefaultValue(field)).toBe(10)
    })

    it('should return 0 when rangeMin is null', () => {
      const field = { type: CustomFieldType.RANGE, rangeMin: null }
      expect(getCustomFieldDefaultValue(field)).toBe(0)
    })

    it('should return 0 when rangeMin is undefined', () => {
      const field = { type: CustomFieldType.RANGE }
      expect(getCustomFieldDefaultValue(field)).toBe(0)
    })

    it('should return actual defaultValue when set', () => {
      const field = { type: CustomFieldType.RANGE, defaultValue: 50, rangeMin: 10 }
      expect(getCustomFieldDefaultValue(field)).toBe(50)
    })

    it('should handle rangeMin of 0', () => {
      const field = { type: CustomFieldType.RANGE, rangeMin: 0 }
      expect(getCustomFieldDefaultValue(field)).toBe(0)
    })
  })

  describe('TEXT type', () => {
    it('should return undefined when no default value', () => {
      const field = { type: CustomFieldType.TEXT }
      expect(getCustomFieldDefaultValue(field)).toBeUndefined()
    })

    it('should return actual defaultValue when set', () => {
      const field = { type: CustomFieldType.TEXT, defaultValue: 'default text' }
      expect(getCustomFieldDefaultValue(field)).toBe('default text')
    })

    it('should fall back to undefined if defaultValue is null', () => {
      const field = { type: CustomFieldType.TEXT, defaultValue: null }
      expect(getCustomFieldDefaultValue(field)).toBeUndefined()
    })

    it('should return empty string if that is the defaultValue', () => {
      const field = { type: CustomFieldType.TEXT, defaultValue: '' }
      expect(getCustomFieldDefaultValue(field)).toBe('')
    })
  })

  describe('TEXTAREA type', () => {
    it('should return undefined when no default value', () => {
      const field = { type: CustomFieldType.TEXTAREA }
      expect(getCustomFieldDefaultValue(field)).toBeUndefined()
    })

    it('should return actual defaultValue when set', () => {
      const field = { type: CustomFieldType.TEXTAREA, defaultValue: 'default text' }
      expect(getCustomFieldDefaultValue(field)).toBe('default text')
    })
  })

  describe('URL type', () => {
    it('should return undefined when no default value', () => {
      const field = { type: CustomFieldType.URL }
      expect(getCustomFieldDefaultValue(field)).toBeUndefined()
    })

    it('should return actual defaultValue when set', () => {
      const field = { type: CustomFieldType.URL, defaultValue: 'https://example.com' }
      expect(getCustomFieldDefaultValue(field)).toBe('https://example.com')
    })
  })

  describe('Edge cases', () => {
    it('should prioritize explicit defaultValue over type-specific defaults', () => {
      const booleanField = { type: CustomFieldType.BOOLEAN, defaultValue: true }
      expect(getCustomFieldDefaultValue(booleanField)).toBe(true)

      const selectField = { type: CustomFieldType.SELECT, defaultValue: 'custom' }
      expect(getCustomFieldDefaultValue(selectField, [{ value: 'first', label: 'First' }])).toBe(
        'custom',
      )

      const rangeField = { type: CustomFieldType.RANGE, defaultValue: 25, rangeMin: 10 }
      expect(getCustomFieldDefaultValue(rangeField)).toBe(25)
    })

    it('should handle number defaultValue for numeric types', () => {
      const rangeField = { type: CustomFieldType.RANGE, defaultValue: 42 }
      expect(getCustomFieldDefaultValue(rangeField)).toBe(42)
    })

    it('should handle 0 as a valid defaultValue', () => {
      const rangeField = { type: CustomFieldType.RANGE, defaultValue: 0 }
      expect(getCustomFieldDefaultValue(rangeField)).toBe(0)
    })
  })
})
