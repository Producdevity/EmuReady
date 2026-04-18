import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrustLevelBadge } from './TrustLevelBadge'

describe('TrustLevelBadge', () => {
  it('shows Newcomer level for score 0', () => {
    render(<TrustLevelBadge trustScore={0} />)
    expect(screen.getByText('Newcomer')).toBeInTheDocument()
  })

  it('shows Newcomer level for negative score (no crash)', () => {
    render(<TrustLevelBadge trustScore={-50} />)
    expect(screen.getByText('Newcomer')).toBeInTheDocument()
  })

  it('shows Contributor level at 100', () => {
    render(<TrustLevelBadge trustScore={100} />)
    expect(screen.getByText('Contributor')).toBeInTheDocument()
  })

  it('shows Trusted level at 250', () => {
    render(<TrustLevelBadge trustScore={250} />)
    expect(screen.getByText('Trusted')).toBeInTheDocument()
  })

  describe('progress display', () => {
    it('shows 0% for negative scores (clamped, no "-5%")', () => {
      render(<TrustLevelBadge trustScore={-5} showProgress />)
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument()
    })

    it('shows 0% at the bottom of a level', () => {
      render(<TrustLevelBadge trustScore={0} showProgress />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('shows 50% at the midpoint between levels', () => {
      // Newcomer (0) → Contributor (100), midpoint is 50
      render(<TrustLevelBadge trustScore={50} showProgress />)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('does not render progress at the highest level (Core)', () => {
      render(<TrustLevelBadge trustScore={2000} showProgress />)
      expect(screen.getByText('Core')).toBeInTheDocument()
      expect(screen.queryByText(/Progress to/)).not.toBeInTheDocument()
    })

    it('shows points needed (can be larger than typical when score is negative)', () => {
      render(<TrustLevelBadge trustScore={-10} showProgress />)
      // Next level Contributor at 100, so 100 - (-10) = 110 points needed
      expect(screen.getByText('110 points needed')).toBeInTheDocument()
    })
  })
})
