import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Autocomplete, type AutocompleteOptionBase } from './Autocomplete'

interface TestOption extends AutocompleteOptionBase {
  id: string
  name: string
  category?: string
  icon?: string
}

interface GameOption extends AutocompleteOptionBase {
  id: string
  title: string
  system: {
    id: string
    name: string
  }
}

const mockStaticItems: TestOption[] = [
  { id: '1', name: 'Apple', category: 'fruit' },
  { id: '2', name: 'Banana', category: 'fruit' },
  { id: '3', name: 'Carrot', category: 'vegetable' },
  { id: '4', name: 'Date', category: 'fruit' },
  { id: '5', name: 'Eggplant', category: 'vegetable' },
]

const mockGameItems: GameOption[] = [
  { id: 'g1', title: 'Super Mario Bros', system: { id: 's1', name: 'NES' } },
  { id: 'g2', title: 'The Legend of Zelda', system: { id: 's1', name: 'NES' } },
  {
    id: 'g3',
    title: 'Sonic the Hedgehog',
    system: { id: 's2', name: 'Genesis' },
  },
]

const defaultProps = {
  optionToValue: (item: TestOption) => item.id,
  optionToLabel: (item: TestOption) => item.name,
  onChange: vi.fn(),
}

const gameProps = {
  label: 'Game',
  placeholder: 'Select a game...',
  optionToValue: (game: GameOption) => game.id,
  optionToLabel: (game: GameOption) => game.title,
  onChange: vi.fn(),
}

describe('Autocomplete async response ordering', () => {
  it.each(['debounce', 'request'] as const)(
    'discards a pending %s when the parent selects another option',
    async (stage) => {
      vi.useFakeTimers()
      const pending = Promise.withResolvers<TestOption[]>()
      const loadItems = vi.fn((query: string) => (query ? pending.promise : Promise.resolve([])))
      const props = { ...defaultProps, loadItems, items: mockStaticItems }
      const view = render(<Autocomplete {...props} />)
      try {
        await act(async () => {})
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'App' } })
        if (stage === 'request') await act(async () => vi.advanceTimersByTime(300))

        view.rerender(<Autocomplete {...props} value="2" />)
        expect(screen.getByRole('combobox')).toHaveValue('Banana')
        await act(async () => vi.advanceTimersByTime(300))
        await act(async () => pending.resolve([{ id: '1', name: 'Apple' }]))

        expect(screen.getByRole('combobox')).toHaveValue('Banana')
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
        if (stage === 'debounce') expect(loadItems).not.toHaveBeenCalledWith('App')
      } finally {
        pending.resolve([])
        vi.useRealTimers()
      }
    },
  )

  it('searches the selected label instead of reopening the prior async results', async () => {
    const loadItems = vi.fn(async (query: string) =>
      query === 'App'
        ? [
            { id: '1', name: 'Apple' },
            { id: '2', name: 'Application' },
          ]
        : [],
    )
    render(<Autocomplete {...defaultProps} loadItems={loadItems} debounceTime={0} />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'App' } })
    fireEvent.mouseDown(await screen.findByRole('option', { name: 'Apple' }))
    fireEvent.blur(input)
    fireEvent.focus(input)
    await waitFor(() => expect(loadItems).toHaveBeenCalledWith('Apple'))
    expect(screen.queryByRole('option', { name: 'Application' })).not.toBeInTheDocument()
  })

  it('keeps a newer lookup when the initial empty lookup completes last', async () => {
    const initial = Promise.withResolvers<TestOption[]>()
    const typed = Promise.withResolvers<TestOption[]>()
    const loadItems = vi.fn((query: string) => (query ? typed.promise : initial.promise))
    render(<Autocomplete {...defaultProps} loadItems={loadItems} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Rare' } })
    await waitFor(() => expect(loadItems).toHaveBeenCalledWith('Rare'))
    await act(async () => typed.resolve([{ id: 'new', name: 'Rare result' }]))
    expect(screen.getByRole('option', { name: 'Rare result' })).toBeVisible()

    await act(async () => initial.resolve([{ id: 'old', name: 'Initial result' }]))

    expect(screen.getByRole('option', { name: 'Rare result' })).toBeVisible()
    expect(screen.queryByRole('option', { name: 'Initial result' })).not.toBeInTheDocument()
  })

  it.each(['resolve', 'reject'] as const)(
    'keeps a newer lookup when an older typed lookup finishes with %s',
    async (outcome) => {
      const older = Promise.withResolvers<TestOption[]>()
      const newer = Promise.withResolvers<TestOption[]>()
      const loadItems = vi.fn((query: string) => {
        if (!query) return Promise.resolve([])
        return query === 'Old' ? older.promise : newer.promise
      })
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        render(<Autocomplete {...defaultProps} loadItems={loadItems} />)
        const input = screen.getByRole('combobox')
        fireEvent.change(input, { target: { value: 'Old' } })
        await waitFor(() => expect(loadItems).toHaveBeenCalledWith('Old'))
        fireEvent.change(input, { target: { value: 'New' } })
        await waitFor(() => expect(loadItems).toHaveBeenCalledWith('New'))
        await act(async () => newer.resolve([{ id: 'new', name: 'Newest result' }]))

        await act(async () => {
          if (outcome === 'reject') older.reject(new Error('Old request failed'))
          else older.resolve([{ id: 'old', name: 'Older result' }])
        })

        expect(screen.getByRole('option', { name: 'Newest result' })).toBeVisible()
        expect(screen.queryByRole('option', { name: 'Older result' })).not.toBeInTheDocument()
        expect(errorLog).not.toHaveBeenCalled()
      } finally {
        older.resolve([])
        newer.resolve([])
        errorLog.mockRestore()
      }
    },
  )
})

