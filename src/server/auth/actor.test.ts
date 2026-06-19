import { describe, expect, it } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm/client'
import { createActorFromSession, requireActorPermission, requireUserActor } from './actor'

const session = {
  user: {
    id: '00000000-0000-4000-a000-000000000001',
    email: 'test@test.com',
    name: 'Test User',
    role: Role.ADMIN,
    permissions: [PERMISSIONS.MANAGE_DEVICES],
    showNsfw: true,
  },
}

describe('actor', () => {
  it('creates an anonymous actor from an empty session', () => {
    expect(createActorFromSession(null)).toEqual({ type: 'anonymous' })
  })

  it('creates a user actor from the authenticated session payload', () => {
    expect(createActorFromSession(session)).toEqual({
      type: 'user',
      userId: session.user.id,
      role: Role.ADMIN,
      permissions: [PERMISSIONS.MANAGE_DEVICES],
      showNsfw: true,
    })
  })

  it('rejects user-only behavior for anonymous actors', () => {
    expect(() => requireUserActor({ type: 'anonymous' })).toThrow(
      'You must be logged in to perform this action',
    )
  })

  it('returns the user actor when the required permission is present', () => {
    const actor = createActorFromSession(session)

    expect(requireActorPermission(actor, PERMISSIONS.MANAGE_DEVICES)).toEqual(actor)
  })

  it('rejects missing permissions', () => {
    const actor = createActorFromSession({
      user: {
        ...session.user,
        permissions: [],
      },
    })

    expect(() => requireActorPermission(actor, PERMISSIONS.MANAGE_DEVICES)).toThrow(
      'You need the following permissions: manage_devices',
    )
  })
})
