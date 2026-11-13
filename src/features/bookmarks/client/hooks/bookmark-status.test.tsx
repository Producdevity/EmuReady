import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { TRPCClientError, type TRPCLink } from '@trpc/client'
import { getQueryKey } from '@trpc/react-query'
import { observable } from '@trpc/server/observable'
import { type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { type AppRouter } from '@/types/trpc'
import { useBookmarkToggle } from './useBookmarkToggle'
import { useBulkBookmarkStatuses, getBookmarkStatus } from './useBulkBookmarkStatuses'

let signedIn = true
let saved = true
let rejectMutation = false
let rejectStatus = false
let statusGate: Promise<void> | null = null
const operations: { path: string; input: unknown }[] = []
const toast = vi.hoisted(() => ({ error: vi.fn() }))
vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: signedIn ? { id: 'viewer' } : null }) }))
vi.mock('@/lib/toast', () => ({ default: toast }))
const reportId = '00000000-0000-4000-a000-000000000001'

function wrapper(
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  }),
) {
  const link: TRPCLink<AppRouter> =
    () =>
    ({ op }) =>
      observable((observer) => {
        operations.push({ path: op.path, input: op.input })
        let active = true
        async function respond() {
          if (op.type === 'mutation') {
            if (rejectMutation) throw new Error('Bookmark unavailable')
            saved = !op.path.endsWith('Unbookmark') && !op.path.endsWith('.unbookmark')
            return { success: true }
          }
          if (statusGate) await statusGate
          if (rejectStatus) throw new Error('Bookmark status unavailable')
          if (op.path.includes('getBulk')) return { statuses: { [reportId]: saved } }
          return { isBookmarked: saved }
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
  return function Wrapper(props: PropsWithChildren) {
    return (
      <api.Provider client={client} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
      </api.Provider>
    )
  }
}

beforeEach(() => {
  signedIn = true
  saved = true
  rejectMutation = false
  rejectStatus = false
  statusGate = null
  operations.length = 0
  vi.clearAllMocks()
})

describe.each(['listing', 'pcListing'] as const)('%s bookmark status', (type) => {
  function useControlledBookmark() {
    const bulk = useBulkBookmarkStatuses(type, [reportId])
    return useBookmarkToggle(
      type === 'listing' ? { type, listingId: reportId } : { type, pcListingId: reportId },
      getBookmarkStatus(bulk, reportId),
    )
  }

  it('blocks toggles when the batch status read fails', async () => {
    rejectStatus = true
    const { result } = renderHook(useControlledBookmark, { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isStatusError).toBe(true))
    act(() => result.current.handleToggle())
    expect(operations).toHaveLength(1)
    expect(saved).toBe(true)
  })

  it('blocks toggles when an individual status read fails', async () => {
    rejectStatus = true
    const { result } = renderHook(
      () =>
        useBookmarkToggle(
          type === 'listing' ? { type, listingId: reportId } : { type, pcListingId: reportId },
        ),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.isStatusError).toBe(true))
    act(() => result.current.handleToggle())
    expect(operations).toHaveLength(1)
    expect(saved).toBe(true)
  })

  it('blocks toggles while cached batch statuses are being refreshed', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(useControlledBookmark, { wrapper: wrapper(queryClient) })
    await waitFor(() => expect(result.current.isStatusPending).toBe(false))
    const gate = Promise.withResolvers<void>()
    statusGate = gate.promise
    try {
      act(() => {
        void queryClient.invalidateQueries({
          queryKey: getQueryKey(
            type === 'listing'
              ? api.bookmarks.getBulkListingBookmarkStatuses
              : api.bookmarks.getBulkPcListingBookmarkStatuses,
          ),
        })
      })
      await waitFor(() => expect(result.current.isStatusPending).toBe(true))
      expect(result.current.isBookmarked).toBe(true)
      act(() => result.current.handleToggle())
      expect(operations).toHaveLength(2)
    } finally {
      gate.resolve()
    }
    await waitFor(() => expect(result.current.isStatusPending).toBe(false))
  })

  it('uses batch status and refreshes it after toggling without per-report reads', async () => {
    const { result } = renderHook(useControlledBookmark, { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isStatusPending).toBe(false))
    expect(result.current.isBookmarked).toBe(true)
    act(() => result.current.handleToggle())
    await waitFor(() => expect(saved).toBe(false))
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isBookmarked).toBe(false)
    expect(operations.filter((op) => op.path.includes('getBulk'))).toHaveLength(2)
    expect(
      operations.some(
        (op) => op.path.endsWith('.isBookmarked') || op.path.endsWith('.isPcBookmarked'),
      ),
    ).toBe(false)
  })

  it('rolls back the optimistic state when the write fails', async () => {
    rejectMutation = true
    const { result } = renderHook(useControlledBookmark, { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isBookmarked).toBe(true))
    act(() => result.current.handleToggle())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Bookmark unavailable'))
    expect(result.current.isBookmarked).toBe(true)
    expect(saved).toBe(true)
  })

  it('bookmarks a report that is not already saved', async () => {
    saved = false
    const { result } = renderHook(useControlledBookmark, { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isStatusPending).toBe(false))
    act(() => result.current.handleToggle())
    await waitFor(() => expect(saved).toBe(true))
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isBookmarked).toBe(true)
  })
})

describe('bookmark status batching', () => {
  it('splits larger sets into API-sized batches', async () => {
    const ids = Array.from(
      { length: 51 },
      (_, index) => `00000000-0000-4000-a000-${String(index).padStart(12, '0')}`,
    )
    const { result } = renderHook(() => useBulkBookmarkStatuses('listing', ids), {
      wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(operations).toHaveLength(2)
    expect(operations.map((op) => op.input)).toEqual([
      { listingIds: ids.slice(0, 50) },
      { listingIds: ids.slice(50) },
    ])
  })

  it('does not request personal bookmark statuses for signed-out visitors', async () => {
    signedIn = false
    renderHook(() => useBulkBookmarkStatuses('listing', [reportId]), { wrapper: wrapper() })
    await act(async () => {})
    expect(operations).toHaveLength(0)
  })
})
