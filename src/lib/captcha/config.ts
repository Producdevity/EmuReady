export const RECAPTCHA_CONFIG = {
  siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
  secretKey: process.env.RECAPTCHA_SECRET_KEY!,
  // Score threshold (0.0 = likely bot, 1.0 = likely human)
  // reCAPTCHA v3 recommends 0.5 as a starting point
  scoreThreshold: 0.5,
  // Actions for different parts of the application
  actions: {
    CREATE_LISTING: 'create_listing',
    VOTE: 'vote',
    COMMENT: 'comment',
    REGISTER: 'register',
    CONTACT: 'contact',
  },
} as const

// Validate configuration
if (typeof window === 'undefined') {
  // Server-side validation
  if (!RECAPTCHA_CONFIG.secretKey && process.env.NODE_ENV !== 'test') {
    console.warn('RECAPTCHA_SECRET_KEY is not set. CAPTCHA verification will be disabled.')
  }
} else {
  // Client-side validation
  if (!RECAPTCHA_CONFIG.siteKey && process.env.NODE_ENV !== 'test') {
    console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. CAPTCHA will be disabled.')
  }
}

export function isCaptchaEnabled(): boolean {
  return Boolean(RECAPTCHA_CONFIG.siteKey && RECAPTCHA_CONFIG.secretKey)
}
