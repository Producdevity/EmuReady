import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState, type ComponentProps } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import PerformanceScaleModal from '../performance/components/PerformanceScaleModal'
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
vi.mock('@/lib/toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({ users: { searchUsers: { fetch: vi.fn().mockResolvedValue([]) } } }),
    emulators: {
      get: {
        useQuery: () => ({ data: { emulators: [{ id: 'emulator-1', name: 'Emulator One' }] } }),
      },
    },
    performanceScales: {
      create: { useMutation: useDeferredMutation },
      update: { useMutation: useDeferredMutation },
    },
    verifiedDevelopers: { verifyDeveloper: { useMutation: useDeferredMutation } },
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

it.each(['performance', 'developer'] as const)(
  'keeps a pending %s submission across sessions and closes only its own form',
  async (kind) => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    function view(isOpen: boolean) {
      return kind === 'performance' ? (
        <PerformanceScaleModal
          isOpen={isOpen}
          editId={1}
          scale={{ id: 1, label: 'Perfect', rank: 1, description: 'Description' }}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      ) : (
        <VerifyDeveloperModal isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} />
      )
    }
    const rendered = render(view(true))
    if (kind === 'developer') {
      fireEvent.click(screen.getByRole('button', { name: 'Choose user' }))
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'emulator-1' } })
    }
    const submitLabel = kind === 'performance' ? 'Save' : 'Verify Developer'
    fireEvent.click(screen.getByRole('button', { name: submitLabel }))
    await waitFor(() => expect(mocks.submitted).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    rendered.rerender(view(false))
    rendered.rerender(view(true))
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled()
    await act(async () => {
      mocks.completion.resolve()
    })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: submitLabel })).toBeEnabled()
  },
)
