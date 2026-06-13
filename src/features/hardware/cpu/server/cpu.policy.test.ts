import { describe, expect, it } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm/client'
import { assertCanManageCpu, assertCanViewCpuStats } from './cpu.policy'
import type { UserActor } from '@/server/auth/actor'

const baseActor = {
  type: 'user',
  userId: 'user-id',
  role: Role.ADMIN,
  showNsfw: false,
} satisfies Omit<UserActor, 'permissions'>

describe('cpu.policy', () => {
  it('allows CPU management with the manage devices permission', () => {
    expect(() =>
      assertCanManageCpu({
        ...baseActor,
        permissions: [PERMISSIONS.MANAGE_DEVICES],
      }),
    ).not.toThrow()
  })

  it('rejects CPU management without the manage devices permission', () => {
    expect(() =>
      assertCanManageCpu({
        ...baseActor,
        permissions: [],
      }),
    ).toThrow('You need the following permissions: manage_devices')
  })

  it('allows CPU stats with the view statistics permission', () => {
    expect(() =>
      assertCanViewCpuStats({
        ...baseActor,
        permissions: [PERMISSIONS.VIEW_STATISTICS],
      }),
    ).not.toThrow()
  })
})
