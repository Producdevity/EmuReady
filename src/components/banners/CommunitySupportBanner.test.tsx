import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CommunitySupportBanner from './CommunitySupportBanner'

const mockDismiss = vi.fn()
const mockHandleCTAClick = vi.fn()

vi.mock('@/hooks/useCommunitySupportBanner', () => ({
  useCommunitySupportBanner: vi.fn(() => ({
    isVisible: true,
    dismiss: mockDismiss,
    handleCTAClick: mockHandleCTAClick,
  })),
}))

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => false),
}))

vi.mock('@/lib/env', () => ({
  env: {
    PATREON_URL: 'https://www.patreon.com/Producdevity',
  },
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    aside: ({
      children,
      className,
      role,
      'aria-label': ariaLabel,
    }: {
      children: React.ReactNode
      className?: string
      role?: string
      'aria-label'?: string
      [key: string]: unknown
    }) => (
      <aside className={className} role={role} aria-label={ariaLabel}>
        {children}
      </aside>
    ),
  },
}))

describe('CommunitySupportBanner', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { useCommunitySupportBanner } = await import('@/hooks/useCommunitySupportBanner')
    vi.mocked(useCommunitySupportBanner).mockReturnValue({
      isVisible: true,
      dismiss: mockDismiss,
      handleCTAClick: mockHandleCTAClick,
    })
  })

  it('renders with correct semantic structure', () => {
    render(<CommunitySupportBanner variant="home" page="home" />)

    const aside = screen.getByRole('complementary', { name: 'Community support' })
    expect(aside).toBeInTheDocument()
  })

  it('renders CTA link pointing to Patreon', () => {
    render(<CommunitySupportBanner variant="home" page="home" />)

    const ctaLink = screen.getByRole('link')
    expect(ctaLink).toHaveAttribute('href', 'https://www.patreon.com/Producdevity')
    expect(ctaLink).toHaveAttribute('target', '_blank')
    expect(ctaLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders dismiss button with aria-label', () => {
    render(<CommunitySupportBanner variant="home" page="home" />)

    const dismissButton = screen.getByRole('button', {
      name: 'Dismiss community support banner',
    })
    expect(dismissButton).toBeInTheDocument()
  })

  it('calls dismiss when dismiss button is clicked', () => {
    render(<CommunitySupportBanner variant="home" page="home" />)

    const dismissButton = screen.getByRole('button', {
      name: 'Dismiss community support banner',
    })
    fireEvent.click(dismissButton)

    expect(mockDismiss).toHaveBeenCalledOnce()
  })

  it('calls handleCTAClick when CTA link is clicked', () => {
    render(<CommunitySupportBanner variant="list" page="listings" />)

    const ctaLink = screen.getByRole('link')
    fireEvent.click(ctaLink)

    expect(mockHandleCTAClick).toHaveBeenCalledOnce()
  })

  it('renders banner text content', () => {
    render(<CommunitySupportBanner variant="home" page="home" />)

    expect(screen.getByText(/EmuReady is open source, free, and ad-free/)).toBeInTheDocument()
  })

  it('does not render when isVisible is false', async () => {
    const { useCommunitySupportBanner } = await import('@/hooks/useCommunitySupportBanner')
    vi.mocked(useCommunitySupportBanner).mockReturnValue({
      isVisible: false,
      dismiss: mockDismiss,
      handleCTAClick: mockHandleCTAClick,
    })

    render(<CommunitySupportBanner variant="detail" page="listing-detail" />)

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('renders with compact styling for list variant', () => {
    render(<CommunitySupportBanner variant="list" page="listings" />)

    const aside = screen.getByRole('complementary')
    expect(aside.className).toContain('mb-4')
    expect(aside.className).not.toContain('mb-12')
  })

  it('renders with larger styling for home variant', async () => {
    const { useCommunitySupportBanner } = await import('@/hooks/useCommunitySupportBanner')
    vi.mocked(useCommunitySupportBanner).mockReturnValue({
      isVisible: true,
      dismiss: mockDismiss,
      handleCTAClick: mockHandleCTAClick,
    })

    render(<CommunitySupportBanner variant="home" page="home" />)

    const aside = screen.getByRole('complementary')
    expect(aside.className).toContain('mb-12')
  })
})
