import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, useWatch } from 'react-hook-form'
import { beforeEach, expect, it, vi } from 'vitest'
import { type DriverRelease } from '@/types/driver-versions'
import DriverVersionField from './DriverVersionField'

const mocks = vi.hoisted(() => ({ submit: vi.fn() }))
let releases: DriverRelease[] | null = []
let loading = false
vi.mock('../hooks/useDriverVersions', () => ({
  useDriverVersions: () => ({ data: releases, loading, rateLimited: false, errorMessage: null }),
}))

const knownRelease: DriverRelease = {
  id: 'known',
  name: 'Known Turnip',
  label: 'Known Turnip release',
  value: 'Known Turnip release|||known.zip',
  tagName: 'v1',
  publishedAt: '2026-11-01T12:00:00.000Z',
  assets: [{ id: 1, name: 'known.zip', downloadUrl: '', contentType: 'application/zip', size: 1 }],
}

interface Props {
  initialDriver?: string
  required?: boolean
}

function Form(props: Props) {
  const form = useForm({ defaultValues: { driver: props.initialDriver ?? '' } })
  const value = useWatch({ control: form.control, name: 'driver' })
  return (
    <form onSubmit={form.handleSubmit(mocks.submit)}>
      <DriverVersionField
        control={form.control}
        fieldName="driver"
        fieldDef={{
          id: 'driver',
          name: 'dynamic_driver_version',
          label: 'Graphics Driver',
          isRequired: props.required ?? true,
        }}
        rules={props.required === false ? {} : { required: 'Graphics Driver is required' }}
        errorMessage={form.formState.errors.driver?.message}
        icon={null}
      />
      <button type="submit">Submit</button>
      <output aria-label="Saved driver value">{value}</output>
    </form>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  releases = []
  loading = false
})

it('submits a custom graphics-driver name instead of a fixed dropdown option', async () => {
  const user = userEvent.setup()
  render(<Form />)
  await user.click(screen.getByLabelText('Graphics Driver *'))
  await user.click(await screen.findByRole('button', { name: 'Enter a custom driver' }))
  const input = screen.getByLabelText('Graphics Driver *')
  expect(input).toHaveFocus()
  await user.type(input, 'StevenMXZ Turnip 8xx V15')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await waitFor(() =>
    expect(mocks.submit).toHaveBeenCalledWith(
      { driver: 'StevenMXZ Turnip 8xx V15' },
      expect.anything(),
    ),
  )
})

it('keeps custom entry available while the driver catalog is loading', async () => {
  loading = true
  releases = null
  const user = userEvent.setup()
  render(<Form />)
  await user.click(screen.getByLabelText('Graphics Driver *'))
  await user.click(await screen.findByRole('button', { name: 'Enter a custom driver' }))
  await user.type(screen.getByLabelText('Graphics Driver *'), 'Custom GPU driver')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await waitFor(() =>
    expect(mocks.submit).toHaveBeenCalledWith({ driver: 'Custom GPU driver' }, expect.anything()),
  )
})

it('edits previously saved custom names without losing their value', async () => {
  const user = userEvent.setup()
  render(<Form initialDriver="Old custom driver" />)
  const input = screen.getByLabelText('Graphics Driver *')
  expect(input).toHaveValue('Old custom driver')
  await user.clear(input)
  await user.type(input, 'Updated custom driver')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await waitFor(() =>
    expect(mocks.submit).toHaveBeenCalledWith(
      { driver: 'Updated custom driver' },
      expect.anything(),
    ),
  )
})

it('requires an actual driver name instead of submitting the custom-choice marker', async () => {
  const user = userEvent.setup()
  render(<Form />)
  await user.click(screen.getByLabelText('Graphics Driver *'))
  await user.click(await screen.findByRole('button', { name: 'Enter a custom driver' }))
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await screen.findByText('Graphics Driver is required')
  expect(screen.getByLabelText('Saved driver value')).toBeEmptyDOMElement()
  expect(mocks.submit).not.toHaveBeenCalled()
})

