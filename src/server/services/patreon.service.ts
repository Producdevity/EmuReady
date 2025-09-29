type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

export async function patreonExchangeCode(code: string, redirectUri: string) {
  const clientId = process.env.PATREON_CLIENT_ID
  const clientSecret = process.env.PATREON_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Patreon client env missing')
  const form = new URLSearchParams()
  form.set('grant_type', 'authorization_code')
  form.set('code', code)
  form.set('client_id', clientId)
  form.set('client_secret', clientSecret)
  form.set('redirect_uri', redirectUri)
  const res = await fetch('https://www.patreon.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  if (!res.ok) throw new Error(`Patreon token error ${res.status}`)
  return (await res.json()) as TokenResponse
}

export async function patreonFetchIdentity(accessToken: string) {
  const url =
    'https://www.patreon.com/api/oauth2/v2/identity?include=memberships' +
    '&fields%5Bmember%5D=last_charge_status%2Clifetime_support_cents%2Clast_charge_date%2Cpatron_status'
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`Patreon identity error ${res.status}`)
  return (await res.json()) as unknown
}

export function hasPaidOnce(identity: unknown): boolean {
  if (!identity || typeof identity !== 'object') return false
  const idObj = identity as {
    included?: { type?: string; attributes?: { lifetime_support_cents?: unknown } }[]
  }
  const memberships = Array.isArray(idObj.included) ? idObj.included : []
  for (const m of memberships) {
    if (m?.type === 'member') {
      const cents = Number(m?.attributes?.lifetime_support_cents ?? 0)
      if (Number.isFinite(cents) && cents > 0) return true
    }
  }
  return false
}
