import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type RouterInput } from '@/types/trpc'
import BookmarkBrowser from './BookmarkBrowser'
import { useBookmarkBrowser } from '../hooks/useBookmarkBrowser'
import type * as BulkBookmarkStatuses from '../hooks/useBulkBookmarkStatuses'

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
vi.mock('../hooks/useBulkBookmarkStatuses', async (importOriginal) => ({
  ...(await importOriginal<typeof BulkBookmarkStatuses>()),
  useBulkBookmarkStatuses: () => ({ statuses: {}, isPending: false, isError: false }),
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

it.each(['Minimum memory (GB)', 'Maximum memory (GB)'])(
  'retains invalid drafts without sending an invalid %s query',
  (label) => {
    render(<Browser />)
    fireEvent.click(screen.getByRole('button', { name: /PC/ }))
    const input = screen.getByLabelText(label)
    const field = label.startsWith('Minimum') ? 'memoryMin' : 'memoryMax'
    fireEvent.change(input, { target: { value: '16' } })
    for (const value of ['0', '-1', '1.5']) {
      fireEvent.change(input, { target: { value } })
      expect(input).toHaveValue(Number(value))
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAccessibleDescription('Enter a positive whole number.')
      expect(mocks.pc).toHaveBeenLastCalledWith(
        expect.objectContaining({ [field]: 16 }),
        expect.anything(),
      )
    }
    fireEvent.change(input, { target: { value: '32' } })
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
    expect(mocks.pc).toHaveBeenLastCalledWith(
      expect.objectContaining({ [field]: 32 }),
      expect.anything(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(input).toHaveValue(null)
    expect(mocks.pc).toHaveBeenLastCalledWith(
      expect.objectContaining({ [field]: null }),
      expect.anything(),
    )
  },
)

it('retains an inverted memory draft and the last valid query until the range is corrected', () => {
  render(<Browser />)
  fireEvent.click(screen.getByRole('button', { name: /PC/ }))
  const minimum = screen.getByLabelText('Minimum memory (GB)')
  const maximum = screen.getByLabelText('Maximum memory (GB)')
  fireEvent.change(minimum, { target: { value: '16' } })
  fireEvent.change(maximum, { target: { value: '32' } })
  fireEvent.change(minimum, { target: { value: '64' } })
  expect(minimum).toHaveValue(64)
  expect(maximum).toHaveAttribute('aria-invalid', 'true')
  expect(maximum).toHaveAccessibleDescription('Maximum memory must be at least minimum memory.')
  expect(mocks.pc).toHaveBeenLastCalledWith(
    expect.objectContaining({ memoryMin: 16, memoryMax: 32 }),
    expect.anything(),
  )
  fireEvent.change(maximum, { target: { value: '64' } })
  expect(maximum).not.toHaveAttribute('aria-invalid')
  expect(mocks.pc).toHaveBeenLastCalledWith(
    expect.objectContaining({ memoryMin: 64, memoryMax: 64 }),
    expect.anything(),
  )
})

it.each([
  {
    edited: 'Minimum memory (GB)',
    invalid: 'Maximum memory (GB)',
    expected: { memoryMin: null, memoryMax: 32 },
  },
  {
    edited: 'Maximum memory (GB)',
    invalid: 'Minimum memory (GB)',
    expected: { memoryMin: 16, memoryMax: null },
  },
])('applies a valid cleared $edited while the other draft is invalid', (testCase) => {
  render(<Browser />)
  fireEvent.click(screen.getByRole('button', { name: /PC/ }))
  fireEvent.change(screen.getByLabelText('Minimum memory (GB)'), { target: { value: '16' } })
  fireEvent.change(screen.getByLabelText('Maximum memory (GB)'), { target: { value: '32' } })
  fireEvent.change(screen.getByLabelText(testCase.invalid), { target: { value: '1.5' } })
  fireEvent.change(screen.getByLabelText(testCase.edited), { target: { value: '' } })
  expect(screen.getByLabelText(testCase.edited)).toHaveValue(null)
  expect(screen.getByLabelText(testCase.invalid)).toHaveAttribute('aria-invalid', 'true')
  expect(mocks.pc).toHaveBeenLastCalledWith(
    expect.objectContaining(testCase.expected),
    expect.anything(),
  )
})

it('validates an edited bound against the last applied range while the other draft is invalid', () => {
  render(<Browser />)
  fireEvent.click(screen.getByRole('button', { name: /PC/ }))
  fireEvent.change(screen.getByLabelText('Minimum memory (GB)'), { target: { value: '16' } })
  fireEvent.change(screen.getByLabelText('Maximum memory (GB)'), { target: { value: '32' } })
  fireEvent.change(screen.getByLabelText('Maximum memory (GB)'), { target: { value: '1.5' } })
  fireEvent.change(screen.getByLabelText('Minimum memory (GB)'), { target: { value: '64' } })
  expect(mocks.pc).toHaveBeenLastCalledWith(
    expect.objectContaining({ memoryMin: 16, memoryMax: 32 }),
    expect.anything(),
  )
  fireEvent.change(screen.getByLabelText('Minimum memory (GB)'), { target: { value: '8' } })
  expect(mocks.pc).toHaveBeenLastCalledWith(
    expect.objectContaining({ memoryMin: 8, memoryMax: 32 }),
    expect.anything(),
  )
})
