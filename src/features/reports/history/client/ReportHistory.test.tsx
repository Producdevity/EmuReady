import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRPCClientError, type TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/lib/api'
import { type AppRouter, type RouterInput, type RouterOutput } from '@/types/trpc'
import { ApprovalStatus } from '@orm'
import { ReportHistory } from './ReportHistory'
import { GetReportHistorySchema } from '../shared/history.schemas'

const requests: RouterInput['reportHistory']['get'][] = []
let failQuery = false
let emptyResult = false

function wrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const link: TRPCLink<AppRouter> =
    () =>
    ({ op }) =>
      observable((observer) => {
        const input = GetReportHistorySchema.parse(op.input)
        requests.push(input)
        let active = true
        queueMicrotask(() => {
          if (!active) return
          if (failQuery) {
            observer.error(TRPCClientError.from<AppRouter>(new Error('Temporarily unavailable')))
            return
          }
          const result: RouterOutput['reportHistory']['get'] = {
            items: emptyResult
              ? []
              : Object.values(ApprovalStatus).map((status, index) => ({
                  id: `00000000-0000-4000-a000-00000000000${index}`,
                  status,
                  title: `${input.kind === 'pc' ? 'PC' : 'Handheld'} game ${index + 1}`,
                  systemName: 'Nintendo Switch 2',
                  emulatorName: 'NX',
                  hardwareLabel: input.kind === 'pc' ? 'AMD Ryzen 7 · 32 GB RAM' : 'AYN Odin 2',
                  createdAt: new Date('2026-11-01T12:00:00.000Z'),
                })),
            pagination: {
              total: emptyResult ? 0 : 21,
              page: input.page,
              pages: emptyResult ? 0 : 2,
              limit: input.limit,
              offset: (input.page - 1) * input.limit,
              hasPreviousPage: input.page > 1,
              hasNextPage: !emptyResult && input.page < 2,
            },
          }
          observer.next({ result: { data: result } })
          observer.complete()
        })
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
  requests.length = 0
  failQuery = false
  emptyResult = false
})

describe('private report history', () => {
  it('shows approval labels for past submissions without edit actions', async () => {
    render(<ReportHistory />, { wrapper: wrapper() })
    await screen.findByText('Handheld game 1')
    expect(screen.getAllByText('Approved').some((element) => element.tagName !== 'OPTION')).toBe(
      true,
    )
    expect(screen.getAllByText('Pending').some((element) => element.tagName !== 'OPTION')).toBe(
      true,
    )
    expect(screen.getAllByText('Rejected').some((element) => element.tagName !== 'OPTION')).toBe(
      true,
    )
    expect(screen.getAllByText('AYN Odin 2')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /edit|delete/i })).not.toBeInTheDocument()
    expect(requests.at(-1)).toMatchObject({ kind: 'handheld', page: 1 })
    expect(requests.at(-1)).not.toHaveProperty('userId')
  })

  it('resets pagination when switching report type or approval status', async () => {
    render(<ReportHistory />, { wrapper: wrapper() })
    await screen.findByText('Handheld game 1')
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0])
    await waitFor(() => expect(requests.at(-1)?.page).toBe(2))
    fireEvent.click(screen.getByRole('tab', { name: 'PC Reports' }))
    await screen.findByText('PC game 1')
    expect(requests.at(-1)).toMatchObject({ kind: 'pc', page: 1 })
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0])
    await waitFor(() => expect(requests.at(-1)?.page).toBe(2))
    fireEvent.change(screen.getByLabelText('Approval status'), {
      target: { value: ApprovalStatus.REJECTED },
    })
    await waitFor(() =>
      expect(requests.at(-1)).toMatchObject({
        kind: 'pc',
        status: ApprovalStatus.REJECTED,
        page: 1,
      }),
    )
  })

  it('debounces title searches and keeps filtered results on the first page', async () => {
    render(<ReportHistory />, { wrapper: wrapper() })
    await screen.findByText('Handheld game 1')
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0])
    await waitFor(() => expect(requests.at(-1)?.page).toBe(2))
    fireEvent.change(screen.getByLabelText('Search your reports by game title'), {
      target: { value: 'Mario' },
    })
    expect(screen.queryByRole('button', { name: 'Go to next page' })).not.toBeInTheDocument()
    await waitFor(() => expect(requests.at(-1)).toMatchObject({ search: 'Mario', page: 1 }))
  })

  it('shows an empty archive without a loading or error state', async () => {
    emptyResult = true
    render(<ReportHistory />, { wrapper: wrapper() })
    await screen.findByText('No reports match these filters.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading your reports…')).not.toBeInTheDocument()
  })

  it('retries a failed history request', async () => {
    failQuery = true
    render(<ReportHistory />, { wrapper: wrapper() })
    await screen.findByRole('alert')
    expect(screen.queryByText('No reports match these filters.')).not.toBeInTheDocument()
    failQuery = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText('Handheld game 1')
  })
})
