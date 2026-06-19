import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GpuFormModal as GpuFormModalComponent } from './GpuFormModal'
import type { GpuDetail } from '../../shared/gpu.types'

const apiMocks = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  deviceBrandsUseQuery: vi.fn(),
  updateMutateAsync: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    gpus: {
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

let GpuFormModal: typeof GpuFormModalComponent

const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const GPU_ID = '00000000-0000-4000-a000-000000000001'

const gpu = {
  id: GPU_ID,
  modelName: 'GeForce RTX 4090',
  brand: {
    id: BRAND_ID,
    name: 'NVIDIA',
  },
  pcListingCount: 3,
} satisfies GpuDetail

describe('GpuFormModal', () => {
  beforeAll(async () => {
    ;({ GpuFormModal } = await import('./GpuFormModal'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.createMutateAsync.mockResolvedValue(gpu)
    apiMocks.updateMutateAsync.mockResolvedValue(gpu)
    apiMocks.deviceBrandsUseQuery.mockReturnValue({
      data: [{ id: BRAND_ID, name: 'NVIDIA' }],
    })
  })

  it('creates a GPU from the selected brand and model input', async () => {
    const onSuccess = vi.fn()
    render(<GpuFormModal isOpen onClose={vi.fn()} gpuData={null} onSuccess={onSuccess} />)

    fireEvent.focus(screen.getByPlaceholderText('Select a brand...'))
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'NVIDIA' }))
    fireEvent.change(screen.getByPlaceholderText('e.g., GeForce RTX 4090'), {
      target: { value: '  GeForce   RTX 4090  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => {
      expect(apiMocks.createMutateAsync).toHaveBeenCalledWith({
        brandId: BRAND_ID,
        modelName: '  GeForce   RTX 4090  ',
      })
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('updates an existing GPU while preserving the selected brand id', async () => {
    const onSuccess = vi.fn()
    render(<GpuFormModal isOpen onClose={vi.fn()} gpuData={gpu} onSuccess={onSuccess} />)

    fireEvent.change(screen.getByPlaceholderText('e.g., GeForce RTX 4090'), {
      target: { value: 'GeForce RTX 4080' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(apiMocks.updateMutateAsync).toHaveBeenCalledWith({
        id: GPU_ID,
        brandId: BRAND_ID,
        modelName: 'GeForce RTX 4080',
      })
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('shows mutation errors without reporting success', async () => {
    const onSuccess = vi.fn()
    apiMocks.createMutateAsync.mockRejectedValueOnce(new Error('Duplicate GPU'))
    render(<GpuFormModal isOpen onClose={vi.fn()} gpuData={null} onSuccess={onSuccess} />)

    fireEvent.focus(screen.getByPlaceholderText('Select a brand...'))
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'NVIDIA' }))
    fireEvent.change(screen.getByPlaceholderText('e.g., GeForce RTX 4090'), {
      target: { value: 'GeForce RTX 4090' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Duplicate GPU')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
