import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import LoginPage from './page'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

describe('LoginPage', () => {
  const mockRouter = {
    push: vi.fn(),
  }

  const mockSearchParams = {
    get: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    useRouter.mockReturnValue(mockRouter)
    useSearchParams.mockReturnValue(mockSearchParams)
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

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Verify signIn was called with correct values
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
    // Mock a failed login
    vi.mocked(signIn).mockResolvedValueOnce({
      error: 'Invalid credentials',
      ok: false,
      status: 401,
      url: null,
    })

    render(<LoginPage />)

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'wrong@example.com' },
    })

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    // Verify not redirected
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('sanitizes email input', async () => {
    render(<LoginPage />)

    // Fill the form with unsanitized email
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: '  test@example.com  ' },
    })

    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    })

    // Submit the form
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
