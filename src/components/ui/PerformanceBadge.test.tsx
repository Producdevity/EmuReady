import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PerformanceBadge from './PerformanceBadge'

describe('PerformanceBadge', () => {
  it('renders correctly with rank 1 (Perfect)', () => {
    render(
      <PerformanceBadge rank={1} label="Perfect" description="description" />,
    )
    const badge = screen.getByText('Perfect')

    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('bg-green-100', 'text-green-800')
    expect(badge.closest('span')).toHaveClass('rounded-full') // pill shape
  })

  it('renders correctly with rank 2 (Great)', () => {
    render(
      <PerformanceBadge rank={2} label="Great" description="description" />,
    )
    const badge = screen.getByText('Great')

    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('bg-lime-100', 'text-lime-800')
  })

  it('renders correctly with rank 3 (Playable)', () => {
    render(
      <PerformanceBadge rank={3} label="Playable" description="description" />,
    )
    const badge = screen.getByText('Playable')

    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass(
      'bg-yellow-100',
      'text-yellow-800',
    )
  })

  it('renders correctly with rank 4 (Poor)', () => {
    render(<PerformanceBadge rank={4} label="Poor" description="description" />)
    const badge = screen.getByText('Poor')

    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass(
      'bg-orange-100',
      'text-orange-800',
    )
  })

  it('renders correctly with rank 5 (Ingame)', () => {
    render(
      <PerformanceBadge rank={5} label="Ingame" description="description" />,
    )
    const badge = screen.getByText('Ingame')

    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('renders correctly with rank 6 (Intro)', () => {
    render(
      <PerformanceBadge rank={6} label="Intro" description="description" />,
    )
    const badge = screen.getByText('Intro')

    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('bg-red-200', 'text-red-900')
  })

  it('renders correctly with rank 7 (Loadable)', () => {
    render(
      <PerformanceBadge rank={7} label="Loadable" description="description" />,
    )
    const badge = screen.getByText('Loadable')

    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('bg-red-300', 'text-red-900')
  })

  it('renders correctly with rank 8 (Nothing)', () => {
    render(
      <PerformanceBadge rank={8} label="Nothing" description="description" />,
    )
    const badge = screen.getByText('Nothing')

    expect(badge).toBeInTheDocument()
    expect(badge.closest('span')).toHaveClass('bg-red-400', 'text-red-900')
  })

  it('applies dark mode classes correctly', () => {
    render(
      <PerformanceBadge rank={1} label="Perfect" description="description" />,
    )
    const badge = screen.getByText('Perfect')

    expect(badge.closest('span')).toHaveClass(
      'dark:bg-green-900',
      'dark:text-green-200',
    )
  })

  it('renders custom labels correctly', () => {
    render(
      <PerformanceBadge
        rank={1}
        label="Custom Performance Label"
        description="description"
      />,
    )
    const badge = screen.getByText('Custom Performance Label')

    expect(badge).toBeInTheDocument()
  })

  it('always renders as pill shape (rounded-full)', () => {
    render(<PerformanceBadge rank={1} label="Test" description="description" />)
    const badge = screen.getByText('Test')

    expect(badge.closest('span')).toHaveClass('rounded-full')
    expect(badge.closest('span')).not.toHaveClass('rounded')
  })

  it('has proper badge structure and styling', () => {
    render(
      <PerformanceBadge
        rank={1}
        label="Test Badge"
        description="description"
      />,
    )
    const badge = screen.getByText('Test Badge')

    expect(badge.closest('span')).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
    )
  })

  it('color progression follows performance hierarchy', () => {
    // Test that better performance has greener colors, worse has redder colors
    const { rerender } = render(
      <PerformanceBadge rank={1} label="Perfect" description="description" />,
    )
    expect(screen.getByText('Perfect').closest('span')).toHaveClass(
      'bg-green-100',
    )

    rerender(
      <PerformanceBadge rank={8} label="Nothing" description="description" />,
    )
    expect(screen.getByText('Nothing').closest('span')).toHaveClass(
      'bg-red-400',
    )

    rerender(
      <PerformanceBadge rank={3} label="Playable" description="description" />,
    )
    expect(screen.getByText('Playable').closest('span')).toHaveClass(
      'bg-yellow-100',
    )
  })
})
