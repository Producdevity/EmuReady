import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LOOKUP_PAGINATION } from '@/data/constants'
import { type RouterOutput } from '@/types/trpc'
import DeviceModal from './DeviceModal'

const mocks = vi.hoisted(() => ({
  socs: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))
const utilities = { socs: { options: { fetch: mocks.socs } } }

vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => utilities,
    deviceBrands: { get: { useQuery: () => ({ data: [{ id: 'brand-1', name: 'Brand' }] }) } },
    devices: {
      create: { useMutation: () => ({ mutateAsync: mocks.create, isPending: false }) },
      update: { useMutation: () => ({ mutateAsync: mocks.update, isPending: false }) },
    },
  },
}))

const device = {
  id: 'device-1',
  brandId: 'brand-1',
  modelName: 'Handheld',
  socId: 'selected-soc',
  brand: { id: 'brand-1', name: 'Brand', createdAt: new Date('2026-01-01') },
  soc: {
    id: 'selected-soc',
    name: 'Selected',
    manufacturer: 'Vendor',
    architecture: null,
    processNode: null,
    cpuCores: null,
    gpuModel: null,
    createdAt: new Date('2026-01-01'),
  },
  _count: { listings: 1 },
} satisfies RouterOutput['devices']['get']['devices'][number]

describe('device form async SoC lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socs.mockResolvedValue({ socs: [], hasMore: false })
    mocks.update.mockResolvedValue(device)
  })

  it('shows the current SoC even when it is outside the first lookup page', async () => {
    render(
      <DeviceModal
        isOpen
        editId={device.id}
        deviceData={device}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    expect(screen.getByDisplayValue('Vendor Selected')).toBeInTheDocument()
    await waitFor(() =>
      expect(mocks.socs).toHaveBeenCalledWith({
        search: undefined,
        limit: LOOKUP_PAGINATION.DEFAULT_LIMIT,
      }),
    )
    expect(mocks.socs).not.toHaveBeenCalledWith(
      expect.objectContaining({ limit: LOOKUP_PAGINATION.MAX_LIMIT }),
    )
  })

  it('searches the server and submits a SoC from later in the catalog', async () => {
    mocks.socs.mockImplementation(async ({ search }: { search?: string }) => ({
      socs:
        search === 'Rare' ? [{ id: 'rare-soc', name: 'Rare Chip', manufacturer: 'Vendor' }] : [],
      hasMore: false,
    }))
    render(
      <DeviceModal
        isOpen
        editId={device.id}
        deviceData={device}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText('SoC (Optional)'), { target: { value: 'Rare' } })
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'Vendor Rare Chip' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        id: device.id,
        brandId: device.brandId,
        modelName: device.modelName,
        socId: 'rare-soc',
      }),
    )
    expect(mocks.socs).toHaveBeenCalledWith({
      search: 'Rare',
      limit: LOOKUP_PAGINATION.DEFAULT_LIMIT,
    })
  })
})
