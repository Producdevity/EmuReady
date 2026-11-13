import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomFieldType } from '@orm'
import { CustomFieldConfigEditor } from './CustomFieldConfigEditor'
import { CustomFieldConfigSchema } from '../../shared/config.schemas'
import { TARGET_ID } from '../../tests/fixtures'
import type * as UI from '@/components/ui'

const mocks = vi.hoisted(() => ({
  apply: vi.fn(),
  confirm: vi.fn(),
  onSaved: vi.fn(),
  onClose: vi.fn(),
}))
vi.mock('@/lib/api', () => ({
  api: {
    customFieldConfigs: {
      save: { useMutation: () => ({ mutateAsync: mocks.apply, isPending: false }) },
    },
  },
}))
vi.mock('@/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof UI>()),
  useConfirmDialog: () => mocks.confirm,
}))

const pastedSnapshot = {
  configuration: CustomFieldConfigSchema.parse({
    version: 1,
    categories: [{ name: 'Graphics' }, { name: 'Advanced', displayOrder: 1 }],
    fields: [
      {
        name: 'renderer',
        label: 'Renderer',
        type: CustomFieldType.SELECT,
        category: 'Graphics',
        options: [{ value: 'vulkan', label: 'Vulkan' }],
        defaultValue: 'vulkan',
      },
    ],
  }),
  revision: '1'.repeat(64),
}

const target = {
  configuration: { version: 1, categories: [], fields: [] },
  revision: '0'.repeat(64),
} as const

function showEditor() {
  return render(
    <CustomFieldConfigEditor
      emulator={{ id: TARGET_ID, name: 'DroidDeck' }}
      snapshot={{
        ...target,
        configuration: { ...target.configuration, categories: [], fields: [] },
      }}
      onSaved={mocks.onSaved}
      onClose={mocks.onClose}
    />,
  )
}

function pasteJson() {
  fireEvent.change(screen.getByLabelText('Configuration JSON'), {
    target: { value: JSON.stringify(pastedSnapshot.configuration, null, 2) },
  })
}

describe('configuration editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.confirm.mockResolvedValue(true)
    mocks.apply.mockResolvedValue(pastedSnapshot)
  })

  it('accepts pasted fields and categories, then saves against the current revision', async () => {
    showEditor()
    expect(screen.getByRole('button', { name: 'Save JSON' })).toBeDisabled()
    expect(screen.queryByLabelText('Copy from emulator')).not.toBeInTheDocument()
    pasteJson()
    expect(mocks.apply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Save JSON' }))
    await waitFor(() => expect(mocks.onSaved).toHaveBeenCalledOnce())
    expect(mocks.apply).toHaveBeenCalledWith({
      emulatorId: TARGET_ID,
      expectedRevision: target.revision,
      configuration: pastedSnapshot.configuration,
    })
    expect(mocks.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Save JSON for DroidDeck?' }),
    )
  })

  it('blocks invalid JSON and displays a useful error', () => {
    showEditor()
    fireEvent.change(screen.getByLabelText('Configuration JSON'), { target: { value: '{' } })
    expect(screen.getByRole('alert')).toHaveTextContent('Enter valid JSON.')
    expect(screen.getByRole('button', { name: 'Save JSON' })).toBeDisabled()
    expect(mocks.apply).not.toHaveBeenCalled()
  })

  it('accepts complete JSON beyond one million characters without a textarea cap', async () => {
    showEditor()
    const configuration = CustomFieldConfigSchema.parse({
      version: 1,
      categories: [],
      fields: Array.from({ length: 101 }, (_, index) => ({
        name: `field_${index}`,
        label: `Field ${index}`,
        type: CustomFieldType.TEXT,
        defaultValue: 'a'.repeat(10_000),
      })),
    })
    const json = JSON.stringify(configuration)
    const editor = screen.getByLabelText('Configuration JSON')
    expect(json.length).toBeGreaterThan(1_000_000)
    expect(editor).not.toHaveAttribute('maxlength')
    fireEvent.change(editor, { target: { value: json } })
    expect(editor).toHaveValue(json)
    fireEvent.click(screen.getByRole('button', { name: 'Save JSON' }))
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith({
        emulatorId: TARGET_ID,
        expectedRevision: target.revision,
        configuration,
      }),
    )
  })

  it('keeps the draft after a stale-revision error', async () => {
    showEditor()
    pasteJson()
    mocks.apply.mockRejectedValueOnce(new Error('The configuration has changed. Reload it.'))
    fireEvent.click(screen.getByRole('button', { name: 'Save JSON' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('The configuration has changed.'),
    )
    expect(screen.getByLabelText('Configuration JSON')).toHaveValue(
      JSON.stringify(pastedSnapshot.configuration, null, 2),
    )
    expect(mocks.onSaved).not.toHaveBeenCalled()
  })

  it('does not save when confirmation is cancelled', async () => {
    showEditor()
    pasteJson()
    mocks.confirm.mockResolvedValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: 'Save JSON' }))
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledOnce())
    expect(mocks.apply).not.toHaveBeenCalled()
  })

  it('protects unsaved drafts when closing', async () => {
    showEditor()
    pasteJson()
    mocks.confirm.mockResolvedValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledOnce())
    expect(mocks.onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    await waitFor(() => expect(mocks.onClose).toHaveBeenCalledOnce())
  })
})
