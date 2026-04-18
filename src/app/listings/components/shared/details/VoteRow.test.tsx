import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VoteRow } from './VoteRow'

function makeVote(
  overrides: Partial<{
    id: string
    value: boolean
    nullifiedAt: Date | null
    userName: string | null
  }> = {},
) {
  return {
    id: overrides.id ?? 'vote-1',
    value: overrides.value ?? true,
    nullifiedAt: overrides.nullifiedAt ?? null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    user: {
      id: 'user-1',
      name: 'userName' in overrides ? (overrides.userName ?? null) : 'Alice',
      trustScore: 50,
    },
  }
}

function renderRow(vote: ReturnType<typeof makeVote>) {
  return render(
    <table>
      <tbody>
        <VoteRow vote={vote} />
      </tbody>
    </table>,
  )
}

describe('VoteRow', () => {
  it('renders an active (non-nullified) upvote row without strike-through or Nullified badge', () => {
    const vote = makeVote({ value: true, nullifiedAt: null })
    renderRow(vote)

    expect(screen.queryByText('Nullified')).not.toBeInTheDocument()

    const row = screen.getByRole('row')
    expect(row.className).not.toContain('line-through')
    expect(row.className).not.toContain('opacity-60')
  })

  it('renders a nullified vote row with reduced opacity and a Nullified badge, but no line-through', () => {
    const vote = makeVote({ value: true, nullifiedAt: new Date('2026-01-02T00:00:00Z') })
    renderRow(vote)

    expect(screen.getByText('Nullified')).toBeInTheDocument()

    const row = screen.getByRole('row')
    expect(row.className).toContain('opacity-60')
    expect(row.innerHTML).not.toContain('line-through')
  })

  it('links to the voter user in admin', () => {
    const vote = makeVote({ userName: 'Alice' })
    renderRow(vote)

    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('falls back to "Unknown User" when voter name is null', () => {
    const vote = makeVote({ userName: null })
    renderRow(vote)

    expect(screen.getByText('Unknown User')).toBeInTheDocument()
  })

  it('renders upvote icon with Upvote aria-label for value=true', () => {
    const vote = makeVote({ value: true })
    renderRow(vote)

    expect(screen.getByLabelText('Upvote')).toBeInTheDocument()
  })

  it('renders downvote icon with Downvote aria-label for value=false', () => {
    const vote = makeVote({ value: false })
    renderRow(vote)

    expect(screen.getByLabelText('Downvote')).toBeInTheDocument()
  })
})
