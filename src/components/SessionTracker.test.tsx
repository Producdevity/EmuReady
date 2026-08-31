import { fireEvent, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SessionTracker from './SessionTracker'

type MockUser = {
  id: string
  externalAccounts?: { provider?: string }[]
  primaryEmailAddress?: { id: string } | null
}

const testState = vi.hoisted(() => ({
  analyticsAllowed: true,
  pathname: '/',
  user: null as MockUser | null,
  analytics: {
    user: {
      signedIn: vi.fn(),
    },
    session: {
      featureDiscovered: vi.fn(),
      pageView: vi.fn(),
      sessionEnded: vi.fn(),
      sessionStarted: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: testState.user }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => testState.pathname,
}))

vi.mock('@/hooks', () => ({
  useCookieConsent: () => ({ analyticsAllowed: testState.analyticsAllowed }),
}))

vi.mock('@/lib/analytics', () => ({
  default: testState.analytics,
}))

describe('SessionTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    testState.analyticsAllowed = true
    testState.pathname = '/'
    testState.user = null
  })

  it('does not track session activity when analytics are disabled', () => {
    testState.analyticsAllowed = false

    render(<SessionTracker />)

    fireEvent.click(document.body)
    window.dispatchEvent(new Event('beforeunload'))

    expect(testState.analytics.session.sessionStarted).not.toHaveBeenCalled()
    expect(testState.analytics.session.pageView).not.toHaveBeenCalled()
    expect(testState.analytics.session.sessionEnded).not.toHaveBeenCalled()
  })

  it('tracks real page view and interaction counts when the session ends', async () => {
    const view = render(<SessionTracker />)

    await waitFor(() => {
      expect(testState.analytics.session.sessionStarted).toHaveBeenCalledOnce()
      expect(testState.analytics.session.pageView).toHaveBeenCalledOnce()
    })
    expect(testState.analytics.session.pageView).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        loadTime: expect.any(Number),
        pathname: '/',
      }),
    )

    testState.pathname = '/games'
    view.rerender(<SessionTracker />)

    await waitFor(() => {
      expect(testState.analytics.session.pageView).toHaveBeenCalledTimes(2)
    })
    expect(testState.analytics.session.pageView).toHaveBeenLastCalledWith({
      pathname: '/games',
      userId: undefined,
    })

    fireEvent.click(document.body)
    fireEvent.keyDown(document, { key: 'Enter' })
    window.dispatchEvent(new Event('beforeunload'))

    expect(testState.analytics.session.sessionEnded).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: expect.any(Number),
        interactions: 2,
        pageViews: 2,
        sessionId: expect.any(String),
      }),
    )
  })

  it('reports the Clerk OAuth provider without counting sign-in as a page view', async () => {
    const view = render(<SessionTracker />)

    await waitFor(() => {
      expect(testState.analytics.session.sessionStarted).toHaveBeenCalledOnce()
    })

    testState.user = {
      id: 'user-1',
      externalAccounts: [{ provider: 'oauth_google' }],
      primaryEmailAddress: null,
    }
    view.rerender(<SessionTracker />)

    await waitFor(() => {
      expect(testState.analytics.user.signedIn).toHaveBeenCalledWith({
        method: 'google',
        userId: 'user-1',
      })
    })
    expect(testState.analytics.session.pageView).toHaveBeenCalledOnce()
  })

  it('falls back to email sign-in when the Clerk user has no OAuth provider', async () => {
    const view = render(<SessionTracker />)

    await waitFor(() => {
      expect(testState.analytics.session.sessionStarted).toHaveBeenCalledOnce()
    })

    testState.user = {
      id: 'user-2',
      primaryEmailAddress: { id: 'email-1' },
    }
    view.rerender(<SessionTracker />)

    await waitFor(() => {
      expect(testState.analytics.user.signedIn).toHaveBeenCalledWith({
        method: 'email',
        userId: 'user-2',
      })
    })
  })

  it('falls back to clerk sign-in when the user has no OAuth provider or email', async () => {
    const view = render(<SessionTracker />)

    await waitFor(() => {
      expect(testState.analytics.session.sessionStarted).toHaveBeenCalledOnce()
    })

    testState.user = {
      id: 'user-3',
      primaryEmailAddress: null,
    }
    view.rerender(<SessionTracker />)

    await waitFor(() => {
      expect(testState.analytics.user.signedIn).toHaveBeenCalledWith({
        method: 'clerk',
        userId: 'user-3',
      })
    })
  })
})
