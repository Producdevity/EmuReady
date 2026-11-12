import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomFieldType } from '@orm'
import { CustomFieldConfigEditor } from './CustomFieldConfigEditor'
import { CustomFieldConfigSchema } from '../../shared/config.schemas'
import { SOURCE_ID, TARGET_ID } from '../../tests/fixtures'
import type * as UI from '@/components/ui'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  apply: vi.fn(),
  confirm: vi.fn(),
  onSaved: vi.fn(),
  onClose: vi.fn(),
}))
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({ customFieldConfigs: { get: { fetch: mocks.fetch } } }),
    customFieldConfigs: {
      sources: {
        useQuery: () => ({
          data: [
            { id: TARGET_ID, name: 'DroidDeck' },
            { id: SOURCE_ID, name: 'Eden' },
          ],
          isPending: false,
          isError: false,
        }),
      },
      save: { useMutation: () => ({ mutateAsync: mocks.apply, isPending: false }) },
    },
  },
}))
vi.mock('@/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof UI>()),
  useConfirmDialog: () => mocks.confirm,
}))

const sourceSnapshot = {
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

async function loadSource() {
  fireEvent.change(screen.getByLabelText('Copy from emulator'), { target: { value: SOURCE_ID } })
  fireEvent.click(screen.getByRole('button', { name: 'Load into editor' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Configuration JSON')).toHaveValue(
      JSON.stringify(sourceSnapshot.configuration, null, 2),
    ),
  )
}

describe('configuration editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.confirm.mockResolvedValue(true)
    mocks.fetch.mockResolvedValue(sourceSnapshot)
    mocks.apply.mockResolvedValue(sourceSnapshot)
  })

  it('loads another emulator without saving, then applies to the destination with its own revision', async () => {
    showEditor()
    expect(screen.getByRole('button', { name: 'Apply to DroidDeck' })).toBeDisabled()
    await loadSource()
    expect(mocks.apply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Apply to DroidDeck' }))
    await waitFor(() => expect(mocks.onSaved).toHaveBeenCalledOnce())
    expect(mocks.apply).toHaveBeenCalledWith({
      emulatorId: TARGET_ID,
      expectedRevision: target.revision,
      configuration: sourceSnapshot.configuration,
    })
    expect(mocks.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Apply configuration to DroidDeck?' }),
    )
  })

  it('blocks invalid JSON and displays a useful error', () => {
    showEditor()
    fireEvent.change(screen.getByLabelText('Configuration JSON'), { target: { value: '{' } })
    expect(screen.getByRole('alert')).toHaveTextContent('Enter valid JSON.')
    expect(screen.getByRole('button', { name: 'Apply to DroidDeck' })).toBeDisabled()
    expect(mocks.apply).not.toHaveBeenCalled()
  })

  it('keeps the draft after a stale-revision error', async () => {
    showEditor()
    await loadSource()
    mocks.apply.mockRejectedValueOnce(new Error('The configuration has changed. Reload it.'))
    fireEvent.click(screen.getByRole('button', { name: 'Apply to DroidDeck' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('The configuration has changed.'),
    )
    expect(screen.getByLabelText('Configuration JSON')).toHaveValue(
      JSON.stringify(sourceSnapshot.configuration, null, 2),
    )
    expect(mocks.onSaved).not.toHaveBeenCalled()
  })

  it('does not save when confirmation is cancelled', async () => {
    showEditor()
    await loadSource()
    mocks.confirm.mockResolvedValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: 'Apply to DroidDeck' }))
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledOnce())
    expect(mocks.apply).not.toHaveBeenCalled()
  })

  it('protects unsaved drafts when closing', async () => {
    showEditor()
    await loadSource()
    mocks.confirm.mockResolvedValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledOnce())
    expect(mocks.onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    await waitFor(() => expect(mocks.onClose).toHaveBeenCalledOnce())
  })
})
