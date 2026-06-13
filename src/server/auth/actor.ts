import { AppError } from '@/lib/errors'
import { hasPermission, type PermissionKey } from '@/utils/permission-system'
import { type Role } from '@orm/client'

export type AnonymousActor = {
  type: 'anonymous'
}

export type UserActor = {
  type: 'user'
  userId: string
  role: Role
  permissions: string[]
  showNsfw: boolean
}

export type Actor = AnonymousActor | UserActor

type SessionLike = {
  user?: {
    id: string
    role: Role
    permissions: string[]
    showNsfw?: boolean | null
  }
} | null

export function createActorFromSession(session: SessionLike | undefined): Actor {
  if (!session?.user) return { type: 'anonymous' }

  return {
    type: 'user',
    userId: session.user.id,
    role: session.user.role,
    permissions: session.user.permissions,
    showNsfw: session.user.showNsfw ?? false,
  }
}

export function requireUserActor(actor: Actor): UserActor {
  if (actor.type === 'anonymous') throw AppError.unauthorized()

  return actor
}

export function requireActorPermission(actor: Actor, permission: PermissionKey): UserActor {
  const user = requireUserActor(actor)

  if (!hasPermission(user.permissions, permission)) {
    throw AppError.insufficientPermissions(permission)
  }

  return user
}
