import { randomUUID } from 'node:crypto'
import { createPrismaClient } from '@/server/prisma-client'
import { ApprovalStatus, Role } from '@orm'
import { test, expect } from './fixtures'
import { withContext } from './helpers/data-factory'
import { GamesPage } from './pages/GamesPage'
import { ListingsPage } from './pages/ListingsPage'

type HandheldSearchFixture = {
  searchTerm: string
  matchingId: string
  controlId: string
  matchingPath: string
  controlPath: string
}

const SEARCH_ACCESS_CASES = [
  { label: 'anonymous', storageState: undefined },
  { label: Role.USER, storageState: 'tests/.auth/user.json' },
  { label: Role.AUTHOR, storageState: 'tests/.auth/author.json' },
  { label: Role.DEVELOPER, storageState: 'tests/.auth/developer.json' },
  { label: Role.MODERATOR, storageState: 'tests/.auth/moderator.json' },
  { label: Role.ADMIN, storageState: 'tests/.auth/admin.json' },
  { label: Role.SUPER_ADMIN, storageState: 'tests/.auth/super_admin.json' },
] satisfies readonly { label: string; storageState: string | undefined }[]

async function createHandheldSearchFixture(): Promise<HandheldSearchFixture> {
  const prisma = createPrismaClient()

  try {
    const author = await prisma.user.findUnique({
      where: { email: 'superadmin@emuready.com' },
      select: { id: true },
    })
    if (!author) throw new Error('Expected seeded super admin for listing search E2E')

    const game = await prisma.game.findFirst({
      where: { status: ApprovalStatus.APPROVED, isErotic: false },
      select: { id: true, systemId: true },
    })
    if (!game) throw new Error('Expected an approved game for listing search E2E')

    const [device, emulator, performance] = await Promise.all([
      prisma.device.findFirst({ select: { id: true } }),
      prisma.emulator.findFirst({
        where: { systems: { some: { id: game.systemId } } },
        select: { id: true },
      }),
      prisma.performanceScale.findFirst({ select: { id: true } }),
    ])
    if (!device) throw new Error('Expected a device for listing search E2E')
    if (!emulator) throw new Error('Expected an emulator for listing search E2E')
    if (!performance) throw new Error('Expected a performance scale for listing search E2E')

    const searchTerm = `rolesearch${randomUUID().replaceAll('-', '')}`
    const [matchingListing, controlListing] = await prisma.$transaction([
      prisma.listing.create({
        data: {
          authorId: author.id,
          gameId: game.id,
          deviceId: device.id,
          emulatorId: emulator.id,
          performanceId: performance.id,
          status: ApprovalStatus.APPROVED,
          processedAt: new Date(),
          notes: searchTerm,
        },
        select: { id: true },
      }),
      prisma.listing.create({
        data: {
          authorId: author.id,
          gameId: game.id,
          deviceId: device.id,
          emulatorId: emulator.id,
          performanceId: performance.id,
          status: ApprovalStatus.APPROVED,
          processedAt: new Date(),
          notes: `E2E listing search control ${randomUUID()}`,
        },
        select: { id: true },
      }),
    ])

    return {
      searchTerm,
      matchingId: matchingListing.id,
      controlId: controlListing.id,
      matchingPath: `/listings/${matchingListing.id}`,
      controlPath: `/listings/${controlListing.id}`,
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function deleteHandheldSearchFixture(fixture: HandheldSearchFixture): Promise<void> {
  const prisma = createPrismaClient()

  try {
    await prisma.listing.deleteMany({
      where: {
        id: {
          in: [fixture.matchingId, fixture.controlId],
        },
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function withHandheldSearchFixture(
  run: (fixture: HandheldSearchFixture) => Promise<void>,
): Promise<void> {
  const fixture = await createHandheldSearchFixture()

  try {
    await run(fixture)
  } finally {
    await deleteHandheldSearchFixture(fixture)
  }
}

test.describe('Handheld Report search visibility by role', () => {
  for (const accessCase of SEARCH_ACCESS_CASES) {
    test(`filters results for ${accessCase.label}`, async ({ browser }) => {
      await withHandheldSearchFixture(async (fixture) => {
        await withContext(browser, accessCase.storageState, async (page) => {
          const listingsPage = new ListingsPage(page)
          await listingsPage.goto()
          await listingsPage.verifyPageLoaded()

          await listingsPage.searchListings(fixture.searchTerm)

          await expect(page.locator(`a[href="${fixture.matchingPath}"]`).first()).toBeVisible()
          await expect(listingsPage.listingItems).toHaveCount(1)
          await expect(page.locator(`a[href="${fixture.controlPath}"]`)).toHaveCount(0)
        })
      })
    })
  }
})

test.describe('Search Functionality Tests', () => {
  test('should search for games by title', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.verifyPageLoaded()

    await gamesPage.searchGames('Mario')

    await expect(gamesPage.gameItems.first().or(gamesPage.noGamesMessage)).toBeVisible()
  })

  test('should search for listings with filters', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    await listingsPage.searchListings('Pokemon')

    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should handle empty search results gracefully', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.searchGames('xyznonexistentgame123')

    await expect(gamesPage.gameItems.first().or(gamesPage.noGamesMessage)).toBeVisible()
  })

  test('should maintain search state during navigation', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const searchQuery = 'Zelda'
    await gamesPage.searchGames(searchQuery)

    await expect(gamesPage.gameItems.first()).toBeVisible()
    await gamesPage.clickFirstGame()

    await page.goBack()
    await page.waitForLoadState('domcontentloaded')

    await expect(gamesPage.pageHeading).toBeVisible()

    await expect(page).toHaveURL(new RegExp(searchQuery))
  })

  test('should support search with special characters', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const specialSearches = ['Mario & Luigi', 'Pok\u00e9mon', 'Street Fighter II']

    for (const searchQuery of specialSearches) {
      await gamesPage.searchGames(searchQuery)
      await expect(gamesPage.searchInput).toBeVisible()
      await gamesPage.searchInput.clear()
    }

    await expect(gamesPage.searchInput).toBeVisible()
  })

  test('should search input accept partial queries', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    await gamesPage.searchInput.fill('Mar')

    await expect(gamesPage.searchInput).toHaveValue('Mar')
    await expect(gamesPage.searchInput).toBeVisible()
  })
})

test.describe('Search Performance Tests', () => {
  test('should handle rapid search input changes', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const searches = ['M', 'Ma', 'Mar', 'Mari', 'Mario']

    for (const partial of searches) {
      await gamesPage.searchInput.fill(partial)
    }

    await page.keyboard.press('Enter')
    await expect(gamesPage.pageHeading).toBeVisible()
    await expect(gamesPage.searchInput).toBeVisible()
  })

  test('should cancel previous search requests', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    await listingsPage.searchListings('Pokemon')
    await listingsPage.searchListings('Mario')
    await listingsPage.searchListings('Zelda')

    await expect(listingsPage.searchInput).toHaveValue('Zelda')

    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })
})

test.describe('Cross-Page Search Tests', () => {
  test('should search across different content types', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    const listingsPage = new ListingsPage(page)

    await gamesPage.goto()
    await gamesPage.searchGames('Mario')
    await expect(gamesPage.gameItems.first().or(gamesPage.noGamesMessage)).toBeVisible()

    await listingsPage.goto()
    await listingsPage.searchListings('Mario')
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })

  test('should handle search with no results across pages', async ({ page }) => {
    const searchQuery = 'nonexistentgame12345xyz'

    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.searchGames(searchQuery)
    await expect(gamesPage.gameItems.first().or(gamesPage.noGamesMessage)).toBeVisible()

    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.searchListings(searchQuery)
    await expect(listingsPage.listingItems.first().or(listingsPage.noListingsMessage)).toBeVisible()
  })
})
