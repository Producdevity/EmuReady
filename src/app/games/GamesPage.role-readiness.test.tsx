import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type RouterOutput } from '@/types/trpc'
import { Role } from '@orm'
import GamesPage from './GamesPage'

let clerkUser: { id: string } | null = null
let response = Promise.withResolvers<RouterOutput['users']['me']>()
const queryKey = ['users', 'me']
const searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
  usePathname: () => '/games',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: clerkUser, isLoaded: true }),
}))
vi.mock('@/lib/api', () => ({
  api: {
    users: { me: { useQuery: useCurrentUserQuery } },
    systems: { get: { useQuery: () => ({ data: [] }) } },
    games: { get: { useQuery: () => ({ data: { games: [] }, isPending: false }) } },
  },
}))
vi.mock('./components/GameFilters', () => ({ default: () => null }))

function useCurrentUserQuery(_input: undefined, options: { enabled: boolean }) {
  return useQuery({ queryKey, queryFn: () => response.promise, enabled: options.enabled })
}

function user(role: Role): NonNullable<RouterOutput['users']['me']> {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'user@example.com',
    name: 'Test user',
    permissions: [],
    role,
  }
}

function renderGames(
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) {
  return {
    queryClient,
    ...render(<GamesPage />, {
      wrapper: function Wrapper(props: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
      },
    }),
  }
}

const linkName = /^add (?:a )?game$/i

beforeEach(() => {
  clerkUser = { id: 'clerk-user' }
  response = Promise.withResolvers<RouterOutput['users']['me']>()
})

describe('game submission role readiness', () => {
  it.each([
    { role: Role.SUPER_ADMIN, href: '/games/new' },
    { role: Role.MODERATOR, href: '/games/new' },
    { role: Role.USER, href: '/games/new/search/v2' },
  ])('waits for the current user before showing either $role destination', async (testCase) => {
    renderGames()
    expect(screen.getByRole('heading', { name: 'Games Library' })).toBeVisible()
    expect(screen.queryAllByRole('link', { name: linkName })).toHaveLength(0)

    await act(async () => response.resolve(user(testCase.role)))
    await waitFor(() => expect(screen.getAllByRole('link', { name: linkName })).toHaveLength(2))
    for (const link of screen.getAllByRole('link', { name: linkName }))
      expect(link).toHaveAttribute('href', testCase.href)
  })

  it('keeps submission links hidden for an anonymous visitor even with cached user data', () => {
    clerkUser = null
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKey, user(Role.SUPER_ADMIN))
    renderGames(queryClient)
    expect(screen.queryAllByRole('link', { name: linkName })).toHaveLength(0)
  })

  it('does not expose a fallback destination when the current-user response is null', async () => {
    const view = renderGames()
    await act(async () => response.resolve(null))
    await waitFor(() => expect(view.queryClient.getQueryState(queryKey)?.status).toBe('success'))
    expect(screen.queryAllByRole('link', { name: linkName })).toHaveLength(0)
  })

  it('does not expose a fallback destination after an initial current-user error', async () => {
    const view = renderGames()
    await act(async () => response.reject(new Error('Current user unavailable')))
    await waitFor(() => expect(view.queryClient.getQueryState(queryKey)?.status).toBe('error'))
    expect(screen.queryAllByRole('link', { name: linkName })).toHaveLength(0)
  })

  it('preserves the resolved destination during a background refresh failure', async () => {
    const view = renderGames()
    await act(async () => response.resolve(user(Role.SUPER_ADMIN)))
    await waitFor(() => expect(screen.getAllByRole('link', { name: linkName })).toHaveLength(2))
    response = Promise.withResolvers<RouterOutput['users']['me']>()
    const refreshed = view.queryClient.refetchQueries({ queryKey })
    for (const link of screen.getAllByRole('link', { name: linkName }))
      expect(link).toHaveAttribute('href', '/games/new')
    await act(async () => {
      response.reject(new Error('Background refresh unavailable'))
      await refreshed
    })
    for (const link of screen.getAllByRole('link', { name: linkName }))
      expect(link).toHaveAttribute('href', '/games/new')
  })
})
