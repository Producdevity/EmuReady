import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialogProvider } from '@/components/ui'
import { CustomFieldConfigEditor } from './CustomFieldConfigEditor'
import { TARGET_ID } from '../../tests/fixtures'

vi.mock('@/lib/api', () => ({
  api: {
    customFieldConfigs: {
      save: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
  },
}))

describe('configuration confirmation dialogs', () => {
  it('cancels the save with Escape without opening the discard dialog', async () => {
    const onClose = vi.fn()
    render(
      <ConfirmDialogProvider>
        <CustomFieldConfigEditor
          emulator={{ id: TARGET_ID, name: 'DroidDeck' }}
          snapshot={{
            configuration: { version: 1, categories: [], fields: [] },
            revision: '0'.repeat(64),
          }}
          onSaved={vi.fn()}
          onClose={onClose}
        />
      </ConfirmDialogProvider>,
    )
    fireEvent.change(screen.getByLabelText('Configuration JSON'), {
      target: {
        value: JSON.stringify({ version: 1, categories: [{ name: 'Graphics' }], fields: [] }),
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save JSON' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Discard the JSON draft?')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save JSON' })).toBeEnabled()
  })
})
