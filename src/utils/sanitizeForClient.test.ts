import { describe, it, expect } from 'vitest'
import sanitizeForClient from './sanitizeForClient'

describe('sanitizeForClient', () => {
  it('should handle primitive values', () => {
    expect(sanitizeForClient('string')).toBe('string')
    expect(sanitizeForClient(123)).toBe(123)
    expect(sanitizeForClient(true)).toBe(true)
    expect(sanitizeForClient(false)).toBe(false)
    expect(sanitizeForClient(null)).toBe(null)
  })

  it('should handle arrays', () => {
    const input = [1, 2, 3, 'test']
    const result = sanitizeForClient(input)
    expect(result).toEqual(input)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle objects', () => {
    const input = {
      name: 'test',
      age: 25,
      active: true,
      metadata: null,
    }
    const result = sanitizeForClient(input)
    expect(result).toEqual(input)
  })

  it('should handle nested objects', () => {
    const input = {
      user: {
        name: 'John',
        profile: {
          email: 'john@example.com',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      },
      items: [1, 2, { id: 3, name: 'item' }],
    }
    const result = sanitizeForClient(input)
    expect(result).toEqual(input)
  })

  it('should handle Date objects', () => {
    const date = new Date('2023-01-01T00:00:00.000Z')
    const input = { createdAt: date }
    const result = sanitizeForClient(input)

    // superjson should preserve the Date object
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.createdAt.getTime()).toBe(date.getTime())
  })

  it('should handle undefined values', () => {
    const input = { defined: 'value', undefined: undefined }
    const result = sanitizeForClient(input)

    // superjson handles undefined values
    expect(result).toEqual(input)
  })

  it('should handle complex data structures', () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: new Date(),
      user: {
        name: 'Test User',
        roles: ['USER', 'AUTHOR'],
      },
      metadata: {
        count: 42,
        active: true,
        tags: ['tag1', 'tag2'],
      },
      optional: undefined,
      nullable: null,
    }

    const result = sanitizeForClient(input)
    expect(result).toEqual(input)
    expect(result.createdAt).toBeInstanceOf(Date)
  })

  it('should return a new object reference', () => {
    const input = { name: 'test' }
    const result = sanitizeForClient(input)

    // Should be equal but not the same reference
    expect(result).toEqual(input)
    expect(result).not.toBe(input)
  })

  it('should handle empty objects and arrays', () => {
    expect(sanitizeForClient({})).toEqual({})
    expect(sanitizeForClient([])).toEqual([])
  })

  it('should preserve type information', () => {
    interface TestInterface {
      id: string
      count: number
      active: boolean
    }

    const input: TestInterface = {
      id: 'test-id',
      count: 10,
      active: true,
    }

    const result = sanitizeForClient<TestInterface>(input)

    // TypeScript should preserve the type
    expect(typeof result.id).toBe('string')
    expect(typeof result.count).toBe('number')
    expect(typeof result.active).toBe('boolean')
    expect(result).toEqual(input)
  })
})
