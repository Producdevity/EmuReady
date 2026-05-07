import { render, screen, fireEvent } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, it, expect } from 'vitest'
import { PcOs } from '@orm'
import { AdminOsField } from './AdminOsField'

interface FormShape {
  os: PcOs | null
}

function Harness(props: { defaultOs: PcOs | null; onValue: (value: PcOs | null) => void }) {
  const { control, formState, watch } = useForm<FormShape>({
    defaultValues: { os: props.defaultOs },
  })
  const current = watch('os')
  props.onValue(current)
  return <AdminOsField control={control} name="os" errors={formState.errors} />
}

describe('AdminOsField', () => {
  it('renders the empty option as "No OS recorded"', () => {
    render(<Harness defaultOs={null} onValue={() => {}} />)
    expect(screen.getByRole('option', { name: 'No OS recorded' })).toBeInTheDocument()
  })

  it('keeps the field null when initialized with null', () => {
    let latest: PcOs | null = PcOs.WINDOWS
    render(
      <Harness
        defaultOs={null}
        onValue={(v) => {
          latest = v
        }}
      />,
    )
    expect(latest).toBeNull()
    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('selecting a real OS updates the field', () => {
    let latest: PcOs | null = null
    render(
      <Harness
        defaultOs={null}
        onValue={(v) => {
          latest = v
        }}
      />,
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: PcOs.LINUX } })
    expect(latest).toBe(PcOs.LINUX)
  })

  it('selecting the empty option clears a previously-set OS to null', () => {
    let latest: PcOs | null = null
    render(
      <Harness
        defaultOs={PcOs.WINDOWS}
        onValue={(v) => {
          latest = v
        }}
      />,
    )
    expect(latest).toBe(PcOs.WINDOWS)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })
    expect(latest).toBeNull()
  })
})
