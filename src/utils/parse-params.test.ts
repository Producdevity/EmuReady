import { describe, it, expect } from 'vitest'
import { parseArrayParam, parseNumberArrayParam } from './parse-params'

describe('parseArrayParam', () => {
  it('should return empty array for null input', () => {
    expect(parseArrayParam(null)).toEqual([])
  })

  it('should return empty array for empty string', () => {
    expect(parseArrayParam('')).toEqual([])
  })

  it('should parse valid JSON array', () => {
    expect(parseArrayParam('["apple", "banana", "cherry"]')).toEqual([
      'apple',
      'banana',
      'cherry',
    ])
  })

  it('should parse single string as array with one element', () => {
    expect(parseArrayParam('single-value')).toEqual(['single-value'])
  })

  it('should handle invalid JSON by treating as single string', () => {
    expect(parseArrayParam('invalid-json[')).toEqual(['invalid-json['])
  })

  it('should handle empty JSON array', () => {
    expect(parseArrayParam('[]')).toEqual([])
  })

  it('should handle JSON array with mixed types as strings', () => {
    expect(parseArrayParam('["string", 123, true]')).toEqual([
      'string',
      123,
      true,
    ])
  })

  it('should handle special characters in single string', () => {
    expect(parseArrayParam('test-with-special-chars!@#$%')).toEqual([
      'test-with-special-chars!@#$%',
    ])
  })
})

describe('parseNumberArrayParam', () => {
  it('should return empty array for null input', () => {
    expect(parseNumberArrayParam(null)).toEqual([])
  })

  it('should return empty array for empty string', () => {
    expect(parseNumberArrayParam('')).toEqual([])
  })

  it('should parse valid JSON array of numbers', () => {
    expect(parseNumberArrayParam('[1, 2, 3, 4, 5]')).toEqual([1, 2, 3, 4, 5])
  })

  it('should parse single number string as array with one element', () => {
    expect(parseNumberArrayParam('42')).toEqual([42])
  })

  it('should filter out falsy numbers (0, NaN)', () => {
    expect(parseNumberArrayParam('[1, 0, 3, null, 5]')).toEqual([1, 3, 5])
  })

  it('should handle string numbers in JSON array', () => {
    expect(parseNumberArrayParam('["1", "2", "3"]')).toEqual([1, 2, 3])
  })

  it('should filter out non-numeric strings (they become NaN)', () => {
    expect(parseNumberArrayParam('["1", "invalid", "3"]')).toEqual([1, 3])
  })

  it('should handle invalid JSON by trying to parse as single number', () => {
    expect(parseNumberArrayParam('123')).toEqual([123])
  })

  it('should return empty array for invalid JSON that is not a number', () => {
    expect(parseNumberArrayParam('invalid-json[')).toEqual([])
  })

  it('should handle empty JSON array', () => {
    expect(parseNumberArrayParam('[]')).toEqual([])
  })

  it('should handle mixed types in JSON array, converting valid ones', () => {
    expect(parseNumberArrayParam('[1, "2", true, "invalid", 5]')).toEqual([
      1, 2, 1, 5,
    ])
  })

  it('should filter out zero values', () => {
    expect(parseNumberArrayParam('[1, 0, 2, 0, 3]')).toEqual([1, 2, 3])
  })

  it('should handle negative numbers', () => {
    expect(parseNumberArrayParam('[-1, -2, 3]')).toEqual([-1, -2, 3])
  })

  it('should handle decimal numbers', () => {
    expect(parseNumberArrayParam('[1.5, 2.7, 3.1]')).toEqual([1.5, 2.7, 3.1])
  })
})
