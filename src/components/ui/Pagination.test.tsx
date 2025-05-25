import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from './Pagination'

describe('Pagination', () => {
  const mockOnPageChange = vi.fn()

  beforeEach(() => {
    mockOnPageChange.mockClear()
  })

  it('should not render when totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render basic pagination with few pages', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
  })

  it('should disable previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    const prevButton = screen.getByLabelText('Go to previous page')
    expect(prevButton).toBeDisabled()
    expect(prevButton).toHaveClass('cursor-not-allowed')
  })

  it('should disable next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    const nextButton = screen.getByLabelText('Go to next page')
    expect(nextButton).toBeDisabled()
    expect(nextButton).toHaveClass('cursor-not-allowed')
  })

  it('should call onPageChange when clicking page numbers', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    fireEvent.click(screen.getByLabelText('Go to page 3'))
    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('should call onPageChange when clicking previous/next buttons', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    fireEvent.click(screen.getByLabelText('Go to previous page'))
    expect(mockOnPageChange).toHaveBeenCalledWith(2)

    fireEvent.click(screen.getByLabelText('Go to next page'))
    expect(mockOnPageChange).toHaveBeenCalledWith(4)
  })

  it('should highlight current page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    const currentPageButton = screen.getByLabelText('Go to page 3')
    expect(currentPageButton).toHaveClass('bg-blue-600', 'text-white')
    expect(currentPageButton).toHaveAttribute('aria-current', 'page')
  })

  it('should show ellipsis and first/last pages for large pagination', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={20}
        onPageChange={mockOnPageChange}
      />,
    )

    expect(screen.getByLabelText('Go to first page')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to last page')).toBeInTheDocument()
    expect(screen.getAllByText('...')).toHaveLength(2)
  })

  it('should handle keyboard navigation', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    const pageButton = screen.getByLabelText('Go to page 3')

    // Test Enter key
    fireEvent.keyDown(pageButton, { key: 'Enter' })
    expect(mockOnPageChange).toHaveBeenCalledWith(3)

    // Test Space key
    fireEvent.keyDown(pageButton, { key: ' ' })
    expect(mockOnPageChange).toHaveBeenCalledWith(3)

    // Test other keys (should not trigger)
    mockOnPageChange.mockClear()
    fireEvent.keyDown(pageButton, { key: 'Tab' })
    expect(mockOnPageChange).not.toHaveBeenCalled()
  })

  it('should hide label when showLabel is false', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        showLabel={false}
      />,
    )

    expect(screen.queryByText('Page 2 of 5')).not.toBeInTheDocument()
  })

  it('should show pages around current page correctly', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={20}
        onPageChange={mockOnPageChange}
      />,
    )

    // Should show pages 8, 9, 10, 11, 12 around current page 10
    expect(screen.getByLabelText('Go to page 8')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 9')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 10')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 11')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 12')).toBeInTheDocument()
  })

  it('should handle edge case when current page is near beginning', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />,
    )

    // Should not show first page separately when current is near beginning
    expect(screen.queryByLabelText('Go to first page')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 4')).toBeInTheDocument()
  })

  it('should handle edge case when current page is near end', () => {
    render(
      <Pagination
        currentPage={9}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />,
    )

    // Should not show last page separately when current is near end
    expect(screen.queryByLabelText('Go to last page')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 7')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 8')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 9')).toBeInTheDocument()
    expect(screen.getByLabelText('Go to page 10')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />,
    )

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('aria-label', 'Pagination navigation')

    const ellipsis = screen.getAllByText('...')
    ellipsis.forEach((el) => {
      expect(el).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('should prevent going below page 1 or above total pages', () => {
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    // Previous button should be disabled on first page, so no call should be made
    const prevButton = screen.getByLabelText('Go to previous page')
    expect(prevButton).toBeDisabled()

    rerender(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />,
    )

    // Next button should be disabled on last page, so no call should be made
    const nextButton = screen.getByLabelText('Go to next page')
    expect(nextButton).toBeDisabled()
  })
})
