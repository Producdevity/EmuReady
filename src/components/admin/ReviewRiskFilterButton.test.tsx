import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewRiskFilterButton } from './ReviewRiskFilterButton'

describe('ReviewRiskFilterButton', () => {
  it('renders the risk filter as a switch', () => {
    render(<ReviewRiskFilterButton isActive={false} onToggle={vi.fn()} />)

    expect(screen.getByRole('switch', { name: 'Risk only' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('calls onToggle when the switch changes', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(<ReviewRiskFilterButton isActive={false} onToggle={onToggle} />)

    await user.click(screen.getByRole('switch', { name: 'Risk only' }))

    expect(onToggle).toHaveBeenCalledOnce()
  })
})
