import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import DeviceAndSocPreferences from './DeviceAndSocPreferences'
import type DeviceMultiSelect from '@/features/hardware/device/client/components/DeviceMultiSelect'

type Preferences = RouterOutput['userPreferences']['get']
type DeviceInput = RouterInput['userPreferences']['bulkUpdateDevices']
type SocInput = RouterInput['userPreferences']['bulkUpdateSocs']
type DeviceResult = RouterOutput['userPreferences']['bulkUpdateDevices']
type SocResult = RouterOutput['userPreferences']['bulkUpdateSocs']

const mocks = vi.hoisted(() => ({
  devices: vi.fn<(input: DeviceInput) => Promise<DeviceResult>>(),
  socs: vi.fn<(input: SocInput) => Promise<SocResult>>(),
  invalidate: vi.fn(),
  setData:
    vi.fn<
      (
        input: undefined,
        update: (current: Preferences | undefined) => Preferences | undefined,
      ) => void
    >(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({
      userPreferences: { get: { invalidate: mocks.invalidate, setData: mocks.setData } },
      users: { me: { invalidate: vi.fn() } },
      listings: { get: { invalidate: vi.fn() } },
    }),
    userPreferences: {
      update: { useMutation: () => ({ mutate: vi.fn() }) },
      bulkUpdateDevices: {
        useMutation: (options: UseMutationOptions<DeviceResult, Error, DeviceInput>) =>
          useMutation({ ...options, mutationFn: mocks.devices }),
      },
      bulkUpdateSocs: {
        useMutation: (options: UseMutationOptions<SocResult, Error, SocInput>) =>
          useMutation({ ...options, mutationFn: mocks.socs }),
      },
    },
  },
}))
vi.mock('@/lib/toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/analytics', () => ({ default: { user: { preferencesUpdated: vi.fn() } } }))
vi.mock('@/features/hardware/device/client/components/DeviceMultiSelect', () => ({
  default: Selection,
}))
vi.mock('@/features/hardware/soc/client/components/SocMultiSelect', () => ({ default: Selection }))

function Selection(props: ComponentProps<typeof DeviceMultiSelect>) {
  const prefix = props.label === 'Preferred devices' ? 'device' : 'soc'
  return (
    <div>
      <output data-testid={prefix}>{props.value.join(',')}</output>
      <button
        onClick={() => props.onChange([...props.value, `${prefix}-${props.value.length + 1}`], [])}
      >
        Add {prefix}
      </button>
      <button onClick={() => props.onChange(props.value.slice(0, -1), [])}>Remove {prefix}</button>
    </div>
  )
}

const initialPreferences = {
  id: 'user-1',
  bio: null,
  defaultToUserDevices: false,
  defaultToUserSocs: false,
  notifyOnNewListings: true,
  showNsfw: false,
  lastUsedDeviceId: null,
  profilePublic: true,
  showActivityInFeed: true,
  showVotingActivity: true,
  allowFollows: true,
  allowFriendRequests: true,
  followersVisible: true,
  followingVisible: true,
  bookmarksVisible: true,
  followedGamesVisible: true,
  devicePreferences: [],
  socPreferences: [],
} satisfies Preferences

let saved: Preferences = initialPreferences

function saveDevices(deviceIds: string[]) {
  const createdAt = new Date('2026-01-01T00:00:00Z')
  const rows: DeviceResult = deviceIds.map((id) => ({
    id: `pref-${id}`,
    userId: 'user-1',
    deviceId: id,
    createdAt,
    device: {
      id,
      brandId: 'brand-1',
      modelName: id,
      socId: null,
      brand: { id: 'brand-1', name: 'Brand', createdAt },
      soc: null,
    },
  }))
  saved = {
    ...saved,
    devicePreferences: rows,
  }
  return rows
}

function saveSocs(socIds: string[]) {
  const createdAt = new Date('2026-01-01T00:00:00Z')
  const rows: SocResult = socIds.map((id) => ({
    id: `pref-${id}`,
    userId: 'user-1',
    socId: id,
    createdAt,
    updatedAt: createdAt,
    soc: {
      id,
      name: id,
      manufacturer: 'Manufacturer',
      architecture: null,
      processNode: null,
      cpuCores: null,
      gpuModel: null,
      createdAt,
    },
  }))
  saved = { ...saved, socPreferences: rows }
  return rows
}

function Harness() {
  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => saved,
    initialData: initialPreferences,
    staleTime: Infinity,
  })
  return <DeviceAndSocPreferences preferencesQuery={preferencesQuery} />
}

function renderPreferences() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  mocks.invalidate.mockImplementation(() => client.invalidateQueries({ queryKey: ['preferences'] }))
  mocks.setData.mockImplementation((_input, update) => {
    client.setQueryData<Preferences>(['preferences'], update)
  })
  return render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  )
}

