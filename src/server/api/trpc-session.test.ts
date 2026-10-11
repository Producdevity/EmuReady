import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppRouterTRPCContext } from './trpc'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fetch: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  rolePermissions: vi.fn(),
}))

vi.unmock('./trpc')
vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }))
vi.mock('@/server/db', () => ({
  prisma: {
    user: { findUnique: mocks.findUnique, create: mocks.create },
    rolePermission: { findMany: mocks.rolePermissions },
  },
}))

function databaseUser() {
  return {
    id: 'database-user',
    email: 'person@example.com',
    name: 'person',
    role: 'USER',
    settings: { showNsfw: true },
  }
}

describe('web session user synchronization', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', mocks.fetch)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.auth.mockResolvedValue({ userId: 'user_authenticated' })
    mocks.rolePermissions.mockResolvedValue([{ permission: { key: 'report:create' } }])
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        primary_email_address_id: 'email_primary',
        email_addresses: [{ id: 'email_primary', email_address: 'person@example.com' }],
        username: 'person',
      }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('keeps anonymous requests anonymous without accessing users', async () => {
    mocks.auth.mockResolvedValue({ userId: null })

    expect((await createAppRouterTRPCContext()).session).toBeNull()
    expect(mocks.findUnique).not.toHaveBeenCalled()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('uses an existing database user without calling Clerk or creating another user', async () => {
    mocks.findUnique.mockResolvedValue(databaseUser())

    const context = await createAppRouterTRPCContext()

    expect(context.session?.user).toMatchObject({
      id: 'database-user',
      permissions: ['report:create'],
      showNsfw: true,
    })
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('creates the missing user with the authenticated Clerk ID', async () => {
    mocks.findUnique.mockResolvedValueOnce(null)
    mocks.create.mockResolvedValue(databaseUser())

    expect((await createAppRouterTRPCContext()).session?.user.id).toBe('database-user')
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clerkId: 'user_authenticated',
          email: 'person@example.com',
          role: 'USER',
          settings: { create: {} },
        }),
      }),
    )
  })

  it('keeps the session when a webhook or concurrent request creates the same Clerk user', async () => {
    mocks.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(databaseUser())
    mocks.create.mockRejectedValue(
      Object.assign(new Error('Email already exists'), { code: 'P2002' }),
    )

    const context = await createAppRouterTRPCContext()

    expect(context.session?.user).toMatchObject({
      id: 'database-user',
      permissions: ['report:create'],
      showNsfw: true,
    })
    expect(mocks.findUnique).toHaveBeenCalledTimes(2)
    expect(mocks.findUnique).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { clerkId: 'user_authenticated' } }),
    )
    expect(mocks.create).toHaveBeenCalledOnce()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('does not attach an email collision belonging to a different Clerk user', async () => {
    mocks.findUnique.mockResolvedValue(null)
    mocks.create.mockRejectedValue(
      Object.assign(new Error('Email already exists'), { code: 'P2002' }),
    )

    expect((await createAppRouterTRPCContext()).session).toBeNull()
    expect(mocks.findUnique).toHaveBeenCalledTimes(2)
    for (const [query] of mocks.findUnique.mock.calls) {
      expect(query.where).toEqual({ clerkId: 'user_authenticated' })
    }
    expect(mocks.rolePermissions).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })

  it('does not retry unrelated database failures', async () => {
    mocks.findUnique.mockResolvedValueOnce(null)
    mocks.create.mockRejectedValue(
      Object.assign(new Error('Connection timed out'), { code: 'P1008' }),
    )

    expect((await createAppRouterTRPCContext()).session).toBeNull()
    expect(mocks.findUnique).toHaveBeenCalledOnce()
    expect(mocks.rolePermissions).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })
})
