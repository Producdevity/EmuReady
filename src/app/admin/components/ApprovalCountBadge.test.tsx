import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from '@/lib/api'
import { PERMISSIONS } from '@/utils/permission-system'
import ApprovalCountBadge from './ApprovalCountBadge'

vi.mock('@/lib/api', () => ({
  api: {
    users: { me: { useQuery: vi.fn() } },
    games: { getStats: { useQuery: vi.fn() } },
    listings: { getStats: { useQuery: vi.fn() } },
    pcListings: { stats: { useQuery: vi.fn() } },
  },
}))

const mockUserQuery = vi.mocked(api.users.me.useQuery)
const mockGamesStatsQuery = vi.mocked(api.games.getStats.useQuery)
const mockListingsStatsQuery = vi.mocked(api.listings.getStats.useQuery)
const mockPcListingsStatsQuery = vi.mocked(api.pcListings.stats.useQuery)

describe('ApprovalCountBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders badge when count is available and user has permission', () => {
    mockUserQuery.mockReturnValue({
      data: { permissions: [PERMISSIONS.VIEW_STATISTICS] },
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockGamesStatsQuery.mockReturnValue({
      data: { pending: 3, approved: 0, rejected: 0, total: 3 },
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockListingsStatsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockPcListingsStatsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)

    render(<ApprovalCountBadge href="/admin/games/approvals" />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByLabelText('3 pending approvals')).toBeInTheDocument()
  })

  it('returns null when user lacks permission', () => {
    mockUserQuery.mockReturnValue({
      data: { permissions: [] },
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockGamesStatsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockListingsStatsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockPcListingsStatsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)

    const { container } = render(
      <ApprovalCountBadge href="/admin/games/approvals" />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('returns null for invalid href', () => {
    mockUserQuery.mockReturnValue({
      data: { permissions: [PERMISSIONS.VIEW_STATISTICS] },
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockGamesStatsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockListingsStatsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    mockPcListingsStatsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      trpc: {},
    } as any)
    render(<ApprovalCountBadge href="/admin/unknown" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
