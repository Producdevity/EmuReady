import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlatformScope } from '@orm'
import { PlatformsSummary } from './PlatformsSummary'

const ANDROID = { id: 'p-android', name: 'Android', scope: PlatformScope.MOBILE }
const WINDOWS = { id: 'p-windows-x86', name: 'Windows x86', scope: PlatformScope.DESKTOP }
const LINUX_ARM = { id: 'p-linux-arm', name: 'Linux ARM', scope: PlatformScope.UNIVERSAL }

describe('PlatformsSummary', () => {
  it('renders both Default and Supported sections', () => {
    render(<PlatformsSummary platforms={[ANDROID, WINDOWS]} defaultPlatform={ANDROID} />)
    expect(screen.getByText('Default Platform')).toBeInTheDocument()
    expect(screen.getByText('Supported Platforms')).toBeInTheDocument()
  })

  it('renders the default platform inline next to the star indicator', () => {
    render(<PlatformsSummary platforms={[ANDROID]} defaultPlatform={ANDROID} />)
    const defaultLabel = screen.getByText('Default Platform').parentElement
    if (!defaultLabel) throw new Error('expected default section')
    expect(within(defaultLabel).getAllByText('Android').length).toBeGreaterThan(0)
  })

  it('falls back to "Not set" when no default is provided', () => {
    render(<PlatformsSummary platforms={[ANDROID]} defaultPlatform={null} />)
    const defaultLabel = screen.getByText('Default Platform').parentElement
    if (!defaultLabel) throw new Error('expected default section')
    expect(within(defaultLabel).getByText('Not set')).toBeInTheDocument()
  })

  it('respects a custom emptyLabel for missing default and missing supported list', () => {
    render(
      <PlatformsSummary platforms={[]} defaultPlatform={null} emptyLabel="No platforms set yet" />,
    )
    const labels = screen.getAllByText('No platforms set yet')
    expect(labels).toHaveLength(2)
  })

  it('reorders supported platforms so the default appears first', () => {
    render(<PlatformsSummary platforms={[WINDOWS, ANDROID, LINUX_ARM]} defaultPlatform={ANDROID} />)
    const supportedSection = screen.getByText('Supported Platforms').parentElement
    if (!supportedSection) throw new Error('expected supported section')
    const chipList = within(supportedSection).getAllByText(/Android|Windows x86|Linux ARM/)
    expect(chipList.map((node) => node.textContent)).toEqual([
      'Android',
      'Windows x86',
      'Linux ARM',
    ])
  })

  it('annotates the default chip with a "(default)" tooltip', () => {
    render(<PlatformsSummary platforms={[ANDROID, WINDOWS]} defaultPlatform={ANDROID} />)
    const supportedSection = screen.getByText('Supported Platforms').parentElement
    if (!supportedSection) throw new Error('expected supported section')
    const androidChip = within(supportedSection).getByText('Android')
    expect(androidChip).toHaveAttribute('title', 'Android (default)')
    const windowsChip = within(supportedSection).getByText('Windows x86')
    expect(windowsChip).toHaveAttribute('title', 'Windows x86')
  })

  it('renders no default-section star or chip ordering when default is omitted', () => {
    render(<PlatformsSummary platforms={[WINDOWS, ANDROID]} />)
    const supportedSection = screen.getByText('Supported Platforms').parentElement
    if (!supportedSection) throw new Error('expected supported section')
    const chips = within(supportedSection).getAllByText(/Windows x86|Android/)
    expect(chips.map((node) => node.textContent)).toEqual(['Windows x86', 'Android'])
  })
})
