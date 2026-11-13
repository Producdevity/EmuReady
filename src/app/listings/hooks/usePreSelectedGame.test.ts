import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalStatus } from '@orm'
import { usePreSelectedGame } from './usePreSelectedGame'
import { type GameOption } from '../components/shared'

let queryGame: GameOption | undefined
vi.mock('@/lib/api', () => ({
  api: { games: { byId: { useQuery: () => ({ data: queryGame }) } } },
}))

function game(id: string, title: string): GameOption {
  return { id, title, status: ApprovalStatus.APPROVED, system: { id: 'system-1', name: 'System' } }
}
function useReportForm(gameIdFromUrl: string | null) {
  const form = useForm({ defaultValues: { gameId: '' } })
  const [selected, setSelected] = useState<GameOption | null>(null)
  const [search, setSearch] = useState('')
  function select(option: GameOption) {
    form.setValue('gameId', option.id)
    setSelected(option)
  }
  const state = usePreSelectedGame({
    gameIdFromUrl,
    onGameSelect: select,
    onSearchTermChange: setSearch,
  })
  return { ...state, form, selected, search, select, setSearch }
}

beforeEach(() => {
  queryGame = undefined
})

describe('URL game preselection', () => {
  it('initializes the real report form and its game metadata after the game loads', () => {
    const { result, rerender } = renderHook(() => useReportForm('game-1'))
    expect(result.current.isInitialGameLoaded).toBe(false)
    queryGame = game('game-1', 'First game')
    rerender()
    expect(result.current.form.getValues('gameId')).toBe('game-1')
    expect(result.current.selected?.title).toBe('First game')
    expect(result.current.search).toBe('First game')
    expect(result.current.isInitialGameLoaded).toBe(true)
  })

  it('does not overwrite manual game selection on a refetch', () => {
    queryGame = game('game-1', 'First game')
    const { result, rerender } = renderHook(() => useReportForm('game-1'))
    act(() => {
      result.current.select(game('manual-game', 'Manual selection'))
      result.current.setSearch('Manual selection')
    })
    queryGame = game('game-1', 'Refreshed first game')
    rerender()
    expect(result.current.form.getValues('gameId')).toBe('manual-game')
    expect(result.current.selected?.title).toBe('Manual selection')
    expect(result.current.search).toBe('Manual selection')
  })

  it('waits for the new URL target instead of applying stale query data', () => {
    queryGame = game('game-1', 'First game')
    const { result, rerender } = renderHook(({ id }) => useReportForm(id), {
      initialProps: { id: 'game-1' },
    })
    rerender({ id: 'game-2' })
    expect(result.current.isInitialGameLoaded).toBe(false)
    expect(result.current.form.getValues('gameId')).toBe('game-1')
    queryGame = game('game-2', 'Second game')
    rerender({ id: 'game-2' })
    expect(result.current.form.getValues('gameId')).toBe('game-2')
    expect(result.current.selected?.title).toBe('Second game')
  })

  it('reapplies a returned URL target even if the intermediate target never loaded', () => {
    queryGame = game('game-1', 'First game')
    const { result, rerender } = renderHook(({ id }) => useReportForm(id), {
      initialProps: { id: 'game-1' },
    })
    rerender({ id: 'game-2' })
    act(() => result.current.select(game('manual', 'Manual selection')))
    rerender({ id: 'game-1' })
    expect(result.current.form.getValues('gameId')).toBe('game-1')
  })

  it('ignores cached game data when no URL target is selected', () => {
    queryGame = game('game-1', 'Cached game')
    const { result } = renderHook(() => useReportForm(null))
    expect(result.current.isInitialGameLoaded).toBe(false)
    expect(result.current.form.getValues('gameId')).toBe('')
  })
})
