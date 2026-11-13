import { keepPreviousData, QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import { ApprovalStatus } from '@orm'
import BookmarkGrid from './BookmarkGrid'
import { BookmarkFiltersSchema } from '../../shared/bookmark-filters.schemas'
import type * as BulkBookmarkStatuses from '../hooks/useBulkBookmarkStatuses'

const mocks = vi.hoisted(() => ({
  handheld: vi.fn(),
  pc: vi.fn(),
  fetching: false,
  placeholder: false,
}))
vi.mock('@/lib/api', () => ({
  api: {
    bookmarks: {
      getListingBookmarks: { useQuery: mocks.handheld },
      getPcListingBookmarks: { useQuery: mocks.pc },
    },
  },
}))
vi.mock('../hooks/useBulkBookmarkStatuses', async (importOriginal) => ({
  ...(await importOriginal<typeof BulkBookmarkStatuses>()),
  useBulkBookmarkStatuses: () => ({ statuses: {}, isPending: false, isError: false }),
}))

vi.mock('./BookmarkButton', () => ({ default: () => null }))

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

const pcResponse = {
  ...response,
  pagination: { ...response.pagination, total: 2, pages: 2, page: 3, offset: 2 },
} satisfies RouterOutput['bookmarks']['getPcListingBookmarks']

function queryResult(data: typeof response | typeof pcResponse) {
  return {
    data,
    isPending: false,
    isError: false,
    isFetching: mocks.fetching,
    isPlaceholderData: mocks.placeholder,
  }
}

beforeEach(() => {
  mocks.fetching = false
  mocks.placeholder = false
  mocks.handheld.mockReset().mockImplementation(() => queryResult(response))
  mocks.pc.mockReset().mockImplementation(() => queryResult(pcResponse))
})

it.each([
  { variant: 'handheld', page: 2, lastPage: 1 },
  { variant: 'pc', page: 3, lastPage: 2 },
] as const)(
  'returns an empty $variant page to the last remaining page',
  async ({ variant, page, lastPage }) => {
    const onPageChange = vi.fn()
    render(
      <BookmarkGrid
        variant={variant}
        userId="00000000-0000-4000-a000-000000000001"
        page={page}
        limit={1}
        search=""
        filters={BookmarkFiltersSchema.parse({})}
        hasFilters={false}
        onPageChange={onPageChange}
        emptyContent={null}
      />,
    )
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(lastPage))
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

function pcBookmarkResponse() {
  const id = '00000000-0000-4000-a000-000000000002'
  return {
    ...pcResponse,
    pagination: { ...response.pagination, page: 1, pages: 1, offset: 0 },
    items: [
      {
        id,
        createdAt: new Date(),
        pcListing: {
          id,
          createdAt: new Date(),
          status: ApprovalStatus.APPROVED,
          successRate: 0,
          _count: { votes: 0, comments: 0 },
          author: { id, name: 'PC tester', profileImage: null },
          game: {
            id,
            title: 'PC bookmark game',
            system: { id, name: 'Nintendo Switch 2', key: 'nintendo_switch_2' },
          },
          emulator: { id, name: 'NX', logo: null },
          performance: { id: 1, rank: 1, label: 'Perfect', description: null },
          cpu: { id, modelName: 'PC CPU', brand: { id, name: 'CPU brand' } },
          gpu: null,
        },
      },
    ],
  } satisfies RouterOutput['bookmarks']['getPcListingBookmarks']
}

it('renders PC bookmarks from the PC endpoint and report shape', () => {
  const id = '00000000-0000-4000-a000-000000000002'
  const data = pcBookmarkResponse()
  mocks.pc.mockReturnValue({ ...queryResult(pcResponse), data })
  render(
    <BookmarkGrid
      variant="pc"
      userId={id}
      page={1}
      limit={1}
      search=""
      filters={BookmarkFiltersSchema.parse({})}
      hasFilters={false}
      onPageChange={vi.fn()}
      emptyContent={null}
    />,
  )
  expect(screen.getByRole('link', { name: /PC bookmark game/ })).toHaveAttribute(
    'href',
    `/pc-listings/${id}`,
  )
  expect(mocks.pc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ enabled: true }),
  )
  expect(mocks.handheld).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ enabled: false }),
  )
})

