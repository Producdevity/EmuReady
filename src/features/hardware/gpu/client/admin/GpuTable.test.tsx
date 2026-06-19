import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GpuTable } from './GpuTable'
import type { GpuDetail } from '../../shared/gpu.types'

const gpu = {
  id: '00000000-0000-4000-a000-000000000001',
  modelName: 'GeForce RTX 4090',
  brand: {
    id: '00000000-0000-4000-a000-000000000002',
    name: 'NVIDIA',
  },
  pcListingCount: 3,
} satisfies GpuDetail

const visibleColumns = {
  isColumnVisible: () => true,
}

function renderTable(overrides: Partial<Parameters<typeof GpuTable>[0]> = {}) {
  return render(
    <GpuTable
      gpus={[gpu]}
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

describe('GpuTable', () => {
  it('renders stable GPU columns with PC Compatibility Report wording', () => {
    renderTable()

    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('GeForce RTX 4090')).toBeInTheDocument()
    expect(screen.getByText('PC Reports')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides mutation actions when the actor cannot manage devices', () => {
    renderTable({ canManageDevices: false })

    expect(screen.getByRole('button', { name: 'View GPU Details' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit GPU' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete GPU' })).not.toBeInTheDocument()
  })

  it('wires view, edit, delete, and sort interactions', () => {
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    const onSort = vi.fn()
    const onView = vi.fn()
    renderTable({ onDelete, onEdit, onSort, onView })

    fireEvent.click(screen.getByRole('button', { name: 'View GPU Details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit GPU' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete GPU' }))
    fireEvent.click(screen.getByText('Brand'))

    expect(onView).toHaveBeenCalledWith(gpu)
    expect(onEdit).toHaveBeenCalledWith(gpu)
    expect(onDelete).toHaveBeenCalledWith(gpu.id)
    expect(onSort).toHaveBeenCalledWith('brand')
  })
})
