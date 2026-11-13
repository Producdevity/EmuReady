import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRPCClientError, type TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type GameSearchFormProps, type BaseGameResult } from '@/components/game-search/types'
import { api } from '@/lib/api'
import { type AppRouter } from '@/types/trpc'
import GameSearchPage from './GameSearchPage'
import IGDBSearchPage from './v2/IGDBSearchPage'

let params = new URLSearchParams()
const mocks = vi.hoisted(() => ({ replace: vi.fn(), error: vi.fn(), warning: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
  useSearchParams: () => params,
  usePathname: () => '/games/new/search',
}))
vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: { id: 'user' }, isLoaded: true }) }))
vi.mock('sonner', () => ({ toast: { error: mocks.error, warning: mocks.warning } }))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/features/human-verification/client', () => ({
  useSubmitWithHumanVerification: () => vi.fn(),
}))
vi.mock('./components/GamePreviewModal', () => ({ default: () => null }))
vi.mock('./v2/components/IGDBGamePreviewModal', () => ({ default: () => null }))
vi.mock('@/components/game-search', () => ({
  GameSearchHeader: () => null,
  GameSearchForm: (props: GameSearchFormProps) => (
    <button onClick={() => props.onSearch('Manual', null, 'switch2')}>
      {props.isSearching ? 'Searching' : 'Search all platforms'}
    </button>
  ),
  GameSearchResults: (props: { results: { games: BaseGameResult[] } }) => (
    <div>
      {props.results.games.map((game) => (
        <span key={game.id}>{game.name}</span>
      ))}
    </div>
  ),
}))

const systems = [{ id: 'switch2', name: 'Nintendo Switch 2', key: 'nintendo_switch_2' }]
let providerResult: (query: string) => Promise<string>
const requests: { path: string; input: unknown }[] = []

function mount(provider: 'igdb' | 'tgdb') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const link: TRPCLink<AppRouter> =
    () =>
    ({ op }) =>
      observable((observer) => {
        let active = true
        async function respond() {
          if (op.path === 'systems.get') return systems
          if (op.path === 'users.me') return { role: 'ADMIN' }
          if (op.path === 'games.checkExistingByNamesAndSystems') return {}
          requests.push({ path: op.path, input: op.input })
          const input = op.input
          if (
            typeof input !== 'object' ||
            input === null ||
            !('query' in input) ||
            typeof input.query !== 'string'
          ) {
            throw new Error('Unexpected test request')
          }
          const name = await providerResult(input.query)
          if (provider === 'igdb') {
            return {
              games: [
                { id: 1, name, imageUrl: null, boxartUrl: null, bannerUrl: null, isErotic: false },
              ],
              count: 1,
            }
          }
          return {
            code: 200,
            status: 'Success',
            remaining_monthly_allowance: 10,
            extra_allowance: 0,
            pages: { previous: '', current: '', next: '' },
            data: { count: 1, games: [{ id: 1, game_title: name }] },
          }
        }
        respond().then(
          (data) => {
            if (!active) return
            observer.next({ result: { data } })
            observer.complete()
          },
          (error: unknown) => {
            if (active)
              observer.error(
                TRPCClientError.from<AppRouter>(
                  error instanceof Error ? error : new Error(String(error)),
                ),
              )
          },
        )
        return () => {
          active = false
        }
      })
  const client = api.createClient({ links: [link] })
  const Page = provider === 'igdb' ? IGDBSearchPage : GameSearchPage
  const view = () => (
    <api.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    </api.Provider>
  )
  const rendered = render(view())
  return { rerender: () => rendered.rerender(view()) }
}

beforeEach(() => {
  vi.clearAllMocks()
  requests.length = 0
  params = new URLSearchParams('q=Initial&system=switch2')
  providerResult = async (query) => `${query} result`
})

describe.each(['igdb', 'tgdb'] as const)('%s search query state', (provider) => {
  it('uses the Switch 2 mapping for URL searches', async () => {
    mount(provider)
    await screen.findByText('Initial result')
    expect(requests).toContainEqual({
      path: `${provider}.searchGames`,
      input:
        provider === 'igdb'
          ? { query: 'Initial', platformId: 508, limit: 20 }
          : { query: 'Initial', systemKey: 'nintendo_switch_2' },
    })
  })

  it('waits for a recognized system before searching a URL', async () => {
    params = new URLSearchParams('q=Initial&system=unknown')
    mount(provider)
    await screen.findByRole('button', { name: 'Search all platforms' })
    expect(requests).toHaveLength(0)
  })

  it('keeps a manual platform override through its URL update and allows repeat searches', async () => {
    const page = mount(provider)
    await screen.findByText('Initial result')
    fireEvent.click(screen.getByRole('button', { name: 'Search all platforms' }))
    await screen.findByText('Manual result')
    const manual = {
      path: `${provider}.searchGames`,
      input:
        provider === 'igdb'
          ? { query: 'Manual', platformId: null, limit: 20 }
          : { query: 'Manual', systemKey: 'nintendo_switch_2' },
    }
    expect(requests).toContainEqual(manual)
    params = new URLSearchParams('q=Manual&system=switch2')
    page.rerender()
    expect(screen.getByText('Manual result')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Search all platforms' }))
    await waitFor(() =>
      expect(
        requests.filter((request) => JSON.stringify(request) === JSON.stringify(manual)),
      ).toHaveLength(2),
    )
  })

  it('ignores late results after navigating to another query', async () => {
    let resolveOld: (name: string) => void = () => {}
    providerResult = (query) =>
      query === 'Initial'
        ? new Promise((resolve) => {
            resolveOld = resolve
          })
        : Promise.resolve(`${query} result`)
    const page = mount(provider)
    await waitFor(() => expect(requests).toHaveLength(1))
    params = new URLSearchParams('q=New&system=switch2')
    page.rerender()
    await screen.findByText('New result')
    await act(async () => resolveOld('Old result'))
    expect(screen.queryByText('Old result')).not.toBeInTheDocument()
    expect(screen.getByText('New result')).toBeInTheDocument()
  })

  it('reports provider errors and stops loading', async () => {
    providerResult = async () => {
      throw new Error('Provider unavailable')
    }
    mount(provider)
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Provider unavailable'))
    expect(screen.getByRole('button', { name: 'Search all platforms' })).toBeInTheDocument()
  })
})
