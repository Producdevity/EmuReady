import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { SelectInput } from './SelectInput'

it('associates each generated label with its own select', async () => {
  const user = userEvent.setup()
  render(
    <>
      <SelectInput label="System" value="" onChange={vi.fn()} options={[]} />
      <SelectInput label="Emulator" value="" onChange={vi.fn()} options={[]} />
    </>,
  )
  const system = screen.getByRole('combobox', { name: 'System' })
  const emulator = screen.getByRole('combobox', { name: 'Emulator' })
  expect(system.id).not.toBe(emulator.id)
  await user.click(screen.getByText('System', { selector: 'label' }))
  expect(system).toHaveFocus()
})

it('names a select whose visible label is hidden', () => {
  render(<SelectInput label="Performance" hideLabel value="" onChange={vi.fn()} options={[]} />)
  expect(screen.getByRole('combobox', { name: 'Performance' })).toBeInTheDocument()
})
