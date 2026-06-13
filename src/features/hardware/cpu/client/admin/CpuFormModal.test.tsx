import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CpuFormModal as CpuFormModalComponent } from './CpuFormModal'
import type { CpuDetail } from '../../shared/cpu.types'

const apiMocks = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  deviceBrandsUseQuery: vi.fn(),
  updateMutateAsync: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    cpus: {
      create: {
        useMutation: () => ({ mutateAsync: apiMocks.createMutateAsync, isPending: false }),
      },
      update: {
        useMutation: () => ({ mutateAsync: apiMocks.updateMutateAsync, isPending: false }),
      },
    },
    deviceBrands: {
      get: {
        useQuery: apiMocks.deviceBrandsUseQuery,
      },
    },
  },
}))

let CpuFormModal: typeof CpuFormModalComponent

const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CPU_ID = '00000000-0000-4000-a000-000000000001'

const cpu = {
  id: CPU_ID,
  modelName: 'Core i7-13700K',
  brand: {
    id: BRAND_ID,
    name: 'Intel',
  },
  pcListingCount: 3,
} satisfies CpuDetail

describe('CpuFormModal', () => {
  beforeAll(async () => {
    ;({ CpuFormModal } = await import('./CpuFormModal'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.createMutateAsync.mockResolvedValue(cpu)
    apiMocks.updateMutateAsync.mockResolvedValue(cpu)
    apiMocks.deviceBrandsUseQuery.mockReturnValue({
      data: [{ id: BRAND_ID, name: 'Intel' }],
    })
  })

  it('creates a CPU from the selected brand and model input', async () => {
    const onSuccess = vi.fn()
    render(<CpuFormModal isOpen onClose={vi.fn()} cpuData={null} onSuccess={onSuccess} />)

    fireEvent.focus(screen.getByPlaceholderText('Select a brand...'))
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'Intel' }))
    fireEvent.change(screen.getByPlaceholderText('e.g., Core i7-13700K'), {
      target: { value: '  Core   i7-13700K  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(apiMocks.createMutateAsync).toHaveBeenCalledWith({
        brandId: BRAND_ID,
        modelName: '  Core   i7-13700K  ',
      })
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('updates an existing CPU while preserving the selected brand id', async () => {
    const onSuccess = vi.fn()
    render(<CpuFormModal isOpen onClose={vi.fn()} cpuData={cpu} onSuccess={onSuccess} />)

    fireEvent.change(screen.getByPlaceholderText('e.g., Core i7-13700K'), {
      target: { value: 'Core i9-14900K' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(apiMocks.updateMutateAsync).toHaveBeenCalledWith({
        id: CPU_ID,
        brandId: BRAND_ID,
        modelName: 'Core i9-14900K',
      })
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('shows mutation errors without reporting success', async () => {
    const onSuccess = vi.fn()
    apiMocks.createMutateAsync.mockRejectedValueOnce(new Error('Duplicate CPU'))
    render(<CpuFormModal isOpen onClose={vi.fn()} cpuData={null} onSuccess={onSuccess} />)

    fireEvent.focus(screen.getByPlaceholderText('Select a brand...'))
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'Intel' }))
    fireEvent.change(screen.getByPlaceholderText('e.g., Core i7-13700K'), {
      target: { value: 'Core i7-13700K' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Duplicate CPU')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
