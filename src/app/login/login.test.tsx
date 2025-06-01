import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import LoginPage from './page'

// Define proper types for the mocks
type MockedRouter = {
  push: ReturnType<typeof vi.fn>
  back: ReturnType<typeof vi.fn>
  forward: ReturnType<typeof vi.fn>
  refresh: ReturnType<typeof vi.fn>
  prefetch: ReturnType<typeof vi.fn>
  replace: ReturnType<typeof vi.fn>
}

type MockedSearchParams = {
  get: ReturnType<typeof vi.fn>
  getAll: ReturnType<typeof vi.fn>
  has: ReturnType<typeof vi.fn>
  forEach: ReturnType<typeof vi.fn>
  entries: ReturnType<typeof vi.fn>
  keys: ReturnType<typeof vi.fn>
  values: ReturnType<typeof vi.fn>
  toString: ReturnType<typeof vi.fn>
  append: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
  sort: ReturnType<typeof vi.fn>
}

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

describe('LoginPage', () => {
  const mockRouter: Partial<MockedRouter> = {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    replace: vi.fn(),
  }

  const mockSearchParams: MockedSearchParams = {
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    forEach: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    toString: vi.fn(),
    append: vi.fn(),
    delete: vi.fn(),
    set: vi.fn(),
    sort: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useRouter).mockImplementation(() => mockRouter as any)
    vi.mocked(useSearchParams).mockImplementation(() => mockSearchParams as any)
    mockSearchParams.get.mockReturnValue(null) // Default: not registered

    // Mock successful login by default
    vi.mocked(signIn).mockResolvedValue({
      error: null,
      ok: true,
      status: 200,
      url: '/profile',
    })
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows success message when registered query param is true', () => {
    mockSearchParams.get.mockReturnValue('true')

    render(<LoginPage />)

    expect(
      screen.getByText('Account created successfully!'),
    ).toBeInTheDocument()
  })

  it('submits form and redirects on successful login', async () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password123',
      })
    })

    // Verify redirect on success
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/profile')
    })
  })

  it('displays error message on failed login', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      error: 'Invalid credentials',
      ok: false,
      status: 401,
      url: null,
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'wrong@example.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    })

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    // Verify not redirected
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('sanitizes email input', async () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: '  test@example.com  ' },
    })

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Verify signIn was called with sanitized email
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })
})
