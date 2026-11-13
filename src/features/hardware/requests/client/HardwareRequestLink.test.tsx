import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { HardwareRequestLink } from './HardwareRequestLink'

it.each(['CPU', 'GPU'] as const)(
  'prefills a %s request without navigating away from the report',
  (hardwareType) => {
    render(<HardwareRequestLink hardwareType={hardwareType} />)
    const link = screen.getByRole('link', { name: `Request a ${hardwareType} on GitHub` })
    const url = new URL(link.getAttribute('href') ?? '')
    expect(url.origin).toBe('https://github.com')
    expect(url.pathname).toBe('/Producdevity/EmuReady/issues/new')
    expect(url.searchParams.get('template')).toBe('feature_request.yml')
    expect(url.searchParams.get('title')).toBe(`[${hardwareType} Request]: `)
    expect(url.searchParams.get('problem')).toBe(
      `My ${hardwareType} is missing from the PC compatibility report form.\n\nManufacturer: \nFull model name: `,
    )
    expect(url.searchParams.get('proposed-solution')).toBe(
      `Please add this ${hardwareType} to EmuReady.`,
    )
    expect(url.searchParams.get('additional-context')).toContain('specification source')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  },
)
