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
    fields: [
      {
        id: 'field-1',
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
      },
    ],
  }
}

function rangeRecord(defaultValue: number | string): Template {
  const result = record('template-1', 'Graphics')
  const field = result.fields[0]
  if (!field) throw new Error('Missing fixture field')
  result.fields = [
    {
      ...field,
      type: CustomFieldType.RANGE,
      options: null,
      defaultValue,
      rangeMin: -100,
      rangeMax: 100,
      rangeDecimals: 2,
    },
  ]
  return result
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
  it.each([
    { bound: 'minimum', intermediate: '-1', final: '-1000', defaultValue: -50 },
    { bound: 'maximum', intermediate: '1', final: '1000', defaultValue: 50 },
  ])('preserves a range default during intermediate $bound edits', async (testCase) => {
    template = rangeRecord(testCase.defaultValue)
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />)
    const bound = screen.getByPlaceholderText(testCase.bound === 'minimum' ? '0' : '100')
    const defaultInput = screen.getByRole('spinbutton', { name: 'Accuracy default value' })
    fireEvent.change(bound, { target: { value: testCase.intermediate } })
    expect(defaultInput).toHaveValue(testCase.defaultValue)
    fireEvent.change(bound, { target: { value: testCase.final } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    await waitFor(() =>
      expect(saving.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: [expect.objectContaining({ defaultValue: testCase.defaultValue })],
        }),
      ),
    )
    await act(async () => saving.completion.resolve())
  })

  it.each([
    { value: '', expected: null },
    { value: '5', expected: 5 },
  ])('allows repairing an excluded range default with $value', async (testCase) => {
    template = rangeRecord(50)
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />)
    fireEvent.change(screen.getByPlaceholderText('100'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Default value must be a number within the range',
    )
    expect(saving.submit).not.toHaveBeenCalled()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Accuracy default value' }), {
      target: { value: testCase.value },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    await waitFor(() =>
      expect(saving.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: [expect.objectContaining({ defaultValue: testCase.expected })],
        }),
      ),
    )
    await act(async () => saving.completion.resolve())
  })

  it('loads a historical range string as an editable numeric default', async () => {
    template = rangeRecord('1.5')
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />)
    expect(screen.getByRole('spinbutton', { name: 'Accuracy default value' })).toHaveValue(1.5)
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    await waitFor(() =>
      expect(saving.submit).toHaveBeenCalledWith(
        expect.objectContaining({ fields: [expect.objectContaining({ defaultValue: 1.5 })] }),
      ),
    )
    await act(async () => saving.completion.resolve())
  })

  it.each(['edit', 'remove'] as const)(
    'clears a dropdown default when its selected option is changed by %s',
    async (operation) => {
      template = record('template-1', 'Graphics')
      const field = template.fields[0]
      if (!field) throw new Error('Missing fixture field')
      field.options = [
        { value: 'quality', label: 'Quality' },
        { value: 'fast', label: 'Fast' },
      ]
      render(
        <CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />,
      )
      expect(screen.getByRole('combobox', { name: 'Accuracy default value' })).toHaveValue(
        'quality',
      )
      if (operation === 'edit')
        fireEvent.change(screen.getAllByPlaceholderText('Value')[0], {
          target: { value: 'balanced' },
        })
      else fireEvent.click(screen.getAllByRole('button', { name: 'Remove option' })[0])
      expect(screen.getByRole('combobox', { name: 'Accuracy default value' })).toHaveValue('')
      fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
      await waitFor(() =>
        expect(saving.submit).toHaveBeenCalledWith(
          expect.objectContaining({ fields: [expect.objectContaining({ defaultValue: null })] }),
        ),
      )
      await act(async () => saving.completion.resolve())
    },
  )

  it('creates a range with a zero maximum without replacing it with a fallback', async () => {
    render(<CustomFieldTemplateFormModal isOpen onClose={onClose} />)
    fireEvent.change(screen.getByLabelText(/^Template Name/), { target: { value: 'Cycles' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Field' }))
    fireEvent.change(screen.getByPlaceholderText('e.g., driver_version'), {
      target: { value: 'cycles' },
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: CustomFieldType.RANGE } })
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '-3' } })
    fireEvent.change(screen.getByPlaceholderText('100'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Template' }))
    await waitFor(() =>
      expect(saving.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cycles',
          fields: [expect.objectContaining({ rangeMin: -3, rangeMax: 0, defaultValue: null })],
        }),
      ),
    )
    await act(async () => saving.completion.resolve())
  })

  it('submits numeric defaults, ranges, placeholders and categories unchanged', async () => {
    template = record('template-1', 'Graphics')
    const field = template.fields[0]
    if (!field) throw new Error('Missing fixture field')
    template.fields = [
      {
        ...field,
        type: CustomFieldType.RANGE,
        options: null,
        defaultValue: 1.5,
        rangeMin: 0.25,
        rangeMax: 4,
        rangeUnit: 'x',
        rangeDecimals: 2,
        categoryOrder: 3,
      },
      {
        ...field,
        id: 'driver',
        name: 'driver',
        label: 'Driver',
        type: CustomFieldType.TEXT,
        options: null,
        defaultValue: 'custom',
        placeholder: 'Enter a driver',
        categoryOrder: 4,
      },
    ]
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />)
    fireEvent.change(screen.getByLabelText(/^Description/), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    await waitFor(() =>
      expect(saving.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          fields: [
            expect.objectContaining({
              defaultValue: 1.5,
              rangeMin: 0.25,
              rangeMax: 4,
              rangeUnit: 'x',
              rangeDecimals: 2,
              categoryName: 'Graphics',
              categoryOrder: 3,
            }),
            expect.objectContaining({
              placeholder: 'Enter a driver',
              categoryName: 'Graphics',
              categoryOrder: 4,
            }),
          ],
        }),
      ),
    )
    await act(async () => saving.completion.resolve())
  })

  it('requires repairing a missing range bound instead of inventing one when editing', () => {
    template = record('template-1', 'Incomplete range')
    const field = template.fields[0]
    if (!field) throw new Error('Missing fixture field')
    template.fields = [
      {
        ...field,
        type: CustomFieldType.RANGE,
        options: null,
        defaultValue: null,
        rangeMin: null,
        rangeMax: 4,
      },
    ]
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />)
    expect(screen.getByPlaceholderText('0')).toHaveValue(null)
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    expect(screen.getByText('Minimum value must be less than maximum value')).toBeInTheDocument()
    expect(saving.submit).not.toHaveBeenCalled()
  })

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
    error = new Error('Custom field template not found')
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="template-1" onClose={onClose} />)
    expect(screen.getByText('Custom field template not found')).toBeInTheDocument()
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
