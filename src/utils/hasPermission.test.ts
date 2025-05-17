import { describe, it, expect } from 'vitest'
import { Role } from '@orm'
import hasPermission, {
  canEditComment,
  canDeleteComment,
} from './hasPermission'

describe('hasPermission', () => {
  it('should return true if user has the required role', () => {
    expect(hasPermission(Role.ADMIN, Role.USER)).toBe(true)
    expect(hasPermission(Role.SUPER_ADMIN, Role.AUTHOR)).toBe(true)
  })

  it('should return false if user does not have the required role', () => {
    expect(hasPermission(Role.USER, Role.ADMIN)).toBe(false)
    expect(hasPermission(Role.AUTHOR, Role.SUPER_ADMIN)).toBe(false)
  })

  it('should return false if user has no role', () => {
    expect(hasPermission(undefined, Role.USER)).toBe(false)
    expect(hasPermission(undefined, undefined)).toBe(false)
  })

  it('should return true if no required role is provided', () => {
    expect(hasPermission(Role.USER, undefined)).toBe(true)
  })
})

describe('canEditComment', () => {
  const commentUserId = 'comment-author'
  const currentUserId = 'current-user'

  it('should allow super admin to edit any comment', () => {
    expect(canEditComment(Role.SUPER_ADMIN, commentUserId, currentUserId)).toBe(
      true,
    )
    expect(
      canEditComment(Role.SUPER_ADMIN, 'different-user', currentUserId),
    ).toBe(true)
  })

  it('should allow authors to edit their own comments', () => {
    expect(canEditComment(Role.USER, commentUserId, commentUserId)).toBe(true)
    expect(canEditComment(Role.AUTHOR, commentUserId, commentUserId)).toBe(true)
    expect(canEditComment(Role.ADMIN, commentUserId, commentUserId)).toBe(true)
  })

  it('should not allow regular users to edit others comments', () => {
    expect(canEditComment(Role.USER, commentUserId, currentUserId)).toBe(false)
    expect(canEditComment(Role.AUTHOR, commentUserId, currentUserId)).toBe(
      false,
    )
    expect(canEditComment(Role.ADMIN, commentUserId, currentUserId)).toBe(false)
  })

  it('should not allow editing without a role', () => {
    expect(canEditComment(undefined, commentUserId, currentUserId)).toBe(false)
  })
})

describe('canDeleteComment', () => {
  const commentUserId = 'comment-author'
  const currentUserId = 'current-user'

  it('should allow admin and super admin to delete any comment', () => {
    expect(canDeleteComment(Role.ADMIN, commentUserId, currentUserId)).toBe(
      true,
    )
    expect(
      canDeleteComment(Role.SUPER_ADMIN, commentUserId, currentUserId),
    ).toBe(true)
  })

  it('should allow authors to delete their own comments', () => {
    expect(canDeleteComment(Role.USER, commentUserId, commentUserId)).toBe(true)
    expect(canDeleteComment(Role.AUTHOR, commentUserId, commentUserId)).toBe(
      true,
    )
  })

  it('should not allow regular users to delete others comments', () => {
    expect(canDeleteComment(Role.USER, commentUserId, currentUserId)).toBe(
      false,
    )
    expect(canDeleteComment(Role.AUTHOR, commentUserId, currentUserId)).toBe(
      false,
    )
  })

  it('should not allow deletion without a role', () => {
    expect(canDeleteComment(undefined, commentUserId, currentUserId)).toBe(
      false,
    )
  })
})
