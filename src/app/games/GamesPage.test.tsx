import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GamesPage from './GamesPage'
import type GameFilters from './components/GameFilters'
import type { ComponentProps } from 'react'

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams('search=Zelda'),
  replace: vi.fn(),
  push: vi.fn(),
  queryGames: vi.fn(),
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
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith('/games?search=Mario&systemId=switch')
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
})
