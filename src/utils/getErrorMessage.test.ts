import { describe, it, expect } from 'vitest'
import getErrorMessage, { DEFAULT_ERROR_MESSAGE } from '@/utils/getErrorMessage'

describe('Get Error Message', () => {
  it('should return the error message for an Error instance', () => {
    const error = new Error('Test error')
    expect(getErrorMessage(error)).toBe('Test error')
  })

  it('should return the error message for a string', () => {
    const error = 'Test error'
    expect(getErrorMessage(error)).toBe('Test error')
  })

  it('should return a default message for an unknown error', () => {
    const error = 123
    expect(getErrorMessage(error)).toBe(DEFAULT_ERROR_MESSAGE)
  })

  it('should return a default message for an unknown error', () => {
    const error = {}
    expect(getErrorMessage(error)).toBe(DEFAULT_ERROR_MESSAGE)
  })
})
