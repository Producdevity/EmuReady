import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CpuTable } from './CpuTable'
import type { CpuDetail } from '../../shared/cpu.types'

const cpu = {
  id: '00000000-0000-4000-a000-000000000001',
  modelName: 'Core i7-13700K',
  brand: {
    id: '00000000-0000-4000-a000-000000000002',
    name: 'Intel',
  },
  pcListingCount: 3,
} satisfies CpuDetail

const visibleColumns = {
  isColumnVisible: () => true,
}

function renderTable(overrides: Partial<Parameters<typeof CpuTable>[0]> = {}) {
  return render(
    <CpuTable
      cpus={[cpu]}
      hasQuery={false}
      canManageDevices
      isDeleting={false}
      columnVisibility={visibleColumns}
      sortField={null}
      sortDirection={null}
      onSort={vi.fn()}
      onView={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      {...overrides}
    />,
  )
}

describe('CpuTable', () => {
  it('renders stable CPU columns with PC Compatibility Report wording', () => {
    renderTable()

    expect(screen.getByText('Intel')).toBeInTheDocument()
    expect(screen.getByText('Core i7-13700K')).toBeInTheDocument()
    expect(screen.getByText('PC Reports')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides mutation actions when the actor cannot manage devices', () => {
    renderTable({ canManageDevices: false })

    expect(screen.getByRole('button', { name: 'View CPU Details' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit CPU' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete CPU' })).not.toBeInTheDocument()
  })

  it('wires view, edit, delete, and sort interactions', () => {
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    const onSort = vi.fn()
    const onView = vi.fn()
    renderTable({ onDelete, onEdit, onSort, onView })

    fireEvent.click(screen.getByRole('button', { name: 'View CPU Details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit CPU' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete CPU' }))
    fireEvent.click(screen.getByText('Brand'))

    expect(onView).toHaveBeenCalledWith(cpu)
    expect(onEdit).toHaveBeenCalledWith(cpu)
    expect(onDelete).toHaveBeenCalledWith(cpu.id)
    expect(onSort).toHaveBeenCalledWith('brand')
  })
})
