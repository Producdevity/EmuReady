import { fireEvent, render, screen } from '@testing-library/react'
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

describe('HumanVerificationProvider', () => {
  afterEach(() => {
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
})
