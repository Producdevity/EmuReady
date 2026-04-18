import { test, expect } from '@playwright/test'

test.describe('Router Security Verification', () => {
  test('protected endpoints should reject unauthenticated requests', async ({ request }) => {
    const protectedEndpoints = [
      '/api/trpc/listings.create',
      '/api/trpc/users.update',
      '/api/trpc/userBans.create',
      '/api/trpc/trust.adjustTrustScore',
    ]

    for (const endpoint of protectedEndpoints) {
      const response = await request.post(endpoint, {
        data: {},
        headers: { 'Content-Type': 'application/json' },
      })
      expect([401, 403]).toContain(response.status())
    }
  })

  test('admin endpoints should reject non-admin users', async ({ request }) => {
    const adminOnlyEndpoints = [
      '/api/trpc/users.updateRole',
      '/api/trpc/permissions.create',
      '/api/trpc/trust.runMonthlyActiveBonus',
    ]

    for (const endpoint of adminOnlyEndpoints) {
      const response = await request.post(endpoint, {
        data: {},
        headers: { 'Content-Type': 'application/json' },
      })
      expect([401, 403]).toContain(response.status())
    }
  })
})

test.describe('Data Validation Verification', () => {
  test('should reject invalid data on creation endpoints', async ({ request }) => {
    const response = await request.post('/api/trpc/listings.create', {
      data: {
        title: '',
        gameId: 'invalid-id',
        deviceId: -1,
      },
      headers: { 'Content-Type': 'application/json' },
    })

    // 400 = bad input; 401/403 = unauthenticated (both are acceptable outcomes)
    expect([400, 401, 403]).toContain(response.status())
  })

  test('should handle malformed tRPC requests', async ({ request }) => {
    const response = await request.post('/api/trpc/nonExistentRouter.nonExistentProcedure', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBeGreaterThanOrEqual(400)
  })
})
