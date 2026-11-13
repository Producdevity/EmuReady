import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ComponentProps, type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import { TailwindColor } from '@orm'
import UserBadgeModal from './UserBadgeModal'

type AssignOptions = Parameters<typeof api.badges.assignToUser.useMutation>[0]
type RemoveOptions = Parameters<typeof api.badges.removeFromUser.useMutation>[0]
type AssignedBadges = RouterOutput['users']['getUserById']['userBadges']

const mocks = vi.hoisted(() => ({
  assign: vi.fn(),
  remove: vi.fn(),
  refreshedUsers: vi.fn(),
  catalogFetch: vi.fn(),
  profileFetch: vi.fn(),
  completion: Promise.withResolvers<void>(),
}))
let catalog: RouterOutput['badges']['get']['badges'] = []
const assigned = new Map<string, AssignedBadges>()
let liveQueries = false
let failCatalog = false
let failProfile = false

function catalogResponse(input: RouterInput['badges']['get']) {
  const page = input.page ?? 1
  const limit = input.limit ?? 20
  return {
    badges: catalog.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total: catalog.length,
      pages: Math.ceil(catalog.length / limit),
    },
  }
}

function useCatalogQuery(
  input: RouterInput['badges']['get'],
  options?: Parameters<typeof api.badges.get.useQuery>[1],
) {
  const query = useQuery({
    queryKey: ['catalog', input],
    enabled: liveQueries,
    retry: false,
    staleTime: Infinity,
    initialData: liveQueries && (input.page ?? 1) === 1 ? catalogResponse(input) : undefined,
    placeholderData: options?.placeholderData ? (previous) => previous : undefined,
    queryFn: async () => {
      mocks.catalogFetch(input)
      if (failCatalog) throw new Error('Catalog unavailable')
      return catalogResponse(input)
    },
  })
  return liveQueries
    ? query
    : { data: catalogResponse(input), isPending: false, isFetching: false, error: null }
}

function useUserBadgesQuery(input: RouterInput['users']['getUserById']) {
  const data = { userBadges: assigned.get(input.userId) ?? [] }
  const query = useQuery({
    queryKey: ['profile', input.userId],
    enabled: liveQueries,
    retry: false,
    staleTime: Infinity,
    initialData: liveQueries ? data : undefined,
    queryFn: async () => {
      mocks.profileFetch(input.userId)
      if (failProfile) throw new Error('Profile unavailable')
      return { userBadges: assigned.get(input.userId) ?? [] }
    },
  })
  return liveQueries
    ? query
    : {
        data,
        isPending: false,
        isFetching: false,
        error: null,
        refetch: async () => mocks.refreshedUsers(input.userId),
      }
}

function useAssign(options?: AssignOptions) {
  return useMutation({
    ...options,
    mutationFn: async (input: RouterInput['badges']['assignToUser']) => {
      mocks.assign(input)
      await mocks.completion.promise
      const result: RouterOutput['badges']['assignToUser'] = {
        id: uuid(900),
        userId: input.userId,
        badgeId: input.badgeId,
        assignedBy: uuid(901),
        assignedAt: new Date('2026-11-01T12:00:00Z'),
        notes: null,
        color: input.color ?? TailwindColor.blue,
        badge: { ...badge(1), id: input.badgeId },
        user: { ...firstUser, id: input.userId },
        assignedByUser: { id: uuid(901), name: 'Admin', email: 'admin@example.com' },
      }
      return result
    },
  })
}

function useRemove(options?: RemoveOptions) {
  return useMutation({
    ...options,
    mutationFn: async (input: RouterInput['badges']['removeFromUser']) => {
      mocks.remove(input)
      await mocks.completion.promise
      return { success: true }
    },
  })
}

vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({
      users: {
        getUserById: {
          invalidate: async (input: RouterInput['users']['getUserById']) => {
            mocks.refreshedUsers(input.userId)
          },
        },
      },
    }),
    badges: {
      get: { useQuery: useCatalogQuery },
      assignToUser: { useMutation: useAssign },
      removeFromUser: { useMutation: useRemove },
    },
    users: {
      getUserById: { useQuery: useUserBadgesQuery },
    },
  },
}))
vi.mock('@/lib/toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

function uuid(index: number) {
  return `00000000-0000-4000-a000-${String(index).padStart(12, '0')}`
}

function badge(index: number): RouterOutput['badges']['get']['badges'][number] {
  return {
    id: uuid(index),
    name: `Badge ${String(index).padStart(3, '0')}`,
    color: '#3B82F6',
    description: null,
    icon: null,
    isActive: true,
    createdBy: uuid(901),
    createdAt: new Date('2026-11-01T12:00:00Z'),
    updatedAt: new Date('2026-11-01T12:00:00Z'),
    creator: { id: uuid(901), name: 'Admin', email: 'admin@example.com' },
    _count: { userBadges: 0 },
  }
}

function assignedBadge(index: number): AssignedBadges[number] {
  return {
    id: uuid(1000 + index),
    color: TailwindColor.blue,
    assignedAt: new Date('2026-11-01T12:00:00Z'),
    badge: badge(index),
  }
}

const firstUser = { id: uuid(200), name: 'First user', email: 'first@example.com' }
const secondUser = { id: uuid(201), name: 'Second user', email: 'second@example.com' }

function wrapper(queryClient: QueryClient) {
  return function Wrapper(props: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
  }
}

function renderModal() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const callbacks = { onClose: vi.fn(), onSuccess: vi.fn() }
  const view = render(<UserBadgeModal {...callbacks} isOpen user={firstUser} />, {
    wrapper: wrapper(queryClient),
  })
  return {
    ...callbacks,
    view,
    queryClient,
    update(props: Partial<ComponentProps<typeof UserBadgeModal>>) {
      view.rerender(<UserBadgeModal {...callbacks} isOpen user={firstUser} {...props} />)
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  catalog = [badge(1), badge(2)]
  assigned.clear()
  liveQueries = false
  failCatalog = false
  failProfile = false
  mocks.completion = Promise.withResolvers<void>()
})

describe('badge assignment sessions', () => {
  it.each([firstUser, secondUser])(
    'clears a cancelled selection and color when reopening for $name',
    (user) => {
      const modal = renderModal()
      fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
      fireEvent.click(screen.getByRole('button', { name: 'Purple' }))
      modal.update({ isOpen: false, user: null })
      modal.update({ user })
      expect(screen.getByRole('combobox')).toHaveValue('')
      expect(screen.getByText('Selected: Blue')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Assign Badge' })).toBeDisabled()
    },
  )

  it('starts a fresh session on user changes but preserves a draft during a same-user refresh', () => {
    const modal = renderModal()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
    modal.update({ user: { ...firstUser, name: 'Updated name' } })
    expect(screen.getByRole('combobox')).toHaveValue(uuid(1))
    modal.update({ user: secondUser })
    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('keeps pending assignment scoped to its submitted user after the target changes', async () => {
    const modal = renderModal()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign Badge' }))
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledOnce())
    modal.update({ user: secondUser })
    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Purple' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(modal.onClose).not.toHaveBeenCalled()
    await act(async () => mocks.completion.resolve())
    await waitFor(() => expect(mocks.refreshedUsers).toHaveBeenCalledExactlyOnceWith(firstUser.id))
    expect(mocks.assign).toHaveBeenCalledWith({
      userId: firstUser.id,
      badgeId: uuid(1),
      color: TailwindColor.blue,
    })
    expect(
      screen.getByRole('heading', { name: /Manage Badges for Second user/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('handles a failed assignment without clearing the draft or reporting success', async () => {
    const modal = renderModal()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign Badge' }))
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledOnce())
    await act(async () => mocks.completion.reject(new Error('Assignment unavailable')))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('combobox')).toHaveValue(uuid(1))
    expect(modal.onSuccess).not.toHaveBeenCalled()
  })

  it.each(['assignment', 'catalog'] as const)(
    'blocks a selected badge that becomes unavailable after a background %s refresh',
    (change) => {
      const modal = renderModal()
      fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
      if (change === 'assignment') assigned.set(firstUser.id, [assignedBadge(1)])
      else catalog = [badge(2)]
      modal.update({ user: { ...firstUser } })
      expect(screen.queryByRole('option', { name: 'Badge 001' })).not.toBeInTheDocument()
      expect(screen.getByRole('combobox')).toHaveValue('')
      expect(screen.getByRole('button', { name: 'Assign Badge' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Assign Badge' }))
      expect(mocks.assign).not.toHaveBeenCalled()
    },
  )

  it('suppresses recipient details and callbacks after the entire modal unmounts', async () => {
    const modal = renderModal()
    modal.update({ user: { ...firstUser, name: '', email: 'private@example.com' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign Badge' }))
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledOnce())
    modal.view.unmount()
    await act(async () => mocks.completion.resolve())
    await waitFor(() => expect(mocks.refreshedUsers).toHaveBeenCalledWith(firstUser.id))
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
    expect(modal.onSuccess).not.toHaveBeenCalled()
  })

  it('reports a failed write for its original recipient when the target changes', async () => {
    const modal = renderModal()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign Badge' }))
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledOnce())
    modal.update({ user: secondUser })
    await act(async () => mocks.completion.reject(new Error('Assignment unavailable')))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to assign badge to First user: Assignment unavailable',
      ),
    )
    expect(modal.onSuccess).not.toHaveBeenCalled()
  })

  it.each(['assign', 'remove'] as const)(
    'refreshes the submitted user after a pending %s and target change',
    async (operation) => {
      if (operation === 'remove') assigned.set(firstUser.id, [assignedBadge(1)])
      const modal = renderModal()
      if (operation === 'assign') {
        fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
        fireEvent.click(screen.getByRole('button', { name: 'Assign Badge' }))
      } else {
        fireEvent.click(screen.getByRole('button', { name: 'Remove Badge 001 badge' }))
      }
      await waitFor(() => expect(mocks[operation]).toHaveBeenCalledOnce())
      modal.update({ user: secondUser })
      await act(async () => mocks.completion.resolve())
      await waitFor(() =>
        expect(mocks.refreshedUsers).toHaveBeenCalledExactlyOnceWith(firstUser.id),
      )
      expect(toast.success).toHaveBeenCalledWith(
        operation === 'assign' ? 'Badge assigned to First user' : 'Badge removed from First user',
      )
      expect(
        screen.getByRole('heading', { name: /Manage Badges for Second user/ }),
      ).toBeInTheDocument()
    },
  )
})

describe('badge catalog pagination', () => {
  it.each([1, 100])(
    'reaches badge101 when %i badges on page1 are already assigned',
    async (count) => {
      catalog = Array.from({ length: 101 }, (_, index) => badge(index + 1))
      assigned.set(
        firstUser.id,
        Array.from({ length: count }, (_, index) => assignedBadge(index + 1)),
      )
      renderModal()
      expect(
        screen.queryByText('All available badges have been assigned to this user.'),
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Badge 001' })).not.toBeInTheDocument()
      if (count === 1) {
        fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(2) } })
        fireEvent.click(screen.getAllByRole('button', { name: 'Go to page 1' })[0])
        expect(screen.getByRole('combobox')).toHaveValue(uuid(2))
      }
      fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0])
      expect(screen.getByRole('combobox', { name: 'Badge' })).toHaveValue('')
      expect(screen.getByRole('option', { name: 'Badge 101' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Badge 001' })).not.toBeInTheDocument()
      fireEvent.change(screen.getByRole('combobox', { name: 'Badge' }), {
        target: { value: uuid(101) },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Assign Badge' }))
      await waitFor(() =>
        expect(mocks.assign).toHaveBeenCalledWith(expect.objectContaining({ badgeId: uuid(101) })),
      )
      await act(async () => mocks.completion.resolve())
    },
  )

  it('returns to an available page when the active catalog shrinks', () => {
    catalog = Array.from({ length: 101 }, (_, index) => badge(index + 1))
    const modal = renderModal()
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0])
    expect(screen.getByRole('option', { name: 'Badge 101' })).toBeInTheDocument()
    catalog = catalog.slice(0, 100)
    modal.update({ user: { ...firstUser } })
    expect(screen.getByRole('option', { name: 'Badge 001' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go to previous page' })).not.toBeInTheDocument()
  })

  it('retries a failed new page using the real query observer', async () => {
    liveQueries = true
    failCatalog = true
    catalog = Array.from({ length: 101 }, (_, index) => badge(index + 1))
    renderModal()
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0])
    await screen.findByRole('alert')
    expect(mocks.assign).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
    failCatalog = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByRole('option', { name: 'Badge 101' })
    expect(mocks.catalogFetch).toHaveBeenCalledTimes(2)
    expect(mocks.catalogFetch).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    expect(mocks.profileFetch).not.toHaveBeenCalled()
  })

  it('can return to a cached page after the requested page fails', async () => {
    liveQueries = true
    failCatalog = true
    catalog = Array.from({ length: 101 }, (_, index) => badge(index + 1))
    renderModal()
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0])
    await screen.findByRole('alert')
    const previous = screen.getAllByRole('button', { name: 'Go to previous page' })[0]
    expect(previous).toBeEnabled()
    fireEvent.click(previous)
    await screen.findByRole('option', { name: 'Badge 001' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(mocks.catalogFetch).toHaveBeenCalledOnce()
  })

  it('keeps a draft and blocks writes until a failed background profile query is retried', async () => {
    liveQueries = true
    const modal = renderModal()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: uuid(1) } })
    fireEvent.click(screen.getByRole('button', { name: 'Purple' }))
    failProfile = true
    await act(async () => {
      await modal.queryClient.refetchQueries({ queryKey: ['profile', firstUser.id] })
    })
    await screen.findByRole('alert')
    expect(screen.getByRole('combobox')).toHaveValue(uuid(1))
    expect(screen.getByText('Selected: Purple')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Assign Badge' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
    failProfile = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Assign Badge' })).toBeEnabled())
    expect(screen.getByRole('combobox')).toHaveValue(uuid(1))
    expect(screen.getByText('Selected: Purple')).toBeInTheDocument()
    expect(mocks.profileFetch).toHaveBeenCalledTimes(2)
    expect(mocks.catalogFetch).not.toHaveBeenCalled()
  })
})
