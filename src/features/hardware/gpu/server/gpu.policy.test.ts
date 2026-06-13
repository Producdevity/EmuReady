import { describe, expect, it } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm/client'
import { assertCanManageGpu, assertCanViewGpuStats } from './gpu.policy'
import type { UserActor } from '@/server/auth/actor'

const baseActor = {
  type: 'user',
  userId: 'user-id',
  role: Role.ADMIN,
  showNsfw: false,
} satisfies Omit<UserActor, 'permissions'>

describe('gpu.policy', () => {
  it('allows GPU management with the manage devices permission', () => {
    expect(() =>
      assertCanManageGpu({
        ...baseActor,
        permissions: [PERMISSIONS.MANAGE_DEVICES],
      }),
    ).not.toThrow()
  })

  it('rejects GPU management without the manage devices permission', () => {
    expect(() =>
      assertCanManageGpu({
        ...baseActor,
        permissions: [],
      }),
    ).toThrow('You need the following permissions: manage_devices')
  })

  it('allows GPU stats with the view statistics permission', () => {
    expect(() =>
      assertCanViewGpuStats({
        ...baseActor,
        permissions: [PERMISSIONS.VIEW_STATISTICS],
      }),
    ).not.toThrow()
  })
})
