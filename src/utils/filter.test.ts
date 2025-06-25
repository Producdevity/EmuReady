import { describe, it, expect } from 'vitest'
import { filterNullAndEmpty } from './filter'

describe('filterNullAndEmpty', () => {
  it('should remove null values', () => {
    const input = {
      name: 'test',
      value: null,
      active: true,
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      name: 'test',
      active: true,
    })
    expect('value' in result).toBe(false)
  })

  it('should remove undefined values', () => {
    const input = {
      name: 'test',
      value: undefined,
      active: true,
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      name: 'test',
      active: true,
    })
    expect('value' in result).toBe(false)
  })

  it('should remove empty arrays', () => {
    const input = {
      name: 'test',
      items: [],
      tags: ['tag1', 'tag2'],
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      name: 'test',
      tags: ['tag1', 'tag2'],
    })
    expect('items' in result).toBe(false)
  })

  it('should keep non-empty arrays', () => {
    const input = {
      name: 'test',
      tags: ['tag1', 'tag2'],
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      name: 'test',
      tags: ['tag1', 'tag2'],
    })
  })

  it('should remove empty strings', () => {
    const input = {
      name: 'test',
      description: '',
      title: 'valid title',
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      name: 'test',
      title: 'valid title',
    })
    expect('description' in result).toBe(false)
  })

  it('should remove whitespace-only strings', () => {
    const input = {
      name: 'test',
      description: '   ',
      title: 'valid title',
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      name: 'test',
      title: 'valid title',
    })
    expect('description' in result).toBe(false)
  })

  it('should keep valid strings', () => {
    const input = {
      name: 'test',
      description: 'valid description',
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      name: 'test',
      description: 'valid description',
    })
  })

  it('should keep numbers including zero', () => {
    const input = {
      count: 0,
      page: 1,
      total: 100,
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      count: 0,
      page: 1,
      total: 100,
    })
  })

  it('should keep boolean values including false', () => {
    const input = {
      active: true,
      disabled: false,
      required: true,
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      active: true,
      disabled: false,
      required: true,
    })
  })

  it('should handle mixed data types correctly', () => {
    const input = {
      name: 'test',
      count: 0,
      active: false,
      tags: ['tag1'],
      emptyTags: [],
      description: null,
      notes: undefined,
      whitespace: '   ',
      validString: 'hello',
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      name: 'test',
      count: 0,
      active: false,
      tags: ['tag1'],
      validString: 'hello',
    })
  })

  it('should handle empty objects', () => {
    const input = {}

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({})
  })

  it('should handle objects with all invalid values', () => {
    const input = {
      nullValue: null,
      undefinedValue: undefined,
      emptyArray: [],
      emptyString: '',
      whitespaceString: '   ',
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({})
  })

  it('should handle nested objects as valid values', () => {
    const input = {
      user: { name: 'John', age: 30 },
      settings: null,
      config: undefined,
    }

    const result = filterNullAndEmpty(input)

    expect(result).toEqual({
      user: { name: 'John', age: 30 },
    })
  })

  it('should preserve object structure without mutation', () => {
    const input = {
      name: 'test',
      value: null,
      active: true,
    }

    const result = filterNullAndEmpty(input)

    // Original object should not be mutated
    expect(input).toEqual({
      name: 'test',
      value: null,
      active: true,
    })

    // Result should be a new object
    expect(result).not.toBe(input)
  })
})
