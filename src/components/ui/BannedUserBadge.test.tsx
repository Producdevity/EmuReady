import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BannedUserBadge } from './BannedUserBadge'

describe('BannedUserBadge', () => {
  const bannedAuthor = { userBans: [{ id: 'ban-1' }] }
  const cleanAuthor = { userBans: [] }

  it('renders nothing when canView is false (even if author is banned)', () => {
    const { container } = render(<BannedUserBadge author={bannedAuthor} canView={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when author has no active bans', () => {
    const { container } = render(<BannedUserBadge author={cleanAuthor} canView={true} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for null / undefined authors', () => {
    const { container: nullContainer } = render(<BannedUserBadge author={null} canView={true} />)
    expect(nullContainer).toBeEmptyDOMElement()

    const { container: undefContainer } = render(
      <BannedUserBadge author={undefined} canView={true} />,
    )
    expect(undefContainer).toBeEmptyDOMElement()
  })

  it('renders the default BANNED USER label when author is banned and viewer can see', () => {
    render(<BannedUserBadge author={bannedAuthor} canView={true} />)
    expect(screen.getByText('BANNED USER')).toBeInTheDocument()
  })

  it('renders a custom label when provided (AuthorDisplay compact variant)', () => {
    render(<BannedUserBadge author={bannedAuthor} canView={true} label="BANNED" />)
    expect(screen.getByText('BANNED')).toBeInTheDocument()
    expect(screen.queryByText('BANNED USER')).not.toBeInTheDocument()
  })

  it('forwards className through to the underlying Badge', () => {
    render(<BannedUserBadge author={bannedAuthor} canView={true} className="mt-1 custom-class" />)
    const badge = screen.getByText('BANNED USER')
    expect(badge.className).toContain('mt-1')
    expect(badge.className).toContain('custom-class')
  })

  it('respects the size prop (profile-header md variant)', () => {
    render(<BannedUserBadge author={bannedAuthor} canView={true} size="md" />)
    const badge = screen.getByText('BANNED USER')
    // size="md" → px-2 py-1 per Badge's sizeClasses map
    expect(badge.className).toContain('px-2')
    expect(badge.className).toContain('py-1')
  })
})
