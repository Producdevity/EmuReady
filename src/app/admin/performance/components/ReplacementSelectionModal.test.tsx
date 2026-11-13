import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReplacementSelectionModal from './ReplacementSelectionModal'
import type { RouterInput } from '@/types/trpc'

const mocks = vi.hoisted(() => ({ deleteScale: vi.fn() }))

vi.mock('@/lib/api', () => ({
  api: {
    performanceScales: {
      get: {
        useQuery: () => ({
          data: [
            { id: 1, label: 'Perfect', rank: 1 },
            { id: 2, label: 'Great', rank: 2 },
            { id: 3, label: 'Playable', rank: 3 },
          ],
        }),
      },
      delete: {
        useMutation: (options: { onSuccess: () => void }) => ({
          isPending: false,
          mutateAsync: async (input: RouterInput['performanceScales']['delete']) => {
            await mocks.deleteScale(input)
            options.onSuccess()
          },
        }),
      },
    },
  },
}))

const initialProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  scaleToDelete: { id: 1, label: 'Perfect', listingsCount: 2 },
}

function selectReplacement(id: number) {
  fireEvent.change(screen.getByLabelText('Replacement Performance Scale'), {
    target: { value: String(id) },
  })
}

describe('performance replacement session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.deleteScale.mockResolvedValue(undefined)
  })

  it('clears selection when canceled, including reopening the same target', () => {
    const view = render(<ReplacementSelectionModal {...initialProps} />)
    selectReplacement(2)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(initialProps.onClose).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Replacement Performance Scale')).toHaveValue('')

    view.rerender(<ReplacementSelectionModal {...initialProps} isOpen={false} />)
    view.rerender(<ReplacementSelectionModal {...initialProps} />)

    expect(screen.getByRole('button', { name: 'Delete and Replace' })).toBeDisabled()
    expect(mocks.deleteScale).not.toHaveBeenCalled()
  })

  it.each(['Cancel', 'target change'] as const)(
    'clears a failed deletion error after %s',
    async (action) => {
      mocks.deleteScale.mockRejectedValue(new Error('Replacement failed'))
      const view = render(<ReplacementSelectionModal {...initialProps} />)
      selectReplacement(2)
      fireEvent.click(screen.getByRole('button', { name: 'Delete and Replace' }))
      await screen.findByText('Replacement failed')

      if (action === 'Cancel') {
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        view.rerender(<ReplacementSelectionModal {...initialProps} isOpen={false} />)
        view.rerender(<ReplacementSelectionModal {...initialProps} />)
      } else {
        view.rerender(
          <ReplacementSelectionModal
            {...initialProps}
            scaleToDelete={{ id: 3, label: 'Playable', listingsCount: 4 }}
          />,
        )
      }

      expect(screen.queryByText('Replacement failed')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete and Replace' })).toBeDisabled()
    },
  )

  it('clears selection when the target changes while open', () => {
    const view = render(<ReplacementSelectionModal {...initialProps} />)
    selectReplacement(2)

    view.rerender(
      <ReplacementSelectionModal
        {...initialProps}
        scaleToDelete={{ id: 3, label: 'Playable', listingsCount: 4 }}
      />,
    )

    expect(screen.getByLabelText('Replacement Performance Scale')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Delete and Replace' })).toBeDisabled()
  })

  it('clears selection when externally closed without clearing the target', () => {
    const view = render(<ReplacementSelectionModal {...initialProps} />)
    selectReplacement(2)
    view.rerender(<ReplacementSelectionModal {...initialProps} isOpen={false} />)
    view.rerender(<ReplacementSelectionModal {...initialProps} />)

    expect(screen.getByRole('button', { name: 'Delete and Replace' })).toBeDisabled()
  })

  it('submits only a selection made for the current target and clears it after success', async () => {
    const view = render(<ReplacementSelectionModal {...initialProps} />)
    selectReplacement(2)
    view.rerender(
      <ReplacementSelectionModal
        {...initialProps}
        scaleToDelete={{ id: 3, label: 'Playable', listingsCount: 4 }}
      />,
    )
    selectReplacement(1)
    fireEvent.click(screen.getByRole('button', { name: 'Delete and Replace' }))

    await waitFor(() => expect(initialProps.onSuccess).toHaveBeenCalledOnce())
    expect(mocks.deleteScale).toHaveBeenCalledExactlyOnceWith({ id: 3, replacementId: 1 })
    expect(screen.getByLabelText('Replacement Performance Scale')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Delete and Replace' })).toBeDisabled()
  })
})
