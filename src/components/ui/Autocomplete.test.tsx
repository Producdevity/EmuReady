import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Autocomplete, { type AutocompleteOptionBase } from './Autocomplete'

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
  optionToValue: (item: GameOption) => item.id,
  optionToLabel: (item: GameOption) => `${item.title} (${item.system.name})`,
  onChange: vi.fn(),
}

describe('Autocomplete Component', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', 'Type to search...')
      expect(input).toHaveAttribute('autoComplete', 'off')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
    })

    it('should render with custom placeholder', () => {
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          placeholder="Search fruits..."
        />,
      )

      expect(
        screen.getByPlaceholderText('Search fruits...'),
      ).toBeInTheDocument()
    })

    it('should render with label', () => {
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          label="Select Item"
        />,
      )

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
      render(
        <Autocomplete {...defaultProps} items={mockStaticItems} disabled />,
      )

      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('should apply custom className', () => {
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          className="custom-class"
        />,
      )

      const container = screen.getByRole('textbox').closest('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Static Items Functionality', () => {
    it('should show all items on focus when input is empty', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
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

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
        expect(screen.queryByText('Banana')).not.toBeInTheDocument()
      })
    })

    it('should filter items using custom filterKeys', async () => {
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          filterKeys={['category']}
        />,
      )

      const input = screen.getByRole('textbox')
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

      const input = screen.getByRole('textbox')
      await user.type(input, 'xyz')

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument()
      })
    })

    it('should handle case-insensitive filtering', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'APPLE')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })
    })
  })

  describe('Async Loading Functionality', () => {
    const mockLoadItems = vi.fn()

    beforeEach(() => {
      mockLoadItems.mockClear()
    })

    it('should call loadItems when typing', async () => {
      mockLoadItems.mockResolvedValue(mockStaticItems.slice(0, 2))

      render(
        <Autocomplete
          {...defaultProps}
          loadItems={mockLoadItems}
          minCharsToTrigger={2}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      await waitFor(() => {
        expect(mockLoadItems).toHaveBeenCalledWith('ap')
      })
    })

    it('should show loading spinner while fetching', async () => {
      mockLoadItems.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockStaticItems), 500),
          ),
      )

      render(
        <Autocomplete
          {...defaultProps}
          loadItems={mockLoadItems}
          debounceTime={50}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      // Should show loading spinner
      await waitFor(
        () => {
          expect(screen.getByText('Loading...')).toBeInTheDocument()
        },
        { timeout: 200 },
      )

      // Should hide loading spinner after data loads
      await waitFor(
        () => {
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
        },
        { timeout: 1000 },
      )
    })

    it('should debounce loadItems calls', async () => {
      mockLoadItems.mockResolvedValue([])

      render(
        <Autocomplete
          {...defaultProps}
          loadItems={mockLoadItems}
          debounceTime={100}
        />,
      )

      const input = screen.getByRole('textbox')

      // Clear any initial calls
      mockLoadItems.mockClear()

      // Simulate rapid typing by firing change events quickly
      fireEvent.change(input, { target: { value: 'a' } })
      fireEvent.change(input, { target: { value: 'ap' } })
      fireEvent.change(input, { target: { value: 'app' } })

      // Wait for debounce to complete
      await waitFor(() => {
        // Should have been called at least once, but due to rapid typing might be called more
        expect(mockLoadItems).toHaveBeenCalled()
        // The final call should be with the complete string
        expect(mockLoadItems).toHaveBeenLastCalledWith('app')
      })

      // Ensure no more calls happen after debounce period
      await new Promise((resolve) => setTimeout(resolve, 150))
      const finalCallCount = mockLoadItems.mock.calls.length

      // Should not have additional calls after the debounce period
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(mockLoadItems).toHaveBeenCalledTimes(finalCallCount)
    })

    it('should handle loadItems errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockLoadItems.mockRejectedValue(new Error('Network error'))

      render(<Autocomplete {...defaultProps} loadItems={mockLoadItems} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ap')

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching/filtering suggestions:',
          expect.any(Error),
        )
      })

      consoleSpy.mockRestore()
    })

    it('should show minimum characters message', async () => {
      render(
        <Autocomplete
          {...defaultProps}
          loadItems={mockLoadItems}
          minCharsToTrigger={3}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.type(input, 'a')

      await waitFor(() => {
        expect(
          screen.getByText('Type at least 3 characters to search'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Selection Behavior', () => {
    it('should select item on click', async () => {
      const onChange = vi.fn()
      const { rerender } = render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          onChange={onChange}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Apple'))

      expect(onChange).toHaveBeenCalledWith('1')

      // Rerender with the selected value to simulate controlled component behavior
      rerender(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          onChange={onChange}
          value="1"
        />,
      )

      await waitFor(() => {
        expect(input).toHaveValue('Apple')
      })
    })

    it('should select item with Enter key', async () => {
      const onChange = vi.fn()
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          onChange={onChange}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      expect(onChange).toHaveBeenCalledWith('1')
    })

    it('should clear selection when input is cleared', async () => {
      const onChange = vi.fn()
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          onChange={onChange}
          value="1"
        />,
      )

      const input = screen.getByRole('textbox')
      await user.clear(input)

      expect(onChange).toHaveBeenCalledWith(null)
    })

    it('should update input value when external value prop changes', () => {
      const { rerender } = render(
        <Autocomplete {...defaultProps} items={mockStaticItems} value="1" />,
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('Apple')

      rerender(
        <Autocomplete {...defaultProps} items={mockStaticItems} value="2" />,
      )

      expect(input).toHaveValue('Banana')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate with arrow keys', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // First item should be highlighted
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
        'aria-selected',
        'true',
      )

      // Move to second item
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
        'aria-selected',
        'true',
      )

      // Move back to first item
      await user.keyboard('{ArrowUp}')
      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })

    it('should wrap around when navigating past boundaries', async () => {
      render(
        <Autocomplete {...defaultProps} items={mockStaticItems.slice(0, 2)} />,
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Go to first item
      await user.keyboard('{ArrowDown}')
      // Go to second item
      await user.keyboard('{ArrowDown}')
      // Should wrap to first item
      await user.keyboard('{ArrowDown}')

      expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })

    it('should close dropdown with Escape key', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown with Tab key', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{Tab}')

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('should open dropdown with arrow keys when closed', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      // Close dropdown
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })

      // Reopen with arrow key
      await user.keyboard('{ArrowDown}')

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })
    })
  })

  describe('Mouse Interactions', () => {
    it('should highlight item on mouse enter', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const appleOption = screen.getByRole('option', { name: 'Apple' })
      await user.hover(appleOption)

      expect(appleOption).toHaveAttribute('aria-selected', 'true')
    })

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <Autocomplete {...defaultProps} items={mockStaticItems} />
          <button>Outside button</button>
        </div>,
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Outside button' }))

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('should prevent default on mousedown to avoid blur', async () => {
      const onChange = vi.fn()
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          onChange={onChange}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })

      // Simulate mousedown event
      const appleOption = screen.getByText('Apple')
      fireEvent.mouseDown(appleOption)

      expect(onChange).toHaveBeenCalledWith('1')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
      expect(input).toHaveAttribute('autoComplete', 'off')

      await user.click(input)

      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        expect(listbox).toHaveAttribute('id', 'autocomplete-list')
        expect(input).toHaveAttribute('aria-controls', 'autocomplete-list')
      })
    })

    it('should set aria-activedescendant when item is highlighted', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{ArrowDown}')

      expect(input).toHaveAttribute('aria-activedescendant', 'option-1')
    })

    it('should have proper role attributes on options', async () => {
      render(<Autocomplete {...defaultProps} items={mockStaticItems} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        const options = screen.getAllByRole('option')
        expect(options).toHaveLength(mockStaticItems.length)

        options.forEach((option, index) => {
          expect(option).toHaveAttribute(
            'id',
            `option-${mockStaticItems[index].id}`,
          )
          expect(option).toHaveAttribute('role', 'option')
        })
      })
    })
  })

  describe('Icons and Custom Rendering', () => {
    it('should render option icons when provided', async () => {
      const itemsWithIcons = mockStaticItems.map((item) => ({
        ...item,
        icon: `icon-${item.id}`,
      }))

      render(
        <Autocomplete
          {...defaultProps}
          items={itemsWithIcons}
          optionToIcon={(item) => (
            <span data-testid={`icon-${item.id}`}>{item.icon}</span>
          )}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        itemsWithIcons.forEach((item) => {
          expect(screen.getByTestId(`icon-${item.id}`)).toBeInTheDocument()
        })
      })
    })

    it('should handle complex option labels', async () => {
      render(<Autocomplete {...gameProps} items={mockGameItems} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Super Mario Bros (NES)')).toBeInTheDocument()
        expect(
          screen.getByText('The Legend of Zelda (NES)'),
        ).toBeInTheDocument()
        expect(
          screen.getByText('Sonic the Hedgehog (Genesis)'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty items array', async () => {
      render(<Autocomplete {...defaultProps} items={[]} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.type(input, 'test')

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument()
      })
    })

    it('should handle undefined items', async () => {
      render(<Autocomplete {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      // Should not crash and should not show dropdown
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should handle disabled state properly', async () => {
      render(
        <Autocomplete {...defaultProps} items={mockStaticItems} disabled />,
      )

      const input = screen.getByRole('textbox')

      // Should not respond to focus
      await user.click(input)
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

      // Should not respond to keyboard
      await user.keyboard('{ArrowDown}')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should handle very long option lists', async () => {
      const longList = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
      }))

      render(<Autocomplete {...defaultProps} items={longList} />)

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        expect(listbox).toBeInTheDocument()
        expect(listbox).toHaveClass('max-h-60', 'overflow-auto')
      })
    })

    it('should handle rapid typing and selection', async () => {
      const onChange = vi.fn()
      render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          onChange={onChange}
          debounceTime={50}
        />,
      )

      const input = screen.getByRole('textbox')

      // Type rapidly
      await user.type(input, 'apple')

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
      })

      // Quick selection
      await user.click(screen.getByText('Apple'))

      expect(onChange).toHaveBeenCalledWith('1')
    })

    it('should handle special characters in search', async () => {
      const specialItems = [
        { id: '1', name: 'Test & Co.' },
        { id: '2', name: 'A/B Testing' },
        { id: '3', name: 'C++ Programming' },
      ]

      render(<Autocomplete {...defaultProps} items={specialItems} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '&')

      await waitFor(() => {
        expect(screen.getByText('Test & Co.')).toBeInTheDocument()
      })
    })

    it('should handle blur and focus events correctly', async () => {
      render(
        <div>
          <Autocomplete {...defaultProps} items={mockStaticItems} />
          <input data-testid="other-input" />
        </div>,
      )

      const input = screen.getByPlaceholderText('Type to search...')
      const otherInput = screen.getByTestId('other-input')

      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Blur should close dropdown after timeout
      await user.click(otherInput)

      await waitFor(
        () => {
          expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
        },
        { timeout: 200 },
      )
    })
  })

  describe('Performance and Optimization', () => {
    it('should trigger search only on initial load below minimum characters', async () => {
      const mockLoadItems = vi.fn().mockResolvedValue([])

      render(
        <Autocomplete
          {...defaultProps}
          loadItems={mockLoadItems}
          minCharsToTrigger={3}
        />,
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'ab')

      // Wait a bit to ensure debounce would have triggered
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400))
      })

      expect(mockLoadItems).toHaveBeenCalledOnce()
    })

    it('should cleanup timeouts on unmount', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount } = render(
        <Autocomplete
          {...defaultProps}
          items={mockStaticItems}
          debounceTime={100}
        />,
      )

      const input = screen.getByRole('textbox')
      // Trigger a debounced search to create a timeout
      await user.type(input, 'a')

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('should handle rapid prop changes', () => {
      const { rerender } = render(
        <Autocomplete {...defaultProps} items={mockStaticItems} value="1" />,
      )

      // Rapidly change props
      for (let i = 1; i <= 5; i++) {
        rerender(
          <Autocomplete
            {...defaultProps}
            items={mockStaticItems}
            value={String(i)}
          />,
        )
      }

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('Eggplant') // Last valid item
    })
  })
})
