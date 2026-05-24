import { z } from 'zod'
import { HUMAN_VERIFICATION_ACTION } from '../../shared/constants'

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const TurnstileResponseSchema = z
  .object({
    success: z.boolean(),
    challenge_ts: z.string().optional(),
    hostname: z.string().optional(),
    action: z.string().optional(),
    cdata: z.string().optional(),
    'error-codes': z.array(z.string()).optional(),
  })
  .passthrough()

export interface TurnstileVerificationResult {
  success: boolean
  errorCodes: string[]
}

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim())
}

export function getRequestIp(headers?: Headers): string | undefined {
  const forwardedFor = headers?.get('x-forwarded-for')?.split(',')[0]?.trim()
  return headers?.get('cf-connecting-ip') ?? forwardedFor ?? headers?.get('x-real-ip') ?? undefined
}

export async function verifyTurnstileToken(params: {
  token: string
  remoteIp?: string
}): Promise<TurnstileVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) return { success: false, errorCodes: ['missing-input-secret'] }

  const body = new URLSearchParams({
    secret,
    response: params.token,
    idempotency_key: crypto.randomUUID(),
  })

  if (params.remoteIp) body.set('remoteip', params.remoteIp)

  const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })

  if (!response.ok) {
    return { success: false, errorCodes: [`siteverify-http-${response.status}`] }
  }

  const parsed = TurnstileResponseSchema.safeParse(await response.json())
  if (!parsed.success) return { success: false, errorCodes: ['invalid-siteverify-response'] }

  if (parsed.data.success && parsed.data.action !== HUMAN_VERIFICATION_ACTION) {
    return { success: false, errorCodes: ['action-mismatch'] }
  }

  return {
    success: parsed.data.success,
    errorCodes: parsed.data['error-codes'] ?? [],
  }
}
