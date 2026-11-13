import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState, type ComponentProps } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm'
import BrandModal from '../brands/components/BrandModal'
import CategoryFormModal from '../emulators/[emulatorId]/custom-fields/components/CategoryFormModal'
import PerformanceScaleModal from '../performance/components/PerformanceScaleModal'
import SocModal from '../socs/components/SocModal'
import SystemModal from '../systems/components/SystemModal'
import CreateBanModal from '../user-bans/components/CreateBanModal'
import EditVerifiedDeveloperModal from '../verified-developers/components/EditVerifiedDeveloperModal'
import VerifyDeveloperModal from '../verified-developers/components/VerifyDeveloperModal'
import type * as UI from '@/components/ui'
import type * as Form from '@/components/ui/form'

const mocks = vi.hoisted(() => ({ submitted: vi.fn(), completion: Promise.withResolvers<void>() }))
function useDeferredMutation() {
  const [isPending, setPending] = useState(false)
  async function mutateAsync(input: unknown) {
    mocks.submitted(input)
    setPending(true)
    try {
      await mocks.completion.promise
    } finally {
      setPending(false)
    }
  }
  return { mutateAsync, isPending }
}
vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: { id: 'clerk-user' } }) }))
vi.mock('@/lib/toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({
      users: { searchUsers: { fetch: vi.fn().mockResolvedValue([]) } },
      customFieldCategories: {
        getByEmulator: { invalidate: vi.fn().mockResolvedValue(undefined) },
      },
    }),
    users: {
      me: {
        useQuery: () => ({
          isSuccess: true,
          data: { role: Role.SUPER_ADMIN, permissions: [PERMISSIONS.MANAGE_USER_BANS] },
        }),
      },
      getUserById: {
        useQuery: () => ({
          data: {
            id: 'user-1',
            name: 'Target User',
            role: Role.USER,
            profileImage: null,
            trustScore: 10,
          },
        }),
      },
      searchUsers: { useQuery: () => ({ data: [], isFetching: false }) },
    },
    deviceBrands: {
      create: { useMutation: useDeferredMutation },
      update: { useMutation: useDeferredMutation },
    },
    systems: {
      create: { useMutation: useDeferredMutation },
      update: { useMutation: useDeferredMutation },
    },
    socs: {
      create: { useMutation: useDeferredMutation },
      update: { useMutation: useDeferredMutation },
    },
    customFieldCategories: {
      create: { useMutation: useDeferredMutation },
      update: { useMutation: useDeferredMutation },
    },
    userBans: { create: { useMutation: useDeferredMutation } },
    emulators: {
      get: {
        useQuery: () => ({ data: { emulators: [{ id: 'emulator-1', name: 'Emulator One' }] } }),
      },
    },
    performanceScales: {
      create: { useMutation: useDeferredMutation },
      update: { useMutation: useDeferredMutation },
    },
    verifiedDevelopers: {
      verifyDeveloper: { useMutation: useDeferredMutation },
      updateVerifiedDeveloper: { useMutation: useDeferredMutation },
    },
  },
}))
vi.mock('@/components/ui/form', async (importOriginal) => ({
  ...(await importOriginal<typeof Form>()),
  Autocomplete: (props: Pick<ComponentProps<typeof UI.Autocomplete>, 'onChange'>) => (
    <button type="button" onClick={() => props.onChange('user-1')}>
      Choose user
    </button>
  ),
}))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.completion = Promise.withResolvers<void>()
})

const cases = [
  'performance',
  'developer',
  'brand',
  'system',
  'soc',
  'category',
  'ban',
  'editDeveloper',
] as const
it.each(
  cases.flatMap((kind) => [
    { kind, reopen: false },
    { kind, reopen: true },
  ]),
)('keeps $kind submission state across a reopen=$reopen session', async ({ kind, reopen }) => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  function view(isOpen: boolean) {
    const callbacks = { isOpen, onClose, onSuccess }
    switch (kind) {
      case 'performance':
        return (
          <PerformanceScaleModal
            {...callbacks}
            editId={1}
            scale={{ id: 1, label: 'Perfect', rank: 1, description: 'Description' }}
          />
        )
      case 'developer':
        return <VerifyDeveloperModal {...callbacks} />
      case 'brand':
        return <BrandModal {...callbacks} editId="brand-1" brandName="Brand" />
      case 'system':
        return (
          <SystemModal
            {...callbacks}
            editId="system-1"
            systemName="Switch 2"
            systemKey="nintendo_switch_2"
          />
        )
      case 'soc':
        return (
          <SocModal
            {...callbacks}
            editId="soc-1"
            socData={{
              id: 'soc-1',
              name: 'Snapdragon',
              manufacturer: 'Qualcomm',
              architecture: 'ARM64',
              processNode: null,
              cpuCores: 8,
              gpuModel: null,
              createdAt: new Date('2026-01-01'),
              _count: { devices: 1 },
            }}
          />
        )
      case 'category':
        return <CategoryFormModal {...callbacks} emulatorId="emulator-1" />
      case 'ban':
        return <CreateBanModal {...callbacks} userId="user-1" />
      case 'editDeveloper':
        return (
          <EditVerifiedDeveloperModal
            {...callbacks}
            verifiedDeveloper={{
              id: 'verification-1',
              emulatorId: 'emulator-1',
              notes: '',
              user: { name: 'Developer', email: 'developer@example.com' },
            }}
          />
        )
    }
  }
  const rendered = render(view(true))
  if (kind === 'developer') {
    fireEvent.click(screen.getByRole('button', { name: 'Choose user' }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'emulator-1' } })
  }
  if (kind === 'category')
    fireEvent.change(screen.getByLabelText('Category Name'), { target: { value: 'Graphics' } })
  if (kind === 'ban')
    fireEvent.change(
      screen.getByPlaceholderText('Provide a clear reason for banning this user...'),
      { target: { value: 'Spam' } },
    )
  const submitLabel = {
    performance: 'Save',
    developer: 'Verify Developer',
    brand: 'Save',
    system: 'Save',
    soc: 'Save',
    category: 'Create',
    ban: 'Ban User Permanently',
    editDeveloper: 'Update',
  }[kind]
  fireEvent.click(screen.getByRole('button', { name: submitLabel }))
  await waitFor(() => expect(mocks.submitted).toHaveBeenCalledOnce())
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).not.toHaveBeenCalled()
  if (reopen) {
    rendered.rerender(view(false))
    rendered.rerender(view(true))
  }
  if (reopen && kind === 'ban')
    fireEvent.change(
      screen.getByPlaceholderText('Provide a clear reason for banning this user...'),
      { target: { value: 'New reason' } },
    )
  expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled()
  await act(async () => {
    mocks.completion.resolve()
  })
  expect(onSuccess).toHaveBeenCalledOnce()
  expect(onClose).toHaveBeenCalledTimes(reopen ? 0 : 1)
  expect(screen.getByRole('button', { name: submitLabel })).toBeEnabled()
})
