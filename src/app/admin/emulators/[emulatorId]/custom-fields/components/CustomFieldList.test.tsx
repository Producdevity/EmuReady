import { act, fireEvent, render, screen } from '@testing-library/react'
import { createElement, type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CustomFieldType } from '@orm'
import CustomFieldList from './CustomFieldList'
import type * as DndCore from '@dnd-kit/core'

interface MutationOptions {
  onSuccess: () => void
  onError: (error: Error) => void
}
const recorded = vi.hoisted(() => ({
  context: vi.fn<(props: ComponentProps<typeof DndCore.DndContext>) => void>(),
  update: vi.fn<(options: MutationOptions) => void>(),
  mutate: vi.fn<(payload: { id: string; displayOrder: number }[]) => void>(),
}))
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof DndCore>()
  function RecordedContext(props: ComponentProps<typeof DndCore.DndContext>) {
    recorded.context(props)
    return createElement(actual.DndContext, props)
  }
  return { ...actual, DndContext: RecordedContext }
})
vi.mock('@/lib/toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({
      customFieldDefinitions: {
        getByEmulator: { invalidate: vi.fn().mockResolvedValue(undefined) },
      },
    }),
    customFieldDefinitions: {
      updateOrder: {
        useMutation: (options: MutationOptions) => {
          recorded.update(options)
          return { mutate: recorded.mutate, isPending: false }
        },
      },
      delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}))

function field(
  id: string,
  label: string,
  displayOrder: number,
): ComponentProps<typeof CustomFieldList>['customFields'][number] {
  return {
    id,
    emulatorId: 'emulator-1',
    categoryId: null,
    category: null,
    name: id,
    label,
    type: CustomFieldType.TEXT,
    options: null,
    defaultValue: null,
    placeholder: null,
    rangeMin: null,
    rangeMax: null,
    rangeUnit: null,
    rangeDecimals: null,
    isRequired: false,
    displayOrder,
    categoryOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }
}

function drag(from: string, to: string) {
  const onDragEnd = recorded.context.mock.lastCall?.[0].onDragEnd
  if (!onDragEnd) throw new Error('Drag handler was not registered')
  const event: DndCore.DragEndEvent = {
    active: {
      id: from,
      data: { current: {} },
      rect: { current: { initial: null, translated: null } },
    },
    over: { id: to, data: { current: {} }, rect: new DOMRect(), disabled: false },
    activatorEvent: new Event('pointerup'),
    collisions: [],
    delta: { x: 0, y: 0 },
  }
  act(() => onDragEnd(event))
}
function labels() {
  return screen.getAllByText(/^Field [AB]$/).map((element) => element.textContent)
}

beforeEach(() => vi.clearAllMocks())

describe('custom field ordering sessions', () => {
  const first = field('field-a', 'Field A', 0)
  const second = field('field-b', 'Field B', 1)
  const callbacks = { onEdit: vi.fn(), onDeleteSuccess: vi.fn(), emulatorId: 'emulator-1' }

  it('shows refreshed server ordering when no reorder session is active', () => {
    const view = render(<CustomFieldList {...callbacks} customFields={[first, second]} />)
    expect(labels()).toEqual(['Field A', 'Field B'])
    view.rerender(
      <CustomFieldList
        {...callbacks}
        customFields={[
          { ...first, displayOrder: 1 },
          { ...second, displayOrder: 0 },
        ]}
      />,
    )
    expect(labels()).toEqual(['Field B', 'Field A'])
  })

  it('keeps a reorder draft on refetch and restores its initial order on cancel', () => {
    const view = render(<CustomFieldList {...callbacks} customFields={[first, second]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reorder Fields' }))
    drag(first.id, second.id)
    expect(labels()).toEqual(['Field B', 'Field A'])
    view.rerender(<CustomFieldList {...callbacks} customFields={[{ ...first }, { ...second }]} />)
    expect(labels()).toEqual(['Field B', 'Field A'])
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Changes' }))
    expect(labels()).toEqual(['Field A', 'Field B'])
  })

  it('ignores a drag whose target no longer exists', () => {
    render(<CustomFieldList {...callbacks} customFields={[first, second]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reorder Fields' }))
    drag(first.id, 'removed-field')
    expect(labels()).toEqual(['Field A', 'Field B'])
    expect(screen.queryByRole('button', { name: 'Cancel Changes' })).not.toBeInTheDocument()
  })
})
