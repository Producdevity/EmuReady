import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import analytics from '@/lib/analytics'
import { VoteReminderBanner } from './VoteReminderBanner'

vi.mock('@/hooks', () => ({ useLocalStorage: () => [false, vi.fn(), true] }))
vi.mock('@/lib/analytics', () => ({
  default: { engagement: { voteReminderShown: vi.fn() } },
}))
vi.mock('../VotingHelpModal', () => ({ default: () => null }))

describe('VoteReminderBanner timing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => vi.useRealTimers())

  it('keeps the original timer and page duration across rerenders', () => {
    const props = {
      listingId: 'report-1',
      currentVote: null,
      onVote: vi.fn(),
      onVoteClick: vi.fn(),
    }
    const view = render(<VoteReminderBanner {...props} />)
    act(() => vi.advanceTimersByTime(30_000))
    view.rerender(<VoteReminderBanner {...props} />)
    act(() => vi.advanceTimersByTime(30_000))

    expect(analytics.engagement.voteReminderShown).toHaveBeenCalledExactlyOnceWith({
      listingId: 'report-1',
      timeOnPage: 60,
    })
  })

  it('starts a new delay when an external vote is removed', () => {
    const props = { listingId: 'report-1', onVote: vi.fn(), onVoteClick: vi.fn() }
    const view = render(<VoteReminderBanner {...props} currentVote={null} />)
    act(() => vi.advanceTimersByTime(60_000))
    view.rerender(<VoteReminderBanner {...props} currentVote={true} />)
    view.rerender(<VoteReminderBanner {...props} currentVote={null} />)
    act(() => vi.advanceTimersByTime(59_000))
    expect(analytics.engagement.voteReminderShown).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(1_000))
    expect(analytics.engagement.voteReminderShown).toHaveBeenCalledTimes(2)
  })
})
