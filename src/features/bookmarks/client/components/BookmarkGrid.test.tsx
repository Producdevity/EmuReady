import { render, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { type RouterOutput } from '@/types/trpc'
import BookmarkGrid from './BookmarkGrid'
import { BookmarkFiltersSchema } from '../../shared/bookmark-filters.schemas'
import type * as BulkBookmarkStatuses from '../hooks/useBulkBookmarkStatuses'

const mocks = vi.hoisted(() => ({ query: vi.fn(), fetching: false, placeholder: false }))
vi.mock('@/lib/api', () => ({
  api: {
    bookmarks: {
      getListingBookmarks: { useQuery: mocks.query },
      getPcListingBookmarks: { useQuery: mocks.query },
    },
  },
}))
vi.mock('../hooks/useBulkBookmarkStatuses', async (importOriginal) => ({
  ...(await importOriginal<typeof BulkBookmarkStatuses>()),
  useBulkBookmarkStatuses: () => ({ statuses: {}, isPending: false, isError: false }),
}))

const response = {
  visibility: 'visible',
  items: [],
  pagination: {
    total: 1,
    page: 2,
    limit: 1,
    pages: 1,
    offset: 1,
    hasNextPage: false,
    hasPreviousPage: true,
  },
} satisfies RouterOutput['bookmarks']['getListingBookmarks']

beforeEach(() => {
  mocks.fetching = false
  mocks.placeholder = false
  mocks.query.mockReset().mockImplementation(() => ({
    data: response,
    isPending: false,
    isError: false,
    isFetching: mocks.fetching,
    isPlaceholderData: mocks.placeholder,
  }))
})

it.each(['handheld', 'pc'] as const)(
  'returns an empty %s page to the last remaining page',
  async (variant) => {
    const onPageChange = vi.fn()
    render(
      <BookmarkGrid
        variant={variant}
        userId="00000000-0000-4000-a000-000000000001"
        page={2}
        limit={1}
        search=""
        filters={BookmarkFiltersSchema.parse({})}
        hasFilters={false}
        onPageChange={onPageChange}
        emptyContent={null}
      />,
    )
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(1))
  },
)

it('waits for the current page result before correcting pagination', async () => {
  mocks.placeholder = true
  const onPageChange = vi.fn()
  const props = {
    variant: 'handheld' as const,
    userId: '00000000-0000-4000-a000-000000000001',
    page: 2,
    limit: 1,
    search: '',
    filters: BookmarkFiltersSchema.parse({}),
    hasFilters: false,
    onPageChange,
    emptyContent: null,
  }
  const view = render(<BookmarkGrid {...props} />)
  expect(onPageChange).not.toHaveBeenCalled()
  mocks.placeholder = false
  view.rerender(<BookmarkGrid {...props} />)
  await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(1))
})
