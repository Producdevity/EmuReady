import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RISK_SIGNAL_TYPES, type AuthorRiskProfile } from '@/schemas/authorRisk'
import { AuthorRiskIndicator } from './AuthorRiskIndicator'

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

describe('AuthorRiskIndicator', () => {
  it('renders nothing when risk profile is null', () => {
    const { container } = render(<AuthorRiskIndicator riskProfile={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when risk profile has no signals', () => {
    const { container } = render(<AuthorRiskIndicator riskProfile={emptyProfile} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders indicator for high severity', () => {
    render(<AuthorRiskIndicator riskProfile={highRiskProfile} />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status.getAttribute('aria-label')).toContain('high severity')
    expect(status.getAttribute('aria-label')).toContain('2 signals')
  })

  it('renders indicator for medium severity', () => {
    render(<AuthorRiskIndicator riskProfile={mediumRiskProfile} />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status.getAttribute('aria-label')).toContain('medium severity')
  })

  it('renders indicator for low severity', () => {
    render(<AuthorRiskIndicator riskProfile={lowRiskProfile} />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status.getAttribute('aria-label')).toContain('low severity')
    expect(status.getAttribute('aria-label')).toContain('1 signal')
  })

  it('applies red color for high severity icon', () => {
    render(<AuthorRiskIndicator riskProfile={highRiskProfile} />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveClass('text-red-500')
  })

  it('applies orange color for medium severity icon', () => {
    render(<AuthorRiskIndicator riskProfile={mediumRiskProfile} />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveClass('text-orange-500')
  })

  it('applies yellow color for low severity icon', () => {
    render(<AuthorRiskIndicator riskProfile={lowRiskProfile} />)
    const status = screen.getByRole('status')
    const svg = status.querySelector('svg')
    expect(svg).toHaveClass('text-yellow-500')
  })
})
