import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TailwindColor } from '@orm'
import { ColorPicker } from './ColorPicker'
import { UserBadgeItem } from './UserBadgeItem'

describe('UserBadgeItem colors', () => {
  it.each(Object.values(TailwindColor))('renders %s using the color picker shade', (color) => {
    render(
      <>
        <ColorPicker selectedColor={color} onColorChange={() => {}} />
        <UserBadgeItem name="Contributor" icon="★" color={color} />
      </>,
    )

    const label = color.charAt(0).toUpperCase() + color.slice(1)
    expect(screen.getByRole('button', { name: label })).toHaveClass(`bg-${color}-500`)
    expect(screen.getByText('★').style.backgroundColor).toBe(`var(--color-${color}-500)`)
  })

  it.each([
    { color: '#123456', expected: 'rgb(18, 52, 86)' },
    { color: 'rebeccapurple', expected: 'rebeccapurple' },
    { color: 'red', expected: 'red' },
    { color: 'var(--custom-badge-color)', expected: 'var(--custom-badge-color)' },
  ])('preserves the custom CSS color $color', (testCase) => {
    render(<UserBadgeItem name="Contributor" icon="★" color={testCase.color} />)
    expect(screen.getByText('★').style.backgroundColor).toBe(testCase.expected)
  })
})
