import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomFieldType } from '@orm'
import type CustomFieldTemplatesPageComponent from './page'

const apiMocks = vi.hoisted(() => ({
  customFieldTemplatesGetUseQuery: vi.fn(),
  refetch: vi.fn(),
}))

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: navigationMocks.replace,
  }),
  useSearchParams: () => navigationMocks.searchParams,
}))

vi.mock('@/lib/api', () => ({
  api: {
    customFieldTemplates: {
      get: {
        useQuery: apiMocks.customFieldTemplatesGetUseQuery,
      },
    },
  },
}))

interface MockTemplate {
  id: string
  name: string
}

interface MockCustomFieldTemplateListProps {
  templates: MockTemplate[]
}

vi.mock('./components/CustomFieldTemplateList', () => ({
  default: (props: MockCustomFieldTemplateListProps) => (
    <div data-testid="template-list">
      {props.templates.map((template) => (
        <div key={template.id}>{template.name}</div>
      ))}
    </div>
  ),
}))

vi.mock('./components/CustomFieldTemplateFormModal', () => ({
  default: () => <div data-testid="template-form-modal" />,
}))

let CustomFieldTemplatesPage: typeof CustomFieldTemplatesPageComponent

const templates = [
  {
    id: 'template-performance',
    name: 'Performance Template',
    description: 'Emulator performance settings',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    fields: [
      {
        id: 'field-frame-pacing',
        name: 'framePacing',
        label: 'Frame pacing',
        type: CustomFieldType.TEXT,
        options: null,
        isRequired: false,
        displayOrder: 0,
      },
    ],
  },
  {
    id: 'template-controls',
    name: 'Controls Template',
    description: 'Input mapping defaults',
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    fields: [
      {
        id: 'field-layout',
        name: 'controllerLayout',
        label: 'Controller layout',
        type: CustomFieldType.TEXT,
        options: null,
        isRequired: false,
        displayOrder: 0,
      },
    ],
  },
]

describe('CustomFieldTemplatesPage', () => {
  beforeAll(async () => {
    ;({ default: CustomFieldTemplatesPage } = await import('./page'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    navigationMocks.searchParams = new URLSearchParams()
    window.history.replaceState(null, '', '/admin/custom-field-templates')
    apiMocks.customFieldTemplatesGetUseQuery.mockReturnValue({
      data: templates,
      isPending: false,
      error: null,
      refetch: apiMocks.refetch,
    })
  })

  it('renders AdminSearchFilters and filters templates by field labels', () => {
    render(<CustomFieldTemplatesPage />)

    fireEvent.change(screen.getByPlaceholderText('Search templates...'), {
      target: { value: 'frame' },
    })

    expect(screen.getByText('Performance Template')).toBeInTheDocument()
    expect(screen.queryByText('Controls Template')).not.toBeInTheDocument()
  })

  it('shows a search-specific empty state when no templates match', () => {
    render(<CustomFieldTemplatesPage />)

    fireEvent.change(screen.getByPlaceholderText('Search templates...'), {
      target: { value: 'battery' },
    })

    expect(screen.getByText('No custom field templates match your search.')).toBeInTheDocument()
    expect(screen.queryByTestId('template-list')).not.toBeInTheDocument()
  })
})
