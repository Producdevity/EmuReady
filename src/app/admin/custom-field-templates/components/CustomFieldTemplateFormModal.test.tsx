import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type RouterOutput } from '@/types/trpc'
import { CustomFieldType } from '@orm'
import CustomFieldTemplateFormModal from './CustomFieldTemplateFormModal'

type Template = RouterOutput['customFieldTemplates']['byId']
let template: Template | undefined
let error: Error | null
let fetching = false
const refetch = vi.fn()
const saving = vi.hoisted(() => ({ completion: Promise.withResolvers<void>(), submit: vi.fn() }))
function useSaveMutation() {
  const [isPending, setPending] = useState(false)
  return {
    isPending,
    mutateAsync: async (input: unknown) => {
      saving.submit(input)
      setPending(true)
      try {
        await saving.completion.promise
      } finally {
        setPending(false)
      }
    },
  }
}
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }))
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({
      customFieldTemplates: {
        get: { invalidate: vi.fn().mockResolvedValue(undefined) },
        byId: { invalidate: vi.fn().mockResolvedValue(undefined) },
      },
    }),
    customFieldTemplates: {
      byId: {
        useQuery: () => ({
          data: template,
          error,
          isError: Boolean(error),
          isSuccess: template !== undefined && !error,
          isFetching: fetching,
          refetch,
        }),
      },
      create: { useMutation: useSaveMutation },
      update: { useMutation: useSaveMutation },
    },
  },
}))

function record(id: string, name: string): Template {
  const date = new Date('2026-01-01')
  return {
    id,
    name,
    description: 'Template description',
    createdAt: date,
    updatedAt: date,
    fields: [
      {
        id: 'field-1',
        templateId: id,
        name: 'accuracy',
        label: 'Accuracy',
        type: CustomFieldType.SELECT,
        options: [{ value: 'quality', label: 'Quality' }],
        defaultValue: 'quality',
        placeholder: null,
        rangeMin: null,
        rangeMax: null,
        rangeUnit: null,
        rangeDecimals: null,
        isRequired: false,
        categoryName: 'Graphics',
        categoryOrder: 0,
        displayOrder: 0,
        createdAt: date,
        updatedAt: date,
      },
    ],
  }
}
const onClose = vi.fn()
beforeEach(() => {
  template = undefined
  saving.completion = Promise.withResolvers<void>()
  error = null
  fetching = false
  vi.clearAllMocks()
})

describe('template form sessions', () => {
  it('preserves a pending save and does not close a reopened session on its completion', async () => {
    template = record('template-1', 'Template')
    const props = { templateIdToEdit: 'template-1', onClose }
    const view = render(<CustomFieldTemplateFormModal {...props} isOpen />)
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    await waitFor(() => expect(saving.submit).toHaveBeenCalledOnce())
    view.rerender(<CustomFieldTemplateFormModal {...props} isOpen={false} />)
    view.rerender(<CustomFieldTemplateFormModal {...props} isOpen />)
    expect(screen.getByRole('button', { name: /Saving/ })).toBeDisabled()
    await act(async () => {
      saving.completion.resolve()
    })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Update Template' })).toBeEnabled()
  })

  it('shows a not-found result when the requested template was deleted', () => {
    template = null
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />)
    expect(screen.getByText('Template not found')).toBeInTheDocument()
    expect(screen.queryByText('Loading template...')).not.toBeInTheDocument()
  })

  it('waits for a stale cached record to refresh before starting a draft', () => {
    template = record('template-1', 'Stale cached template')
    fetching = true
    const props = { isOpen: true, templateIdToEdit: 'template-1', onClose }
    const view = render(<CustomFieldTemplateFormModal {...props} />)
    expect(screen.queryByLabelText(/^Template Name/)).not.toBeInTheDocument()
    fetching = false
    template = record('template-1', 'Refreshed template')
    view.rerender(<CustomFieldTemplateFormModal {...props} />)
    expect(screen.getByLabelText(/^Template Name/)).toHaveValue('Refreshed template')
    fireEvent.change(screen.getByLabelText(/^Template Name/), { target: { value: 'My draft' } })
    fetching = true
    view.rerender(<CustomFieldTemplateFormModal {...props} />)
    expect(screen.getByLabelText(/^Template Name/)).toHaveValue('My draft')
  })

  it('initializes an edit form after its record loads', () => {
    const view = render(
      <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />,
    )
    expect(screen.getByText('Loading template...')).toBeInTheDocument()
    template = record('template-1', 'Original template')
    view.rerender(
      <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />,
    )
    expect(screen.getByLabelText(/^Template Name/)).toHaveValue('Original template')
    expect(screen.getAllByDisplayValue('Quality').length).toBeGreaterThan(0)
  })

  it('preserves a draft during refetch and resets it when reopening', () => {
    template = record('template-1', 'Original template')
    const view = render(
      <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />,
    )
    fireEvent.change(screen.getByLabelText(/^Template Name/), {
      target: { value: 'Unsaved draft' },
    })
    template = record('template-1', 'Refreshed template')
    view.rerender(
      <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />,
    )
    expect(screen.getByLabelText(/^Template Name/)).toHaveValue('Unsaved draft')
    view.rerender(
      <CustomFieldTemplateFormModal
        isOpen={false}
        templateIdToEdit="template-1"
        onClose={onClose}
      />,
    )
    view.rerender(
      <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />,
    )
    expect(screen.getByLabelText(/^Template Name/)).toHaveValue('Refreshed template')
  })

  it('does not initialize another record from stale query data', () => {
    template = record('template-1', 'First template')
    const view = render(
      <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />,
    )
    view.rerender(
      <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-2" onClose={onClose} />,
    )
    expect(screen.getByText('Loading template...')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('First template')).not.toBeInTheDocument()
    template = record('template-2', 'Second template')
    view.rerender(
      <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-2" onClose={onClose} />,
    )
    expect(screen.getByLabelText(/^Template Name/)).toHaveValue('Second template')
  })

  it('starts a new template with empty values even if edit data was cached', () => {
    template = record('template-1', 'Cached edit')
    render(<CustomFieldTemplateFormModal isOpen onClose={onClose} />)
    expect(screen.getByLabelText(/^Template Name/)).toHaveValue('')
  })

  it('shows a retry action instead of an editable empty form on load failure', () => {
    error = new Error('Template unavailable')
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />)
    expect(screen.getByText('Template unavailable')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Template Name/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Please try again' }))
    expect(refetch).toHaveBeenCalledOnce()
  })
})
