import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import type * as ClerkWebhooks from '@clerk/nextjs/webhooks'

const mocks = vi.hoisted(() => ({
  verifyWebhook: vi.fn(),
  user: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  analytics: {
    signedUp: vi.fn(),
    registrationCompleted: vi.fn(),
    registrationStarted: vi.fn(),
    funnelStepCompleted: vi.fn(),
  },
}))

vi.mock('@clerk/nextjs/webhooks', async () => {
  const actual = await vi.importActual<typeof ClerkWebhooks>('@clerk/nextjs/webhooks')
  return { ...actual, verifyWebhook: mocks.verifyWebhook }
})

vi.mock('@/server/db', () => ({ prisma: { user: mocks.user } }))

vi.mock('@/lib/analytics', () => ({
  default: {
    user: { signedUp: mocks.analytics.signedUp },
    userJourney: {
      registrationCompleted: mocks.analytics.registrationCompleted,
      registrationStarted: mocks.analytics.registrationStarted,
    },
    conversion: { funnelStepCompleted: mocks.analytics.funnelStepCompleted },
  },
}))

const request = new NextRequest('http://localhost/api/webhooks/clerk', { method: 'POST' })

function createdEvent() {
  return {
    type: 'user.created',
    data: {
      id: 'user_clerk_1',
      username: 'TestUser',
      primary_email_address_id: 'email_1',
      email_addresses: [{ id: 'email_1', email_address: 'test@example.com' }],
      image_url: 'https://example.com/avatar.png',
      public_metadata: {},
    },
  }
}

describe('Clerk webhook route', () => {
  beforeEach(() => {
    vi.stubEnv('CLERK_WEBHOOK_SECRET', 'whsec_test')
    mocks.verifyWebhook.mockReset()
    mocks.user.create.mockReset()
    mocks.user.deleteMany.mockReset()
    mocks.user.findUnique.mockReset()
    mocks.user.update.mockReset()
    mocks.analytics.signedUp.mockReset()
    mocks.analytics.registrationCompleted.mockReset()
    mocks.analytics.registrationStarted.mockReset()
    mocks.analytics.funnelStepCompleted.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('creates a new user and emits signup analytics once', async () => {
    mocks.verifyWebhook.mockResolvedValueOnce(createdEvent())
    mocks.user.findUnique.mockResolvedValueOnce(null)
    mocks.user.create.mockResolvedValueOnce({ id: 'database_user_1' })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mocks.user.create).toHaveBeenCalledOnce()
    expect(mocks.analytics.signedUp).toHaveBeenCalledOnce()
    expect(mocks.analytics.signedUp).toHaveBeenCalledWith({ userId: 'database_user_1' })
    expect(mocks.analytics.registrationCompleted).toHaveBeenCalledOnce()
    expect(mocks.analytics.registrationStarted).toHaveBeenCalledOnce()
    expect(mocks.analytics.funnelStepCompleted).toHaveBeenCalledOnce()
  })

  it('accepts a repeated user.created event without creating or tracking the user again', async () => {
    mocks.verifyWebhook.mockResolvedValueOnce(createdEvent())
    mocks.user.findUnique.mockResolvedValueOnce({ id: 'database_user_1' })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mocks.user.create).not.toHaveBeenCalled()
    expect(mocks.analytics.signedUp).not.toHaveBeenCalled()
  })

  it('accepts a concurrent duplicate after the competing create wins', async () => {
    const uniqueConstraintError = new Error('Unique constraint failed')
    Object.assign(uniqueConstraintError, { code: 'P2002' })
    mocks.verifyWebhook.mockResolvedValueOnce(createdEvent())
    mocks.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'database_user_1' })
    mocks.user.create.mockRejectedValueOnce(uniqueConstraintError)

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mocks.analytics.signedUp).not.toHaveBeenCalled()
  })

  it('rejects an email collision that belongs to another Clerk user', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const uniqueConstraintError = new Error('Unique constraint failed')
    Object.assign(uniqueConstraintError, { code: 'P2002' })
    mocks.verifyWebhook.mockResolvedValueOnce(createdEvent())
    mocks.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    mocks.user.create.mockRejectedValueOnce(uniqueConstraintError)

    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(mocks.analytics.signedUp).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('accepts a repeated user.deleted event when the user is already absent', async () => {
    mocks.verifyWebhook.mockResolvedValueOnce({
      type: 'user.deleted',
      data: { id: 'user_clerk_1', email_addresses: [] },
    })
    mocks.user.deleteMany.mockResolvedValueOnce({ count: 0 })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mocks.user.deleteMany).toHaveBeenCalledWith({
      where: { clerkId: 'user_clerk_1' },
    })
  })
})
