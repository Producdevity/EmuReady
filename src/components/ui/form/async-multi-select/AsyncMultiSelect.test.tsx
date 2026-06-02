import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AsyncMultiSelect, { type Option } from './AsyncMultiSelect'

const options: Option[] = [
  { id: 'device-1', name: 'Retroid Pocket 5', badgeName: 'Pocket 5' },
  { id: 'device-2', name: 'AYN Odin 2', badgeName: 'Odin 2' },
]

type AsyncMultiSelectProps = Parameters<typeof AsyncMultiSelect>[0]

function renderSelect(overrides: Partial<AsyncMultiSelectProps> = {}) {
  const props: AsyncMultiSelectProps = {
    label: 'Devices',
    value: [],
    onChange: vi.fn(),
    options,
    selectedByIds: [],
    isFetching: false,
    hasMore: false,
    debounceMs: 10,
    ...overrides,
  }

  render(<AsyncMultiSelect {...props} />)
  return props
}

describe('AsyncMultiSelect', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders selected labels from selectedByIds when the selected option is not on the current page', () => {
    renderSelect({
      value: ['device-99'],
      options: [],
      selectedByIds: [{ id: 'device-99', name: 'Steam Deck OLED', badgeName: 'Deck OLED' }],
    })

    expect(screen.getByText('Steam Deck OLED')).toBeInTheDocument()
    expect(screen.getByText('Deck OLED')).toBeInTheDocument()
  })

  it('renders selected labels in value order from current page options and selectedByIds', () => {
    renderSelect({
      value: ['device-2', 'device-99', 'device-1'],
      selectedByIds: [{ id: 'device-99', name: 'Steam Deck OLED', badgeName: 'Deck OLED' }],
      maxDisplayed: 3,
    })

    expect(screen.getByText('AYN Odin 2, Steam Deck OLED, Retroid Pocket 5')).toBeInTheDocument()
  })

  it('does not emit an initial empty search query on mount', () => {
    const onQueryChange = vi.fn()
    renderSelect({ onQueryChange })

    act(() => {
      vi.advanceTimersByTime(10)
    })

    expect(onQueryChange).not.toHaveBeenCalled()
  })

  it('debounces search query changes', () => {
    const onQueryChange = vi.fn()
    renderSelect({ onQueryChange })

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    fireEvent.change(screen.getByPlaceholderText('Search devices...'), {
      target: { value: 'odin' },
    })

    expect(onQueryChange).not.toHaveBeenCalledWith('odin')

    act(() => {
      vi.advanceTimersByTime(10)
    })

    expect(onQueryChange).toHaveBeenCalledWith('odin')
  })

  it('clears the search query from the search button', () => {
    const onQueryChange = vi.fn()
    renderSelect({ onQueryChange })

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    fireEvent.change(screen.getByPlaceholderText('Search devices...'), {
      target: { value: 'odin' },
    })

    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(onQueryChange).toHaveBeenLastCalledWith('odin')

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(onQueryChange).toHaveBeenLastCalledWith('')
  })

  it('closes the dropdown with Escape and clears the search query', () => {
    const onQueryChange = vi.fn()
    renderSelect({ onQueryChange })

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    const searchInput = screen.getByPlaceholderText('Search devices...')
    fireEvent.change(searchInput, { target: { value: 'odin' } })

    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(onQueryChange).toHaveBeenLastCalledWith('odin')

    fireEvent.keyDown(searchInput, { key: 'Escape' })

    expect(screen.queryByText('Retroid Pocket 5')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    expect(screen.getByPlaceholderText('Search devices...')).toHaveValue('')
  })

  it('closes the dropdown on outside click', () => {
    renderSelect()

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    expect(screen.getByText('Retroid Pocket 5')).toBeInTheDocument()

    fireEvent.click(document.body)

    expect(screen.queryByText('Retroid Pocket 5')).not.toBeInTheDocument()
  })

  it('opens another async select from the same click that closes the current select', () => {
    render(
      <>
        <AsyncMultiSelect
          label="Devices"
          value={[]}
          onChange={vi.fn()}
          options={options}
          selectedByIds={[]}
          isFetching={false}
          hasMore={false}
        />
        <AsyncMultiSelect
          label="SoCs"
          value={[]}
          onChange={vi.fn()}
          options={[{ id: 'soc-1', name: 'Snapdragon G3x Gen 2' }]}
          selectedByIds={[]}
          isFetching={false}
          hasMore={false}
        />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    expect(screen.getByText('Retroid Pocket 5')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'SoCs multi-select' }))

    expect(screen.queryByText('Retroid Pocket 5')).not.toBeInTheDocument()
    expect(screen.getByText('Snapdragon G3x Gen 2')).toBeInTheDocument()
  })

  it('selects and deselects options', () => {
    const onChange = vi.fn()
    renderSelect({ value: ['device-1'], onChange })

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    fireEvent.click(screen.getByLabelText('Retroid Pocket 5'))
    expect(onChange).toHaveBeenCalledWith([])

    fireEvent.click(screen.getByLabelText('AYN Odin 2'))
    expect(onChange).toHaveBeenCalledWith(['device-1', 'device-2'])
  })

  it('selects an option when the visible row text is clicked', () => {
    const onChange = vi.fn()
    renderSelect({ onChange })

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    fireEvent.click(screen.getByText('AYN Odin 2'))

    expect(onChange).toHaveBeenCalledWith(['device-2'])
  })

  it('clears all selections from the dropdown footer', () => {
    const onChange = vi.fn()
    renderSelect({ value: ['device-1', 'device-2'], onChange })

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    fireEvent.click(screen.getByText('Clear all (2)'))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('removes one selected chip without clearing the other selected values', () => {
    const onChange = vi.fn()
    renderSelect({ value: ['device-1', 'device-2'], onChange })

    fireEvent.click(screen.getByRole('button', { name: 'Remove Retroid Pocket 5' }))

    expect(onChange).toHaveBeenCalledWith(['device-2'])
  })

  it('shows empty and loading states', () => {
    const { rerender } = render(
      <AsyncMultiSelect
        label="Devices"
        value={[]}
        onChange={vi.fn()}
        options={[]}
        selectedByIds={[]}
        isFetching={false}
        hasMore={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    expect(screen.getByText('No options found')).toBeInTheDocument()

    rerender(
      <AsyncMultiSelect
        label="Devices"
        value={[]}
        onChange={vi.fn()}
        options={[]}
        selectedByIds={[]}
        isFetching={true}
        hasMore={false}
      />,
    )

    expect(screen.getByText(/Loading/)).toBeInTheDocument()
  })

  it('opens below the trigger when there is enough visible space', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 150,
      height: 40,
      left: 0,
      right: 320,
      top: 110,
      width: 320,
      x: 0,
      y: 110,
      toJSON: () => ({}),
    })

    renderSelect()

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))

    expect(screen.getByTestId('async-multi-select-options').parentElement).toHaveClass('top-full')
  })

  it('opens above the trigger when the visual viewport is constrained below it', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 350,
      height: 40,
      left: 0,
      right: 320,
      top: 310,
      width: 320,
      x: 0,
      y: 310,
      toJSON: () => ({}),
    })
    vi.stubGlobal('visualViewport', {
      addEventListener: vi.fn(),
      height: 360,
      offsetTop: 0,
      removeEventListener: vi.fn(),
    })

    renderSelect()

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))

    expect(screen.getByTestId('async-multi-select-options').parentElement).toHaveClass(
      'bottom-full',
    )
  })

  it('loads more options when scrolled near the bottom', () => {
    const onLoadMore = vi.fn()
    renderSelect({ hasMore: true, onLoadMore })

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    const scrollContainer = screen.getByTestId('async-multi-select-options')

    Object.defineProperty(scrollContainer, 'scrollTop', { value: 260, configurable: true })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 80, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 340, configurable: true })

    fireEvent.scroll(scrollContainer)

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('does not load more while already fetching or when no more pages exist', () => {
    const onLoadMore = vi.fn()
    const { rerender } = render(
      <AsyncMultiSelect
        label="Devices"
        value={[]}
        onChange={vi.fn()}
        options={options}
        selectedByIds={[]}
        isFetching={true}
        hasMore={true}
        onLoadMore={onLoadMore}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    const scrollContainer = screen.getByTestId('async-multi-select-options')
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 260, configurable: true })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 80, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 340, configurable: true })

    fireEvent.scroll(scrollContainer)
    expect(onLoadMore).not.toHaveBeenCalled()

    rerender(
      <AsyncMultiSelect
        label="Devices"
        value={[]}
        onChange={vi.fn()}
        options={options}
        selectedByIds={[]}
        isFetching={false}
        hasMore={false}
        onLoadMore={onLoadMore}
      />,
    )

    fireEvent.scroll(scrollContainer)
    expect(onLoadMore).not.toHaveBeenCalled()
  })
})
