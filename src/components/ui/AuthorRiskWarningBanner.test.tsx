import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RISK_SIGNAL_TYPES, type AuthorRiskProfile } from '@/schemas/authorRisk'
import { AuthorRiskWarningBanner } from './AuthorRiskWarningBanner'

const emptyProfile: AuthorRiskProfile = {
  authorId: 'author-1',
  signals: [],
  highestSeverity: null,
}

const highRiskProfile: AuthorRiskProfile = {
  authorId: 'author-1',
  signals: [
    {
      type: RISK_SIGNAL_TYPES.ACTIVE_BAN,
      severity: 'high',
      label: 'Active Ban',
      description: 'Banned for: spam',
    },
    {
      type: RISK_SIGNAL_TYPES.ACTIVE_REPORTS,
      severity: 'low',
      label: 'Active Reports',
      description: '1 active report',
    },
  ],
  highestSeverity: 'high',
}

const mediumRiskProfile: AuthorRiskProfile = {
  authorId: 'author-2',
  signals: [
    {
      type: RISK_SIGNAL_TYPES.ACTIVE_REPORTS,
      severity: 'medium',
      label: 'Active Reports',
      description: '4 active reports',
    },
  ],
  highestSeverity: 'medium',
}

const lowRiskProfile: AuthorRiskProfile = {
  authorId: 'author-3',
  signals: [
    {
      type: RISK_SIGNAL_TYPES.NEW_AUTHOR,
      severity: 'low',
      label: 'New Author',
      description: 'No previously approved listings',
    },
  ],
  highestSeverity: 'low',
}

describe('AuthorRiskWarningBanner', () => {
  it('renders nothing when risk profile is null', () => {
    const { container } = render(<AuthorRiskWarningBanner riskProfile={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when risk profile has no signals', () => {
    const { container } = render(<AuthorRiskWarningBanner riskProfile={emptyProfile} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders banner with all signals', () => {
    render(<AuthorRiskWarningBanner riskProfile={highRiskProfile} />)
    expect(screen.getByText('Author Risk Warning')).toBeInTheDocument()
    expect(screen.getByText('Active Ban')).toBeInTheDocument()
    expect(screen.getByText('Active Reports')).toBeInTheDocument()
    expect(screen.getByText('Banned for: spam')).toBeInTheDocument()
  })

  it('renders red border for high severity', () => {
    const { container } = render(<AuthorRiskWarningBanner riskProfile={highRiskProfile} />)
    const banner = container.firstChild as HTMLElement
    expect(banner).toHaveClass('border-red-200')
  })

  it('renders orange border for medium severity', () => {
    const { container } = render(<AuthorRiskWarningBanner riskProfile={mediumRiskProfile} />)
    const banner = container.firstChild as HTMLElement
    expect(banner).toHaveClass('border-orange-200')
  })

  it('renders yellow border for low severity', () => {
    const { container } = render(<AuthorRiskWarningBanner riskProfile={lowRiskProfile} />)
    const banner = container.firstChild as HTMLElement
    expect(banner).toHaveClass('border-yellow-200')
  })

  it('includes severity badges for each signal', () => {
    render(<AuthorRiskWarningBanner riskProfile={highRiskProfile} />)
    const badges = screen.getAllByText(/^(high|medium|low)$/)
    expect(badges).toHaveLength(2)
  })

  it('includes review guidance text', () => {
    render(<AuthorRiskWarningBanner riskProfile={lowRiskProfile} />)
    expect(screen.getByText(/Review this listing carefully/)).toBeInTheDocument()
  })
})
