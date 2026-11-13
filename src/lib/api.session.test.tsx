import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import superjson from 'superjson'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ListingFormAuthGuard } from '@/app/listings/components/shared/ListingFormAuthGuard'
import { Role } from '@orm'
import { api, TRPCProvider } from './api'

let sessionId: string | null | undefined = 'session-a'
let ownerId: string | null = '00000000-0000-4000-a000-000000000001'
const firstOwner = '00000000-0000-4000-a000-000000000001'
const secondOwner = '00000000-0000-4000-a000-000000000002'

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ sessionId, userId: ownerId, isLoaded: sessionId !== undefined }),
}))

function responseFor(id: string | null) {
  const data = id ? { id, name: id, email: null, role: Role.USER, permissions: [] } : null
  return new Response(JSON.stringify([{ result: { data: superjson.serialize(data) } }]), {
    headers: { 'content-type': 'application/json' },
  })
}

const fetchQuery = vi.fn(async () => responseFor(ownerId))

function Profile() {
  const query = api.users.me.useQuery()
  return (
    <output aria-label="Profile owner">
      {query.isPending ? 'Loading' : (query.data?.id ?? 'Signed out')}
    </output>
  )
}

function App() {
  return (
    <TRPCProvider>
      <Profile />
      <Draft />
    </TRPCProvider>
  )
}

function Draft() {
  const [value, setValue] = useState('')
  return (
    <input aria-label="Search draft" value={value} onChange={(ev) => setValue(ev.target.value)} />
  )
}

function ReportDraft() {
  const query = api.users.me.useQuery()
  return (
    <ListingFormAuthGuard isLoading={query.isLoading} isAuthenticated={Boolean(query.data)}>
      <Draft />
    </ListingFormAuthGuard>
  )
}

function ReportApp() {
  return (
    <TRPCProvider>
      <Profile />
      <ReportDraft />
    </TRPCProvider>
  )
}

beforeEach(() => {
  sessionId = 'session-a'
  ownerId = firstOwner
  fetchQuery.mockReset().mockImplementation(async () => responseFor(ownerId))
  vi.stubGlobal('fetch', fetchQuery)
})

afterEach(() => vi.unstubAllGlobals())

it.each(['account switch', 'sign out', 'sign in'] as const)(
  'isolates cached profile data on %s',
  async (transition) => {
    if (transition === 'sign in') {
      sessionId = null
      ownerId = null
    }
    const view = render(<App />)
    await waitFor(() =>
      expect(screen.getByLabelText('Profile owner')).toHaveTextContent(ownerId ?? 'Signed out'),
    )
    if (transition === 'sign out') {
      sessionId = null
      ownerId = null
    } else {
      sessionId = 'session-b'
      ownerId = secondOwner
    }
    view.rerender(<App />)
    expect(screen.getByLabelText('Profile owner')).not.toHaveTextContent(firstOwner)
    await waitFor(() =>
      expect(screen.getByLabelText('Profile owner')).toHaveTextContent(ownerId ?? 'Signed out'),
    )
    expect(fetchQuery).toHaveBeenCalledTimes(2)
  },
)

it('preserves the cache while the active session stays the same', async () => {
  const view = render(<App />)
  await screen.findByText(firstOwner)
  view.rerender(<App />)
  expect(screen.getByLabelText('Profile owner')).toHaveTextContent(firstOwner)
  expect(fetchQuery).toHaveBeenCalledOnce()
})

it('waits for auth initialization before allowing report input', async () => {
  sessionId = undefined
  const refreshed = Promise.withResolvers<Response>()
  fetchQuery.mockImplementationOnce(async () => responseFor(firstOwner))
  fetchQuery.mockImplementationOnce(() => refreshed.promise)
  const view = render(<ReportApp />)
  try {
    await screen.findByText(firstOwner)
    expect(screen.queryByLabelText('Search draft')).not.toBeInTheDocument()
    sessionId = 'session-a'
    view.rerender(<ReportApp />)
    await waitFor(() => expect(fetchQuery).toHaveBeenCalledTimes(2))
    expect(screen.queryByLabelText('Search draft')).not.toBeInTheDocument()
    await act(async () => refreshed.resolve(responseFor(firstOwner)))
    const input = await screen.findByLabelText('Search draft')
    fireEvent.change(input, { target: { value: 'Rog' } })
    expect(input).toHaveValue('Rog')
  } finally {
    refreshed.resolve(responseFor(firstOwner))
  }
})

