import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { MultiSelect } from './MultiSelect'

const mockOptions = [
  { id: '1', name: 'Option 1' },
  { id: '2', name: 'Option 2' },
  { id: '3', name: 'Option 3' },
  { id: '4', name: 'Long Option Name That Should Be Truncated' },
]

describe('MultiSelect', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders with label and placeholder', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={[]}
        onChange={onChange}
        options={mockOptions}
        placeholder="Select options"
      />,
    )

    expect(screen.getByText('Test Select')).toBeInTheDocument()
    expect(screen.getByText('Select options')).toBeInTheDocument()
  })

  it('opens dropdown when clicked', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search test select...')).toBeInTheDocument()
    })
  })

  it('displays selected options correctly', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['1', '2']}
        onChange={onChange}
        options={mockOptions}
        maxDisplayed={2}
      />,
    )

    expect(screen.getByText('Option 1, Option 2')).toBeInTheDocument()
  })

  it('displays truncated text when more options than maxDisplayed', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['1', '2', '3']}
        onChange={onChange}
        options={mockOptions}
        maxDisplayed={2}
      />,
    )

    expect(screen.getByText('Option 1, Option 2 (+1 more)')).toBeInTheDocument()
  })

  it('toggles option selection when checkbox is clicked', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      const checkbox = screen.getByLabelText('Option 1')
      fireEvent.click(checkbox)
    })

    expect(onChange).toHaveBeenCalledWith(['1'])
  })

  it('removes selected option when already selected', async () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['1', '2']}
        onChange={onChange}
        options={mockOptions}
      />,
    )

    const selectButton = screen.getByRole('button', { expanded: false })
    fireEvent.click(selectButton)

    await waitFor(() => {
      const checkbox = screen.getByLabelText('Option 1')
      fireEvent.click(checkbox)
    })

    expect(onChange).toHaveBeenCalledWith(['2'])
  })

  it('filters options based on search query', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search test select...')
      fireEvent.change(searchInput, { target: { value: 'Option 1' } })
    })

    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
  })

  it('shows "No options found" when search has no results', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search test select...')
      fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })
    })

    expect(screen.getByText('No options found')).toBeInTheDocument()
  })

  it('clears all selections when clear all button is clicked', async () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['1', '2']}
        onChange={onChange}
        options={mockOptions}
      />,
    )

    const selectButton = screen.getByRole('button', { expanded: false })
    fireEvent.click(selectButton)

    await waitFor(() => {
      const clearAllButton = screen.getByText('Clear all (2)')
      fireEvent.click(clearAllButton)
    })

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('clears all selections when X button is clicked', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['1', '2']}
        onChange={onChange}
        options={mockOptions}
      />,
    )

    const clearButton = screen.getByRole('button', {
      name: 'Clear all selections',
    })
    fireEvent.click(clearButton)

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('closes dropdown when clicking outside', async () => {
    const onChange = vi.fn()
    render(
      <div>
        <MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />
        <div data-testid="outside">Outside element</div>
      </div>,
    )

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search test select...')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search test select...')).not.toBeInTheDocument()
    })
  })

  it('closes dropdown when Escape is pressed inside the dropdown', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button', { expanded: false }))
    const searchInput = await screen.findByPlaceholderText('Search test select...')

    fireEvent.keyDown(searchInput, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search test select...')).not.toBeInTheDocument()
    })
  })

  it('closes dropdown when Escape is pressed on a checkbox option', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button', { expanded: false }))
    const checkbox = await screen.findByLabelText('Option 1')

    fireEvent.keyDown(checkbox, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search test select...')).not.toBeInTheDocument()
    })
  })

  it('clears the search query when Escape closes the dropdown', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button', { expanded: false }))
    const searchInput = await screen.findByPlaceholderText('Search test select...')
    fireEvent.change(searchInput, { target: { value: 'Option 1' } })
    expect(searchInput).toHaveValue('Option 1')

    fireEvent.keyDown(searchInput, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search test select...')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { expanded: false }))
    const reopenedInput = await screen.findByPlaceholderText('Search test select...')
    expect(reopenedInput).toHaveValue('')
  })

  it('returns focus to the trigger button after closing via Escape', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    const triggerButton = screen.getByRole('button', { expanded: false })
    fireEvent.click(triggerButton)
    const searchInput = await screen.findByPlaceholderText('Search test select...')

    fireEvent.keyDown(searchInput, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search test select...')).not.toBeInTheDocument()
    })
    expect(document.activeElement).toBe(triggerButton)
  })

  it('renders with left icon when provided', () => {
    const onChange = vi.fn()
    const testIcon = <span data-testid="test-icon">📱</span>

    render(
      <MultiSelect
        label="Test Select"
        value={[]}
        onChange={onChange}
        options={mockOptions}
        leftIcon={testIcon}
      />,
    )

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={[]}
        onChange={onChange}
        options={mockOptions}
        className="custom-class"
      />,
    )

    const container = screen.getByText('Test Select').closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('clears search query when clear search button is clicked', async () => {
    const onChange = vi.fn()
    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search test select...')
      fireEvent.change(searchInput, { target: { value: 'test query' } })
    })

    const clearSearchButton = screen.getByRole('button', {
      name: 'Clear search',
    })
    fireEvent.click(clearSearchButton)

    const searchInput = screen.getByPlaceholderText('Search test select...')
    expect(searchInput).toHaveValue('')
  })

  it('opens below the trigger when there is enough visible space', async () => {
    const onChange = vi.fn()
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

    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button', { expanded: false }))

    const optionList = await screen.findByTestId('multi-select-options')
    expect(optionList.parentElement).toHaveClass('top-full')
  })

  it('opens above the trigger when the visual viewport is constrained below it', async () => {
    const onChange = vi.fn()
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

    render(<MultiSelect label="Test Select" value={[]} onChange={onChange} options={mockOptions} />)

    fireEvent.click(screen.getByRole('button', { expanded: false }))

    const optionList = await screen.findByTestId('multi-select-options')
    expect(optionList.parentElement).toHaveClass('bottom-full')
  })

  it('displays selected badges by default', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['1', '2']}
        onChange={onChange}
        options={mockOptions}
      />,
    )

    expect(screen.getByText('Selected (2)')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('hides selected badges when showSelectedBadges is false', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['1', '2']}
        onChange={onChange}
        options={mockOptions}
        showSelectedBadges={false}
      />,
    )

    expect(screen.queryByText('Selected (2)')).not.toBeInTheDocument()
  })

  it('removes individual option when badge X is clicked', () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['1', '2']}
        onChange={onChange}
        options={mockOptions}
      />,
    )

    const removeButton = screen.getByRole('button', { name: 'Remove Option 1' })
    fireEvent.click(removeButton)

    expect(onChange).toHaveBeenCalledWith(['2'])
  })

  it('sorts selected options to the top of the dropdown', async () => {
    const onChange = vi.fn()
    render(
      <MultiSelect
        label="Test Select"
        value={['3', '4']}
        onChange={onChange}
        options={mockOptions}
      />,
    )

    const selectButton = screen.getByLabelText('Test Select multi-select')
    fireEvent.click(selectButton)

    await waitFor(() => {
      const labels = screen.getAllByRole('checkbox')
      expect(labels[0]).toBeChecked()
      expect(labels[1]).toBeChecked()
      expect(labels[2]).not.toBeChecked()
      expect(labels[3]).not.toBeChecked()
    })
  })
})
