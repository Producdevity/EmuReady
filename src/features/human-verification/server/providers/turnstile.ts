import { z } from 'zod'
import { HUMAN_VERIFICATION_ACTION } from '../../shared/constants'

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TURNSTILE_SITEVERIFY_TIMEOUT_MS = 5000
const TURNSTILE_TEST_SECRET_KEYS = new Set([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
])
const LOCAL_DEVELOPMENT_HOSTNAMES = ['localhost', '127.0.0.1', '::1']

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
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  )
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

  let response: Response
  try {
    response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(TURNSTILE_SITEVERIFY_TIMEOUT_MS),
    })
  } catch (error) {
    if (isAbortError(error)) return { success: false, errorCodes: ['siteverify-timeout'] }
    return { success: false, errorCodes: ['siteverify-request-failed'] }
  }

  if (!response.ok) {
    return { success: false, errorCodes: [`siteverify-http-${response.status}`] }
  }

  const parsed = TurnstileResponseSchema.safeParse(await response.json())
  if (!parsed.success) return { success: false, errorCodes: ['invalid-siteverify-response'] }

  if (parsed.data.success && !TURNSTILE_TEST_SECRET_KEYS.has(secret)) {
    const validationErrors = validateSuccessfulResponse({
      action: parsed.data.action,
      hostname: parsed.data.hostname,
    })

    if (validationErrors.length > 0) {
      return { success: false, errorCodes: validationErrors }
    }
  }

  return {
    success: parsed.data.success,
    errorCodes: parsed.data['error-codes'] ?? [],
  }
}

function validateSuccessfulResponse(params: { action?: string; hostname?: string }): string[] {
  const errors: string[] = []

  if (params.action !== HUMAN_VERIFICATION_ACTION) errors.push('action-mismatch')

  const hostname = normalizeHostname(params.hostname)
  if (!hostname) {
    errors.push('hostname-missing')
  } else if (!getAllowedHostnames().has(hostname)) {
    errors.push('hostname-mismatch')
  }

  return errors
}

function getAllowedHostnames(): Set<string> {
  const hostnames = new Set<string>()

  addCommaSeparatedHostnames(hostnames, process.env.TURNSTILE_ALLOWED_HOSTNAMES)
  addHostnameFromUrl(hostnames, process.env.NEXT_PUBLIC_APP_URL)
  addHostnameFromUrl(hostnames, process.env.VERCEL_URL)
  addHostnameFromUrl(hostnames, process.env.VERCEL_BRANCH_URL)
  addHostnameFromUrl(hostnames, process.env.VERCEL_PROJECT_PRODUCTION_URL)

  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'test') {
    for (const hostname of LOCAL_DEVELOPMENT_HOSTNAMES) hostnames.add(hostname)
  }

  return hostnames
}

function addCommaSeparatedHostnames(hostnames: Set<string>, value: string | undefined): void {
  if (!value) return
  for (const hostname of value.split(',')) addHostname(hostnames, hostname)
}

function addHostnameFromUrl(hostnames: Set<string>, value: string | undefined): void {
  if (!value) return

  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
    addHostname(hostnames, url.hostname)
  } catch {
    addHostname(hostnames, value)
  }
}

function addHostname(hostnames: Set<string>, value: string | undefined): void {
  const hostname = normalizeHostname(value)
  if (hostname) hostnames.add(hostname)
}

function normalizeHostname(value: string | undefined): string | null {
  const trimmed = value?.trim().toLowerCase()
  if (!trimmed) return null

  return trimmed.replace(/^\[/, '').replace(/\]$/, '').replace(/\.$/, '')
}

function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) return false
  const { name } = error
  return typeof name === 'string' && (name === 'AbortError' || name === 'TimeoutError')
}
