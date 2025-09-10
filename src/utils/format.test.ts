import { describe, expect, it } from 'vitest'
import { formatEnumLabel, formatUserRole } from './format'

describe('format', () => {
  describe('formatUserRole', () => {
    it('should format user roles correctly', () => {
      expect(formatUserRole('SUPER_ADMIN')).toBe('Super Admin')
      expect(formatUserRole('ADMIN')).toBe('Admin')
      expect(formatUserRole('AUTHOR')).toBe('Author')
      expect(formatUserRole('USER')).toBe('User')
    })
  })

  describe('formatEnumLabel', () => {
    it('should format enum labels correctly', () => {
      expect(formatEnumLabel('COMMENT_ON_LISTING')).toBe('Comment On Listing')
      expect(formatEnumLabel('REPLY_TO_COMMENT')).toBe('Reply To Comment')
      expect(formatEnumLabel('LISTING_UPVOTED')).toBe('Listing Upvoted')
      expect(formatEnumLabel('LISTING_DOWNVOTED')).toBe('Listing Downvoted')
      expect(formatEnumLabel('COMMENT_UPVOTED')).toBe('Comment Upvoted')
      expect(formatEnumLabel('COMMENT_DOWNVOTED')).toBe('Comment Downvoted')
    })
  })
})
