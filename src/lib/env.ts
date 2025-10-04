interface Env {
  EMUREADY_LITE_GITHUB_URL: string
  EMUREADY_BETA_URL: string
  DISCORD_URL: string
  PATREON_URL: string
  KOFI_URL: string
  EMUREADY_EMAIL: string
  GITHUB_URL: string
  GITHUB_README_URL: string
  GITHUB_SUPPORT_URL: string
  GITHUB_CONTRIBUTING_URL: string
  GITHUB_REQUEST_EMULATOR_URL: string
  GITHUB_ISSUES_URL: string
  APP_URL: string
  GA_ID: string
  LOCAL_STORAGE_PREFIX: string
  ENABLE_SW: boolean
  VERCEL_ANALYTICS_ENABLED: boolean
  DISABLE_COOKIE_BANNER: boolean
  IS_PROD: boolean
  IS_DEV: boolean
  IS_TEST: boolean
  ENABLE_PATREON_VERIFICATION: boolean
  ENABLE_ANDROID_DOWNLOADS: boolean
  ANDROID_LATEST_JSON_URL: string
  ANDROID_LATEST_APK_URL: string
}

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/Producdevity/EmuReady'
export const env = {
  EMUREADY_LITE_GITHUB_URL:
    process.env.NEXT_PUBLIC_EMUREADY_LITE_GITHUB_URL ??
    'https://github.com/Producdevity/EmuReadyLite/releases',

  EMUREADY_BETA_URL:
    process.env.NEXT_PUBLIC_EMUREADY_BETA_URL ??
    'https://play.google.com/store/apps/details?id=com.producdevity.emureadyapp',

  DISCORD_URL: process.env.NEXT_PUBLIC_DISCORD_LINK ?? 'https://discord.gg/CYhCzApXav',

  PATREON_URL: process.env.NEXT_PUBLIC_PATREON_LINK ?? 'https://www.patreon.com/Producdevity',

  KOFI_URL: process.env.NEXT_PUBLIC_KOFI_LINK ?? 'https://ko-fi.com/producdevity',

  EMUREADY_EMAIL: process.env.NEXT_PUBLIC_EMUREADY_EMAIL ?? 'info@emuready.com',

  GITHUB_URL,
  GITHUB_README_URL: `${GITHUB_URL}/blob/master/README.md`,
  GITHUB_SUPPORT_URL: `${GITHUB_URL}/issues/new?template=question.md`,
  GITHUB_CONTRIBUTING_URL: `${GITHUB_URL}/blob/master/CONTRIBUTING.md`,
  GITHUB_REQUEST_EMULATOR_URL: `${GITHUB_URL}/issues/new?template=emulator_request.md`,

  GITHUB_ISSUES_URL: `${GITHUB_URL}/issues`,

  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  GA_ID: process.env.NEXT_PUBLIC_GA_ID ?? '',

  LOCAL_STORAGE_PREFIX: process.env.NEXT_PUBLIC_LOCAL_STORAGE_PREFIX ?? '@LocalEmuReady_',

  ENABLE_SW: process.env.NEXT_PUBLIC_ENABLE_SW === 'true',

  VERCEL_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true',

  DISABLE_COOKIE_BANNER: process.env.NEXT_PUBLIC_DISABLE_COOKIE_BANNER === 'true',

  IS_PROD: process.env.NODE_ENV === 'production',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',

  ENABLE_PATREON_VERIFICATION: process.env.NEXT_PUBLIC_ENABLE_PATREON_VERIFICATION === 'true',
  ENABLE_ANDROID_DOWNLOADS: process.env.NEXT_PUBLIC_ENABLE_ANDROID_DOWNLOADS === 'true',
  ANDROID_LATEST_JSON_URL:
    process.env.NEXT_PUBLIC_ANDROID_LATEST_JSON_URL ??
    'https://cdn.emuready.com/android/latest.json',
  ANDROID_LATEST_APK_URL:
    process.env.NEXT_PUBLIC_ANDROID_LATEST_APK_URL ??
    'https://cdn.emuready.com/android/emuready-latest.apk',
} as const satisfies Env
