import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmDialogProvider } from '@/components/ui'
import TestingPage from './page'

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: false, signOut: vi.fn() }),
  useSignIn: () => ({ signIn: null }),
  useUser: () => ({ user: null }),
}))
vi.mock('./testScenarios', () => ({
  testScenarios: [
    {
      id: 'user',
      name: 'User',
      icon: '',
      color: '',
      categories: [
        {
          id: 'reports',
          name: 'Reports',
          scenarios: [{ id: 'create', description: 'Create a report' }],
        },
      ],
    },
  ],
  testAccounts: {
    user: { role: 'User', email: 'tester@example.invalid', password: 'fixture-only' },
  },
}))
vi.mock('@/lib/toast', () => ({ default: { warning: vi.fn(), error: vi.fn() } }))

const storage = new Map<string, string>()
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
})
const key = 'emuready-test-results'
const saved = {
  testerName: 'Tester',
  selectedRole: 'user',
  expandedCategories: ['user-reports'],
  results: { user: { reports: { create: { checked: true, notes: 'Saved note' } } } },
}

beforeEach(() => storage.clear())

describe('test checklist persistence', () => {
  it('loads saved progress without overwriting it on mount', () => {
    const snapshot = JSON.stringify(saved)
    storage.set(key, snapshot)
    render(<TestingPage />)
    expect(screen.getByPlaceholderText('Enter your name')).toHaveValue('Tester')
    expect(screen.getByDisplayValue('Saved note')).toBeInTheDocument()
    expect(storage.get(key)).toBe(snapshot)
  })

  it('persists edits and keeps existing report results', () => {
    storage.set(key, JSON.stringify(saved))
    render(<TestingPage />)
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Updated' },
    })
    expect(JSON.parse(storage.get(key) ?? '{}')).toMatchObject({ ...saved, testerName: 'Updated' })
  })

  it('requires confirmation before clearing progress', async () => {
    storage.set(key, JSON.stringify(saved))
    render(
      <ConfirmDialogProvider>
        <TestingPage />
      </ConfirmDialogProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Progress' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByPlaceholderText('Enter your name')).toHaveValue('Tester')
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Progress' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear Results' }))
    await waitFor(() => expect(screen.getByPlaceholderText('Enter your name')).toHaveValue(''))
    expect(JSON.parse(storage.get(key) ?? '{}')).toMatchObject({ results: {}, testerName: '' })
  })

  it('falls back safely when stored data is invalid', () => {
    storage.set(key, JSON.stringify({ results: 'invalid' }))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<TestingPage />)
    expect(screen.getByPlaceholderText('Enter your name')).toHaveValue('')
    expect(screen.getByText('0 of 1 tests')).toBeInTheDocument()
    error.mockRestore()
  })
})
