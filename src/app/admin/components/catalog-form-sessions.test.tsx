import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BrandModal from '../brands/components/BrandModal'
import PerformanceScaleModal from '../performance/components/PerformanceScaleModal'
import SocModal from '../socs/components/SocModal'
import SystemModal from '../systems/components/SystemModal'

vi.mock('@/lib/api', () => {
  const mutation = () => ({ mutateAsync: vi.fn(), isPending: false })
  return {
    api: Object.fromEntries(
      ['deviceBrands', 'performanceScales', 'systems', 'socs'].map((name) => [
        name,
        { create: { useMutation: mutation }, update: { useMutation: mutation } },
      ]),
    ),
  }
})

type Session = { isOpen: boolean; secondRecord?: boolean }

const cases = [
  {
    name: 'SoC',
    field: 'Name *',
    first: 'Snapdragon 8 Gen 3',
    second: 'Dimensity 9400',
    render: (session: Session) => (
      <SocModal
        isOpen={session.isOpen}
        editId={session.secondRecord ? 'soc-2' : 'soc-1'}
        socData={{
          id: session.secondRecord ? 'soc-2' : 'soc-1',
          name: session.secondRecord ? 'Dimensity 9400' : 'Snapdragon 8 Gen 3',
          manufacturer: session.secondRecord ? 'MediaTek' : 'Qualcomm',
          architecture: 'ARM64',
          processNode: null,
          cpuCores: 8,
          gpuModel: null,
          createdAt: new Date('2026-01-01'),
          _count: { devices: 1 },
        }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    ),
  },
  {
    name: 'brand',
    field: 'Brand Name',
    first: 'Retroid',
    second: 'AYN',
    render: (session: Session) => (
      <BrandModal
        isOpen={session.isOpen}
        editId={session.secondRecord ? 'brand-2' : 'brand-1'}
        brandName={session.secondRecord ? 'AYN' : 'Retroid'}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    ),
  },
  {
    name: 'performance scale',
    field: 'Performance Level',
    first: 'Perfect',
    second: 'Great',
    render: (session: Session) => (
      <PerformanceScaleModal
        isOpen={session.isOpen}
        editId={session.secondRecord ? 2 : 1}
        scale={{
          id: session.secondRecord ? 2 : 1,
          label: session.secondRecord ? 'Great' : 'Perfect',
          description: 'Description',
          rank: session.secondRecord ? 2 : 1,
        }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    ),
  },
  {
    name: 'system',
    field: 'System Name',
    first: 'Nintendo Switch',
    second: 'Nintendo Switch 2',
    render: (session: Session) => (
      <SystemModal
        isOpen={session.isOpen}
        editId={session.secondRecord ? 'system-2' : 'system-1'}
        systemName={session.secondRecord ? 'Nintendo Switch 2' : 'Nintendo Switch'}
        systemKey={session.secondRecord ? 'nintendo_switch_2' : 'nintendo_switch'}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    ),
  },
]

describe.each(cases)('$name form session', (entry) => {
  it('starts with the original values after closing and reopening', () => {
    const view = render(entry.render({ isOpen: true }))
    expect(screen.getByLabelText(entry.field)).toHaveValue(entry.first)
    fireEvent.change(screen.getByLabelText(entry.field), { target: { value: 'Unsaved draft' } })

    view.rerender(entry.render({ isOpen: false }))
    view.rerender(entry.render({ isOpen: true }))

    expect(screen.getByLabelText(entry.field)).toHaveValue(entry.first)
  })

  it('does not carry a draft into a different record', () => {
    const view = render(entry.render({ isOpen: true }))
    fireEvent.change(screen.getByLabelText(entry.field), { target: { value: 'Unsaved draft' } })

    view.rerender(entry.render({ isOpen: true, secondRecord: true }))

    expect(screen.getByLabelText(entry.field)).toHaveValue(entry.second)
  })
})
