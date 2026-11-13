import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type RouterOutput } from '@/types/trpc'
import { CustomFieldType } from '@orm'
import CustomFieldTemplateFormModal from './CustomFieldTemplateFormModal'

type Template = RouterOutput['customFieldTemplates']['byId']
const save = vi.fn()

let template: Template | undefined
let error: Error | null
const refetch = vi.fn()
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
      byId: { useQuery: () => ({ data: template, error, isError: Boolean(error), refetch }) },
      create: { useMutation: () => ({ mutate: save }) },
      update: { useMutation: () => ({ mutate: save }) },
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
const onClose = vi.fn()
beforeEach(() => {
  template = undefined
  error = null
  vi.clearAllMocks()
})

describe('template form sessions', () => {
  it('allows zero as a range maximum', () => {
    template = record('a', 'Cycles')
    const field = template.fields[0]
    if (!field) throw new Error('Missing fixture field')
    template.fields = [
      {
        ...field,
        type: CustomFieldType.RANGE,
        options: null,
        defaultValue: 0,
        rangeMin: -3,
        rangeMax: 3,
        rangeUnit: '',
        rangeDecimals: 0,
      },
    ]
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="a" onClose={onClose} />)
    fireEvent.change(screen.getByDisplayValue('3'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [expect.objectContaining({ rangeMin: -3, rangeMax: 0, defaultValue: 0 })],
      }),
    )
  })

  it('submits numeric defaults, ranges, placeholders and categories unchanged', () => {
    template = record('a', 'Alpha')
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
    render(<CustomFieldTemplateFormModal isOpen templateIdToEdit="a" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Update Template' }))
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
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
    )
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
