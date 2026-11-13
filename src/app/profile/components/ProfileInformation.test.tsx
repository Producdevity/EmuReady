import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfileInformation from './ProfileInformation'

const mutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }))
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({ users: { getProfile: { invalidate: vi.fn() } } }),
    users: { update: { useMutation: () => mutation } },
  },
}))

const initial = { data: { name: 'Original name', bio: 'Original bio' }, isPending: false }
const refreshed = { data: { name: 'Refreshed name', bio: 'Refreshed bio' }, isPending: false }

describe('profile information draft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('preserves an edit during a query refresh and submits the displayed draft', () => {
    const view = render(<ProfileInformation userQuery={initial} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'My draft' },
    })
    view.rerender(<ProfileInformation userQuery={refreshed} />)
    expect(screen.getByDisplayValue('My draft')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(mutation.mutate).toHaveBeenCalledWith({ name: 'My draft', bio: 'Original bio' })
  })

  it('starts the next edit with the latest saved values after cancellation', () => {
    const view = render(<ProfileInformation userQuery={initial} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Discard me' },
    })
    view.rerender(<ProfileInformation userQuery={refreshed} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByDisplayValue('Refreshed name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Refreshed bio')).toBeInTheDocument()
  })
})
