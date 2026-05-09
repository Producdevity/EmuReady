import path from 'path'
import { clerk } from '@clerk/testing/playwright'
import { test as setup, type Page } from '@playwright/test'
import { PrismaClient, Role } from '@orm'
import { registerCookieConsent } from './helpers/cookie-consent'

const authFiles = {
  user: path.join(__dirname, '.auth/user.json'),
  author: path.join(__dirname, '.auth/author.json'),
  moderator: path.join(__dirname, '.auth/moderator.json'),
  developer: path.join(__dirname, '.auth/developer.json'),
  admin: path.join(__dirname, '.auth/admin.json'),
  super_admin: path.join(__dirname, '.auth/super_admin.json'),
}

const prisma = new PrismaClient()
const seedPassword = 'DevPassword123!'

async function verifySeededRole(email: string, expectedRole: Role) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  })

  if (!user) throw new Error(`Expected seeded test user to exist: ${email}`)
  if (user.role !== expectedRole) {
    throw new Error(`Expected ${email} to have role ${expectedRole}, received ${user.role}`)
  }
}

async function authenticateUser(
  page: Page,
  email: string,
  password: string,
  role: string,
  expectedRole: Role,
) {
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
    await verifySeededRole(email, expectedRole)

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

setup.afterAll(async () => {
  await prisma.$disconnect()
})

const authConfigs = [
  {
    role: 'user',
    expectedRole: Role.USER,
    email: 'user@emuready.com',
    password: seedPassword,
    file: authFiles.user,
  },
  {
    role: 'super_admin',
    expectedRole: Role.SUPER_ADMIN,
    email: 'superadmin@emuready.com',
    password: seedPassword,
    file: authFiles.super_admin,
  },
  {
    role: 'admin',
    expectedRole: Role.ADMIN,
    email: 'admin@emuready.com',
    password: seedPassword,
    file: authFiles.admin,
  },
  {
    role: 'moderator',
    expectedRole: Role.MODERATOR,
    email: 'moderator@emuready.com',
    password: seedPassword,
    file: authFiles.moderator,
  },
  {
    role: 'author',
    expectedRole: Role.AUTHOR,
    email: 'author@emuready.com',
    password: seedPassword,
    file: authFiles.author,
  },
  {
    role: 'developer',
    expectedRole: Role.DEVELOPER,
    email: 'developer@emuready.com',
    password: seedPassword,
    file: authFiles.developer,
  },
]

for (const config of authConfigs) {
  setup(`authenticate as ${config.role}`, async ({ page }) => {
    await authenticateUser(page, config.email, config.password, config.role, config.expectedRole)
    await page.context().storageState({ path: config.file })
  })
}
