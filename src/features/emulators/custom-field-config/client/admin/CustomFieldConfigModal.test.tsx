import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CustomFieldConfigEditor } from './CustomFieldConfigEditor'
import { CustomFieldConfigModal } from './CustomFieldConfigModal'
import { TARGET_ID } from '../../tests/fixtures'

const query = vi.hoisted(() => ({ useQuery: vi.fn() }))
vi.mock('@/lib/api', () => ({ api: { customFieldConfigs: { get: { useQuery: query.useQuery } } } }))
vi.mock('./CustomFieldConfigEditor', () => ({
  CustomFieldConfigEditor: vi.fn(() => <div>Configuration editor</div>),
}))

describe('configuration loading', () => {
  it('waits for a fresh snapshot before initializing a draft from cached data', () => {
    const cached = {
      configuration: { version: 1, categories: [], fields: [] },
      revision: '0'.repeat(64),
    }
    const current = { ...cached, revision: '1'.repeat(64) }
    const props = {
      emulator: { id: TARGET_ID, name: 'DroidDeck' },
      onClose: vi.fn(),
      onSaved: vi.fn(),
    }
    query.useQuery.mockReturnValue({
      data: cached,
      isPending: false,
      isFetchedAfterMount: false,
      isError: false,
    })
    const view = render(<CustomFieldConfigModal {...props} />)
    expect(screen.getByText('Loading configuration...')).toBeInTheDocument()
    expect(CustomFieldConfigEditor).not.toHaveBeenCalled()
    query.useQuery.mockReturnValue({
      data: current,
      isPending: false,
      isFetchedAfterMount: true,
      isError: false,
    })
    view.rerender(<CustomFieldConfigModal {...props} />)
    expect(screen.getByText('Configuration editor')).toBeInTheDocument()
    expect(CustomFieldConfigEditor).toHaveBeenCalledWith(
      expect.objectContaining({ snapshot: current }),
      undefined,
    )
  })
})