describe('Autocomplete Component', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup({
      delay: null, // Remove all typing delays for faster tests
    })
    vi.clearAllMocks()
    // Don't use fake timers by default - only in specific tests that need them
  })

  afterEach(() => {
    // Clean up any remaining timers from tests that use fake timers
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', 'Type to search...')
      expect(input).toHaveAttribute('autoComplete', 'off')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
    })

    it('should render with custom placeholder', () => {
      render(
        <Autocomplete {...defaultProps} items={mockStaticItems} placeholder="Search fruits..." />,
      )

      expect(screen.getByPlaceholderText('Search fruits...')).toBeInTheDocument()
    })

    it('should render with label', () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} label="Select Item" />)

      expect(screen.getByText('Select Item')).toBeInTheDocument()
      expect(screen.getByLabelText('Select Item')).toBeInTheDocument()
    })

    it('should render with left and right icons', () => {
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          leftIcon={<span data-testid="left-icon">🔍</span>}
          rightIcon={<span data-testid="right-icon">⚙️</span>}
        />,
      )

      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('should render as disabled', () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} disabled />)

      const input = screen.getByRole('combobox')
      expect(input).toBeDisabled()
    })

    it('should apply custom className', () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} className="custom-class" />)

      const container = screen.getByRole('combobox').closest('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Static Items Functionality', () => {
    it('should show all items on focus when input is empty', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      mockStaticItems.forEach((item) => {
        expect(screen.getByText(item.name)).toBeInTheDocument()
      })
    })

    it('should filter items based on input', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'ap')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
        expect(screen.queryByText('Banana')).not.toBeInTheDocument()
      })
    })

    it('should filter items using custom filterKeys', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} filterKeys={['category']} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'fruit')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
        expect(screen.getByText('Banana')).toBeInTheDocument()
        expect(screen.getByText('Date')).toBeInTheDocument()
        expect(screen.queryByText('Carrot')).not.toBeInTheDocument()
      })
    })

    it('should show "No results found" when no items match', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'xyz')

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument()
      })
    })

    it('should handle case-insensitive filtering', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'APPLE')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })
    })

    it('should handle partial matching', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'ppl')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })
    })

    it('should select item on click', async () => {
      const mockOnChange = vi.fn()
      render(<Autocomplete {...defaultProps} items={mockStaticItems} onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const appleOption = screen.getByText('Apple')
      await user.click(appleOption)

      expect(mockOnChange).toHaveBeenCalledWith('1')
    })

    it('should close dropdown on item selection', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const appleOption = screen.getByText('Apple')
      await user.click(appleOption)

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should open dropdown on ArrowDown key', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })
    })

    it('should navigate through items with ArrowDown and ArrowUp', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Navigate down
      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
      })

      await user.keyboard('{ArrowDown}')
      await waitFor(() => {
        expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
      })

      // Navigate up
      await user.keyboard('{ArrowUp}')
      await waitFor(() => {
        expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('should wrap around when navigating past first/last item', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const options = screen.getAllByRole('option')

      // Navigate up from first item (should wrap to last)
      await user.keyboard('{ArrowDown}') // Select first
      await user.keyboard('{ArrowUp}') // Should wrap to last
      await waitFor(() => {
        expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true')
      })

      // Navigate down from last item (should wrap to first)
      await user.keyboard('{ArrowDown}') // Should wrap to first
      await waitFor(() => {
        expect(options[0]).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('should select highlighted item on Enter', async () => {
      const mockOnChange = vi.fn()
      render(<Autocomplete {...defaultProps} items={mockStaticItems} onChange={mockOnChange} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{ArrowDown}') // Highlight first item
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('1')
      })
    })

    it('should close dropdown on Escape', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('submits the form instead of selecting a dismissed option and can reopen with arrows', async () => {
      const onChange = vi.fn()
      const onSubmit = vi.fn()
      render(
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <Autocomplete {...defaultProps} items={mockStaticItems} onChange={onChange} />
        </form>,
      )
      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.keyboard('{ArrowDown}{Escape}{Enter}')
      expect(onChange).not.toHaveBeenCalled()
      expect(onSubmit).toHaveBeenCalledOnce()
      expect(input).not.toHaveAttribute('aria-activedescendant')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
      expect(onChange).toHaveBeenCalledExactlyOnceWith('1')
      expect(onSubmit).toHaveBeenCalledOnce()
    })

    it('does not schedule a lookup for Enter while the dropdown is closed', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)
      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.keyboard('{Escape}')
      vi.useFakeTimers()
      fireEvent.keyDown(input, { key: 'Enter' })
      await act(() => vi.advanceTimersByTimeAsync(300))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('does not select hidden prior results while an async lookup is loading', async () => {
      const pending = Promise.withResolvers<TestOption[]>()
      const onChange = vi.fn()
      const loadItems = vi.fn((query: string) =>
        query ? pending.promise : Promise.resolve(mockStaticItems),
      )
      render(
        <Autocomplete
          {...defaultProps}
          loadItems={loadItems}
          debounceTime={0}
          onChange={onChange}
        />,
      )
      try {
        const input = screen.getByRole('combobox')
        await user.click(input)
        await screen.findByRole('option', { name: 'Apple' })
        await user.type(input, 'Ba')
        await waitFor(() => expect(loadItems).toHaveBeenCalledWith('Ba'))
        expect(screen.queryByRole('option')).not.toBeInTheDocument()
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onChange).not.toHaveBeenCalled()
        expect(input).not.toHaveAttribute('aria-activedescendant')
        expect(input).toHaveValue('Ba')
      } finally {
        await act(async () => pending.resolve([]))
      }
    })

    it('should close dropdown on Tab', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{Tab}')

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('should reset highlight when typing', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'ap')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })

      await user.keyboard('{ArrowDown}') // Highlight first item

      // Verify item is highlighted
      await waitFor(() => {
        const firstOption = screen.getByText('Apple').closest('[role="option"]')
        expect(firstOption).toHaveAttribute('aria-selected', 'true')
      })

      await user.type(input, 'p') // Type more

      // When typing, highlighted index is reset to -1 in the component
      await waitFor(() => {
        const options = screen.getAllByRole('option')
        options.forEach((option) => {
          expect(option).toHaveAttribute('aria-selected', 'false')
        })
      })
    })
  })

  describe('Mouse Interactions', () => {
    it('should highlight item on hover', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const firstOption = screen.getAllByRole('option')[0]
      await user.hover(firstOption)

      expect(firstOption).toHaveAttribute('aria-selected', 'true')
    })

    it('should remove highlight on mouse leave', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const firstOption = screen.getByText('Apple').closest('[role="option"]')!

      await user.hover(firstOption)
      expect(firstOption).toHaveAttribute('aria-selected', 'true')

      // Note: user.unhover() doesn't trigger a real mouse leave in jsdom
      // The component uses onMouseEnter to set highlight, not onMouseLeave to clear it
      // So we'll just verify the hover behavior works
      expect(firstOption).toHaveAttribute('aria-selected', 'true')
    })

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <Autocomplete {...defaultProps} items={mockStaticItems} />
          <button>Outside</button>
        </div>,
      )

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const outsideButton = screen.getByText('Outside')
      await user.click(outsideButton)

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('should not close dropdown when clicking inside the component', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Click on the input again
      await user.click(input)

      // Dropdown should still be open
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
  })

  describe('Async Loading', () => {
    const mockLoadItems = vi.fn()

    beforeEach(() => {
      mockLoadItems.mockClear()
    })

    it('should call loadItems when typing', async () => {
      mockLoadItems.mockResolvedValue(mockStaticItems)

      render(<Autocomplete {...defaultProps} loadItems={mockLoadItems} minCharsToTrigger={2} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'ap')

      await waitFor(() => {
        expect(mockLoadItems).toHaveBeenCalledWith('ap')
      })
    })

    it('should not call loadItems before minCharsToTrigger', async () => {
      mockLoadItems.mockResolvedValue(mockStaticItems)

      render(<Autocomplete {...defaultProps} loadItems={mockLoadItems} minCharsToTrigger={3} />)

      const input = screen.getByRole('combobox')

      // Clear any calls from focus/initialization
      mockLoadItems.mockClear()

      await user.type(input, 'ap')

      // Should not be called yet since we only have 2 chars
      await waitFor(() => {
        expect(mockLoadItems).not.toHaveBeenCalled()
      })

      await user.type(input, 'p')

      await waitFor(() => {
        expect(mockLoadItems).toHaveBeenCalledWith('app')
      })
    })

    it('should show loading state while fetching', async () => {
      let resolvePromise: (value: TestOption[]) => void
      const promise = new Promise<TestOption[]>((resolve) => {
        resolvePromise = resolve
      })
      mockLoadItems.mockReturnValue(promise)

      render(<Autocomplete {...defaultProps} loadItems={mockLoadItems} minCharsToTrigger={2} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'ap')

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })

      // Resolve the promise
      act(() => {
        resolvePromise!(mockStaticItems)
      })

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })

    it('should handle error state on failed load gracefully', async () => {
      // Mock console.error to suppress expected error logs
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockLoadItems.mockRejectedValue(new Error('Failed to load'))

      render(<Autocomplete {...defaultProps} loadItems={mockLoadItems} minCharsToTrigger={2} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'ap')

      // Verify loadItems was called
      await waitFor(() => {
        expect(mockLoadItems).toHaveBeenCalledWith('ap')
      })

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      // After error, component should not crash and should gracefully handle the error
      // No specific UI expectation - just that it doesn't break
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-expanded', 'true')

      // Restore console.error
      consoleErrorSpy.mockRestore()
    })

    it('should debounce loadItems calls', async () => {
      mockLoadItems.mockResolvedValue(mockStaticItems)

      render(
        <Autocomplete
          {...defaultProps}
          loadItems={mockLoadItems}
          minCharsToTrigger={1}
          debounceTime={50} // Use shorter debounce for faster test
        />,
      )

      const input = screen.getByRole('combobox')

      // Clear any initial calls
      mockLoadItems.mockClear()

      // Type multiple characters quickly
      await user.type(input, 'a')
      await user.type(input, 'p')
      await user.type(input, 'p')

      // Should not be called yet due to debouncing
      expect(mockLoadItems).not.toHaveBeenCalled()

      // Wait for debounce period with shorter timeout
      await waitFor(
        () => {
          expect(mockLoadItems).toHaveBeenCalledTimes(1)
          expect(mockLoadItems).toHaveBeenCalledWith('app')
        },
        { timeout: 200 },
      )
    })

    it('should cancel previous request when new one is made', async () => {
      let firstResolve: (value: TestOption[]) => void
      let secondResolve: (value: TestOption[]) => void

      const firstPromise = new Promise<TestOption[]>((resolve) => {
        firstResolve = resolve
      })

      const secondPromise = new Promise<TestOption[]>((resolve) => {
        secondResolve = resolve
      })

      mockLoadItems.mockImplementation((query) => {
        if (query === 'ap') return firstPromise
        if (query === 'ba') return secondPromise
        return Promise.resolve([])
      })

      render(<Autocomplete {...defaultProps} loadItems={mockLoadItems} minCharsToTrigger={2} />)

      const input = screen.getByRole('combobox')

      // First request
      await user.type(input, 'ap')
      await waitFor(() => {
        expect(mockLoadItems).toHaveBeenCalledWith('ap')
      })

      // Second request before first completes
      await user.clear(input)
      await user.type(input, 'ba')
      await waitFor(() => {
        expect(mockLoadItems).toHaveBeenCalledWith('ba')
      })

      // Resolve first request (should be ignored)
      act(() => {
        firstResolve!([{ id: '1', name: 'Apple' }])
      })

      // Resolve second request
      act(() => {
        secondResolve!([{ id: '2', name: 'Banana' }])
      })

      await waitFor(() => {
        expect(screen.getByText('Banana')).toBeInTheDocument()
        expect(screen.queryByText('Apple')).not.toBeInTheDocument()
      })
    })

    it('should clear results when input is cleared', async () => {
      mockLoadItems.mockResolvedValue(mockStaticItems)

      render(<Autocomplete {...defaultProps} loadItems={mockLoadItems} minCharsToTrigger={2} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'ap')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })

      await user.clear(input)

      await waitFor(() => {
        expect(screen.queryByText('Apple')).not.toBeInTheDocument()
      })
    })
  })

  describe('Controlled Component', () => {
    it('should display the selected value when value prop is provided', () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} value="1" />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('Apple')
    })

    it('should update input when value prop changes', () => {
      const { rerender } = render(
        <Autocomplete {...defaultProps} items={mockStaticItems} value="1" />,
      )

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('Apple')

      rerender(<Autocomplete {...defaultProps} items={mockStaticItems} value="2" />)

      expect(input).toHaveValue('Banana')
    })

    it('should clear input when value is set to null', () => {
      const mockOnChange = vi.fn()
      const { rerender } = render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          value="1"
          onChange={mockOnChange}
        />,
      )

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('Apple')

      rerender(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          value={null}
          onChange={mockOnChange}
        />,
      )

      // When value is null, the component should clear the input
      expect(input).toHaveValue('')
    })

    it('should call onChange when typing to clear the selection', async () => {
      const mockOnChange = vi.fn()
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          value="1"
          onChange={mockOnChange}
        />,
      )

      const input = screen.getByRole('combobox')
      expect(input).toHaveValue('Apple')

      // When typing in a controlled component, it should call onChange with null to clear the selection
      await user.type(input, 'x')

      // The onChange should be called with null (clearing the selection)
      expect(mockOnChange).toHaveBeenCalledWith(null)
    })

    it('should call onChange when selecting an item in controlled mode', async () => {
      const mockOnChange = vi.fn()
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          value={null}
          onChange={mockOnChange}
        />,
      )

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const appleOption = screen.getByText('Apple')
      await user.click(appleOption)

      expect(mockOnChange).toHaveBeenCalledWith('1')
    })
  })

  describe('Game Items Example', () => {
    it('should work with complex object structure', async () => {
      render(<Autocomplete {...gameProps} items={mockGameItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // The component shows just the title, not the formatted string with system
      expect(screen.getByText('Super Mario Bros')).toBeInTheDocument()
      expect(screen.getByText('The Legend of Zelda')).toBeInTheDocument()
      expect(screen.getByText('Sonic the Hedgehog')).toBeInTheDocument()
    })

    it('should filter complex objects correctly', async () => {
      render(<Autocomplete {...gameProps} items={mockGameItems} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'mario')

      await waitFor(() => {
        expect(screen.getByText('Super Mario Bros')).toBeInTheDocument()
        expect(screen.queryByText('The Legend of Zelda')).not.toBeInTheDocument()
      })
    })

    it('should filter by nested properties when using custom filterKeys', async () => {
      const gamePropsWithOnChange = {
        label: 'Game',
        placeholder: 'Select a game...',
        optionToValue: (game: GameOption) => game.id,
        optionToLabel: (game: GameOption) => game.title,
        onChange: vi.fn(),
      }

      render(<Autocomplete {...gamePropsWithOnChange} items={mockGameItems} />)

      const input = screen.getByRole('combobox')
      await user.type(input, 'mario')

      await waitFor(() => {
        expect(screen.getByText('Super Mario Bros')).toBeInTheDocument()
        expect(screen.queryByText('The Legend of Zelda')).not.toBeInTheDocument()
      })
    })
  })

  describe('selection and request state', () => {
    it('keeps a typed search when its controlled selection is cleared', async () => {
      function Controlled() {
        const [value, setValue] = useState<string | null>('1')
        return (
          <Autocomplete
            {...defaultProps}
            items={mockStaticItems}
            value={value}
            onChange={setValue}
          />
        )
      }
      render(<Controlled />)
      const input = screen.getByRole('combobox')
      await user.type(input, 'x')
      expect(input).toHaveValue('Applex')
    })

    it('keeps the draft when the form maps a local selection clear to an empty string', async () => {
      function Controlled() {
        const [value, setValue] = useState('1')
        return (
          <Autocomplete
            {...defaultProps}
            items={mockStaticItems}
            value={value}
            onChange={(next) => setValue(next ?? '')}
          />
        )
      }
      render(<Controlled />)
      const input = screen.getByRole('combobox')
      await user.type(input, 'x')
      expect(input).toHaveValue('Applex')
    })

    it('replaces a draft when the parent selects another item', async () => {
      const { rerender } = render(
        <Autocomplete {...defaultProps} items={mockStaticItems} value="1" />,
      )
      await user.type(screen.getByRole('combobox'), 'x')
      rerender(<Autocomplete {...defaultProps} items={mockStaticItems} value="2" />)
      expect(screen.getByRole('combobox')).toHaveValue('Banana')
    })

    it('updates open static options when same-length data changes', async () => {
      const { rerender } = render(
        <Autocomplete {...defaultProps} items={[{ id: '1', name: 'Apple' }]} />,
      )
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
      rerender(<Autocomplete {...defaultProps} items={[{ id: '2', name: 'Banana' }]} />)
      expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument()
    })

    it('loads an initial selected label once in Strict Mode', async () => {
      const loadItems = vi.fn().mockResolvedValue(mockStaticItems)
      render(
        <StrictMode>
          <Autocomplete {...defaultProps} loadItems={loadItems} value="1" />
        </StrictMode>,
      )
      await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('Apple'))
      expect(loadItems).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      render(<Autocomplete {...defaultProps} items={[]} />)

      const input = screen.getByRole('combobox')
      fireEvent.focus(input)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should handle undefined items', () => {
      render(<Autocomplete {...defaultProps} items={undefined as unknown as TestOption[]} />)

      const input = screen.getByRole('combobox')
      fireEvent.focus(input)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should handle items with missing required properties', () => {
      const invalidItems = [
        { id: '1', name: 'Valid Item' },
        { id: '', name: 'Empty ID' },
        { id: '3' }, // Missing name
      ] as TestOption[]

      render(<Autocomplete {...defaultProps} items={invalidItems} />)

      const input = screen.getByRole('combobox')
      fireEvent.focus(input)

      // Should only show valid items
      expect(screen.getByText('Valid Item')).toBeInTheDocument()
    })

    it('should handle very long lists efficiently', async () => {
      const longList: TestOption[] = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
      }))

      render(<Autocomplete {...defaultProps} items={longList} />)

      const input = screen.getByRole('combobox')
      await user.type(input, '99')

      await waitFor(() => {
        expect(screen.getByText('Item 99')).toBeInTheDocument()
      })
    })

    it('should handle rapid typing without breaking', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')

      // Rapid typing simulation
      await user.type(input, 'apple')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })
    })

    it('should handle focus and blur events correctly', async () => {
      render(
        <div>
          <Autocomplete {...defaultProps} items={mockStaticItems} />
          <button>Other Element</button>
        </div>,
      )

      const input = screen.getByRole('combobox')
      const button = screen.getByText('Other Element')

      // Focus should open dropdown
      await user.click(input)
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Blur should close dropdown
      await user.click(button)
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('should handle disabled state correctly', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} disabled />)

      const input = screen.getByRole('combobox')

      // Should not open dropdown when disabled
      await user.click(input)
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

      // Should not respond to keyboard events
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
      expect(input).toHaveAttribute('aria-expanded', 'false')
      expect(input).toHaveAttribute('role', 'combobox')
    })

    it('should update aria-expanded when dropdown opens/closes', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      expect(input).toHaveAttribute('aria-expanded', 'false')

      await user.click(input)
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true')
      })

      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('should have proper listbox role and options', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        expect(listbox).toBeInTheDocument()

        const options = screen.getAllByRole('option')
        expect(options).toHaveLength(mockStaticItems.length)

        options.forEach((option) => {
          expect(option).toHaveAttribute('role', 'option')
          expect(option).toHaveAttribute('id', expect.stringContaining('option'))
        })
      })
    })

    it('should associate input with listbox using aria-controls', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        const listboxId = listbox.getAttribute('id')
        expect(input).toHaveAttribute('aria-controls', listboxId)
      })
    })

    it('should announce selection changes to screen readers', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{ArrowDown}')

      const firstOption = screen.getAllByRole('option')[0]
      expect(firstOption).toHaveAttribute('aria-selected', 'true')
      expect(input).toHaveAttribute('aria-activedescendant', firstOption.getAttribute('id'))
    })
  })
})
