import { describe, expect, it } from 'vitest'
import { formatUserRole } from './format'

describe('format', () => {
  describe('formatUserRole', () => {
    it('should format user roles correctly', () => {
      expect(formatUserRole('SUPER_ADMIN')).toBe('Super Admin')
      expect(formatUserRole('ADMIN')).toBe('Admin')
      expect(formatUserRole('AUTHOR')).toBe('Author')
      expect(formatUserRole('USER')).toBe('User')
    })
  })
})
