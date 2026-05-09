import path from 'path'
import { clerk } from '@clerk/testing/playwright'
import { test as setup, type Page } from '@playwright/test'
import { registerCookieConsent } from './helpers/cookie-consent'

const authFiles = {
  user: path.join(__dirname, '.auth/user.json'),
  author: path.join(__dirname, '.auth/author.json'),
  moderator: path.join(__dirname, '.auth/moderator.json'),
  developer: path.join(__dirname, '.auth/developer.json'),
  admin: path.join(__dirname, '.auth/admin.json'),
  super_admin: path.join(__dirname, '.auth/super_admin.json'),
}

async function authenticateUser(page: Page, email: string, password: string, role: string) {
  console.log(`🔐 Setting up authentication for ${role}: ${email}`)

  const userButtonSelector = '.cl-userButtonTrigger, .cl-userButton, [data-clerk-user-button]'

  await registerCookieConsent(page.context())

  try {
    await page.goto('/', { waitUntil: 'load' })
    await clerk.loaded({ page })
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: email,
        password,
      },
    })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector(userButtonSelector, { timeout: 8000 })

    console.log(`✅ Successfully authenticated ${role}: ${email}`)
    return true
  } catch (error) {
    console.error(`❌ Authentication failed for ${role} (${email}):`, error)
    await page.screenshot({
      path: `test-results/auth-failed-${role}.png`,
      fullPage: true,
    })
    throw error
  }
}

setup.beforeAll(async () => {
  const fs = await import('fs')
  const authDir = path.join(__dirname, '.auth')

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  console.log('🧹 Auth setup initialized')
})

const authConfigs = [
  {
    role: 'user',
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
    file: authFiles.user,
  },
  {
    role: 'super_admin',
    email: process.env.TEST_SUPER_ADMIN_EMAIL,
    password: process.env.TEST_SUPER_ADMIN_PASSWORD,
    file: authFiles.super_admin,
  },
  {
    role: 'admin',
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
    file: authFiles.admin,
  },
  {
    role: 'moderator',
    email: process.env.TEST_MODERATOR_EMAIL,
    password: process.env.TEST_MODERATOR_PASSWORD,
    file: authFiles.moderator,
  },
  {
    role: 'author',
    email: process.env.TEST_AUTHOR_EMAIL,
    password: process.env.TEST_AUTHOR_PASSWORD,
    file: authFiles.author,
  },
  {
    role: 'developer',
    email: process.env.TEST_DEVELOPER_EMAIL,
    password: process.env.TEST_DEVELOPER_PASSWORD,
    file: authFiles.developer,
  },
]

for (const config of authConfigs) {
  if (!config.email || !config.password) {
    setup.skip(`authenticate as ${config.role}`, async () => {
      console.log(`⚠️  Skipping ${config.role} auth - credentials not provided`)
    })
    continue
  }

  const email = config.email
  const password = config.password

  setup(`authenticate as ${config.role}`, async ({ page }) => {
    await authenticateUser(page, email, password, config.role)
    await page.context().storageState({ path: config.file })
  })
}
