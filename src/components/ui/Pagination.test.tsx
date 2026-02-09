import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  const mockOnPageChange = vi.fn()

  beforeEach(() => {
    mockOnPageChange.mockClear()
  })

  it('should not render when totalPages is 1 or less and no pageSizeSelector', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={mockOnPageChange} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render pageSizeSelector even when totalPages is 1', () => {
    render(
      <Pagination
        page={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
        pageSizeSelector={<div data-testid="page-size-selector">10 per page</div>}
      />,
    )

    // Component renders both desktop and mobile layouts, so there are 2 instances
    expect(screen.getAllByTestId('page-size-selector')).toHaveLength(2)
  })

  it('should render basic pagination with few pages', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} />)

    // Component renders both desktop and mobile layouts
    expect(screen.getAllByLabelText('Go to previous page')).toHaveLength(2)
    expect(screen.getAllByLabelText('Go to next page')).toHaveLength(2)
  })

  it('should disable previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={mockOnPageChange} />)

    const prevButtons = screen.getAllByLabelText('Go to previous page')
    prevButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
      expect(btn).toHaveClass('cursor-not-allowed')
    })
  })

  it('should disable next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={mockOnPageChange} />)

    const nextButtons = screen.getAllByLabelText('Go to next page')
    nextButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
      expect(btn).toHaveClass('cursor-not-allowed')
    })
  })

  it('should call onPageChange when clicking page numbers', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} />)

    // Click the first instance (desktop layout)
    fireEvent.click(screen.getAllByLabelText('Go to page 3')[0])
    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('should call onPageChange when clicking previous/next buttons', () => {
    render(<Pagination page={3} totalPages={5} onPageChange={mockOnPageChange} />)

    fireEvent.click(screen.getAllByLabelText('Go to previous page')[0])
    expect(mockOnPageChange).toHaveBeenCalledWith(2)

    fireEvent.click(screen.getAllByLabelText('Go to next page')[0])
    expect(mockOnPageChange).toHaveBeenCalledWith(4)
  })

  it('should highlight current page', () => {
    render(<Pagination page={3} totalPages={5} onPageChange={mockOnPageChange} />)

    const currentPageButtons = screen.getAllByLabelText('Go to page 3')
    currentPageButtons.forEach((btn) => {
      expect(btn).toHaveClass('bg-blue-600', 'text-white')
      expect(btn).toHaveAttribute('aria-current', 'page')
    })
  })

  it('should show ellipsis and first/last pages for large pagination', () => {
    render(<Pagination page={10} totalPages={20} onPageChange={mockOnPageChange} />)

    expect(screen.getAllByLabelText('Go to first page').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to last page').length).toBeGreaterThan(0)
  })

  it('should handle keyboard navigation', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} />)

    const pageButtons = screen.getAllByLabelText('Go to page 3')

    // Test Enter key on first instance
    fireEvent.keyDown(pageButtons[0], { key: 'Enter' })
    expect(mockOnPageChange).toHaveBeenCalledWith(3)

    // Test Space key
    fireEvent.keyDown(pageButtons[0], { key: ' ' })
    expect(mockOnPageChange).toHaveBeenCalledWith(3)

    // Test other keys (should not trigger)
    mockOnPageChange.mockClear()
    fireEvent.keyDown(pageButtons[0], { key: 'Tab' })
    expect(mockOnPageChange).not.toHaveBeenCalled()
  })

  it('should hide label when showLabel is false', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} showLabel={false} />)

    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('should show pages around current page correctly', () => {
    render(<Pagination page={10} totalPages={20} onPageChange={mockOnPageChange} />)

    // Should show pages 8, 9, 10, 11, 12 around current page 10
    expect(screen.getAllByLabelText('Go to page 8').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 9').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 10').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 11').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 12').length).toBeGreaterThan(0)
  })

  it('should handle edge case when current page is near beginning', () => {
    render(<Pagination page={2} totalPages={10} onPageChange={mockOnPageChange} />)

    // Should not show first page separately when current is near beginning
    expect(screen.queryByLabelText('Go to first page')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText('Go to page 1').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 2').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 3').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 4').length).toBeGreaterThan(0)
  })

  it('should handle edge case when current page is near end', () => {
    render(<Pagination page={9} totalPages={10} onPageChange={mockOnPageChange} />)

    // Should not show last page separately when current is near end
    expect(screen.queryByLabelText('Go to last page')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText('Go to page 7').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 8').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 9').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Go to page 10').length).toBeGreaterThan(0)
  })

  it('should have proper accessibility attributes', () => {
    render(<Pagination page={5} totalPages={10} onPageChange={mockOnPageChange} />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('aria-label', 'Pagination navigation')

    const ellipsisElements = document.querySelectorAll('span[aria-hidden="true"]')
    ellipsisElements.forEach((el) => {
      expect(el).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('should prevent going below page 1 or above total pages', () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={5} onPageChange={mockOnPageChange} />,
    )

    // Previous button should be disabled on first page, so no call should be made
    const prevButtons = screen.getAllByLabelText('Go to previous page')
    expect(prevButtons[0]).toBeDisabled()

    rerender(<Pagination page={5} totalPages={5} onPageChange={mockOnPageChange} />)

    // Next button should be disabled on last page, so no call should be made
    const nextButtons = screen.getAllByLabelText('Go to next page')
    expect(nextButtons[0]).toBeDisabled()
  })

  describe('unified pagination bar with pageSizeSelector', () => {
    it('should render pageSizeSelector alongside navigation', () => {
      render(
        <Pagination
          page={2}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
          pageSizeSelector={<div data-testid="page-size-selector">10 per page</div>}
        />,
      )

      // Component renders both desktop and mobile layouts
      expect(screen.getAllByTestId('page-size-selector').length).toBeGreaterThan(0)
      expect(screen.getAllByLabelText('Go to previous page').length).toBeGreaterThan(0)
      expect(screen.getAllByLabelText('Go to next page').length).toBeGreaterThan(0)
    })

    it('should show items count info in unified bar', () => {
      render(
        <Pagination
          page={2}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
          pageSizeSelector={<div data-testid="page-size-selector">10 per page</div>}
        />,
      )

      // Check for "Showing 11 to 20 of 50 results"
      expect(screen.getAllByText('11').length).toBeGreaterThan(0)
      expect(screen.getAllByText('20').length).toBeGreaterThan(0)
      expect(screen.getAllByText('50').length).toBeGreaterThan(0)
    })
  })
})
