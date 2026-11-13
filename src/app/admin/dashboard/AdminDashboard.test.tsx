import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRPCClientError, type TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/lib/api'
import { DashboardQuerySchema } from '@/schemas/activity'
import { type AppRouter, type RouterInput, type RouterOutput } from '@/types/trpc'
import { Role } from '@orm'
import { AdminDashboard } from './AdminDashboard'

type DashboardData = RouterOutput['activity']['dashboard']
const dashboardData: DashboardData = {
  criticalActions: [],
  recentUsers: [],
  recentListings: [],
  recentComments: [],
  recentReports: [],
  recentBans: [],
  permissions: { canSeeUsers: true, canSeeReports: true, canSeeBans: true },
  platformStats: {
    newUsersCount: 0,
    newUsersChange: 0,
    newListingsCount: 0,
    newListingsChange: 0,
    newPcListingsCount: 0,
    newPcListingsChange: 0,
    activeReportsCount: 0,
    pendingApprovalsCount: 0,
    pendingGamesCount: 0,
    pendingListingsCount: 0,
    pendingPcListingsCount: 0,
  },
}
const requests: RouterInput['activity']['dashboard'][] = []
const pending: ReturnType<typeof Promise.withResolvers<DashboardData>>[] = []
let holdRequests = false

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  })
  const link: TRPCLink<AppRouter> =
    () =>
    ({ op }) =>
      observable((observer) => {
        requests.push(DashboardQuerySchema.parse(op.input))
        const response = Promise.withResolvers<DashboardData>()
        if (holdRequests) pending.push(response)
        else response.resolve(dashboardData)
        let active = true
        response.promise.then(
          (data) => {
            if (!active) return
            observer.next({ result: { data } })
            observer.complete()
          },
          (error: unknown) => {
            if (!active) return
            const failure =
              error instanceof Error
                ? error
                : new Error('Dashboard request failed', { cause: error })
            observer.error(TRPCClientError.from<AppRouter>(failure))
          },
        )
        return () => {
          active = false
        }
      })
  const client = api.createClient({ links: [link] })
  return function Wrapper(props: PropsWithChildren) {
    return (
      <api.Provider client={client} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
      </api.Provider>
    )
  }
}

function refreshButtons() {
  return screen.getAllByRole('button', { name: /^Refresh(?: stats)?$/ })
}

async function expectIdle() {
  await screen.findByRole('heading', { name: 'Platform Stats' })
  await waitFor(() => {
    expect(refreshButtons()).toHaveLength(6)
    for (const button of refreshButtons()) expect(button).toBeEnabled()
  })
}

beforeEach(() => {
  requests.length = 0
  pending.length = 0
  holdRequests = false
})

describe('dashboard request state', () => {
  it('disables initial refresh actions until the shared request completes', async () => {
    holdRequests = true
    render(<AdminDashboard userRole={Role.SUPER_ADMIN} navItems={[]} />, { wrapper: wrapper() })
    for (const button of refreshButtons()) expect(button).toBeDisabled()
    await waitFor(() => expect(pending).toHaveLength(1))
    await act(async () => pending[0].resolve(dashboardData))
    await expectIdle()
  })

  it('keeps refresh available when the selected range is clicked again', async () => {
    render(<AdminDashboard userRole={Role.SUPER_ADMIN} navItems={[]} />, { wrapper: wrapper() })
    await expectIdle()
    fireEvent.click(screen.getAllByRole('button', { name: '24h' })[0])
    await expectIdle()
    expect(requests).toHaveLength(1)
  })

  it('keeps refresh available when returning to a fresh cached range', async () => {
    render(<AdminDashboard userRole={Role.SUPER_ADMIN} navItems={[]} />, { wrapper: wrapper() })
    await expectIdle()
    fireEvent.click(screen.getAllByRole('button', { name: '48h' })[0])
    await waitFor(() => expect(requests).toHaveLength(2))
    await expectIdle()
    expect(requests[1]).toMatchObject({ usersTimeRange: '48h', listingsTimeRange: '24h' })

    fireEvent.click(screen.getAllByRole('button', { name: '24h' })[0])
    await expectIdle()
    expect(requests).toHaveLength(2)
  })

  it.each(['Refresh', 'Refresh stats'])(
    'reflects the shared pending request after %s is clicked',
    async (label) => {
      render(<AdminDashboard userRole={Role.SUPER_ADMIN} navItems={[]} />, { wrapper: wrapper() })
      await expectIdle()
      holdRequests = true
      fireEvent.click(screen.getAllByRole('button', { name: label })[0])
      await waitFor(() => expect(pending).toHaveLength(1))
      for (const button of refreshButtons()) expect(button).toBeDisabled()
      expect(requests).toHaveLength(2)
      expect(requests[1]).toEqual(requests[0])
      await act(async () => pending[0].resolve(dashboardData))
      await expectIdle()
    },
  )

  it('recovers the shared refresh actions after a failed request is retried', async () => {
    render(<AdminDashboard userRole={Role.SUPER_ADMIN} navItems={[]} />, { wrapper: wrapper() })
    await expectIdle()
    holdRequests = true
    fireEvent.click(screen.getAllByRole('button', { name: 'Refresh' })[0])
    await waitFor(() => expect(pending).toHaveLength(1))
    await act(async () => pending[0].reject(new Error('Dashboard temporarily unavailable')))
    await screen.findByRole('heading', { name: 'Failed to load dashboard data' })
    holdRequests = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await expectIdle()
    expect(requests).toHaveLength(3)
  })
})
