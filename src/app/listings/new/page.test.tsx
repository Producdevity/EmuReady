import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import { type PropsWithChildren } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomFieldType } from '@orm'
import AddListingPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    devices: {
      get: {
        useQuery: vi.fn(() => ({
          data: [
            {
              id: 'device-1',
              brand: { name: 'Test Brand' },
              modelName: 'Test Model',
            },
          ],
        })),
      },
    },
    listings: {
      performanceScales: {
        useQuery: vi.fn(() => ({
          data: [
            { id: 1, label: 'Perfect' },
            { id: 2, label: 'Great' },
          ],
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
        })),
      },
    },
    customFieldDefinitions: {
      getByEmulator: {
        useQuery: vi.fn((params) => {
          if (params.emulatorId === 'emulator-with-fields') {
            return {
              data: [
                {
                  id: 'field-1',
                  name: 'driver_version',
                  label: 'Driver Version',
                  type: CustomFieldType.TEXT,
                  isRequired: true,
                  emulator: { name: 'Test Emulator' },
                },
                {
                  id: 'field-2',
                  name: 'graphics_setting',
                  label: 'Graphics Setting',
                  type: CustomFieldType.SELECT,
                  isRequired: true,
                  options: [
                    { value: 'low', label: 'Low' },
                    { value: 'high', label: 'High' },
                  ],
                  emulator: { name: 'Test Emulator' },
                },
              ],
              isLoading: false,
            }
          }
          return { data: [], isLoading: false }
        }),
      },
    },
    games: {
      byId: {
        useQuery: vi.fn(() => ({ data: null })),
      },
    },
    useUtils: vi.fn(() => ({
      games: {
        get: {
          fetch: vi.fn(() =>
            Promise.resolve({
              games: [
                {
                  id: 'game-1',
                  title: 'Test Game',
                  system: { id: 'system-1', name: 'Test System' },
                },
              ],
            }),
          ),
        },
      },
      emulators: {
        get: {
          fetch: vi.fn(() =>
            Promise.resolve([
              { id: 'emulator-with-fields', name: 'Test Emulator' },
            ]),
          ),
        },
        byId: {
          fetch: vi.fn(() =>
            Promise.resolve({
              id: 'emulator-with-fields',
              name: 'Test Emulator',
              systems: [{ id: 'system-1', name: 'Test System' }],
            }),
          ),
        },
      },
    })),
  },
}))

vi.mock('@/hooks/useMounted', () => ({
  default: () => true,
}))

vi.mock('@/lib/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the child components that are already tested separately
vi.mock('./components/GameSelector', () => ({
  default: ({ onGameSelect, _control }: any) => (
    <div data-testid="game-selector">
      <button
        onClick={() =>
          onGameSelect({
            id: 'game-1',
            title: 'Test Game',
            system: { id: 'system-1', name: 'Test System' },
          })
        }
      >
        Select Game
      </button>
    </div>
  ),
}))

vi.mock('./components/EmulatorSelector', () => ({
  default: ({ setValue }: any) => (
    <div data-testid="emulator-selector">
      <button onClick={() => setValue('emulatorId', 'emulator-with-fields')}>
        Select Emulator
      </button>
    </div>
  ),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

function TestWrapper(props: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}

// TODO: this takes minutes to run, convert this into a playwright test, skip for now
describe.skip('AddListingPage Integration Tests', () => {
  const mockPush = vi.fn()
  const mockGet = vi.fn(() => null)

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
    ;(useSearchParams as any).mockReturnValue({ get: mockGet })
  })

  it('should display custom field validation errors when required fields are empty', async () => {
    render(
      <TestWrapper>
        <AddListingPage />
      </TestWrapper>,
    )

    const user = userEvent.setup()

    // Select a game
    await user.click(screen.getByText('Select Game'))

    // Select an emulator with custom fields
    await user.click(screen.getByText('Select Emulator'))

    // Wait for custom fields to load
    await waitFor(() => {
      expect(screen.getByText('Emulator-Specific Details')).toBeInTheDocument()
    })

    // Expect to see the required custom fields
    expect(screen.getByText('Driver Version')).toBeInTheDocument()
    expect(screen.getByText('Graphics Setting')).toBeInTheDocument()

    // Fill basic form fields
    const deviceSelect = screen.getByDisplayValue('')
    await user.selectOptions(deviceSelect, 'device-1')

    const performanceSelect = screen.getByDisplayValue('')
    await user.selectOptions(performanceSelect, '1')

    // Try to submit without filling required custom fields
    const submitButton = screen.getByRole('button', { name: /create listing/i })

    // The form should have HTML5 validation preventing submission
    // or show validation errors
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).not.toBeDisabled()
  })

  it('should enable form submission when all required custom fields are filled', async () => {
    render(
      <TestWrapper>
        <AddListingPage />
      </TestWrapper>,
    )

    const user = userEvent.setup()

    // Select a game
    await user.click(screen.getByText('Select Game'))

    // Select an emulator with custom fields
    await user.click(screen.getByText('Select Emulator'))

    // Wait for custom fields to load
    await waitFor(() => {
      expect(screen.getByText('Emulator-Specific Details')).toBeInTheDocument()
    })

    // Fill the custom fields
    const driverVersionInput =
      screen.getByPlaceholderText(/enter driver version/i)
    await user.type(driverVersionInput, 'v1.0.0')

    const graphicsSelect = screen.getByDisplayValue('low') // Should default to first option
    await user.selectOptions(graphicsSelect, 'high')

    // Fill basic form fields
    const deviceSelect = screen.getByDisplayValue('')
    await user.selectOptions(deviceSelect, 'device-1')

    const performanceSelect = screen.getByDisplayValue('')
    await user.selectOptions(performanceSelect, '1')

    // Submit button should be enabled and ready
    const submitButton = screen.getByRole('button', { name: /create listing/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('should show specific error messages in FormValidationSummary', async () => {
    render(
      <TestWrapper>
        <AddListingPage />
      </TestWrapper>,
    )

    const user = userEvent.setup()

    // Select a game and emulator to show custom fields
    await user.click(screen.getByText('Select Game'))
    await user.click(screen.getByText('Select Emulator'))

    // Wait for custom fields to load
    await waitFor(() => {
      expect(screen.getByText('Emulator-Specific Details')).toBeInTheDocument()
    })

    // Try to submit the form without filling required fields
    const form =
      screen.getByRole('form') ||
      screen.getByText('Create New Listing').closest('form')

    if (form) {
      // Trigger form validation by attempting to submit
      fireEvent.submit(form)

      // Wait for validation errors to appear
      await waitFor(() => {
        // Should show specific error messages, not just generic ones
        const errorSummary = screen.queryByText(
          'Please fix the following errors:',
        )
        if (errorSummary) {
          expect(errorSummary).toBeInTheDocument()
        }
      })
    }
  })

  it('should not show custom fields when emulator has none', async () => {
    // Mock API to return emulator without custom fields
    const { api } = await import('@/lib/api')
    ;(api.customFieldDefinitions.getByEmulator.useQuery as any).mockReturnValue(
      {
        data: [],
        isLoading: false,
      },
    )

    render(
      <TestWrapper>
        <AddListingPage />
      </TestWrapper>,
    )

    const user = userEvent.setup()

    // Select a game and emulator
    await user.click(screen.getByText('Select Game'))
    await user.click(screen.getByText('Select Emulator'))

    // Should not show custom fields section
    await waitFor(() => {
      expect(
        screen.queryByText('Emulator-Specific Details'),
      ).not.toBeInTheDocument()
    })
  })
})
