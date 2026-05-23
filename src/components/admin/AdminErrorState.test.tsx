import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminErrorState } from './AdminErrorState'

describe('AdminErrorState', () => {
  it('renders an alert with the default title and retry action', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<AdminErrorState message="Failed to load pending listings." onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Unable to load admin data')).toBeInTheDocument()
    expect(screen.getByText('Failed to load pending listings.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try Again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('supports custom title and retry label', () => {
    render(
      <AdminErrorState
        title="Listings unavailable"
        message="The approval queue could not be loaded."
        retryLabel="Retry"
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('Listings unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })
})
