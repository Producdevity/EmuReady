import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type RouterOutput } from '@/types/trpc'
import { IGDBImageSelector } from './IGDBImageSelector'
import { RawgImageSelector } from './RawgImageSelector'
import { TGDBImageSelector } from './TGDBImageSelector'

const queries = vi.hoisted(() => {
  function query<T>() {
    const state: { data: T | undefined } = { data: undefined }
    return {
      ...state,
      error: null,
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    }
  }
  return {
    rawg: query<RouterOutput['rawg']['searchGameImages']>(),
    tgdb: query<RouterOutput['tgdb']['searchGameImages']>(),
    igdb: query<RouterOutput['igdb']['getGameImages']>(),
    gameImages: vi.fn(),
  }
})

vi.mock('@/hooks/useDebouncedValue', () => ({ default: (value: string) => value }))
vi.mock('@/lib/api', () => ({
  api: {
    rawg: { searchGameImages: { useQuery: () => queries.rawg } },
    tgdb: { searchGameImages: { useQuery: () => queries.tgdb } },
    igdb: {
      searchGames: { useQuery: () => ({ data: { games: [] }, isLoading: false }) },
      getGameImages: {
        useQuery: (input: unknown) => {
          queries.gameImages(input)
          return queries.igdb
        },
      },
    },
  },
}))

describe('provider image selector state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queries.rawg.data = undefined
    queries.tgdb.data = undefined
    queries.igdb.data = undefined
  })

  it.each([
    { name: 'RAWG', Component: RawgImageSelector },
    { name: 'TheGamesDB', Component: TGDBImageSelector },
    { name: 'IGDB', Component: IGDBImageSelector },
  ])(
    'updates a pristine $name search while preserving a manually edited query',
    ({ Component }) => {
      const onImageSelect = vi.fn()
      const view = render(<Component gameTitle="First game" onImageSelect={onImageSelect} />)
      view.rerender(<Component gameTitle="Second game" onImageSelect={onImageSelect} />)
      expect(screen.getByDisplayValue('Second game')).toBeInTheDocument()
      fireEvent.change(screen.getByDisplayValue('Second game'), {
        target: { value: 'Manual search' },
      })
      view.rerender(<Component gameTitle="Third game" onImageSelect={onImageSelect} />)
      expect(screen.getByDisplayValue('Manual search')).toBeInTheDocument()
    },
  )

  it('deduplicates TheGamesDB URLs and derives the boxart filter from current results', () => {
    const cover = {
      id: 'cover',
      url: 'https://example.com/cover.webp',
      type: 'boxart',
      source: 'tgdb',
      gameId: 1,
      gameName: 'Game',
    } satisfies RouterOutput['tgdb']['searchGameImages'][string][number]
    queries.tgdb.data = {
      '1': [
        cover,
        { ...cover, id: 'duplicate' },
        {
          ...cover,
          id: 'screenshot',
          url: 'https://example.com/screenshot.webp',
          type: 'screenshot',
        },
      ],
    }
    render(<TGDBImageSelector gameTitle="Game" onImageSelect={vi.fn()} />)
    expect(screen.getByText('Found 1 image')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: /all image types/i }))
    expect(screen.getByText('Found 2 images')).toBeInTheDocument()
  })

  it('allows returning to IGDB search when an initial game ID is supplied', () => {
    queries.igdb.data = [
      {
        url: 'https://example.com/cover.webp',
        type: 'cover',
        label: 'Cover',
        width: 300,
        height: 400,
      },
    ]
    const view = render(
      <IGDBImageSelector gameTitle="Game" igdbGameId={1} onImageSelect={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /back to search/i }))
    expect(screen.queryByText('Available Images (1)')).not.toBeInTheDocument()
    expect(queries.gameImages).toHaveBeenLastCalledWith({ gameId: null })

    view.rerender(
      <IGDBImageSelector gameTitle="Another game" igdbGameId={2} onImageSelect={vi.fn()} />,
    )
    expect(queries.gameImages).toHaveBeenLastCalledWith({ gameId: 2 })
    expect(screen.getByText('Available Images (1)')).toBeInTheDocument()
  })
})