it.each(['session-a', null])(
  'preserves input while the initial session resolves to %s',
  async (id) => {
    sessionId = undefined
    ownerId = null
    const view = render(<App />)
    await screen.findByText('Signed out')
    fireEvent.change(screen.getByLabelText('Search draft'), { target: { value: 'Mario' } })

    sessionId = id
    ownerId = id ? firstOwner : null
    view.rerender(<App />)

    expect(screen.getByLabelText('Search draft')).toHaveValue('Mario')
    await waitFor(() =>
      expect(screen.getByLabelText('Profile owner')).toHaveTextContent(ownerId ?? 'Signed out'),
    )
    await waitFor(() => expect(fetchQuery).toHaveBeenCalledTimes(2))
  },
)

it('discards a late initial-loading response after the session resolves', async () => {
  sessionId = undefined
  ownerId = null
  const older = Promise.withResolvers<Response>()
  fetchQuery.mockImplementationOnce(() => older.promise)
  const view = render(<App />)
  try {
    await waitFor(() => expect(fetchQuery).toHaveBeenCalledOnce())
    fireEvent.change(screen.getByLabelText('Search draft'), { target: { value: 'Mario' } })
    sessionId = 'session-a'
    ownerId = firstOwner
    view.rerender(<App />)
    expect(screen.getByLabelText('Search draft')).toHaveValue('Mario')
    await screen.findByText(firstOwner)
    await act(async () => older.resolve(responseFor(null)))
    expect(screen.getByLabelText('Profile owner')).toHaveTextContent(firstOwner)
  } finally {
    older.resolve(responseFor(null))
  }
})

it.each(['initial loading', 'later account switch'] as const)(
  'discards completed loading-period data on %s',
  async (transition) => {
    if (transition === 'initial loading') sessionId = undefined
    const view = render(<App />)
    await screen.findByText(firstOwner)
    if (transition === 'later account switch') {
      sessionId = undefined
      view.rerender(<App />)
      await waitFor(() => expect(fetchQuery).toHaveBeenCalledTimes(2))
      await screen.findByText(firstOwner)
    }
    fireEvent.change(screen.getByLabelText('Search draft'), { target: { value: 'Mario' } })
    const next = Promise.withResolvers<Response>()
    fetchQuery.mockImplementation(() => next.promise)
    try {
      sessionId = 'session-b'
      ownerId = secondOwner
      view.rerender(<App />)
      expect(screen.getByLabelText('Profile owner')).not.toHaveTextContent(firstOwner)
      if (transition === 'initial loading')
        expect(screen.getByLabelText('Search draft')).toHaveValue('Mario')
      await waitFor(() =>
        expect(fetchQuery).toHaveBeenCalledTimes(transition === 'initial loading' ? 2 : 3),
      )
      await act(async () => next.resolve(responseFor(secondOwner)))
      await screen.findByText(secondOwner)
    } finally {
      next.resolve(responseFor(secondOwner))
    }
  },
)

it('isolates a later session even when auth passes through loading', async () => {
  const view = render(<App />)
  await screen.findByText(firstOwner)
  fireEvent.change(screen.getByLabelText('Search draft'), { target: { value: 'Private draft' } })
  sessionId = undefined
  ownerId = null
  view.rerender(<App />)
  expect(screen.getByLabelText('Profile owner')).not.toHaveTextContent(firstOwner)
  expect(screen.getByLabelText('Search draft')).toHaveValue('')
  sessionId = 'session-b'
  ownerId = secondOwner
  view.rerender(<App />)
  await screen.findByText(secondOwner)
  expect(screen.getByLabelText('Profile owner')).not.toHaveTextContent(firstOwner)
})

it('keeps a late response from the previous session out of the current cache', async () => {
  const older = Promise.withResolvers<Response>()
  fetchQuery.mockImplementationOnce(() => older.promise)
  const view = render(<App />)
  try {
    await waitFor(() => expect(fetchQuery).toHaveBeenCalledOnce())
    sessionId = 'session-b'
    ownerId = secondOwner
    view.rerender(<App />)
    await screen.findByText(secondOwner)
    await act(async () => older.resolve(responseFor(firstOwner)))
    expect(screen.getByLabelText('Profile owner')).toHaveTextContent(secondOwner)
  } finally {
    older.resolve(responseFor(firstOwner))
  }
})
