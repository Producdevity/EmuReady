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

describe('ApprovalCountBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders badge when count is available and user has permission', () => {
    ;(api.users.me.useQuery as any).mockReturnValue({
      data: { permissions: [PERMISSIONS.VIEW_STATISTICS] },
    })
    ;(api.games.getStats.useQuery as any).mockReturnValue({
      data: { pending: 3 },
    })
    ;(api.listings.getStats.useQuery as any).mockReturnValue({
      data: undefined,
    })
    ;(api.pcListings.stats.useQuery as any).mockReturnValue({ data: undefined })

    render(<ApprovalCountBadge href="/admin/games/approvals" />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByLabelText('3 pending approvals')).toBeInTheDocument()
  })

  it('returns null when user lacks permission', () => {
    ;(api.users.me.useQuery as any).mockReturnValue({
      data: { permissions: [] },
    })
    ;(api.games.getStats.useQuery as any).mockReturnValue({ data: undefined })
    ;(api.listings.getStats.useQuery as any).mockReturnValue({
      data: undefined,
    })
    ;(api.pcListings.stats.useQuery as any).mockReturnValue({ data: undefined })

    const { container } = render(
      <ApprovalCountBadge href="/admin/games/approvals" />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('returns null for invalid href', () => {
    ;(api.users.me.useQuery as any).mockReturnValue({
      data: { permissions: [PERMISSIONS.VIEW_STATISTICS] },
    })
    ;(api.games.getStats.useQuery as any).mockReturnValue({ data: undefined })
    ;(api.listings.getStats.useQuery as any).mockReturnValue({
      data: undefined,
    })
    ;(api.pcListings.stats.useQuery as any).mockReturnValue({ data: undefined })
    render(<ApprovalCountBadge href="/admin/unknown" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
