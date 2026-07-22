import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import ApprovalCountBadge from './ApprovalCountBadge'

interface UserQueryResult {
  data?: {
    permissions?: string[] | null
  } | null
}

interface StatsQueryResult {
  data?: {
    pending: number
    approved: number
    rejected: number
    total: number
  }
}

const apiMocks = vi.hoisted(() => ({
  userMeUseQuery: vi.fn<() => UserQueryResult>(),
  gamesStatsUseQuery: vi.fn<(input?: undefined, options?: unknown) => StatsQueryResult>(),
  listingsStatsUseQuery: vi.fn<(input?: undefined, options?: unknown) => StatsQueryResult>(),
  pcListingsStatsUseQuery: vi.fn<(input?: undefined, options?: unknown) => StatsQueryResult>(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    users: { me: { useQuery: apiMocks.userMeUseQuery } },
    games: { stats: { useQuery: apiMocks.gamesStatsUseQuery } },
    listings: { stats: { useQuery: apiMocks.listingsStatsUseQuery } },
    pcListings: { stats: { useQuery: apiMocks.pcListingsStatsUseQuery } },
  },
}))

describe('ApprovalCountBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders badge when count is available and user has permission', () => {
    apiMocks.userMeUseQuery.mockReturnValue({
      data: { permissions: [PERMISSIONS.VIEW_STATISTICS] },
    })
    apiMocks.gamesStatsUseQuery.mockReturnValue({
      data: { pending: 3, approved: 0, rejected: 0, total: 3 },
    })
    apiMocks.listingsStatsUseQuery.mockReturnValue({})
    apiMocks.pcListingsStatsUseQuery.mockReturnValue({})

    render(<ApprovalCountBadge href="/admin/games/approvals" />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByLabelText('3 pending approvals')).toBeInTheDocument()
  })

  it('returns null when user lacks permission', () => {
    apiMocks.userMeUseQuery.mockReturnValue({
      data: { permissions: [] },
    })
    apiMocks.gamesStatsUseQuery.mockReturnValue({})
    apiMocks.listingsStatsUseQuery.mockReturnValue({})
    apiMocks.pcListingsStatsUseQuery.mockReturnValue({})

    const { container } = render(<ApprovalCountBadge href="/admin/games/approvals" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('returns null for invalid href', () => {
    apiMocks.userMeUseQuery.mockReturnValue({
      data: { permissions: [PERMISSIONS.VIEW_STATISTICS] },
    })
    apiMocks.gamesStatsUseQuery.mockReturnValue({})
    apiMocks.listingsStatsUseQuery.mockReturnValue({})
    apiMocks.pcListingsStatsUseQuery.mockReturnValue({})
    render(<ApprovalCountBadge href="/admin/unknown" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
