import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ColumnVisibilityControl } from '@/components/ui'
import {
  type useColumnVisibility,
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'

vi.mock('@/hooks/useColumnVisibility')

const mockColumns: ColumnDefinition[] = [
  { key: 'game', label: 'Game', defaultVisible: true },
  { key: 'system', label: 'System', defaultVisible: true },
  { key: 'device', label: 'Device', defaultVisible: true },
  { key: 'emulator', label: 'Emulator', defaultVisible: true },
  { key: 'performance', label: 'Performance', defaultVisible: true },
  { key: 'successRate', label: 'Success Rate', defaultVisible: true },
  { key: 'author', label: 'Author', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

// Simple test component that mimics the listings table structure
function TestListingsTable(props: {
  columnVisibility: ReturnType<typeof useColumnVisibility>
}) {
  return (
    <div>
      <ColumnVisibilityControl
        columns={mockColumns}
        columnVisibility={props.columnVisibility}
      />

      <table>
        <thead>
          <tr>
            {props.columnVisibility.isColumnVisible('game') && <th>Game</th>}
            {props.columnVisibility.isColumnVisible('system') && (
              <th>System</th>
            )}
            {props.columnVisibility.isColumnVisible('device') && (
              <th>Device</th>
            )}
            {props.columnVisibility.isColumnVisible('emulator') && (
              <th>Emulator</th>
            )}
            {props.columnVisibility.isColumnVisible('performance') && (
              <th>Performance</th>
            )}
            {props.columnVisibility.isColumnVisible('successRate') && (
              <th>Success Rate</th>
            )}
            {props.columnVisibility.isColumnVisible('author') && (
              <th>Author</th>
            )}
            {props.columnVisibility.isColumnVisible('actions') && (
              <th>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            {props.columnVisibility.isColumnVisible('game') && (
              <td>Test Game</td>
            )}
            {props.columnVisibility.isColumnVisible('system') && (
              <td>Test System</td>
            )}
            {props.columnVisibility.isColumnVisible('device') && (
              <td>Test Device</td>
            )}
            {props.columnVisibility.isColumnVisible('emulator') && (
              <td>Test Emulator</td>
            )}
            {props.columnVisibility.isColumnVisible('performance') && (
              <td>Perfect</td>
            )}
            {props.columnVisibility.isColumnVisible('successRate') && (
              <td>95%</td>
            )}
            {props.columnVisibility.isColumnVisible('author') && (
              <td>Test Author</td>
            )}
            {props.columnVisibility.isColumnVisible('actions') && (
              <td>View | Delete</td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function makeMockColumnVisibility(
  overrides: Partial<ReturnType<typeof useColumnVisibility>> = {},
): ReturnType<typeof useColumnVisibility> {
  const base = {
    visibleColumns: new Set([
      'game',
      'system',
      'device',
      'emulator',
      'performance',
      'successRate',
      'author',
      'actions',
    ]),
    isColumnVisible: vi.fn((key: string) => {
      if (key === 'actions') return true // alwaysVisible
      if (key === 'author') return false // defaultVisible: false
      return [
        'game',
        'system',
        'device',
        'emulator',
        'performance',
        'successRate',
      ].includes(key)
    }),
    toggleColumn: vi.fn(),
    showColumn: vi.fn(),
    hideColumn: vi.fn(),
    resetToDefaults: vi.fn(),
    showAll: vi.fn(),
    hideAll: vi.fn(),
    isHydrated: true,
  }

  return {
    ...base,
    ...overrides,
    isHydrated: overrides.isHydrated ?? true,
  }
}

describe('Listings Table Column Visibility Integration', () => {
  it('should show default visible columns and hide author column by default', () => {
    const mockColumnVisibility = makeMockColumnVisibility({
      visibleColumns: new Set([
        'game',
        'system',
        'device',
        'emulator',
        'performance',
        'successRate',
        'actions',
      ]),
    })

    render(<TestListingsTable columnVisibility={mockColumnVisibility} />)

    // Should show default visible columns
    expect(screen.getByText('Game')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
    expect(screen.getByText('Device')).toBeInTheDocument()
    expect(screen.getByText('Emulator')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('Success Rate')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()

    // Should hide author column by default
    expect(screen.queryByText('Author')).not.toBeInTheDocument()
    expect(screen.queryByText('Test Author')).not.toBeInTheDocument()

    // Should show data for visible columns
    expect(screen.getByText('Test Game')).toBeInTheDocument()
    expect(screen.getByText('Test System')).toBeInTheDocument()
    expect(screen.getByText('Test Device')).toBeInTheDocument()
    expect(screen.getByText('Test Emulator')).toBeInTheDocument()
    expect(screen.getByText('Perfect')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('View | Delete')).toBeInTheDocument()
  })

  it('should show author column when made visible', () => {
    const mockColumnVisibility = makeMockColumnVisibility({
      isColumnVisible: vi.fn((key: string) => {
        if (key === 'actions') return true // alwaysVisible
        return [
          'game',
          'system',
          'device',
          'emulator',
          'performance',
          'successRate',
          'author',
        ].includes(key)
      }),
    })

    render(<TestListingsTable columnVisibility={mockColumnVisibility} />)

    // Should show author column when visible
    expect(screen.getByText('Author')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
  })

  it('should hide columns when they are made invisible', () => {
    const mockColumnVisibility = makeMockColumnVisibility({
      visibleColumns: new Set(['game', 'actions']), // Only game and actions visible
      isColumnVisible: vi.fn((key: string) => {
        if (key === 'actions') return true // alwaysVisible
        return key === 'game'
      }),
    })

    render(<TestListingsTable columnVisibility={mockColumnVisibility} />)

    // Should show only game and actions columns
    expect(screen.getByText('Game')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('Test Game')).toBeInTheDocument()
    expect(screen.getByText('View | Delete')).toBeInTheDocument()

    // Should hide other columns
    expect(screen.queryByText('System')).not.toBeInTheDocument()
    expect(screen.queryByText('Device')).not.toBeInTheDocument()
    expect(screen.queryByText('Emulator')).not.toBeInTheDocument()
    expect(screen.queryByText('Performance')).not.toBeInTheDocument()
    expect(screen.queryByText('Success Rate')).not.toBeInTheDocument()
    expect(screen.queryByText('Author')).not.toBeInTheDocument()

    // Should hide corresponding data
    expect(screen.queryByText('Test System')).not.toBeInTheDocument()
    expect(screen.queryByText('Test Device')).not.toBeInTheDocument()
    expect(screen.queryByText('Test Emulator')).not.toBeInTheDocument()
    expect(screen.queryByText('Perfect')).not.toBeInTheDocument()
    expect(screen.queryByText('95%')).not.toBeInTheDocument()
    expect(screen.queryByText('Test Author')).not.toBeInTheDocument()
  })

  it('should always show actions column even when hideAll is called', () => {
    const mockColumnVisibility = makeMockColumnVisibility({
      visibleColumns: new Set(['actions']), // Only actions visible (alwaysVisible)
      isColumnVisible: vi.fn((key: string) => {
        return key === 'actions' // Only actions is visible
      }),
    })

    render(<TestListingsTable columnVisibility={mockColumnVisibility} />)

    // Should show actions column (alwaysVisible)
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('View | Delete')).toBeInTheDocument()

    // Should hide all other columns
    expect(screen.queryByText('Game')).not.toBeInTheDocument()
    expect(screen.queryByText('System')).not.toBeInTheDocument()
    expect(screen.queryByText('Device')).not.toBeInTheDocument()
    expect(screen.queryByText('Emulator')).not.toBeInTheDocument()
    expect(screen.queryByText('Performance')).not.toBeInTheDocument()
    expect(screen.queryByText('Success Rate')).not.toBeInTheDocument()
    expect(screen.queryByText('Author')).not.toBeInTheDocument()
  })

  it('should call toggleColumn when column visibility control is used', () => {
    const mockColumnVisibility = makeMockColumnVisibility()

    render(<TestListingsTable columnVisibility={mockColumnVisibility} />)

    // Open the column visibility dropdown
    const button = screen.getByText(/Columns \(\d+\/\d+\)/)
    fireEvent.click(button)

    // Click on a column to toggle it
    const authorColumn = screen.getByText('Author').closest('div')
    fireEvent.click(authorColumn!)

    expect(mockColumnVisibility.toggleColumn).toHaveBeenCalledWith('author')
  })
})
