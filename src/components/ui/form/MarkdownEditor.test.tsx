import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type PropsWithChildren } from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MarkdownEditor } from './MarkdownEditor'

interface MotionProps extends PropsWithChildren {
  [key: string]: unknown
}

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionProps) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: MotionProps) => <p {...props}>{children}</p>,
  },
  AnimatePresence: (props: PropsWithChildren) => props.children,
}))

describe('MarkdownEditor Resize Functionality', () => {
  const mockOnChange = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnChange.mockClear()
    // Reset viewport to desktop size for most tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe('Desktop Resize Handle', () => {
    it('renders resize handle on desktop', () => {
      render(
        <MarkdownEditor onChange={mockOnChange} value="" label="Test Editor" />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')
      expect(resizeHandle).toBeInTheDocument()
      expect(resizeHandle).toHaveClass('hidden md:flex')
    })

    it('shows drag cursor on resize handle', () => {
      render(<MarkdownEditor onChange={mockOnChange} value="" />)

      const resizeHandle = screen.getByTitle('Drag to resize')
      expect(resizeHandle).toHaveClass('cursor-ns-resize')
    })

    it('changes appearance during resize', async () => {
      render(<MarkdownEditor onChange={mockOnChange} value="" />)

      const resizeHandle = screen.getByTitle('Drag to resize')

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })

      expect(resizeHandle).toHaveClass('bg-blue-50')

      // End resize
      fireEvent.mouseUp(document)

      await waitFor(() => {
        expect(resizeHandle).not.toHaveClass('bg-blue-50')
      })
    })

    it('resizes editor with mouse drag', async () => {
      render(
        <MarkdownEditor
          onChange={mockOnChange}
          value=""
          minHeight={120}
          maxHeight={600}
        />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')
      const textarea = screen.getByRole('textbox')

      // Initial height should be 120px
      expect(textarea).toHaveStyle({ height: '120px' })

      // Start resize
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })

      // Drag down 100px
      fireEvent.mouseMove(document, { clientY: 200 })

      // Height should increase
      expect(textarea).toHaveStyle({ height: '220px' })

      // End resize
      fireEvent.mouseUp(document)
    })

    it('respects minHeight constraint', async () => {
      render(
        <MarkdownEditor
          onChange={mockOnChange}
          value=""
          minHeight={150}
          maxHeight={600}
        />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')
      const textarea = screen.getByRole('textbox')

      // Start at minHeight
      expect(textarea).toHaveStyle({ height: '150px' })

      // Try to drag above minimum
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })
      fireEvent.mouseMove(document, { clientY: 50 }) // Drag up 50px

      // Should stay at minHeight
      expect(textarea).toHaveStyle({ height: '150px' })

      fireEvent.mouseUp(document)
    })

    it('respects maxHeight constraint when provided', async () => {
      render(
        <MarkdownEditor
          onChange={mockOnChange}
          value=""
          minHeight={120}
          maxHeight={300}
        />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')
      const textarea = screen.getByRole('textbox')

      // Start resize and drag way down
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })
      fireEvent.mouseMove(document, { clientY: 500 }) // Drag down 400px

      // Should be capped at maxHeight
      expect(textarea).toHaveStyle({ height: '300px' })

      fireEvent.mouseUp(document)
    })

    it('allows unlimited height when no maxHeight is provided', async () => {
      render(
        <MarkdownEditor onChange={mockOnChange} value="" minHeight={120} />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')
      const textarea = screen.getByRole('textbox')

      // Start resize and drag way down
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })
      fireEvent.mouseMove(document, { clientY: 800 }) // Drag down 700px

      // Should allow very large height
      expect(textarea).toHaveStyle({ height: '820px' })

      fireEvent.mouseUp(document)
    })

    it('handles touch events for resize on desktop', async () => {
      render(
        <MarkdownEditor onChange={mockOnChange} value="" minHeight={120} />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')
      const textarea = screen.getByRole('textbox')

      // Start touch resize
      fireEvent.touchStart(resizeHandle, {
        touches: [{ clientY: 100 }],
      })

      // Touch move
      fireEvent.touchMove(document, {
        touches: [{ clientY: 200 }],
      })

      // Height should increase
      expect(textarea).toHaveStyle({ height: '220px' })

      // End touch
      fireEvent.touchEnd(document)
    })
  })

  describe('Mobile Expand/Collapse', () => {
    it('shows expand button with correct class', () => {
      render(
        <MarkdownEditor
          onChange={mockOnChange}
          value=""
          minHeight={120}
          maxHeight={600}
        />,
      )

      const expandButton = screen.getByTitle('Expand editor')
      expect(expandButton).toBeInTheDocument()
      expect(expandButton).toHaveClass('md:hidden')
    })

    it('toggles between expand and collapse states', async () => {
      render(
        <MarkdownEditor
          onChange={mockOnChange}
          value=""
          minHeight={120}
          maxHeight={600}
        />,
      )

      const textarea = screen.getByRole('textbox')

      // Initially collapsed
      expect(textarea).toHaveStyle({ height: '120px' })
      expect(screen.getByTitle('Expand editor')).toBeInTheDocument()

      // Click expand
      await user.click(screen.getByTitle('Expand editor'))

      // Should be expanded
      expect(textarea).toHaveStyle({ height: '600px' })
      expect(screen.getByTitle('Collapse editor')).toBeInTheDocument()

      // Click collapse
      await user.click(screen.getByTitle('Collapse editor'))

      // Should be collapsed again
      expect(textarea).toHaveStyle({ height: '120px' })
      expect(screen.getByTitle('Expand editor')).toBeInTheDocument()
    })

    it('uses correct icons for expand/collapse states', async () => {
      render(
        <MarkdownEditor
          onChange={mockOnChange}
          value=""
          minHeight={120}
          maxHeight={600}
        />,
      )

      // Check initial state (collapsed - should show Maximize2 icon)
      let button = screen.getByTitle('Expand editor')
      expect(button.querySelector('svg')).toBeInTheDocument()

      // Expand
      await user.click(button)

      // Check expanded state (should show Minimize2 icon)
      button = screen.getByTitle('Collapse editor')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('shows orange at 90% and red when exceeding limit', async () => {
      const { rerender } = render(
        <MarkdownEditor
          onChange={mockOnChange}
          value={'a'.repeat(95)} // 95% of 100
          maxLength={100}
        />,
      )

      // At 95% (over 90%) should be orange
      expect(screen.getByText('95/100')).toHaveClass('text-orange-500')

      // Test at exactly the limit
      rerender(
        <MarkdownEditor
          onChange={mockOnChange}
          value={'a'.repeat(100)} // exactly at limit
          maxLength={100}
        />,
      )

      expect(screen.getByText('100/100')).not.toHaveClass('text-red-500')

      // Test exceeding the limit
      rerender(
        <MarkdownEditor
          onChange={mockOnChange}
          value={'a'.repeat(105)} // over the limit
          maxLength={100}
        />,
      )

      expect(screen.getByText('105/100')).toHaveClass('text-red-500')
      expect(screen.getByText('105/100')).toHaveClass('font-medium')
    })

    it('expand/collapse works in preview mode', async () => {
      render(
        <MarkdownEditor
          onChange={mockOnChange}
          value=""
          minHeight={120}
          maxHeight={600}
        />,
      )

      // Switch to preview
      const previewButton = screen.getByRole('button', { name: /preview/i })
      await user.click(previewButton)

      // Get the content container (has height styling)
      const getContentContainer = () =>
        document.querySelector('div[style*="height"]')

      expect(getContentContainer()).toHaveStyle({ height: '120px' })

      // Expand in preview mode
      const expandButton = screen.getByTitle('Expand editor')
      await user.click(expandButton)

      expect(getContentContainer()).toHaveStyle({ height: '600px' })
    })
  })

  describe('Props and Configuration', () => {
    it('uses default minHeight when not provided', () => {
      render(<MarkdownEditor onChange={mockOnChange} value="" />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveStyle({ height: '120px' })
    })

    it('allows unlimited height by default (no maxHeight constraint)', async () => {
      render(
        <MarkdownEditor onChange={mockOnChange} value="" minHeight={120} />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')

      // Try to drag to a very large height
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })
      fireEvent.mouseMove(document, { clientY: 1000 }) // Drag down 900px

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveStyle({ height: '1020px' }) // Should allow unlimited height

      fireEvent.mouseUp(document)
    })

    it('accepts custom minHeight and maxHeight', () => {
      render(
        <MarkdownEditor
          onChange={mockOnChange}
          value=""
          minHeight={200}
          maxHeight={400}
        />,
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveStyle({ height: '200px' })
    })

    it('respects disabled state for resize controls', async () => {
      render(
        <MarkdownEditor onChange={mockOnChange} value="" disabled={true} />,
      )

      // Expand button should be disabled
      const expandButton = screen.getByTitle('Expand editor')
      expect(expandButton).toBeDisabled()
    })
  })

  describe('Cleanup and Event Handling', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <MarkdownEditor onChange={mockOnChange} value="" />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')

      // Start resize to add listeners
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })

      // Unmount component
      unmount()

      // Should clean up listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function),
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function),
      )

      removeEventListenerSpy.mockRestore()
    })

    it('handles missing touch coordinates gracefully', () => {
      render(<MarkdownEditor onChange={mockOnChange} value="" />)

      const resizeHandle = screen.getByTitle('Drag to resize')

      // Start with invalid touch event
      fireEvent.touchStart(resizeHandle, { touches: [] })

      // Should not crash
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('prevents default on resize start', () => {
      render(<MarkdownEditor onChange={mockOnChange} value="" />)

      const resizeHandle = screen.getByTitle('Drag to resize')

      const preventDefault = vi.fn()
      const mockEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientY: 100,
      })

      // Mock preventDefault on the event object
      Object.defineProperty(mockEvent, 'preventDefault', {
        value: preventDefault,
        writable: true,
      })

      fireEvent(resizeHandle, mockEvent)

      expect(preventDefault).toHaveBeenCalled()
    })
  })

  describe('Integration with Existing Features', () => {
    it('maintains resize state when switching between edit and preview', async () => {
      render(
        <MarkdownEditor onChange={mockOnChange} value="" minHeight={120} />,
      )

      const resizeHandle = screen.getByTitle('Drag to resize')

      // Resize first
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })
      fireEvent.mouseMove(document, { clientY: 200 })
      fireEvent.mouseUp(document)

      // Check initial resize worked
      const getContentContainer = () =>
        document.querySelector('div[style*="height"]')
      expect(getContentContainer()).toHaveStyle({ height: '220px' })

      // Switch to preview
      const previewButton = screen.getByRole('button', { name: /preview/i })
      await user.click(previewButton)

      // Check height is maintained in preview
      expect(getContentContainer()).toHaveStyle({ height: '220px' })

      // Switch back to edit using text content
      await user.click(screen.getByText('Edit'))

      // Check height is still maintained after switching back
      expect(getContentContainer()).toHaveStyle({ height: '220px' })

      // Verify textarea is back and has correct height
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveStyle({ height: '220px' })
    })

    it('preserves content during resize operations', async () => {
      render(<MarkdownEditor onChange={mockOnChange} value="Initial content" />)

      const textarea = screen.getByRole('textbox')
      const resizeHandle = screen.getByTitle('Drag to resize')

      // Verify initial content
      expect(textarea).toHaveValue('Initial content')

      // Resize
      fireEvent.mouseDown(resizeHandle, { clientY: 100 })
      fireEvent.mouseMove(document, { clientY: 200 })
      fireEvent.mouseUp(document)

      // Content should be preserved
      expect(textarea).toHaveValue('Initial content')
    })
  })
})