it.each([2, 3])(
  'keeps current navigation after a real page-query error from page %s',
  async (requestedPage) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    const data = pcBookmarkResponse()
    const fetchPage = vi.fn(async (page: number | undefined) => {
      if (page === 2) throw new Error('Page unavailable')
      if (page === 3)
        return {
          ...data,
          items: [],
          pagination: { ...data.pagination, page: 3, total: 2, pages: 2 },
        }
      return { ...data, pagination: { ...data.pagination, total: 3, pages: 3 } }
    })
    mocks.pc.mockImplementation(function usePcQuery(
      input: RouterInput['bookmarks']['getPcListingBookmarks'],
    ) {
      return useQuery({
        queryKey: ['pc-bookmarks', input],
        queryFn: () => fetchPage(input.page),
        placeholderData: keepPreviousData,
      })
    })
    function Grid() {
      const [page, setPage] = useState(1)
      return (
        <BookmarkGrid
          variant="pc"
          userId="00000000-0000-4000-a000-000000000001"
          page={page}
          limit={1}
          search=""
          filters={BookmarkFiltersSchema.parse({})}
          hasFilters={false}
          onPageChange={setPage}
          emptyContent={null}
        />
      )
    }
    const view = render(
      <QueryClientProvider client={client}>
        <Grid />
      </QueryClientProvider>,
    )
    try {
      expect(await screen.findByRole('link', { name: /PC bookmark game/ })).toBeInTheDocument()
      fireEvent.click(screen.getAllByRole('button', { name: `Go to page ${requestedPage}` })[0])
      expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /PC bookmark game/ })).not.toBeInTheDocument()
      if (requestedPage === 3)
        expect(screen.queryByRole('button', { name: 'Go to page 3' })).not.toBeInTheDocument()
      fireEvent.click(screen.getAllByRole('button', { name: 'Go to previous page' })[0])
      expect(await screen.findByRole('link', { name: /PC bookmark game/ })).toBeInTheDocument()
      expect(fetchPage).toHaveBeenCalledWith(2)
    } finally {
      view.unmount()
      client.clear()
    }
  },
)

it.each(['owner', 'variant', 'search', 'filters', 'limit', 'hidden'] as const)(
  'does not reuse pagination metadata after %s changes',
  (change) => {
    const data = pcBookmarkResponse()
    data.pagination.pages = 3
    data.pagination.total = 3
    mocks.pc.mockReturnValue({ ...queryResult(pcResponse), data })
    const props = {
      variant: 'pc' as const,
      userId: '00000000-0000-4000-a000-000000000001',
      page: 1,
      limit: 1,
      search: '',
      filters: BookmarkFiltersSchema.parse({}),
      hasFilters: false,
      onPageChange: vi.fn(),
      emptyContent: null,
    }
    const view = render(<BookmarkGrid {...props} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to page 2' })[0])
    const error = {
      data: undefined,
      isPending: false,
      isError: true,
      isFetching: false,
      isPlaceholderData: false,
      error: new Error('Page unavailable'),
      refetch: vi.fn(),
    }
    mocks.pc.mockReturnValue(error)
    mocks.handheld.mockReturnValue(error)
    view.rerender(<BookmarkGrid {...props} page={2} />)
    expect(screen.getByRole('navigation', { name: 'Pagination navigation' })).toBeInTheDocument()
    const changes = {
      owner: { userId: '00000000-0000-4000-a000-000000000002' },
      variant: { variant: 'handheld' as const },
      search: { search: 'Another game' },
      filters: { filters: BookmarkFiltersSchema.parse({ memoryMin: 16 }) },
      limit: { limit: 20 },
      hidden: {},
    }
    if (change === 'hidden') mocks.pc.mockReturnValue({ ...error, data: { visibility: 'hidden' } })
    view.rerender(<BookmarkGrid {...props} page={2} {...changes[change]} />)
    expect(
      screen.queryByRole('navigation', { name: 'Pagination navigation' }),
    ).not.toBeInTheDocument()
  },
)
