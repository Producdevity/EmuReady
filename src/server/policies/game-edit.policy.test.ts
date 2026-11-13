import { describe, expect, it } from 'vitest'
import { ApprovalStatus } from '@orm'
import { assertCanEditOwnPendingGame } from './game-edit.policy'

describe('own pending game edit policy', () => {
  it('allows the submitter to edit a pending game', () => {
    expect(() =>
      assertCanEditOwnPendingGame(
        { submittedBy: 'owner', status: ApprovalStatus.PENDING },
        'owner',
      ),
    ).not.toThrow()
  })

  it.each(['another-user', null])('rejects a pending game submitted by %s', (submittedBy) => {
    expect(() =>
      assertCanEditOwnPendingGame({ submittedBy, status: ApprovalStatus.PENDING }, 'owner'),
    ).toThrow('You can only edit your own games')
  })

  it.each([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED])(
    'rejects the submitter editing a %s game',
    (status) => {
      expect(() => assertCanEditOwnPendingGame({ submittedBy: 'owner', status }, 'owner')).toThrow(
        'You can only edit pending games',
      )
    },
  )
})
