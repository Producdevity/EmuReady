import { render, screen } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DevicesPage from './devices/DevicesPage'
import EmulatorsPage from './emulators/EmulatorsPage'
import type DeviceViewModal from './devices/components/DeviceViewModal'
import type EmulatorViewModal from './emulators/components/EmulatorViewModal'

let query = new URLSearchParams()
let record: { id: string } | undefined
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => query,
}))
vi.mock('@/hooks', () => ({
  useColumnVisibility: () => ({
    visibleColumns: new Set(),
    isColumnVisible: () => true,
    toggleColumn: vi.fn(),
    showColumn: vi.fn(),
    hideColumn: vi.fn(),
    showAll: vi.fn(),
    hideAll: vi.fn(),
    resetToDefaults: vi.fn(),
    isHydrated: true,
  }),
}))
vi.mock('@/lib/api', () => ({
  api: {
    devices: {
      get: { useQuery: () => ({ data: { devices: [] }, isLoading: false, isError: false }) },
      byId: { useQuery: () => ({ data: record }) },
    },
    emulators: {
      get: { useQuery: () => ({ data: { emulators: [] }, isLoading: false, isError: false }) },
      byId: { useQuery: () => ({ data: record }) },
    },
  },
}))
vi.mock('./devices/components/DeviceViewModal', () => ({
  default: (props: ComponentProps<typeof DeviceViewModal>) =>
    props.isOpen && props.deviceData ? <div role="status">{props.deviceData.id}</div> : null,
}))
vi.mock('./emulators/components/EmulatorViewModal', () => ({
  default: (props: ComponentProps<typeof EmulatorViewModal>) =>
    props.isOpen && props.emulatorData ? <div role="status">{props.emulatorData.id}</div> : null,
}))
beforeEach(() => {
  record = undefined
})

describe.each([
  { name: 'device', key: 'deviceId', element: () => <DevicesPage /> },
  { name: 'emulator', key: 'emulatorId', element: () => <EmulatorsPage /> },
])('$name URL selection', (entry) => {
  it('does not show a previous record while another URL target loads', () => {
    query = new URLSearchParams({ [entry.key]: 'first' })
    record = { id: 'first' }
    const view = render(entry.element())
    expect(screen.getByRole('status')).toHaveTextContent('first')
    query = new URLSearchParams({ [entry.key]: 'second' })
    view.rerender(entry.element())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    record = { id: 'second' }
    view.rerender(entry.element())
    expect(screen.getByRole('status')).toHaveTextContent('second')
  })

  it('closes the dialog when its selection parameter is removed', () => {
    query = new URLSearchParams({ [entry.key]: 'first' })
    record = { id: 'first' }
    const view = render(entry.element())
    query = new URLSearchParams()
    view.rerender(entry.element())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
