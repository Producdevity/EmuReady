import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import { Role } from '@orm'
import ProfilePage from '../ProfilePage'
import ProfileInformation from './ProfileInformation'
import type * as Clerk from '@clerk/nextjs'

const mutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
const invalidate = vi.hoisted(() =>
  vi.fn<ReturnType<typeof api.useUtils>['users']['getProfile']['invalidate']>(),
)
const fetchProfile = vi.hoisted(() => vi.fn<() => Promise<RouterOutput['users']['getProfile']>>())
const profileQueryError = vi.hoisted(() => vi.fn())
let onSuccess: NonNullable<Parameters<typeof api.users.update.useMutation>[0]>['onSuccess']
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({ users: { getProfile: { invalidate } } }),
    users: {
      getProfile: { useQuery: () => useProfileQuery() },
      update: {
        useMutation: (options: Parameters<typeof api.users.update.useMutation>[0]) => {
          onSuccess = options?.onSuccess
          return mutation
        },
      },
    },
    userPreferences: { get: { useQuery: () => ({}) } },
    notifications: { getPreferences: { useQuery: () => ({}) } },
  },
}))
vi.mock('@clerk/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof Clerk>()),
  useUser: () => ({ user: { id: 'clerk-user' }, isLoaded: true }),
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/profile',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/lib/analytics', () => ({
  default: { navigation: { pageView: vi.fn() }, conversion: { goalCompleted: vi.fn() } },
}))
vi.mock('@/lib/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

const initial = { data: { name: 'Original name', bio: 'Original bio' }, isPending: false }
const refreshed = { data: { name: 'Refreshed name', bio: 'Refreshed bio' }, isPending: false }
const profile: RouterOutput['users']['getProfile'] = {
  ...initial.data,
  id: '00000000-0000-4000-a000-000000000001',
  email: 'owner@example.com',
  profileImage: null,
  role: Role.USER,
  trustScore: 1,
  createdAt: new Date('2026-11-01T12:00:00Z'),
  _count: { listings: 0 },
}
let initialProfile: typeof profile | undefined = profile

function useProfileQuery() {
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    initialData: initialProfile,
    staleTime: Infinity,
    retry: false,
  })
  useEffect(() => {
    if (query.isError) profileQueryError()
  }, [query.isError])
  return query
}

describe('profile information draft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onSuccess = undefined
    invalidate.mockReset().mockResolvedValue(undefined)
    initialProfile = profile
    fetchProfile.mockReset().mockResolvedValue(profile)
  })

  it('waits for the saved profile refetch before another edit can start', async () => {
    const refetch = Promise.withResolvers<void>()
    invalidate.mockReturnValueOnce(refetch.promise)
    const view = render(<ProfileInformation userQuery={initial} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'My saved name' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    const complete = onSuccess
    if (!complete) throw new Error('Expected a profile success callback')
    let completion: unknown
    act(() => {
      completion = complete(
        { success: true, profile: { name: 'My saved name', bio: 'Original bio' } },
        { name: 'My saved name', bio: 'Original bio' },
        undefined,
        { client: new QueryClient(), meta: undefined, mutationKey: undefined },
      )
    })
    try {
      expect(invalidate).toHaveBeenCalledOnce()
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('My saved name')).toBeInTheDocument()
      view.rerender(<ProfileInformation userQuery={refreshed} />)
      await act(async () => {
        refetch.resolve()
        await completion
      })
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
      expect(screen.getByDisplayValue('Refreshed name')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Refreshed bio')).toBeInTheDocument()
    } finally {
      refetch.resolve()
      await completion
    }
  })

  it('preserves an edit during a query refresh and submits the displayed draft', () => {
    const view = render(<ProfileInformation userQuery={initial} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'My draft' },
    })
    view.rerender(<ProfileInformation userQuery={refreshed} />)
    expect(screen.getByDisplayValue('My draft')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(mutation.mutate).toHaveBeenCalledWith({ name: 'My draft', bio: 'Original bio' })
  })

  it('keeps the saved draft open when a real background profile refetch fails', async () => {
    const queryClient = new QueryClient()
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchProfile.mockRejectedValue(new Error('Profile refresh unavailable'))
    invalidate.mockImplementation((_input, _filters, options) =>
      queryClient.invalidateQueries({ queryKey: ['profile'] }, options),
    )
    try {
      render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage />
        </QueryClientProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
      fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
        target: { value: '  My saved name  ' },
      })
      fireEvent.change(screen.getByPlaceholderText('Tell us about yourself'), {
        target: { value: '<b>Submitted bio</b>' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
      const complete = onSuccess
      if (!complete) throw new Error('Expected a profile success callback')
      await act(async () => {
        await complete(
          { success: true, profile: { name: 'My saved name', bio: 'Persisted bio' } },
          { name: '  My saved name  ', bio: '<b>Submitted bio</b>' },
          undefined,
          { client: queryClient, meta: undefined, mutationKey: undefined },
        )
      })
      await waitFor(() => expect(profileQueryError).toHaveBeenCalledOnce())
      expect(fetchProfile).toHaveBeenCalledOnce()
      expect(queryClient.getQueryData(['profile'])).toEqual(profile)
      expect(screen.getByPlaceholderText('Enter your name')).toHaveValue('  My saved name  ')
      expect(
        screen.queryByText('Error loading profile. Please try again later.'),
      ).not.toBeInTheDocument()
      expect(toast.warning).toHaveBeenCalledWith(
        'Profile saved, but it could not be refreshed. Your draft is still open.',
      )
      expect(toast.success).not.toHaveBeenCalled()
      expect(toast.error).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.getByText('My saved name', { selector: 'p' }).textContent).toBe('My saved name')
      expect(screen.getByText('Persisted bio', { selector: 'p' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
      expect(screen.getByDisplayValue('My saved name')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Persisted bio')).toBeInTheDocument()

      act(() => {
        queryClient.setQueryData(['profile'], { ...profile, name: 'Latest server name' })
      })
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(await screen.findByText('Latest server name', { selector: 'p' })).toBeInTheDocument()
    } finally {
      queryClient.clear()
      errorLog.mockRestore()
    }
  })

  it('keeps the full-page error for an initial failure without a cached profile', async () => {
    const queryClient = new QueryClient()
    initialProfile = undefined
    fetchProfile.mockRejectedValue(new Error('Profile unavailable'))
    try {
      render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage />
        </QueryClientProvider>,
      )
      await screen.findByText('Error loading profile. Please try again later.')
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    } finally {
      queryClient.clear()
    }
  })

  it('starts the next edit with the latest saved values after cancellation', () => {
    const view = render(<ProfileInformation userQuery={initial} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Discard me' },
    })
    view.rerender(<ProfileInformation userQuery={refreshed} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByDisplayValue('Refreshed name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Refreshed bio')).toBeInTheDocument()
  })
})
