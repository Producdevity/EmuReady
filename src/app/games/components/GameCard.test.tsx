import { render, screen } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { ApprovalStatus } from '@orm'
import GameCard from './GameCard'

const game = {
  id: '00000000-0000-4000-a000-000000000001',
  title: 'Mario Kart World',
  normalizedTitle: 'mario kart world',
  systemId: '00000000-0000-4000-a000-000000000002',
  imageUrl: null,
  boxartUrl: 'https://example.com/game-cover.webp',
  bannerUrl: null,
  tgdbGameId: null,
  metadata: null,
  isErotic: false,
  ageRating: null,
  status: ApprovalStatus.APPROVED,
  submittedBy: null,
  submittedAt: null,
  approvedBy: null,
  approvedAt: null,
  createdAt: new Date('2026-11-01T12:00:00.000Z'),
  system: { name: 'Nintendo Switch 2' },
  _count: { listings: 1, pcListings: 1 },
} satisfies ComponentProps<typeof GameCard>['game']

describe('externally hosted game covers', () => {
  it.each([
    { eagerLoad: undefined, loading: 'lazy' },
    { eagerLoad: false, loading: 'lazy' },
    { eagerLoad: true, loading: 'eager' },
  ])('uses $loading loading when eagerLoad is $eagerLoad', (input) => {
    render(<GameCard game={game} eagerLoad={input.eagerLoad} />)
    const cover = screen.getByRole('img', { name: game.title })
    expect(cover).toHaveAttribute('src', game.boxartUrl)
    expect(cover).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(cover).toHaveAttribute('loading', input.loading)
  })
})
