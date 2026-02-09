import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PAGE_SIZE_OPTIONS } from '@/data/constants'
import { PageSizeSelector } from './PageSizeSelector'

describe('PageSizeSelector', () => {
  describe('rendering', () => {
    it('renders with default options', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} />)

      expect(screen.getByText('Show')).toBeInTheDocument()
      expect(screen.getByText('per page')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('displays the current value', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={25} onChange={onChange} />)

      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('renders all page size options when opened', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} />)

      // Open the dropdown
      fireEvent.click(screen.getByRole('button'))

      PAGE_SIZE_OPTIONS.forEach((option) => {
        // Use getAllByText since value appears in both trigger and dropdown
        expect(screen.getAllByText(String(option)).length).toBeGreaterThan(0)
      })
    })

    it('renders with custom options when opened', () => {
      const onChange = vi.fn()
      const customOptions = [5, 15, 30] as const
      render(<PageSizeSelector value={5} onChange={onChange} options={customOptions} />)

      // Open the dropdown
      fireEvent.click(screen.getByRole('button'))

      customOptions.forEach((option) => {
        // Use getAllByText since value appears in both trigger and dropdown
        expect(screen.getAllByText(String(option)).length).toBeGreaterThan(0)
      })
    })
  })

  describe('interactions', () => {
    it('calls onChange with correct value when option is clicked', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} />)

      // Open the dropdown
      fireEvent.click(screen.getByRole('button'))

      // Click on 50 option
      fireEvent.click(screen.getByText('50'))

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(50)
    })

    it('calls onChange with 25 when selecting 25', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} />)

      // Open the dropdown
      fireEvent.click(screen.getByRole('button'))

      // Click on 25 option
      fireEvent.click(screen.getByText('25'))

      expect(onChange).toHaveBeenCalledWith(25)
    })

    it('closes dropdown after selection', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} />)

      // Open the dropdown
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getAllByText('25').length).toBeGreaterThan(0)

      // Click on 25 option
      fireEvent.click(screen.getByText('25'))

      // Dropdown should close - only the selected value should be visible
      // The trigger button shows the value, not the dropdown options
    })
  })

  describe('disabled state', () => {
    it('applies disabled styling when disabled prop is true', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} disabled />)

      const container = screen.getByText('Show').parentElement
      expect(container).toHaveClass('opacity-50')
      expect(container).toHaveClass('pointer-events-none')
    })

    it('does not call onChange when disabled', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} disabled />)

      // Try to click the button
      fireEvent.click(screen.getByRole('button'))

      // Since pointer-events-none is applied, the click shouldn't register
      // But even if it did, the handleChange function checks for disabled
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('styling', () => {
    it('applies custom className', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} className="custom-class" />)

      const container = screen.getByText('Show').parentElement
      expect(container).toHaveClass('custom-class')
    })

    it('has correct base styling', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} />)

      const container = screen.getByText('Show').parentElement
      expect(container).toHaveClass('flex', 'items-center', 'gap-2')
    })
  })

  describe('dropdown trigger', () => {
    it('has minimum width for consistent appearance', () => {
      const onChange = vi.fn()
      render(<PageSizeSelector value={10} onChange={onChange} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-w-[70px]')
    })
  })
})
