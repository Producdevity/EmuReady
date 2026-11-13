import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type RouterInput } from '@/types/trpc'
import BookmarkBrowser from './BookmarkBrowser'
import { useBookmarkBrowser } from '../hooks/useBookmarkBrowser'

const mocks = vi.hoisted(() => {
  const data = { visibility: 'visible', items: [], pagination: { page: 1, pages: 1, total: 0 } }
  return {
    handheld: vi.fn(
      (_input: RouterInput['bookmarks']['getListingBookmarks'], _options: unknown) => ({
        data,
        isPending: false,
      }),
    ),
    pc: vi.fn((_input: RouterInput['bookmarks']['getPcListingBookmarks'], _options: unknown) => ({
      data,
      isPending: false,
    })),
  }
})
const userId = '00000000-0000-4000-a000-000000000001'
const systemId = '00000000-0000-4000-a000-000000000002'
vi.mock('../hooks/useBulkBookmarkStatuses', () => ({
  useBulkBookmarkStatuses: () => ({ statuses: {}, isPending: false }),
}))
vi.mock('@/lib/api', () => ({
  api: {
    systems: { get: { useQuery: () => ({ data: [{ id: systemId, name: 'Nintendo Switch 2' }] }) } },
    emulators: { get: { useQuery: () => ({ data: { emulators: [{ id: userId, name: 'NX' }] } }) } },
    listings: { performanceScales: { useQuery: () => ({ data: [{ id: 1, label: 'Perfect' }] }) } },
    bookmarks: {
      getListingBookmarks: { useQuery: mocks.handheld },
      getPcListingBookmarks: { useQuery: mocks.pc },
    },
  },
}))

function Browser() {
  const browser = useBookmarkBrowser()
  return (
    <BookmarkBrowser userId={userId} ownProfile handheldCount={1} pcCount={1} browser={browser}>
      <span>
        {browser.variant === 'handheld' ? 'Handheld hardware filters' : 'PC hardware filters'}
      </span>
    </BookmarkBrowser>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('bookmark filter controls', () => {
  it('sends selected systems and ordering to the saved-report query', async () => {
    render(<Browser />)
    fireEvent.click(screen.getByRole('button', { name: 'Systems multi-select' }))
    fireEvent.click(screen.getByText('Nintendo Switch 2'))
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'title' } })
    fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'asc' } })
    expect(mocks.handheld).toHaveBeenLastCalledWith(
      expect.objectContaining({
        systemIds: [systemId],
        sortField: 'title',
        sortDirection: 'asc',
        page: 1,
      }),
      expect.anything(),
    )
    expect(screen.getByText('No matching bookmarks found')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(mocks.handheld).toHaveBeenLastCalledWith(
      expect.objectContaining({ systemIds: [], sortField: 'savedAt', sortDirection: 'desc' }),
      expect.anything(),
    )
  })

  it('switches hardware controls and active queries for PC bookmarks', () => {
    render(<Browser />)
    fireEvent.click(screen.getByRole('button', { name: /PC/ }))
    fireEvent.change(screen.getByLabelText('Minimum memory (GB)'), { target: { value: '16' } })
    expect(mocks.pc).toHaveBeenLastCalledWith(
      expect.objectContaining({ memoryMin: 16 }),
      expect.anything(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByLabelText('Minimum memory (GB)')).toHaveValue(null)
    expect(screen.getByText('PC hardware filters')).toBeInTheDocument()
    expect(mocks.pc).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId }),
      expect.objectContaining({ enabled: true }),
    )
    expect(mocks.handheld).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    )
  })

  it('debounces title searches and clears them with the other filters', async () => {
    render(<Browser />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search bookmarks' }), {
      target: { value: 'Mario' },
    })
    await waitFor(() =>
      expect(mocks.handheld).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Mario' }),
        expect.anything(),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() =>
      expect(mocks.handheld).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: undefined }),
        expect.anything(),
      ),
    )
  })
})
