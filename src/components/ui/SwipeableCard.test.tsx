import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SwipeableCard } from './SwipeableCard'
import type { MouseEvent } from 'react'

describe('SwipeableCard', () => {
  it('passes click events to the click handler', () => {
    const handleClick = vi.fn((event: MouseEvent) => {
      expect(event.ctrlKey).toBe(true)
    })

    render(<SwipeableCard onClick={handleClick}>Open report</SwipeableCard>)

    fireEvent.click(screen.getByText('Open report'), { ctrlKey: true })

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('passes middle-click events to the auxiliary click handler', () => {
    const handleAuxClick = vi.fn((event: MouseEvent) => {
      expect(event.button).toBe(1)
    })

    render(<SwipeableCard onAuxClick={handleAuxClick}>Open report</SwipeableCard>)

    fireEvent(
      screen.getByText('Open report'),
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )

    expect(handleAuxClick).toHaveBeenCalledTimes(1)
  })
})
