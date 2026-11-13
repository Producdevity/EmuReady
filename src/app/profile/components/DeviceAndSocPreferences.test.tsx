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
}))

vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({
      userPreferences: { get: { invalidate: mocks.invalidate } },
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
  saved = {
    ...saved,
    devicePreferences: deviceIds.map((id) => ({
      id: `pref-${id}`,
      deviceId: id,
      device: { id, modelName: id, brand: { id: 'brand-1', name: 'Brand' }, soc: null },
    })),
  }
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
      saveDevices(deviceIds)
      return []
    })
    mocks.devices.mockImplementationOnce(async ({ deviceIds }) => {
      await second.promise
      saveDevices(deviceIds)
      return []
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
    mocks.socs.mockImplementationOnce(async () => {
      await first.promise
      return []
    })
    mocks.devices.mockResolvedValue([])
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
})
