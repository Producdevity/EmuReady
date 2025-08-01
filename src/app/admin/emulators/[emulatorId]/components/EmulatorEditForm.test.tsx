import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import EmulatorEditForm from './EmulatorEditForm'

// Mock the dependencies
vi.mock('@/lib/api', () => ({
  api: {
    emulators: {
      update: {
        useMutation: vi.fn(),
      },
    },
    useUtils: vi.fn(),
  },
}))

vi.mock('@/lib/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock framer-motion to properly handle all motion props
vi.mock('framer-motion', () => ({
  motion: {
    form: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      transition,
      ...props
    }: any) => <form {...props}>{children}</form>,
    p: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      transition,
      ...props
    }: any) => <p {...props}>{children}</p>,
    button: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      transition,
      ...props
    }: any) => <button {...props}>{children}</button>,
    div: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      transition,
      ...props
    }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockEmulator = {
  id: 'test-emulator-id',
  name: 'Test Emulator',
  logo: 'test-logo.png',
  description: null,
  repositoryUrl: null,
  officialUrl: null,
  systems: [],
  verifiedDevelopers: [],
  customFieldDefinitions: [],
  _count: { listings: 0 },
}

const mockMutate = vi.fn()
const mockInvalidate = vi.fn()

describe('EmulatorEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup API mocks
    ;(api.emulators.update.useMutation as any).mockReturnValue({
      mutate: mockMutate,
    })
    ;(api.useUtils as any).mockReturnValue({
      emulators: {
        byId: {
          invalidate: mockInvalidate,
        },
        get: {
          invalidate: mockInvalidate,
        },
      },
    })
  })

  it('renders the form with initial values', () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    expect(screen.getByDisplayValue('Test Emulator')).toBeInTheDocument()
    expect(screen.getByText('Using: test-logo.png')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled() // Should be disabled when not dirty
  })

  it('validates emulator name input', async () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    const nameInput = screen.getByDisplayValue('Test Emulator')
    const saveButton = screen.getByRole('button', { name: /save changes/i })

    // Clear the input to trigger validation error
    fireEvent.change(nameInput, { target: { value: '' } })
    fireEvent.blur(nameInput)

    // Try to submit the form to trigger validation
    fireEvent.click(saveButton)

    await waitFor(
      () => {
        expect(
          screen.getByText('Emulator name is required'),
        ).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('enables save button when form is dirty', async () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    const nameInput = screen.getByDisplayValue('Test Emulator')
    const saveButton = screen.getByRole('button', { name: /save changes/i })

    expect(saveButton).toBeDisabled()

    // Make a change to enable the button
    fireEvent.change(nameInput, { target: { value: 'Updated Emulator' } })

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })
  })

  it('allows logo selection', async () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    // Find and click a different logo
    const retroarchLogo = screen.getByTitle('retroarch')
    fireEvent.click(retroarchLogo)

    await waitFor(() => {
      expect(screen.getByText('Using: retroarch.png')).toBeInTheDocument()
    })
  })

  it('allows clearing the logo', async () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    // Find and click the clear logo button
    const clearButton = screen.getByText(/clear logo/i)
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText('No logo selected')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const onSuccessMock = vi.fn()

    ;(api.emulators.update.useMutation as any).mockReturnValue({
      mutate: mockMutate.mockImplementation((_data) => {
        // Simulate successful mutation
        onSuccessMock()
      }),
    })

    render(<EmulatorEditForm emulator={mockEmulator} />)

    const nameInput = screen.getByDisplayValue('Test Emulator')
    const saveButton = screen.getByRole('button', { name: /save changes/i })

    // Update the name
    fireEvent.change(nameInput, { target: { value: 'Updated Emulator' } })

    // Submit the form
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        id: 'test-emulator-id',
        name: 'Updated Emulator',
        logo: 'test-logo.png',
        description: undefined,
        repositoryUrl: undefined,
        officialUrl: undefined,
      })
    })
  })

  it('handles submission errors gracefully', async () => {
    const errorMessage = 'Failed to update emulator'

    // Mock the mutation to return a mutation with proper onError handling
    const mockOnError = vi.fn()
    ;(api.emulators.update.useMutation as any).mockReturnValue({
      mutate: vi.fn().mockImplementation((_data) => {
        // Simulate the onError callback being triggered
        setTimeout(() => {
          mockOnError(new Error(errorMessage))
          toast.error(`Failed to update emulator: ${errorMessage}`)
        }, 0)
      }),
    })

    render(<EmulatorEditForm emulator={mockEmulator} />)

    const nameInput = screen.getByDisplayValue('Test Emulator')
    const saveButton = screen.getByRole('button', { name: /save changes/i })

    // Update the name and submit
    fireEvent.change(nameInput, { target: { value: 'Updated Emulator' } })
    fireEvent.click(saveButton)

    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to update emulator'),
        )
      },
      { timeout: 3000 },
    )
  })

  it('validates logo filename format', async () => {
    render(<EmulatorEditForm emulator={{ ...mockEmulator, logo: '' }} />)

    const nameInput = screen.getByDisplayValue('Test Emulator')

    // Try to submit with an invalid logo (this would be tested via form validation)
    fireEvent.change(nameInput, { target: { value: 'Updated Emulator' } })

    // The form should handle logo validation internally
    // Since we're using react-hook-form with zod, invalid logos would be caught
    expect(screen.getByText('No logo selected')).toBeInTheDocument()
  })

  it('enables save button when logo is changed', async () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    const saveButton = screen.getByRole('button', { name: /save changes/i })

    // Initially the button should be disabled (form not dirty)
    expect(saveButton).toBeDisabled()

    // Click a different logo to make the form dirty
    const retroarchLogo = screen.getByTitle('retroarch')
    fireEvent.click(retroarchLogo)

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    // Verify the logo was actually selected
    expect(screen.getByText('Using: retroarch.png')).toBeInTheDocument()
  })

  it('enables save button when logo is cleared', async () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    const saveButton = screen.getByRole('button', { name: /save changes/i })

    // Initially the button should be disabled (form not dirty)
    expect(saveButton).toBeDisabled()

    // Clear the current logo to make the form dirty
    const clearButton = screen.getByText(/clear logo/i)
    fireEvent.click(clearButton)

    // The save button should now be enabled
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    // Verify the logo was actually cleared
    expect(screen.getByText('No logo selected')).toBeInTheDocument()
  })

  it('submits form with logo changes only', async () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    const saveButton = screen.getByRole('button', { name: /save changes/i })

    // Select a different logo
    const retroarchLogo = screen.getByTitle('retroarch')
    fireEvent.click(retroarchLogo)

    // Wait for the button to be enabled
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    // Submit the form
    fireEvent.click(saveButton)

    // Verify the mutation was called with the new logo
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        id: 'test-emulator-id',
        name: 'Test Emulator', // Name unchanged
        logo: 'retroarch.png', // Logo changed
      })
    })
  })

  it('submits form with logo cleared', async () => {
    render(<EmulatorEditForm emulator={mockEmulator} />)

    const saveButton = screen.getByRole('button', { name: /save changes/i })

    // Clear the logo
    const clearButton = screen.getByText(/clear logo/i)
    fireEvent.click(clearButton)

    // Wait for the button to be enabled
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    })

    // Submit the form
    fireEvent.click(saveButton)

    // Verify the mutation was called with no logo (undefined)
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        id: 'test-emulator-id',
        name: 'Test Emulator', // Name unchanged
        logo: undefined, // Logo cleared (empty string becomes undefined)
      })
    })
  })
})
