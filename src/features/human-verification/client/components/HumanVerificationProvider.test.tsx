import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HumanVerificationProvider, useHumanVerification } from './HumanVerificationProvider'
import { HUMAN_VERIFICATION_ACTION } from '../../shared/constants'

interface ScriptProps {
  src: string
  onReady?: () => void
  onError?: () => void
}

const scriptProps: ScriptProps[] = []

vi.mock('@/lib/env', () => ({
  env: {
    TURNSTILE_SITE_KEY: 'site-key',
  },
}))

vi.mock('next/script', () => ({
  default: function Script(props: ScriptProps) {
    scriptProps.push(props)
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
  const renderWidget = vi.fn<
    (container: HTMLElement, options: Record<string, unknown>) => string | undefined
  >(() => 'widget-id')
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
  beforeEach(() => {
    scriptProps.length = 0
  })

  afterEach(() => {
    delete window.turnstile
    vi.unstubAllEnvs()
  })

  it('rejects concurrent verification requests instead of replacing the pending request', async () => {
    const requests: Promise<string>[] = []

    render(
      <HumanVerificationProvider>
        <CaptureButton
          onRequest={(promise) => {
            requests.push(promise)
            void promise.catch(() => {})
          }}
        />
      </HumanVerificationProvider>,
    )

    const button = screen.getByRole('button', { name: /request verification/i })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(requests).toHaveLength(2)
    await expect(requests[1]).rejects.toThrow(/already in progress/i)
  })

  it('becomes ready from the script onReady callback, renders the widget, then resolves with the token', async () => {
    const stub = createTurnstileStub()
    const requests: Promise<string>[] = []

    render(
      <HumanVerificationProvider>
        <CaptureButton
          onRequest={(promise) => {
            requests.push(promise)
            void promise.catch(() => {})
          }}
        />
      </HumanVerificationProvider>,
    )

    window.turnstile = stub.api
    expect(scriptProps[0].src).toBe(
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
    )
    act(() => scriptProps[0].onReady?.())

    fireEvent.click(screen.getByRole('button', { name: /request verification/i }))

    expect(stub.renderWidget).toHaveBeenCalledTimes(1)
    expect(stub.ready).not.toHaveBeenCalled()

    const options = stub.renderWidget.mock.calls[0][1]
    expect(options.sitekey).toBe('site-key')
    expect(options.action).toBe(HUMAN_VERIFICATION_ACTION)
    expect(options.size).toBe('flexible')
    expect(options.appearance).toBe('always')

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

    fireEvent.click(screen.getByRole('button', { name: /request verification/i }))

    expect(stub.renderWidget).toHaveBeenCalledTimes(1)
    expect(stub.ready).not.toHaveBeenCalled()
  })

  it('rejects when Turnstile cannot render a widget id', async () => {
    const stub = createTurnstileStub()
    stub.renderWidget.mockReturnValueOnce(undefined)
    const requests: Promise<string>[] = []

    render(
      <HumanVerificationProvider>
        <CaptureButton
          onRequest={(promise) => {
            requests.push(promise)
            void promise.catch(() => {})
          }}
        />
      </HumanVerificationProvider>,
    )

    window.turnstile = stub.api
    act(() => scriptProps[0].onReady?.())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request verification/i }))
      await Promise.resolve()
    })

    await expect(requests[0]).rejects.toThrow(/failed to render/i)
  })

  it('rejects when Turnstile render throws', async () => {
    const stub = createTurnstileStub()
    stub.renderWidget.mockImplementationOnce(() => {
      throw new Error('render failed')
    })
    const requests: Promise<string>[] = []

    render(
      <HumanVerificationProvider>
        <CaptureButton
          onRequest={(promise) => {
            requests.push(promise)
            void promise.catch(() => {})
          }}
        />
      </HumanVerificationProvider>,
    )

    window.turnstile = stub.api
    act(() => scriptProps[0].onReady?.())

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /request verification/i }))
      await Promise.resolve()
    })

    await expect(requests[0]).rejects.toThrow(/failed to render/i)
  })
})
