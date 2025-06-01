import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('renders correctly with default props', () => {
    render(<Badge>Default Badge</Badge>)
    const badge = screen.getByText('Default Badge')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100')
    expect(badge).toHaveClass('rounded')
    expect(badge).not.toHaveClass('rounded-full')
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>)
    expect(screen.getByText('Primary')).toHaveClass('bg-blue-100')

    rerender(<Badge variant="success">Success</Badge>)
    expect(screen.getByText('Success')).toHaveClass('bg-green-100')

    rerender(<Badge variant="warning">Warning</Badge>)
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100')

    rerender(<Badge variant="danger">Danger</Badge>)
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100')

    rerender(<Badge variant="info">Info</Badge>)
    expect(screen.getByText('Info')).toHaveClass('bg-indigo-100')

    rerender(<Badge variant="default">Default</Badge>)
    expect(screen.getByText('Default')).toHaveClass('bg-gray-100')
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small')).toHaveClass('text-xs', 'px-1.5')

    rerender(<Badge size="md">Medium</Badge>)
    expect(screen.getByText('Medium')).toHaveClass('text-xs', 'px-2')

    rerender(<Badge size="lg">Large</Badge>)
    expect(screen.getByText('Large')).toHaveClass('text-sm', 'px-2.5')
  })

  it('applies pill shape when pill is true', () => {
    render(<Badge pill>Pill Badge</Badge>)
    expect(screen.getByText('Pill Badge')).toHaveClass('rounded-full')
    expect(screen.getByText('Pill Badge')).not.toHaveClass('rounded')
  })

  it('applies additional className when provided', () => {
    render(<Badge className="test-class">Custom Class</Badge>)
    expect(screen.getByText('Custom Class')).toHaveClass('test-class')
  })

  it('renders children correctly', () => {
    render(
      <Badge>
        <span data-testid="child-element">Child Content</span>
      </Badge>,
    )
    expect(screen.getByTestId('child-element')).toBeInTheDocument()
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })
})
