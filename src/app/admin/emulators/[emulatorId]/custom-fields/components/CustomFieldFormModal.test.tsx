import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { type RouterOutput } from '@/types/trpc'
import { CustomFieldType } from '@orm'
import CustomFieldFormModal from './CustomFieldFormModal'

const update = vi.hoisted(() => vi.fn())
const field: RouterOutput['customFieldDefinitions']['byId'] = {
  id: 'field-1',
  emulatorId: 'emulator-1',
  name: 'resolution',
  label: 'Resolution',
  type: CustomFieldType.RANGE,
  options: null,
  defaultValue: '50',
  placeholder: null,
  isRequired: false,
  displayOrder: 0,
  categoryId: null,
  categoryOrder: 0,
  rangeMin: 0,
  rangeMax: 100,
  rangeUnit: '%',
  rangeDecimals: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({
      customFieldDefinitions: {
        getByEmulator: { invalidate: vi.fn().mockResolvedValue(undefined) },
      },
    }),
    customFieldDefinitions: {
      byId: { useQuery: () => ({ data: field }) },
      create: { useMutation: () => ({ mutate: vi.fn() }) },
      update: { useMutation: () => ({ mutate: update }) },
    },
    customFieldCategories: { getByEmulator: { useQuery: () => ({ data: [] }) } },
  },
}))

it('displays a stored numeric-string range default and preserves it on save', async () => {
  render(
    <CustomFieldFormModal
      isOpen
      emulatorId="emulator-1"
      fieldIdToEdit="field-1"
      onClose={vi.fn()}
    />,
  )
  expect(screen.getByDisplayValue('50')).toHaveValue(50)
  fireEvent.click(screen.getByRole('button', { name: 'Update Field' }))
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'field-1', defaultValue: '50' }),
    ),
  )
})
