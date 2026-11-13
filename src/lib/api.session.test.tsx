import { act, render, screen, waitFor } from '@testing-library/react'
import superjson from 'superjson'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Role } from '@orm'
import { api, TRPCProvider } from './api'

let sessionId: string | null = 'session-a'
let ownerId: string | null = '00000000-0000-4000-a000-000000000001'
const firstOwner = '00000000-0000-4000-a000-000000000001'
const secondOwner = '00000000-0000-4000-a000-000000000002'

vi.mock('@clerk/nextjs', () => ({ useAuth: () => ({ sessionId, userId: ownerId }) }))

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
