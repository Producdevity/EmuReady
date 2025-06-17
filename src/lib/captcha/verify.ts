import { RECAPTCHA_CONFIG, isCaptchaEnabled } from './config'

interface RecaptchaResponse {
  success: boolean
  score: number
  action: string
  challenge_ts: string
  hostname: string
  'error-codes'?: string[]
}

interface VerifyRecaptchaParams {
  token: string
  expectedAction: string
  userIP?: string
}

interface VerifyRecaptchaResult {
  success: boolean
  score: number
  action: string
  error?: string
}

export async function verifyRecaptcha(
  params: VerifyRecaptchaParams,
): Promise<VerifyRecaptchaResult> {
  const { token, expectedAction, userIP } = params

  // If CAPTCHA is not enabled, always return success
  if (!isCaptchaEnabled()) {
    console.warn('CAPTCHA is disabled - skipping verification')
    return {
      success: true,
      score: 1.0,
      action: expectedAction,
    }
  }

  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: RECAPTCHA_CONFIG.secretKey,
          response: token,
          ...(userIP && { remoteip: userIP }),
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: RecaptchaResponse = await response.json()

    // Check if the verification was successful
    if (!data.success) {
      return {
        success: false,
        score: 0,
        action: expectedAction,
        error: `reCAPTCHA verification failed: ${data['error-codes']?.join(', ') || 'Unknown error'}`,
      }
    }

    // Check if the action matches what we expected
    if (data.action !== expectedAction) {
      return {
        success: false,
        score: data.score,
        action: data.action,
        error: `Action mismatch: expected '${expectedAction}', got '${data.action}'`,
      }
    }

    // Check if the score meets our threshold
    if (data.score < RECAPTCHA_CONFIG.scoreThreshold) {
      return {
        success: false,
        score: data.score,
        action: data.action,
        error: `Score too low: ${data.score} < ${RECAPTCHA_CONFIG.scoreThreshold}`,
      }
    }

    return {
      success: true,
      score: data.score,
      action: data.action,
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error)
    return {
      success: false,
      score: 0,
      action: expectedAction,
      error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Helper function to extract IP address from request headers
export function getClientIP(headers: Headers): string | undefined {
  // Try common headers in order of preference
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ]

  for (const header of ipHeaders) {
    const value = headers.get(header)
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0]?.trim()
    }
  }

  return undefined
}
