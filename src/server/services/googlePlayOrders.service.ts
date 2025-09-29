/**
 * Minimal Google Play Orders verification using Service Account JWT.
 * No external deps; uses node:crypto to mint JWT and fetch to call token + orders.get.
 */
import crypto from 'node:crypto'

type GoogleTokenResponse = { access_token: string; token_type: string; expires_in: number }

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function createAccessToken(scopes: string[]): Promise<string> {
  const clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!clientEmail || !privateKey) throw new Error('Google SA credentials missing')

  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(unsigned)
  const signature = sign.sign(privateKey)
  const assertion = `${unsigned}.${base64url(signature)}`

  const form = new URLSearchParams()
  form.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  form.set('assertion', assertion)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  if (!res.ok) throw new Error(`Google token error ${res.status}`)
  const json = (await res.json()) as GoogleTokenResponse
  return json.access_token
}

export type PlayOrder = {
  orderId: string
  state?: string
  lineItems?: { offerDetails?: unknown; preTaxAmount?: unknown }[]
  paidAppDetails?: unknown
}

export async function fetchPlayOrder(packageName: string, orderId: string): Promise<PlayOrder> {
  const token = await createAccessToken(['https://www.googleapis.com/auth/androidpublisher'])
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
    packageName,
  )}/orders/${encodeURIComponent(orderId)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    let detail = ''
    try {
      detail = await res.text()
    } catch {
      // ignore
    }
    throw new Error(`orders.get failed ${res.status}${detail ? `: ${detail}` : ''}`)
  }
  return (await res.json()) as PlayOrder
}

export function isPaidAppOrder(order: PlayOrder): boolean {
  // Heuristic: either paidAppDetails present or at least one line item
  if (order.paidAppDetails) return true
  if (order.lineItems && order.lineItems.length > 0) return true
  return false
}
