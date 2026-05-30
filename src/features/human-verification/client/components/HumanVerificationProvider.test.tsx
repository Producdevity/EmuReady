import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HumanVerificationProvider, useHumanVerification } from './HumanVerificationProvider'
import { HUMAN_VERIFICATION_ACTION } from '../../shared/constants'

vi.mock('@/lib/env', () => ({
  env: {
    TURNSTILE_SITE_KEY: 'site-key',
  },
}))

vi.mock('next/script', () => ({
  default: function Script() {
    return null
  },
}))

interface CaptureButtonProps {
  onRequest: (promise: Promise<string>) => void
}

function CaptureButton(props: CaptureButtonProps) {
  const requestVerification = useHumanVerification()

  return (
    <button
      type="button"
      onClick={() => {
        props.onRequest(requestVerification({ action: HUMAN_VERIFICATION_ACTION }))
      }}
    >
      Request verification
    </button>
  )
}

function createTurnstileStub() {
  const renderWidget = vi.fn<(container: HTMLElement, options: Record<string, unknown>) => string>(
    () => 'widget-id',
  )
  const ready = vi.fn(() => {
    throw new Error('turnstile.ready() must not be called when api.js is loaded async/defer')
  })

  return {
    renderWidget,
    ready,
    api: {
      ready,
      render: renderWidget,
      remove: vi.fn(),
      reset: vi.fn(),
    },
  }
}

describe('HumanVerificationProvider', () => {
  afterEach(() => {
    delete window.turnstile
    delete window.onloadTurnstileCallback
    vi.unstubAllEnvs()
  })

  it('rejects concurrent verification requests instead of replacing the pending request', async () => {
    const requests: Promise<string>[] = []

    render(
      <HumanVerificationProvider>
        <CaptureButton onRequest={(promise) => requests.push(promise)} />
      </HumanVerificationProvider>,
    )

    const button = screen.getByRole('button', { name: /request verification/i })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(requests).toHaveLength(2)
    await expect(requests[1]).rejects.toThrow(/already in progress/i)
  })

  it('becomes ready via onloadTurnstileCallback, renders the widget directly, then resolves with the token', async () => {
    const stub = createTurnstileStub()
    const requests: Promise<string>[] = []

    render(
      <HumanVerificationProvider>
        <CaptureButton onRequest={(promise) => requests.push(promise)} />
      </HumanVerificationProvider>,
    )

    expect(typeof window.onloadTurnstileCallback).toBe('function')

    window.turnstile = stub.api
    act(() => window.onloadTurnstileCallback?.())

    fireEvent.click(screen.getByRole('button', { name: /request verification/i }))

    expect(stub.renderWidget).toHaveBeenCalledTimes(1)
    expect(stub.ready).not.toHaveBeenCalled()

    const options = stub.renderWidget.mock.calls[0][1]
    expect(options.sitekey).toBe('site-key')
    expect(options.action).toBe(HUMAN_VERIFICATION_ACTION)

    const onToken = options.callback
    if (typeof onToken !== 'function') throw new Error('callback option is not a function')
    act(() => onToken('verification-token'))

    await expect(requests[0]).resolves.toBe('verification-token')
  })

  it('treats an already-loaded Turnstile script as ready without registering an onload callback', () => {
    const stub = createTurnstileStub()
    window.turnstile = stub.api

    render(
      <HumanVerificationProvider>
        <CaptureButton onRequest={() => {}} />
      </HumanVerificationProvider>,
    )

    expect(window.onloadTurnstileCallback).toBeUndefined()

    fireEvent.click(screen.getByRole('button', { name: /request verification/i }))

    expect(stub.renderWidget).toHaveBeenCalledTimes(1)
    expect(stub.ready).not.toHaveBeenCalled()
  })
})