it('can return to the catalog and submit a listed driver', async () => {
  releases = [knownRelease]
  const user = userEvent.setup()
  render(<Form initialDriver="Custom GPU driver" />)
  await user.click(screen.getByRole('button', { name: 'Choose a listed driver' }))
  await user.click(screen.getByLabelText('Graphics Driver *'))
  await user.click(await screen.findByRole('option', { name: 'Known Turnip release' }))
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await waitFor(() =>
    expect(mocks.submit).toHaveBeenCalledWith({ driver: knownRelease.value }, expect.anything()),
  )
})

it('preserves imported filename normalization for listed drivers', async () => {
  releases = [knownRelease]
  render(<Form initialDriver="known.zip" />)
  await waitFor(() =>
    expect(screen.getByLabelText('Saved driver value')).toHaveTextContent(knownRelease.value),
  )
})

it('does not rewrite explicit custom text when a matching release arrives', async () => {
  const user = userEvent.setup()
  const view = render(<Form />)
  await user.click(screen.getByLabelText('Graphics Driver *'))
  await user.click(await screen.findByRole('button', { name: 'Enter a custom driver' }))
  await user.type(screen.getByLabelText('Graphics Driver *'), 'known.zip')
  releases = [knownRelease]
  view.rerender(<Form />)
  expect(screen.getByLabelText('Graphics Driver *')).toHaveValue('known.zip')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await waitFor(() =>
    expect(mocks.submit).toHaveBeenCalledWith({ driver: 'known.zip' }, expect.anything()),
  )
})

it('shows newly loaded releases in an already opened catalog', async () => {
  loading = true
  releases = null
  const user = userEvent.setup()
  const view = render(<Form />)
  await user.click(screen.getByLabelText('Graphics Driver *'))
  await screen.findByRole('option', { name: 'Default System Driver' })
  releases = [knownRelease]
  loading = false
  view.rerender(<Form />)
  expect(await screen.findByRole('option', { name: 'Known Turnip release' })).toBeVisible()
})

it('shows and edits a saved custom value while the catalog is loading', async () => {
  loading = true
  releases = null
  const user = userEvent.setup()
  render(<Form initialDriver="Saved custom driver" />)
  const input = screen.getByLabelText('Graphics Driver *')
  expect(input).toHaveValue('Saved custom driver')
  await user.clear(input)
  await user.type(input, 'Updated pending driver')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await waitFor(() =>
    expect(mocks.submit).toHaveBeenCalledWith(
      { driver: 'Updated pending driver' },
      expect.anything(),
    ),
  )
})

it('focuses and describes the listed-driver control when validation fails', async () => {
  const user = userEvent.setup()
  render(<Form />)
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  const error = await screen.findByText('Graphics Driver is required')
  const input = screen.getByRole('combobox', { name: 'Graphics Driver *' })
  expect(input).toHaveFocus()
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAttribute('aria-describedby', error.id)
  expect(input).toHaveClass('border-red-300')
})

it('keeps custom entry available after an unmatched catalog search', async () => {
  const user = userEvent.setup()
  render(<Form />)
  await user.type(screen.getByRole('combobox'), 'Unlisted experimental GPU')
  await waitFor(() =>
    expect(screen.queryByRole('option', { name: /Default System Driver/ })).not.toBeInTheDocument(),
  )
  await user.click(await screen.findByText(/^(Custom driver…|Enter a custom driver)$/))
  await user.type(screen.getByLabelText('Graphics Driver *'), 'Unlisted experimental GPU')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  await waitFor(() =>
    expect(mocks.submit).toHaveBeenCalledWith(
      { driver: 'Unlisted experimental GPU' },
      expect.anything(),
    ),
  )
})

it.each([true, false])(
  'announces the required state in both driver input modes (%s)',
  async (required) => {
    const user = userEvent.setup()
    render(<Form required={required} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', String(required))
    await user.click(screen.getByRole('button', { name: 'Enter a custom driver' }))
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', String(required))
  },
)
