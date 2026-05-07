import { describe, expect, it } from 'vitest'
import { CustomFieldType } from '@orm'
import { diffCustomFieldValues, type CustomFieldValueEntry } from './customFieldSync'

const textField = (id: string, defaultValue?: unknown) => ({
  id,
  type: CustomFieldType.TEXT,
  defaultValue,
})

const booleanField = (id: string, defaultValue?: unknown) => ({
  id,
  type: CustomFieldType.BOOLEAN,
  defaultValue,
})

const value = (id: string, val: unknown): CustomFieldValueEntry => ({
  customFieldDefinitionId: id,
  value: val,
})

describe('diffCustomFieldValues', () => {
  it('returns null when there are no incoming fields', () => {
    expect(diffCustomFieldValues([], [])).toBeNull()
    expect(diffCustomFieldValues([], [value('a', 'x')])).toBeNull()
  })

  it('returns null when the current ids match incoming ids in the same order', () => {
    const fields = [textField('a'), textField('b')]
    const current = [value('a', 'one'), value('b', 'two')]
    expect(diffCustomFieldValues(fields, current)).toBeNull()
  })

  it('returns the next values when the current ids differ from incoming ids', () => {
    const fields = [textField('a'), textField('b')]
    const current = [value('a', 'one')] // missing b
    const result = diffCustomFieldValues(fields, current)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(2)
  })

  it('preserves an existing non-null value', () => {
    const fields = [textField('a', 'unused-default'), textField('b')]
    const current = [value('a', 'kept')]
    const result = diffCustomFieldValues(fields, current)
    expect(result?.[0]).toEqual({ customFieldDefinitionId: 'a', value: 'kept' })
  })

  it('uses the field defaultValue when the current value is null or undefined', () => {
    const fields = [textField('a', 'fallback')]
    const result = diffCustomFieldValues(fields, [])
    expect(result?.[0]).toEqual({ customFieldDefinitionId: 'a', value: 'fallback' })
  })

  it('falls back to false for BOOLEAN fields when no defaultValue is set', () => {
    const fields = [booleanField('a')]
    const result = diffCustomFieldValues(fields, [])
    expect(result?.[0]).toEqual({ customFieldDefinitionId: 'a', value: false })
  })

  it('falls back to null for non-BOOLEAN fields when no defaultValue is set', () => {
    const fields = [textField('a')]
    const result = diffCustomFieldValues(fields, [])
    expect(result?.[0]).toEqual({ customFieldDefinitionId: 'a', value: null })
  })

  it('treats explicit null as missing and applies the default', () => {
    const fields = [textField('a', 'default')]
    const result = diffCustomFieldValues(fields, [value('a', null)])
    expect(result).toBeNull() // ids match, no diff regardless of value semantics
  })

  it('detects reorder as a diff (treats id sequence as significant)', () => {
    const fields = [textField('a'), textField('b')]
    const current = [value('b', 'two'), value('a', 'one')]
    const result = diffCustomFieldValues(fields, current)
    expect(result).not.toBeNull()
    expect(result?.[0].customFieldDefinitionId).toBe('a')
    expect(result?.[1].customFieldDefinitionId).toBe('b')
  })

  it('preserves existing values during a reorder', () => {
    const fields = [textField('a'), textField('b')]
    const current = [value('b', 'two'), value('a', 'one')]
    const result = diffCustomFieldValues(fields, current)
    expect(result?.[0].value).toBe('one')
    expect(result?.[1].value).toBe('two')
  })

  it('treats false as a real value (does not apply default to a stored false)', () => {
    const fields = [booleanField('a', true)]
    const current = [value('a', false)]
    const result = diffCustomFieldValues(fields, current)
    expect(result).toBeNull() // ids match
  })
})
