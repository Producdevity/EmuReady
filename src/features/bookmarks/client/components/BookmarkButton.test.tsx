import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalStatus } from '@orm'
import BookmarkButton from './BookmarkButton'
import BookmarkCard from './BookmarkCard'

const state = vi.hoisted(() => ({
  user: { id: 'viewer' },
  isBookmarked: true,
  isPending: false,
  isStatusPending: false,
  handleToggle: vi.fn(),
}))
vi.mock('../hooks/useBookmarkToggle', () => ({ useBookmarkToggle: () => state }))
const id = '00000000-0000-4000-a000-000000000001'

beforeEach(() => {
  vi.clearAllMocks()
  state.isPending = false
})

describe('bookmark actions', () => {
  it('toggles without activating the report row navigation', () => {
    const navigate = vi.fn()
    render(
      <div onClick={navigate} onAuxClick={navigate}>
        <BookmarkButton type="listing" listingId={id} />
      </div>,
    )
    const button = screen.getByRole('button', { name: 'Remove bookmark' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(button)
    fireEvent(button, new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    expect(state.handleToggle).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('disables repeated writes while a mutation is pending', () => {
    state.isPending = true
    render(<BookmarkButton type="pcListing" pcListingId={id} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }))
    expect(state.handleToggle).not.toHaveBeenCalled()
  })

  it('keeps the saved-card action outside the report link', () => {
    const brand = { id, name: 'Brand' }
    render(
      <BookmarkCard
        variant="handheld"
        index={0}
        status={{ isBookmarked: true, isPending: false }}
        item={{
          id,
          createdAt: new Date(),
          listing: {
            id,
            createdAt: new Date(),
            status: ApprovalStatus.APPROVED,
            successRate: 0,
            _count: { votes: 0, comments: 0 },
            author: { id, name: 'Tester', profileImage: null },
            game: {
              id,
              title: 'Mario',
              system: { id, name: 'Nintendo Switch 2', key: 'nintendo_switch_2' },
            },
            emulator: { id, name: 'NX', logo: null },
            device: { id, modelName: 'Device', brand },
            performance: { id: 1, label: 'Perfect', rank: 1, description: 'Plays perfectly.' },
          },
        }}
      />,
    )
    const button = screen.getByRole('button', { name: 'Remove bookmark' })
    expect(button.closest('a')).toBeNull()
    expect(screen.getByRole('link')).toHaveAttribute('href', `/listings/${id}`)
  })
})
