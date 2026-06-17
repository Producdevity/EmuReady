import { randomUUID } from 'node:crypto'
import { type Locator, type Page } from '@playwright/test'
import { createPrismaClient } from '@/server/prisma-client'
import { ApprovalStatus } from '@orm'
import { test, expect } from './fixtures'
import { registerCookieConsent } from './helpers/cookie-consent'
import { registerExternalServiceMocks } from './helpers/external-services'

const ORIGINAL_COVER_URL =
  'https://media.rawg.io/media/games/5c0/5c0dd63002cb23f804aab327d40ef119.jpg'
const STEAM_COVER_URL =
  'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/header.jpg?t=1745363004'
const ARBITRARY_BOXART_URL = 'https://example.com/e2e-boxart.jpg'
const GOG_BANNER_URL =
  'https://images.gog-statics.com/c75e674590b8947542c809924df30bbef2190341163dd08668e243c266be70c5_product_card_v2_mobile_slider_639.jpg'

type GameFixture = {
  id: string
  title: string
}

async function createGameFixture(): Promise<GameFixture> {
  const prisma = createPrismaClient()

  try {
    const system = await prisma.system.findFirst({ select: { id: true } })
    if (!system) throw new Error('Expected at least one system for game image selector E2E')

    const superAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@emuready.com' },
      select: { id: true },
    })
    if (!superAdmin) throw new Error('Expected seeded super admin user for image selector E2E')

    const title = `E2E Image Selector ${randomUUID()}`
    const game = await prisma.game.create({
      data: {
        title,
        systemId: system.id,
        imageUrl: ORIGINAL_COVER_URL,
        boxartUrl: null,
        bannerUrl: null,
        status: ApprovalStatus.APPROVED,
        submittedBy: superAdmin.id,
        submittedAt: new Date(),
        approvedBy: superAdmin.id,
        approvedAt: new Date(),
      },
      select: { id: true, title: true },
    })

    return game
  } finally {
    await prisma.$disconnect()
  }
}

async function deleteGameFixture(gameId: string): Promise<void> {
  const prisma = createPrismaClient()

  try {
    await prisma.game.deleteMany({ where: { id: gameId } })
  } finally {
    await prisma.$disconnect()
  }
}

async function getGameImageValues(gameId: string) {
  const prisma = createPrismaClient()

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        imageUrl: true,
        boxartUrl: true,
        bannerUrl: true,
      },
    })
    if (!game) throw new Error(`Expected E2E game to exist: ${gameId}`)

    return game
  } finally {
    await prisma.$disconnect()
  }
}

async function withGameFixture(run: (game: GameFixture) => Promise<void>): Promise<void> {
  const game = await createGameFixture()

  try {
    await run(game)
  } finally {
    await deleteGameFixture(game.id)
  }
}

function imageInput(page: Page, placeholder: string): Locator {
  return page.getByPlaceholder(placeholder)
}

function imageInputRow(input: Locator): Locator {
  return input.locator(
    'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " flex ") and contains(concat(" ", normalize-space(@class), " "), " gap-2 ")][1]',
  )
}

function applyButtonFor(input: Locator): Locator {
  return imageInputRow(input).getByRole('button', { name: 'Apply' })
}

function clearButtonFor(input: Locator): Locator {
  return imageInputRow(input).getByRole('button', { name: 'Clear image URL' })
}

async function setImageField(input: Locator, value: string): Promise<void> {
  await input.fill(value)
  await expect(applyButtonFor(input)).toBeEnabled()
  await applyButtonFor(input).click()
}

async function clearImageField(input: Locator): Promise<void> {
  await expect(clearButtonFor(input)).toBeVisible()
  await clearButtonFor(input).click()
  await expect(input).toHaveValue('')
}

