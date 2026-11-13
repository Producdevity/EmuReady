import { act, cleanup, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import PatreonCallbackPage from './page'

type CallbackInput = RouterInput['entitlements']['linkPatreonCallback']
type CallbackOutput = RouterOutput['entitlements']['linkPatreonCallback']
const navigation = vi.hoisted(() => ({ replace: vi.fn() }))
const link = vi.hoisted(() => vi.fn<(input: CallbackInput) => Promise<CallbackOutput>>())
let query = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useSearchParams: () => query,
}))
vi.mock('@/lib/api', () => ({
  api: { entitlements: { linkPatreonCallback: { useMutation: () => ({ mutateAsync: link }) } } },
}))
const storage = new Map<string, string>()
Object.defineProperty(window, 'sessionStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
})

beforeEach(() => {
  storage.clear()
  query = new URLSearchParams('code=code-one&state=state-one')
  navigation.replace.mockReset()
  link.mockReset().mockResolvedValue({ ok: true })
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Patreon callback attempts', () => {
  it('displays missing parameters without starting an authorization request', () => {
    query = new URLSearchParams()
    render(<PatreonCallbackPage />)
    expect(screen.getByText('Missing code or state')).toBeInTheDocument()
    expect(link).not.toHaveBeenCalled()
  })

  it('does not reuse an authorization code already attempted in this tab', () => {
    storage.set('patreon_oauth_code:code-one', '1')
    render(<PatreonCallbackPage />)
    expect(screen.getByText(/authorization code was already used/)).toBeInTheDocument()
    expect(link).not.toHaveBeenCalled()
  })

  it('makes one attempt in Strict Mode and redirects after a successful link', async () => {
    await act(async () => {
      render(
        <StrictMode>
          <PatreonCallbackPage />
        </StrictMode>,
      )
    })
    expect(link).toHaveBeenCalledOnce()
    expect(link).toHaveBeenCalledWith({ code: 'code-one', state: 'state-one' })
    expect(screen.getByText('Patreon linked. You now have lifetime downloads!')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(navigation.replace).toHaveBeenCalledWith('/profile?tab=downloads')
  })

  it('cancels the delayed redirect when the callback page unmounts', async () => {
    const view = render(<PatreonCallbackPage />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('Patreon linked. You now have lifetime downloads!')).toBeInTheDocument()
    view.unmount()
    act(() => vi.advanceTimersByTime(2000))
    expect(navigation.replace).not.toHaveBeenCalled()
  })

  it('starts a fresh attempt when the URL contains a different authorization code', async () => {
    const view = render(<PatreonCallbackPage />)
    await act(async () => {
      await Promise.resolve()
    })
    query = new URLSearchParams('code=code-two&state=state-two')
    await act(async () => {
      view.rerender(<PatreonCallbackPage />)
    })
    expect(link).toHaveBeenCalledTimes(2)
    expect(link).toHaveBeenLastCalledWith({ code: 'code-two', state: 'state-two' })
  })

  it('shows a failed link without scheduling a success redirect', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    link.mockRejectedValueOnce(new Error('Authorization failed'))
    await act(async () => {
      render(<PatreonCallbackPage />)
    })
    expect(screen.getByText('Authorization failed')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(navigation.replace).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
