import { describe, it, expect } from 'vitest'
import { Role } from '@orm'
import hasPermission from './hasPermission'

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