test.describe('Game image selectors', () => {
  test.describe('admin edit form', () => {
    test.use({ storageState: 'tests/.auth/super_admin.json' })

    test('validates, saves, and clears cover, boxart, and banner image URLs', async ({ page }) => {
      await withGameFixture(async (game) => {
        await page.goto(`/admin/games/${game.id}`, { waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('heading', { name: `Edit Game: ${game.title}` })).toBeVisible()

        const coverInput = imageInput(page, 'https://example.com/game-image.jpg')
        const boxartInput = imageInput(page, 'https://example.com/boxart-image.jpg')
        const bannerInput = imageInput(page, 'https://example.com/banner-image.jpg')

        await expect(coverInput).toHaveValue(ORIGINAL_COVER_URL)

        await coverInput.fill('http://example.com/not-allowed.jpg')
        await expect(page.getByText('Image URL must use HTTPS.')).toBeVisible()
        await expect(applyButtonFor(coverInput)).toBeDisabled()

        await setImageField(coverInput, STEAM_COVER_URL)
        await setImageField(boxartInput, ARBITRARY_BOXART_URL)
        await setImageField(bannerInput, GOG_BANNER_URL)

        await page.getByRole('button', { name: 'Save Changes' }).click()

        await expect
          .poll(() => getGameImageValues(game.id))
          .toEqual({
            imageUrl: STEAM_COVER_URL,
            boxartUrl: ARBITRARY_BOXART_URL,
            bannerUrl: GOG_BANNER_URL,
          })

        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(coverInput).toHaveValue(STEAM_COVER_URL)
        await expect(boxartInput).toHaveValue(ARBITRARY_BOXART_URL)
        await expect(bannerInput).toHaveValue(GOG_BANNER_URL)

        await clearImageField(boxartInput)
        await clearImageField(bannerInput)
        await page.getByRole('button', { name: 'Save Changes' }).click()

        await expect
          .poll(() => getGameImageValues(game.id))
          .toEqual({
            imageUrl: STEAM_COVER_URL,
            boxartUrl: null,
            bannerUrl: null,
          })
      })
    })
  })

  test.describe('public game image editor access', () => {
    test('hides privileged image editing from regular users', async ({ browser }) => {
      await withGameFixture(async (game) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' })
        await registerCookieConsent(context)
        const page = await context.newPage()
        await registerExternalServiceMocks(page)

        try {
          await page.goto(`/games/${game.id}`, { waitUntil: 'domcontentloaded' })
          await expect(page.getByRole('heading', { name: game.title })).toBeVisible()
          await expect(page.getByRole('button', { name: /edit cover image/i })).toHaveCount(0)
          await expect(page.getByRole('button', { name: /edit boxart/i })).toHaveCount(0)
          await expect(page.getByRole('button', { name: /edit banner/i })).toHaveCount(0)
        } finally {
          await context.close()
        }
      })
    })

    test('shows manual and provider selectors to moderators', async ({ browser }) => {
      await withGameFixture(async (game) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/moderator.json' })
        await registerCookieConsent(context)
        const page = await context.newPage()
        await registerExternalServiceMocks(page)

        try {
          await page.goto(`/games/${game.id}`, { waitUntil: 'domcontentloaded' })
          await expect(page.getByRole('heading', { name: game.title })).toBeVisible()

          const editButton = page.getByRole('button', { name: /edit cover image/i })
          await expect(editButton).toBeAttached()
          await editButton.click({ force: true })

          const dialog = page.locator('[role="dialog"]')
          await expect(dialog).toBeVisible()
          await expect(dialog.getByRole('button', { name: 'Manual URL' })).toBeVisible()
          await expect(dialog.getByRole('button', { name: 'RAWG.io' })).toBeVisible()
          await expect(dialog.getByRole('button', { name: 'TheGamesDB' })).toBeVisible()
          await expect(dialog.getByRole('button', { name: /IGDB/i })).toBeVisible()
          await expect(dialog.getByPlaceholder('https://example.com/image.jpg')).toBeVisible()
        } finally {
          await context.close()
        }
      })
    })
  })

  test.describe('new game image selector access', () => {
    test.use({ storageState: 'tests/.auth/author.json' })

    test('shows provider-only image selection to authors on manual game creation', async ({
      page,
    }) => {
      await page.goto('/games/new', { waitUntil: 'domcontentloaded' })

      await expect(
        page.getByRole('textbox', { name: 'Enter game title', exact: true }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'RAWG.io' })).toBeVisible()
      await expect(page.getByRole('button', { name: /TheGamesDB/ })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Manual URL' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /IGDB/i })).toHaveCount(0)
    })
  })
})
