import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountDeletionService } from '@/features/accounts/server/account-deletion.service'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm'
import { appRouter } from './root'

vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
vi.unmock('@orm')
vi.unmock('@orm/client')

const database = vi.hoisted(() => ({ user: { delete: vi.fn() } }))
vi.mock('@/server/db', () => ({ prisma: database }))

const actorId = '00000000-0000-4000-a000-000000000001'
const targetId = '00000000-0000-4000-a000-000000000002'

function caller(authorized = true) {
  return appRouter.createCaller({
    prisma,
    headers: new Headers(),
    session: {
      user: {
        id: actorId,
        name: null,
        email: null,
        role: Role.ADMIN,
        permissions: authorized ? [PERMISSIONS.MANAGE_USERS] : [],
        showNsfw: false,
      },
    },
  })
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('user account deletion composition', () => {
  it('routes authorized deletion through the complete account lifecycle', async () => {
    const deletion = vi
      .spyOn(AccountDeletionService.prototype, 'deleteAccount')
      .mockResolvedValue(undefined)
    await expect(caller().users.delete({ userId: targetId })).resolves.toEqual({ success: true })
    expect(deletion).toHaveBeenCalledExactlyOnceWith(targetId)
    expect(database.user.delete).not.toHaveBeenCalled()
  })

  it('does not return success when the account lifecycle fails', async () => {
    vi.spyOn(AccountDeletionService.prototype, 'deleteAccount').mockRejectedValue(
      new Error('Account cleanup unavailable'),
    )
    await expect(caller().users.delete({ userId: targetId })).rejects.toThrow(
      'Account cleanup unavailable',
    )
    expect(database.user.delete).not.toHaveBeenCalled()
  })

  it('checks the capability before invoking account deletion', async () => {
    const deletion = vi
      .spyOn(AccountDeletionService.prototype, 'deleteAccount')
      .mockResolvedValue(undefined)
    await expect(caller(false).users.delete({ userId: targetId })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(deletion).not.toHaveBeenCalled()
    expect(database.user.delete).not.toHaveBeenCalled()
  })

  it('uses the authenticated identity to prevent self-deletion', async () => {
    const deletion = vi
      .spyOn(AccountDeletionService.prototype, 'deleteAccount')
      .mockResolvedValue(undefined)
    await expect(caller().users.delete({ userId: actorId })).rejects.toThrow(
      'cannot delete your own',
    )
    expect(deletion).not.toHaveBeenCalled()
    expect(database.user.delete).not.toHaveBeenCalled()
  })
})
