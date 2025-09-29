import crypto from 'node:crypto'

type Payload = {
  sub: string // userId
  iat: number
  exp: number
  n: string // nonce
}

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export const oauthState = {
  sign(userId: string, ttlSeconds = 600): string {
    const secret = process.env.INTERNAL_API_KEY
    if (!secret) throw new Error('INTERNAL_API_KEY missing')
    const header = { alg: 'HS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const payload: Payload = {
      sub: userId,
      iat: now,
      exp: now + ttlSeconds,
      n: crypto.randomUUID(),
    }
    const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
    const sig = crypto.createHmac('sha256', secret).update(unsigned).digest()
    return `${unsigned}.${base64url(sig)}`
  },

  verify(token: string): Payload {
    const secret = process.env.INTERNAL_API_KEY
    if (!secret) throw new Error('INTERNAL_API_KEY missing')
    const [h, p, s] = token.split('.')
    if (!h || !p || !s) throw new Error('Invalid state token')
    const expected = base64url(crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest())
    if (crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)) === false) {
      throw new Error('Invalid signature')
    }
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8')) as Payload
    if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('State token expired')
    return payload
  },
}
