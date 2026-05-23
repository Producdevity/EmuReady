export const RECAPTCHA_CONFIG = {
  siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '',
  secretKey: process.env.RECAPTCHA_SECRET_KEY ?? '',
  scoreThreshold: 0.5,
  actions: {
    CREATE_LISTING: 'create_listing',
    VOTE: 'vote',
    COMMENT: 'comment',
    REGISTER: 'register',
    CONTACT: 'contact',
  },
} as const

if (
  process.env.NODE_ENV !== 'test' &&
  typeof window === 'undefined' &&
  !isCaptchaDisabled() &&
  !RECAPTCHA_CONFIG.secretKey
) {
  console.warn('RECAPTCHA_SECRET_KEY is not set. CAPTCHA verification will be disabled.')
}

if (
  process.env.NODE_ENV !== 'test' &&
  typeof window !== 'undefined' &&
  !isCaptchaDisabled() &&
  !RECAPTCHA_CONFIG.siteKey
) {
  console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. CAPTCHA will be disabled.')
}

export function isCaptchaDisabled(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_RECAPTCHA === 'true'
}

export function isCaptchaClientEnabled(): boolean {
  return !isCaptchaDisabled() && Boolean(RECAPTCHA_CONFIG.siteKey)
}

export function isCaptchaVerificationEnabled(): boolean {
  return !isCaptchaDisabled() && Boolean(RECAPTCHA_CONFIG.secretKey)
}
