import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewPcListingPage from '@/app/pc-listings/new/NewPcListingPage'
import storageKeys from '@/data/storageKeys'
import { createLastEmulatorSettings } from '@/features/reports/last-settings/shared/settings'
import {
  createStorage,
  customField,
  emulatorId,
  fieldId,
  userId,
} from '@/features/reports/last-settings/tests/fixtures'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import { ApprovalStatus, CustomFieldType } from '@orm'
import NewListingPage from './NewListingPage'
import type * as Clerk from '@clerk/nextjs'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  handheld:
    vi.fn<
      (
        input: RouterInput['listings']['create'],
      ) => Promise<
        Pick<
          RouterOutput['listings']['create'],
          'id' | 'authorId' | 'emulatorId' | 'gameId' | 'deviceId' | 'performanceId'
        >
      >
    >(),
  pc: vi.fn<
    (
      input: RouterInput['pcListings']['create'],
    ) => Promise<Pick<RouterOutput['pcListings']['create'], 'id' | 'authorId' | 'emulatorId'>>
  >(),
  invalidate: vi.fn(),
}))
const storage = createStorage()
Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
const game = {
  id: fieldId(30),
  title: 'Test game',
  system: { id: fieldId(31), name: 'Test system' },
  status: ApprovalStatus.APPROVED,
}
const emulator = { id: emulatorId, name: 'Test Emulator', systems: [game.system], logo: null }
const device = {
  id: fieldId(32),
  modelName: 'Test device',
  brand: { id: fieldId(33), name: 'Test brand' },
  soc: { id: fieldId(34), name: 'Test chip', manufacturer: 'Test manufacturer' },
}
const cpu = {
  id: fieldId(35),
  modelName: 'Test CPU',
  brand: { id: fieldId(33), name: 'Test brand' },
}
const performance = [{ id: 1, label: 'Perfect', rank: 5, description: null }]
const driverData = { releases: [], rateLimited: false, errorMessage: null }
const fields = [
  customField(10, CustomFieldType.TEXT, { label: 'Emulator Version' }),
  customField(11, CustomFieldType.BOOLEAN, { label: 'Enable feature', defaultValue: true }),
  customField(12, CustomFieldType.RANGE, {
    label: 'Scale',
    rangeMin: 0,
    rangeMax: 10,
    defaultValue: 5,
  }),
]
let definitions = fields.map((field) => ({ ...field, emulator, category: null }))
const values = [
  { customFieldDefinitionId: fieldId(10), value: '1.2.3' },
  { customFieldDefinitionId: fieldId(11), value: false },
  { customFieldDefinitionId: fieldId(12), value: 0 },
]
const settingsKey = `${storageKeys.newListing.lastUsedEmulatorSettings}:${userId}:${emulatorId}`
const utils = {
  emulators: { get: { fetch: vi.fn(async () => ({ emulators: [emulator] })) } },
  games: {
    get: { fetch: vi.fn(async () => ({ games: [game] })) },
    byId: { invalidate: mocks.invalidate },
  },
  devices: { options: { fetch: vi.fn(async () => ({ devices: [device] })) } },
  cpus: { options: { fetch: vi.fn(async () => ({ cpus: [cpu] })) } },
  gpus: { options: { fetch: vi.fn(async () => ({ gpus: [] })) } },
  listings: { get: { invalidate: mocks.invalidate } },
  pcListings: { get: { invalidate: mocks.invalidate } },
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams('gameId=00000000-0000-4000-a000-000000000030'),
}))
vi.mock('@clerk/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof Clerk>()),
  useAuth: () => ({ isLoaded: true }),
}))
vi.mock('@/lib/toast', () => ({ default: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/analytics', () => ({
  default: { listing: { created: vi.fn() }, conversion: { goalCompleted: vi.fn() } },
}))
vi.mock('@/lib/dynamic-imports', async () => ({
  MarkdownEditor: (await import('@/components/ui/form/MarkdownEditor')).MarkdownEditor,
}))
vi.mock('@/features/human-verification/client', () => ({
  useSubmitWithHumanVerification: () =>
    async function submit<T>(operation: (token?: string) => Promise<T>) {
      return operation()
    },
}))
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => utils,
    users: { me: { useQuery: () => ({ data: { id: userId }, isLoading: false }) } },
    games: { byId: { useQuery: () => ({ data: game }) } },
    customFieldDefinitions: {
      getByEmulator: {
        useQuery: (input: { emulatorId: string }) => ({
          data: input.emulatorId ? definitions : undefined,
          isPending: !input.emulatorId,
          isSuccess: Boolean(input.emulatorId),
          isFetching: false,
        }),
      },
    },
    listings: {
      driverVersions: { useQuery: () => ({ data: driverData, isLoading: false }) },
      performanceScales: { useQuery: () => ({ data: performance }) },
      create: { useMutation: () => ({ mutateAsync: mocks.handheld, isPending: false }) },
    },
    performanceScales: { get: { useQuery: () => ({ data: performance }) } },
    pcListings: {
      presets: { get: { useQuery: () => ({ data: [] }) } },
      create: { useMutation: () => ({ mutateAsync: mocks.pc, isPending: false }) },
    },
  },
}))

