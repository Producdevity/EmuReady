import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GetGamesSchema } from '@/schemas/game'
import GamesPage from './GamesPage'
import type GameFilters from './components/GameFilters'
import type { RouterInput } from '@/types/trpc'
import type { ComponentProps } from 'react'

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams('search=Zelda'),
  replace: vi.fn(),
  push: vi.fn(),
  queryGames: vi.fn<(input: RouterInput['games']['get']) => unknown>(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.params,
  usePathname: () => '/games',
  useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}))
vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: null }) }))
vi.mock('@/lib/api', () => ({
  api: {
    users: { me: { useQuery: () => ({ data: null }) } },
    systems: { get: { useQuery: () => ({ data: [] }) } },
    games: { get: { useQuery: mocks.queryGames } },
  },
}))
vi.mock('./components/GameFilters', () => ({
  default: function GameFiltersInput(props: ComponentProps<typeof GameFilters>) {
    return <input aria-label="Game search" value={props.search} onChange={props.onSearchChange} />
  },
}))

describe('games library search navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mocks.params = new URLSearchParams('search=Zelda')
    mocks.queryGames.mockReturnValue({ data: { games: [] }, isPending: false })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    { raw: '2.7', page: 2 },
    { raw: '-1', page: 1 },
    { raw: 'invalid', page: 1 },
    { raw: String(Number.MAX_SAFE_INTEGER), page: 1 },
    { raw: String(Number.MAX_SAFE_INTEGER + 1), page: 1 },
    {
      raw: String(Math.floor(Number.MAX_SAFE_INTEGER / 12) + 1),
      page: Math.floor(Number.MAX_SAFE_INTEGER / 12) + 1,
    },
    { raw: String(Math.floor(Number.MAX_SAFE_INTEGER / 12) + 2), page: 1 },
  ])('normalizes the URL page $raw before querying', (testCase) => {
    mocks.params = new URLSearchParams({ page: testCase.raw })
    render(<GamesPage />)
    expect(mocks.queryGames).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: testCase.page, limit: 12 }),
    )
    expect(GetGamesSchema.safeParse(mocks.queryGames.mock.lastCall?.[0]).success).toBe(true)
  })

  it('uses the newly navigated search without writing the previous search back to the URL', () => {
    const view = render(<GamesPage />)
    expect(screen.getByLabelText('Game search')).toHaveValue('Zelda')

    mocks.params = new URLSearchParams('search=Dark+Souls')
    view.rerender(<GamesPage />)
    act(() => vi.advanceTimersByTime(600))

    expect(screen.getByLabelText('Game search')).toHaveValue('Dark Souls')
    expect(mocks.queryGames).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Dark Souls' }),
    )
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it('debounces local typing, preserves system filters, and resets pagination', () => {
    mocks.params = new URLSearchParams('search=Zelda&systemId=switch&page=3')
    render(<GamesPage />)
    fireEvent.change(screen.getByLabelText('Game search'), { target: { value: 'Mario' } })
    act(() => vi.advanceTimersByTime(499))

    expect(screen.getByLabelText('Game search')).toHaveValue('Mario')
    expect(mocks.replace).not.toHaveBeenCalled()
    expect(mocks.queryGames).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Zelda', systemId: 'switch', page: 3 }),
    )

    act(() => vi.advanceTimersByTime(1))
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith('/games?search=Mario&systemId=switch', {
      scroll: false,
    })
  })

  it('updates both input and query after navigating back to an earlier search', () => {
    const view = render(<GamesPage />)
    mocks.params = new URLSearchParams('search=Dark+Souls')
    view.rerender(<GamesPage />)
    mocks.params = new URLSearchParams('search=Zelda')
    view.rerender(<GamesPage />)

    expect(screen.getByLabelText('Game search')).toHaveValue('Zelda')
    expect(mocks.queryGames).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Zelda' }))
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it('keeps filters changed while a search is pending', () => {
    const view = render(<GamesPage />)
    fireEvent.change(screen.getByLabelText('Game search'), { target: { value: 'Mario' } })
    mocks.params = new URLSearchParams('search=Zelda&systemId=switch')
    view.rerender(<GamesPage />)

    act(() => vi.advanceTimersByTime(500))

    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith('/games?search=Mario&systemId=switch', {
      scroll: false,
    })
  })

  it('cancels pending typing when another search is navigated to', () => {
    const view = render(<GamesPage />)
    fireEvent.change(screen.getByLabelText('Game search'), { target: { value: 'Mario' } })
    mocks.params = new URLSearchParams('search=Dark+Souls')
    view.rerender(<GamesPage />)
    act(() => vi.advanceTimersByTime(500))

    expect(screen.getByLabelText('Game search')).toHaveValue('Dark Souls')
    expect(mocks.replace).not.toHaveBeenCalled()

    mocks.params = new URLSearchParams('search=Zelda')
    view.rerender(<GamesPage />)
    expect(screen.getByLabelText('Game search')).toHaveValue('Zelda')
  })

  it.each([
    ['   ', '/games?systemId=switch'],
    ['  Mario  ', '/games?search=Mario&systemId=switch'],
  ])('normalizes the search URL for %j', (value, expectedUrl) => {
    mocks.params = new URLSearchParams('search=Zelda&systemId=switch&page=3')
    render(<GamesPage />)
    fireEvent.change(screen.getByLabelText('Game search'), { target: { value } })
    act(() => vi.advanceTimersByTime(500))

    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith(expectedUrl, { scroll: false })
  })

  it('cancels the pending URL update when the page unmounts', () => {
    const view = render(<GamesPage />)
    fireEvent.change(screen.getByLabelText('Game search'), { target: { value: 'Mario' } })

    view.unmount()
    act(() => vi.advanceTimersByTime(500))

    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it('preserves a typed space when its normalized search returns from navigation', () => {
    const view = render(<GamesPage />)
    fireEvent.change(screen.getByLabelText('Game search'), { target: { value: 'Dark ' } })
    act(() => vi.advanceTimersByTime(500))
    mocks.params = new URLSearchParams('search=Dark')
    view.rerender(<GamesPage />)

    expect(screen.getByLabelText('Game search')).toHaveValue('Dark ')

    fireEvent.change(screen.getByLabelText('Game search'), { target: { value: 'Dark Souls' } })
    act(() => vi.advanceTimersByTime(500))
    expect(mocks.replace).toHaveBeenLastCalledWith('/games?search=Dark+Souls', { scroll: false })
  })
})
