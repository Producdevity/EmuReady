import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ColumnVisibilityControl from './ColumnVisibilityControl'
import {
  type ColumnDefinition,
  type UseColumnVisibilityReturn,
} from '@/hooks/useColumnVisibility'

describe('ColumnVisibilityControl', () => {
  const mockColumns: ColumnDefinition[] = [
    { key: 'name', label: 'Name', defaultVisible: true },
    { key: 'email', label: 'Email', defaultVisible: true },
    { key: 'role', label: 'Role', defaultVisible: false },
    { key: 'actions', label: 'Actions', alwaysVisible: true },
  ]

  const createMockColumnVisibility = (
    overrides: Partial<UseColumnVisibilityReturn> = {},
  ): UseColumnVisibilityReturn => ({
    visibleColumns: new Set(['name', 'email', 'actions']),
    isColumnVisible: vi.fn((key: string) => {
      if (key === 'actions') return true // alwaysVisible
      return ['name', 'email'].includes(key)
    }),
    toggleColumn: vi.fn(),
    showColumn: vi.fn(),
    hideColumn: vi.fn(),
    resetToDefaults: vi.fn(),
    showAll: vi.fn(),
    hideAll: vi.fn(),
    ...overrides,
  })

  it('should render the column visibility button with correct count', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    expect(screen.getByText('Columns (3/4)')).toBeInTheDocument()
  })

  it('should show dropdown when button is clicked', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    expect(screen.getByText('Show All')).toBeInTheDocument()
    expect(screen.getByText('Hide All')).toBeInTheDocument()
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('should display all columns in the dropdown', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should show "Always visible" for alwaysVisible columns', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    expect(screen.getByText('Always visible')).toBeInTheDocument()
  })

  it('should call toggleColumn when clicking on a toggleable column', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    const nameColumn = screen.getByText('Name').closest('div')
    fireEvent.click(nameColumn!)

    expect(mockColumnVisibility.toggleColumn).toHaveBeenCalledWith('name')
  })

  it('should call toggleColumn when clicking checkbox', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]) // First checkbox (should be for 'name')

    expect(mockColumnVisibility.toggleColumn).toHaveBeenCalledWith('name')
  })

  it('should call showAll when Show All button is clicked', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    const showAllButton = screen.getByText('Show All')
    fireEvent.click(showAllButton)

    expect(mockColumnVisibility.showAll).toHaveBeenCalled()
  })

  it('should call hideAll when Hide All button is clicked', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    const hideAllButton = screen.getByText('Hide All')
    fireEvent.click(hideAllButton)

    expect(mockColumnVisibility.hideAll).toHaveBeenCalled()
  })

  it('should call resetToDefaults when Reset button is clicked', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)

    expect(mockColumnVisibility.resetToDefaults).toHaveBeenCalled()
  })

  it('should close dropdown when clicking outside', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <div>
        <ColumnVisibilityControl
          columns={mockColumns}
          columnVisibility={mockColumnVisibility}
        />
        <div data-testid="outside">Outside element</div>
      </div>,
    )

    const button = screen.getByText('Columns (3/4)')
    fireEvent.click(button)

    expect(screen.getByText('Show All')).toBeInTheDocument()

    const outsideElement = screen.getByTestId('outside')
    fireEvent.mouseDown(outsideElement)

    expect(screen.queryByText('Show All')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    const { container } = render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
        className="custom-class"
      />,
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should show correct count when all columns are visible', () => {
    const mockColumnVisibility = createMockColumnVisibility({
      isColumnVisible: vi.fn(() => true),
    })

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    expect(screen.getByText('Columns (4/4)')).toBeInTheDocument()
  })

  it('should show message when no toggleable columns exist', () => {
    const alwaysVisibleColumns: ColumnDefinition[] = [
      { key: 'actions1', label: 'Actions 1', alwaysVisible: true },
      { key: 'actions2', label: 'Actions 2', alwaysVisible: true },
    ]

    const mockColumnVisibility = createMockColumnVisibility({
      isColumnVisible: vi.fn(() => true),
    })

    render(
      <ColumnVisibilityControl
        columns={alwaysVisibleColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (2/2)')
    fireEvent.click(button)

    expect(
      screen.getByText('All columns are always visible'),
    ).toBeInTheDocument()
  })

  it('should rotate chevron icon when dropdown is open', () => {
    const mockColumnVisibility = createMockColumnVisibility()

    render(
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={mockColumnVisibility}
      />,
    )

    const button = screen.getByText('Columns (3/4)')
    const chevron = button.querySelector('svg:last-child')

    expect(chevron).not.toHaveClass('rotate-180')

    fireEvent.click(button)

    expect(chevron).toHaveClass('rotate-180')
  })
})