beforeEach(() => {
  storage.clear()
  vi.clearAllMocks()
  emulator.name = 'Test Emulator'
  definitions = fields.map((field) => ({ ...field, emulator, category: null }))
  mocks.invalidate.mockResolvedValue(undefined)
  mocks.handheld
    .mockReset()
    .mockImplementation(async (input: RouterInput['listings']['create']) => ({
      ...input,
      id: fieldId(40),
      authorId: userId,
    }))
  mocks.pc.mockReset().mockImplementation(async (input: RouterInput['pcListings']['create']) => ({
    ...input,
    id: fieldId(40),
    authorId: userId,
  }))
})

async function chooseOption(placeholder: RegExp, query: string, option: RegExp) {
  const input = await screen.findByPlaceholderText(placeholder)
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: query } })
  const match = await screen.findByRole('option', { name: option })
  await act(async () => {
    fireEvent.mouseDown(match)
  })
}

async function prepareForm(kind: 'handheld' | 'pc') {
  const view = render(kind === 'handheld' ? <NewListingPage /> : <NewPcListingPage />)
  await chooseOption(/Search for emulators/, emulator.name, new RegExp(emulator.name))
  await screen.findByLabelText('Emulator Version')
  if (kind === 'handheld') await chooseOption(/Search for a device/, 'Test', /Test device/)
  else {
    await chooseOption(/Select a CPU/, 'Test', /Test CPU/)
    fireEvent.change(screen.getByPlaceholderText(/Windows 11 Pro/), {
      target: { value: 'Windows 11' },
    })
  }
  const performanceSelect = screen.getByRole('option', { name: 'Perfect' }).closest('select')
  if (!performanceSelect) throw new Error('Performance selector is missing')
  fireEvent.change(performanceSelect, { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Keep these report notes' } })
  return view
}

describe.each(['handheld', 'pc'] as const)('%s last emulator settings', (kind) => {
  it('applies settings only on request and preserves the other report fields', async () => {
    storage.setItem(settingsKey, JSON.stringify(createLastEmulatorSettings(values)))
    await prepareForm(kind)
    expect(screen.getByLabelText('Emulator Version')).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: 'Enable feature' })).toBeChecked()
    expect(screen.getByRole('slider', { name: 'Scale' })).toHaveValue('5')
    fireEvent.click(await screen.findByRole('button', { name: 'Use last settings' }))
    expect(screen.getByLabelText('Emulator Version')).toHaveValue('1.2.3')
    expect(screen.getByRole('checkbox', { name: 'Enable feature' })).not.toBeChecked()
    expect(screen.getByRole('slider', { name: 'Scale' })).toHaveValue('0')
    expect(screen.getByLabelText('Notes')).toHaveValue('Keep these report notes')
    fireEvent.click(screen.getByRole('button', { name: 'Create Compatibility Report' }))
    const mutation = kind === 'handheld' ? mocks.handheld : mocks.pc
    await waitFor(() => expect(mutation).toHaveBeenCalledOnce())
    expect(mutation).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: game.id,
        emulatorId,
        performanceId: 1,
        notes: 'Keep these report notes',
        customFieldValues: values,
        ...(kind === 'handheld' ? { deviceId: device.id } : { cpuId: cpu.id, memorySize: 16 }),
      }),
    )
    await waitFor(() => expect(mocks.push).toHaveBeenCalled())
  })

  it('keeps manual custom settings instead of offering to overwrite them', async () => {
    storage.setItem(settingsKey, JSON.stringify(createLastEmulatorSettings(values)))
    await prepareForm(kind)
    await screen.findByRole('button', { name: 'Use last settings' })
    fireEvent.change(screen.getByLabelText('Emulator Version'), {
      target: { value: 'Manual version' },
    })
    expect(screen.queryByRole('button', { name: 'Use last settings' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Emulator Version')).toHaveValue('Manual version')
  })

  it('retains a manual draft when refreshed definitions reset form dirtiness', async () => {
    storage.setItem(settingsKey, JSON.stringify(createLastEmulatorSettings(values)))
    const view = await prepareForm(kind)
    fireEvent.change(screen.getByLabelText('Emulator Version'), {
      target: { value: 'Manual version' },
    })
    definitions = [
      ...definitions,
      {
        ...customField(13, CustomFieldType.TEXT, { label: 'New field' }),
        emulator,
        category: null,
      },
    ]
    view.rerender(kind === 'handheld' ? <NewListingPage /> : <NewPcListingPage />)
    await screen.findByLabelText('New field')
    expect(screen.getByLabelText('Emulator Version')).toHaveValue('Manual version')
    expect(screen.queryByRole('button', { name: 'Use last settings' })).not.toBeInTheDocument()
  })

  it('saves the submitted snapshot only after a successful report', async () => {
    await prepareForm(kind)
    const submitted = Promise.withResolvers<Awaited<ReturnType<typeof mocks.handheld>>>()
    const mutation = kind === 'handheld' ? mocks.handheld : mocks.pc
    mutation.mockImplementation(() => submitted.promise)
    fireEvent.change(screen.getByLabelText('Emulator Version'), {
      target: { value: 'Submitted version' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Compatibility Report' }))
    await waitFor(() => expect(mutation).toHaveBeenCalledOnce())
    expect(storage.getItem(settingsKey)).toBeNull()
    fireEvent.change(screen.getByLabelText('Emulator Version'), {
      target: { value: 'Later unsubmitted draft' },
    })
    await act(async () =>
      submitted.resolve({
        id: fieldId(40),
        authorId: userId,
        emulatorId,
        gameId: game.id,
        deviceId: device.id,
        performanceId: 1,
      }),
    )
    await waitFor(() => expect(mocks.push).toHaveBeenCalled())
    expect(JSON.parse(storage.getItem(settingsKey) ?? '{}')).toEqual({
      version: 1,
      values: [
        { customFieldDefinitionId: fieldId(10), value: 'Submitted version' },
        { customFieldDefinitionId: fieldId(11), value: true },
        { customFieldDefinitionId: fieldId(12), value: 5 },
      ],
    })
  })

  it('does not save values from a failed report', async () => {
    const previous = createLastEmulatorSettings(values)
    storage.setItem(settingsKey, JSON.stringify(previous))
    await prepareForm(kind)
    const mutation = kind === 'handheld' ? mocks.handheld : mocks.pc
    mutation.mockRejectedValueOnce(new Error('Report rejected'))
    fireEvent.change(screen.getByLabelText('Emulator Version'), {
      target: { value: 'Failed version' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Compatibility Report' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(JSON.parse(storage.getItem(settingsKey) ?? '{}')).toEqual(previous)
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('continues successful navigation when saving the snapshot fails', async () => {
    await prepareForm(kind)
    const write = vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Create Compatibility Report' }))
      await waitFor(() => expect(mocks.push).toHaveBeenCalled())
      expect(toast.success).toHaveBeenCalled()
      expect(toast.error).not.toHaveBeenCalled()
      expect(toast.warning).toHaveBeenCalledWith(
        'Report submitted, but your last emulator settings could not be saved.',
      )
    } finally {
      write.mockRestore()
      warn.mockRestore()
    }
  })
})

it('keeps an imported configuration instead of replacing it with saved settings', async () => {
  emulator.name = 'Eden'
  definitions[1].name = 'disk_shader_cache'
  storage.setItem(settingsKey, JSON.stringify(createLastEmulatorSettings(values)))
  await prepareForm('handheld')
  await screen.findByRole('button', { name: 'Use last settings' })
  const text = '[Renderer]\nuse_disk_shader_cache=true\n'
  const file = new File([text], 'config.ini', { type: 'text/plain' })
  Object.defineProperty(file, 'text', { value: async () => text })
  await act(async () => {
    fireEvent.change(screen.getByLabelText(/Import Eden config/), { target: { files: [file] } })
  })
  await screen.findByText(/Filled 0 fields/)
  expect(screen.getByRole('checkbox', { name: 'Enable feature' })).toBeChecked()
  expect(screen.queryByRole('button', { name: 'Use last settings' })).not.toBeInTheDocument()
})
