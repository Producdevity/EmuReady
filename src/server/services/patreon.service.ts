import { logger } from '@/lib/logger'
import http from '@/rest/http'

type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

export class PatreonError extends Error {
  status: number
  code?: string
  constructor(status: number, code?: string, message?: string) {
    super(message ?? `Patreon error ${status}${code ? ` (${code})` : ''}`)
    this.status = status
    this.code = code
  }
}

// Cached campaign id discovered via creator token (server-side only)
let cachedCampaignId: string | null | undefined
let discoverPromise: Promise<string | null> | null = null

function readStringProp(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  const val = (obj as Record<string, unknown>)[key]
  return typeof val === 'string' ? val : undefined
}

export async function getPatreonCampaignId(): Promise<string | null> {
  // 1) Explicit env wins
  const explicit = process.env.PATREON_CAMPAIGN_ID
  if (explicit && explicit.trim()) return explicit.trim()

  // 2) Cached discovery
  if (typeof cachedCampaignId !== 'undefined') return cachedCampaignId

  // 3) In-flight discovery
  if (discoverPromise) return discoverPromise

  const creatorToken = process.env.PATREON_CREATOR_TOKEN
  if (!creatorToken) {
    cachedCampaignId = null
    return null
  }

  discoverPromise = (async () => {
    try {
      const url =
        'https://www.patreon.com/api/oauth2/v2/campaigns?fields%5Bcampaign%5D=id%2Ccreation_name%2Cvanity'
      const res = await http.get(url, {
        headers: { Authorization: `Bearer ${creatorToken}` },
        validateStatus: () => true,
      })
      if (res.status < 200 || res.status >= 300) {
        logger.error('[patreon] Campaign discovery failed', {
          status: res.status,
          statusText: res.statusText,
          data: res.data,
        })
        cachedCampaignId = null
        return null
      }
      const data = res.data as unknown as { data?: unknown[] }
      const arr = Array.isArray(data?.data) ? (data!.data as unknown[]) : []
      if (arr.length === 0) {
        logger.error('[patreon] No campaigns found for creator token')
        cachedCampaignId = null
        return null
      }
      const first = arr[0]
      const id = readStringProp(first, 'id')
      if (id) {
        logger.info('[patreon] Successfully discovered campaign', { campaignId: id })
        cachedCampaignId = id
        return id
      }
      logger.error('[patreon] Campaign ID not found in response', { firstCampaign: first })
      cachedCampaignId = null
      return null
    } catch (err) {
      logger.error('[patreon] Campaign discovery exception', err as Error)
      cachedCampaignId = null
      return null
    } finally {
      discoverPromise = null
    }
  })()

  return discoverPromise
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
  const url = 'https://www.patreon.com/api/oauth2/token'

  const postOnce = async () =>
    http.post<TokenResponse>(url, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // Patreon can be slow; keep default axios timeout from http client
      validateStatus: () => true,
    })

  // Minimal retry for transient 429s
  let res = await postOnce()
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 400))
    res = await postOnce()
  }
  if (res.status < 200 || res.status >= 300) {
    const body = res.data as unknown as { error?: string; error_description?: string }
    const errCode = body?.error
    throw new PatreonError(
      res.status,
      errCode,
      body?.error_description || `Patreon token error ${res.status}`,
    )
  }
  return res.data
}

export async function patreonFetchIdentity(accessToken: string) {
  const url =
    'https://www.patreon.com/api/oauth2/v2/identity?include=memberships,memberships.campaign' +
    '&fields%5Bmember%5D=last_charge_status%2Clifetime_support_cents%2Clast_charge_date%2Cpatron_status'
  const res = await http.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    validateStatus: () => true,
  })
  if (res.status < 200 || res.status >= 300) {
    throw new PatreonError(res.status, undefined, `Patreon identity error ${res.status}`)
  }
  return res.data as unknown
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function readString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function readNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

type MemberLite = {
  lifetimeCents: number
  patronStatus?: string
  lastChargeStatus?: string
  campaignId?: string
}

function extractMembers(identity: unknown): MemberLite[] {
  if (!isRecord(identity)) return []
  const included = identity.included
  if (!Array.isArray(included)) return []
  const out: MemberLite[] = []
  for (const it of included) {
    const itObj = isRecord(it) ? it : undefined
    if (!itObj) continue
    const type = readString(itObj.type)
    if (type !== 'member') continue
    const attributes = isRecord(itObj.attributes) ? itObj.attributes : undefined
    const relationships = isRecord(itObj.relationships) ? itObj.relationships : undefined
    const lifetimeCents = readNumber(attributes?.lifetime_support_cents) ?? 0
    const patronStatus = readString(attributes?.patron_status)
    const lastChargeStatus = readString(attributes?.last_charge_status)
    const campaignRel =
      relationships && isRecord(relationships.campaign) ? relationships.campaign : undefined
    const cdata = campaignRel && isRecord(campaignRel.data) ? campaignRel.data : undefined
    const campaignId = readString(cdata?.id)
    out.push({ lifetimeCents, patronStatus, lastChargeStatus, campaignId })
  }
  return out
}

export function hasPaidOnce(identity: unknown): boolean {
  return extractMembers(identity).some((m) => m.lifetimeCents > 0)
}

export function hasPaidOnceForCampaign(identity: unknown, campaignId: string): boolean {
  return extractMembers(identity).some((m) => m.campaignId === campaignId && m.lifetimeCents > 0)
}

export function hasActivePledge(identity: unknown): boolean {
  return extractMembers(identity).some((m) => m.patronStatus === 'active_patron')
}

export function hasActivePledgeForCampaign(identity: unknown, campaignId: string): boolean {
  return extractMembers(identity).some(
    (m) => m.campaignId === campaignId && m.patronStatus === 'active_patron',
  )
}
