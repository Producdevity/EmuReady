import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import storageKeys from '@/data/storageKeys'
import toast from '@/lib/toast'
import { useLastEmulatorSettings } from './useLastEmulatorSettings'
import { createLastEmulatorSettings } from '../shared/settings'
import { createStorage, customField, emulatorId, fieldId, userId } from '../tests/fixtures'

vi.mock('@/lib/toast', () => ({ default: { warning: vi.fn() } }))
const key = `${storageKeys.newListing.lastUsedEmulatorSettings}:${userId}:${emulatorId}`
const values = [{ customFieldDefinitionId: fieldId(10), value: '1.2.3' }]
const storage = createStorage()
Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
const props: Parameters<typeof useLastEmulatorSettings>[0] = {
  userId,
  emulatorId,
  fields: [customField(10)],
  enabled: true,
  values: [],
  blocked: false,
}

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
})

it('loads settings only for the current account and emulator', async () => {
  window.localStorage.setItem(key, JSON.stringify(createLastEmulatorSettings(values)))
  const view = renderHook(useLastEmulatorSettings, { initialProps: props })
  await waitFor(() => expect(view.result.current.available).toBe(true))
  view.rerender({ ...props, userId: fieldId(20) })
  expect(view.result.current.available).toBe(false)
  expect(view.result.current.reusable).toEqual([])
  view.rerender({ ...props, emulatorId: fieldId(21) })
  expect(view.result.current.available).toBe(false)
})

it('never reads or writes an anonymous settings key', () => {
  const read = vi.spyOn(storage, 'getItem')
  const write = vi.spyOn(storage, 'setItem')
  try {
    const view = renderHook(() => useLastEmulatorSettings({ ...props, userId: undefined }))
    act(() => view.result.current.remember(userId, emulatorId, values))
    expect(read).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  } finally {
    read.mockRestore()
    write.mockRestore()
  }
})

it('retains the submitted account and emulator scope when selection changes during a request', () => {
  const view = renderHook(useLastEmulatorSettings, { initialProps: props })
  const rememberSubmission = view.result.current.remember
  view.rerender({ ...props, emulatorId: fieldId(21) })
  act(() => rememberSubmission(userId, emulatorId, values))
  expect(JSON.parse(window.localStorage.getItem(key) ?? '{}')).toEqual(
    createLastEmulatorSettings(values),
  )
  expect(view.result.current.available).toBe(false)
})

it('does not save a response belonging to another author', () => {
  const view = renderHook(() => useLastEmulatorSettings(props))
  act(() => view.result.current.remember(fieldId(20), emulatorId, values))
  expect(window.localStorage.getItem(key)).toBeNull()
})

it('guards edited or imported settings and checks the current draft again on apply', async () => {
  window.localStorage.setItem(key, JSON.stringify(createLastEmulatorSettings(values)))
  const view = renderHook(useLastEmulatorSettings, { initialProps: props })
  await waitFor(() => expect(view.result.current.available).toBe(true))
  expect(view.result.current.apply([], true)).toBeNull()
  expect(
    view.result.current.apply([{ customFieldDefinitionId: fieldId(10), value: 'Manual' }], false),
  ).toBeNull()
  view.rerender({ ...props, blocked: true })
  expect(view.result.current.available).toBe(false)
  expect(view.result.current.apply([], false)).toBeNull()
})

it('does not throw after a successful report if browser storage is full', () => {
  const view = renderHook(() => useLastEmulatorSettings(props))
  const write = vi.spyOn(storage, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage is full', 'QuotaExceededError')
  })
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    expect(() => act(() => view.result.current.remember(userId, emulatorId, values))).not.toThrow()
    expect(toast.warning).toHaveBeenCalledWith(
      'Report submitted, but your last emulator settings could not be saved.',
    )
  } finally {
    write.mockRestore()
    warn.mockRestore()
  }
})
