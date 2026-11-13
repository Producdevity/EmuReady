import { render, screen } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { type api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import DevicesPage from './DevicesPage'
import type DeviceViewModal from './components/DeviceViewModal'
import type * as UI from '@/components/ui'

type Device = RouterOutput['devices']['get']['devices'][number]
const selected: Device = {
  id: 'device-1',
  modelName: 'Selected device',
  brandId: 'brand-1',
  socId: null,
  brand: { id: 'brand-1', name: 'Brand', createdAt: new Date('2026-11-01') },
  soc: null,
  _count: { listings: 1 },
}
let devices: Device[] = []
let params = new URLSearchParams()
let byId: { data: RouterOutput['devices']['byId'] | undefined; isError: boolean }
const byIdQuery = vi.hoisted(() =>
  vi.fn<(...args: Parameters<typeof api.devices.byId.useQuery>) => typeof byId>(),
)

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => params,
}))
vi.mock('@/hooks', () => ({ useColumnVisibility: () => ({ isColumnVisible: () => false }) }))
vi.mock('@/lib/api', () => ({
  api: {
    devices: {
      get: { useQuery: () => ({ data: { devices }, isPending: false }) },
      byId: { useQuery: byIdQuery },
    },
  },
}))
vi.mock('@/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof UI>()),
  ColumnVisibilityControl: () => null,
}))
vi.mock('./components/DeviceViewModal', () => ({
  default: (props: ComponentProps<typeof DeviceViewModal>) =>
    props.isOpen && props.deviceData ? <div role="dialog">{props.deviceData.modelName}</div> : null,
}))

beforeEach(() => {
  devices = [selected]
  params = new URLSearchParams('deviceId=device-1')
  byId = { data: undefined, isError: false }
  byIdQuery.mockReset().mockImplementation(() => byId)
})

it('keeps the latest resolved device open while it leaves the current results', () => {
  const view = render(<DevicesPage />)
  expect(screen.getByRole('dialog')).toHaveTextContent('Selected device')
  expect(byIdQuery).toHaveBeenLastCalledWith({ id: 'device-1' }, { enabled: false })

  devices = []
  view.rerender(<DevicesPage />)
  expect(byIdQuery).toHaveBeenLastCalledWith({ id: 'device-1' }, { enabled: true })
  expect(screen.getByRole('dialog')).toHaveTextContent('Selected device')

  byId.data = { ...selected, modelName: 'Fetched device' }
  view.rerender(<DevicesPage />)
  expect(screen.getByRole('dialog')).toHaveTextContent('Fetched device')

  byId.data = undefined
  view.rerender(<DevicesPage />)
  expect(screen.getByRole('dialog')).toHaveTextContent('Fetched device')
})

it('does not show an old device after changing or removing its URL id, or a failed lookup', () => {
  const view = render(<DevicesPage />)
  params = new URLSearchParams('deviceId=another-device')
  view.rerender(<DevicesPage />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  params = new URLSearchParams('deviceId=device-1')
  devices = []
  byId.isError = true
  view.rerender(<DevicesPage />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  params = new URLSearchParams()
  view.rerender(<DevicesPage />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