describe('async hardware preference saves', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.devices.mockReset()
    mocks.socs.mockReset()
    saved = initialPreferences
  })

  it('keeps a later selection visible while earlier responses arrive, and serializes writes', async () => {
    const first = Promise.withResolvers<void>()
    const second = Promise.withResolvers<void>()
    mocks.devices.mockImplementationOnce(async ({ deviceIds }) => {
      await first.promise
      return saveDevices(deviceIds)
    })
    mocks.devices.mockImplementationOnce(async ({ deviceIds }) => {
      await second.promise
      return saveDevices(deviceIds)
    })
    renderPreferences()

    fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
    await waitFor(() => expect(mocks.devices).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
    expect(screen.getByTestId('device')).toHaveTextContent('device-1,device-2')
    expect(mocks.devices).toHaveBeenCalledTimes(1)

    await act(async () => first.resolve())
    await waitFor(() => expect(mocks.devices).toHaveBeenCalledTimes(2))
    expect(screen.getByTestId('device')).toHaveTextContent('device-1,device-2')
    expect(mocks.devices).toHaveBeenLastCalledWith(
      { deviceIds: ['device-1', 'device-2'] },
      expect.anything(),
    )
    await act(async () => second.resolve())
    await waitFor(() => expect(saved.devicePreferences).toHaveLength(2))
    expect(screen.getByTestId('device')).toHaveTextContent('device-1,device-2')
  })

  it('shares the save scope between device and SoC preferences', async () => {
    const first = Promise.withResolvers<void>()
    mocks.socs.mockImplementationOnce(async ({ socIds }) => {
      await first.promise
      return saveSocs(socIds)
    })
    mocks.devices.mockImplementation(async ({ deviceIds }) => saveDevices(deviceIds))
    renderPreferences()
    fireEvent.click(screen.getByRole('button', { name: 'Add soc' }))
    await waitFor(() => expect(mocks.socs).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
    expect(mocks.devices).not.toHaveBeenCalled()
    await act(async () => first.resolve())
    await waitFor(() => expect(mocks.devices).toHaveBeenCalledTimes(1))
  })

  it('restores saved selection and reports a failed latest save', async () => {
    const gate = Promise.withResolvers<void>()
    mocks.devices.mockImplementationOnce(async () => {
      await gate.promise
      throw new Error('Save failed')
    })
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      renderPreferences()
      fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
      expect(screen.getByTestId('device')).toHaveTextContent('device-1')
      await act(async () => gate.resolve())
      await waitFor(() => expect(screen.getByTestId('device')).toBeEmptyDOMElement())
      expect(toast.error).toHaveBeenCalledWith('Failed to update device preferences: Save failed')
    } finally {
      errorLog.mockRestore()
    }
  })

  it.each(['success', 'error'] as const)(
    'keeps the latest selection when an older matching save completes with %s',
    async (outcome) => {
      const gates = [
        Promise.withResolvers<void>(),
        Promise.withResolvers<void>(),
        Promise.withResolvers<void>(),
      ]
      for (const gate of gates) {
        mocks.devices.mockImplementationOnce(async ({ deviceIds }) => {
          await gate.promise
          return saveDevices(deviceIds)
        })
      }
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        renderPreferences()
        fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
        await waitFor(() => expect(mocks.devices).toHaveBeenCalledTimes(1))
        fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
        fireEvent.click(screen.getByRole('button', { name: 'Remove device' }))

        await act(async () => {
          if (outcome === 'error') gates[0].reject(new Error('Older save failed'))
          else gates[0].resolve()
        })
        await waitFor(() => expect(mocks.devices).toHaveBeenCalledTimes(2))
        await act(async () => gates[1].resolve())
        await waitFor(() => expect(mocks.devices).toHaveBeenCalledTimes(3))

        expect(screen.getByTestId('device')).toHaveTextContent(/^device-1$/)
        await act(async () => gates[2].resolve())
        await waitFor(() => expect(saved.devicePreferences).toHaveLength(1))
        expect(screen.getByTestId('device')).toHaveTextContent(/^device-1$/)
      } finally {
        await act(async () => gates.forEach((gate) => gate.resolve()))
        errorLog.mockRestore()
      }
    },
  )

  it.each(['device', 'soc'] as const)(
    'keeps confirmed %s selections when preference refetching fails',
    async (kind) => {
      mocks.devices.mockImplementation(async ({ deviceIds }) => saveDevices(deviceIds))
      mocks.socs.mockImplementation(async ({ socIds }) => saveSocs(socIds))
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        renderPreferences()
        mocks.invalidate.mockRejectedValueOnce(new Error('Refetch unavailable'))
        fireEvent.click(screen.getByRole('button', { name: `Add ${kind}` }))
        await waitFor(() => expect(toast.success).toHaveBeenCalledOnce())

        expect(screen.getByTestId(kind)).toHaveTextContent(`${kind}-1`)
      } finally {
        errorLog.mockRestore()
      }
    },
  )
})
