import { randomUUID } from 'node:crypto'
import { createPrismaClient } from '@/server/prisma-client'
import { ApprovalStatus, Role, type Prisma } from '@orm'
import { test, expect } from './fixtures'
import { withContext } from './helpers/data-factory'
import { GamesPage } from './pages/GamesPage'
import { ListingsPage } from './pages/ListingsPage'

const SEARCH_LISTING_KEYS = [
  'approvedMatch',
  'approvedControl',
  'ownerPendingMatch',
  'ownerPendingControl',
  'otherPendingMatch',
] as const

type SearchListingKey = (typeof SEARCH_LISTING_KEYS)[number]

type HandheldSearchFixture = {
  searchTerm: string
  listings: Record<SearchListingKey, { id: string; path: string }>
}

type SearchAccessCase = {
  label: string
  storageState: string | undefined
  ownerEmail: string
  expectedListings: readonly SearchListingKey[]
}

const E2E_USERS = {
  [Role.USER]: {
    ownerEmail: 'user@emuready.com',
    storageState: 'tests/.auth/user.json',
  },
  [Role.AUTHOR]: {
    ownerEmail: 'author@emuready.com',
    storageState: 'tests/.auth/author.json',
  },
  [Role.DEVELOPER]: {
    ownerEmail: 'developer@emuready.com',
    storageState: 'tests/.auth/developer.json',
  },
  [Role.MODERATOR]: {
    ownerEmail: 'moderator@emuready.com',
    storageState: 'tests/.auth/moderator.json',
  },
  [Role.ADMIN]: {
    ownerEmail: 'admin@emuready.com',
    storageState: 'tests/.auth/admin.json',
  },
  [Role.SUPER_ADMIN]: {
    ownerEmail: 'superadmin@emuready.com',
    storageState: 'tests/.auth/super_admin.json',
  },
} satisfies Record<Role, { ownerEmail: string; storageState: string }>

const PUBLIC_RESULTS: readonly SearchListingKey[] = ['approvedMatch']
const AUTHENTICATED_RESULTS: readonly SearchListingKey[] = ['approvedMatch', 'ownerPendingMatch']
const MODERATOR_RESULTS: readonly SearchListingKey[] = [
  'approvedMatch',
  'ownerPendingMatch',
  'otherPendingMatch',
]

const SEARCH_ACCESS_CASES = [
  {
    label: 'anonymous',
    storageState: undefined,
    ownerEmail: E2E_USERS[Role.USER].ownerEmail,
    expectedListings: PUBLIC_RESULTS,
  },
  {
    label: Role.USER,
    ...E2E_USERS[Role.USER],
    expectedListings: AUTHENTICATED_RESULTS,
  },
  {
    label: Role.AUTHOR,
    ...E2E_USERS[Role.AUTHOR],
    expectedListings: AUTHENTICATED_RESULTS,
  },
  {
    label: Role.DEVELOPER,
    ...E2E_USERS[Role.DEVELOPER],
    expectedListings: AUTHENTICATED_RESULTS,
  },
  {
    label: Role.MODERATOR,
    ...E2E_USERS[Role.MODERATOR],
    expectedListings: MODERATOR_RESULTS,
  },
  {
    label: Role.ADMIN,
    ...E2E_USERS[Role.ADMIN],
    expectedListings: MODERATOR_RESULTS,
  },
  {
    label: Role.SUPER_ADMIN,
    ...E2E_USERS[Role.SUPER_ADMIN],
    expectedListings: MODERATOR_RESULTS,
  },
] satisfies readonly SearchAccessCase[]

async function createHandheldSearchFixture(ownerEmail: string): Promise<HandheldSearchFixture> {
  const prisma = createPrismaClient()

  try {
    const otherAuthorEmail =
      ownerEmail === E2E_USERS[Role.AUTHOR].ownerEmail
        ? E2E_USERS[Role.USER].ownerEmail
        : E2E_USERS[Role.AUTHOR].ownerEmail
    const [owner, otherAuthor] = await Promise.all([
      prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: otherAuthorEmail }, select: { id: true } }),
    ])
    if (!owner) throw new Error(`Expected seeded listing owner: ${ownerEmail}`)
    if (!otherAuthor) throw new Error(`Expected seeded listing author: ${otherAuthorEmail}`)

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

    const fixtureToken = randomUUID().replaceAll('-', '')
    const searchTerm = `rolesearch${fixtureToken}`
    const controlTerm = `rolecontrol${fixtureToken}`
    const createListing = (
      authorId: string,
      status: ApprovalStatus,
      notes: string,
    ): Prisma.ListingUncheckedCreateInput => ({
      authorId,
      gameId: game.id,
      deviceId: device.id,
      emulatorId: emulator.id,
      performanceId: performance.id,
      status,
      processedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
      notes,
    })

    const [
      approvedMatch,
      approvedControl,
      ownerPendingMatch,
      ownerPendingControl,
      otherPendingMatch,
    ] = await prisma.$transaction([
      prisma.listing.create({
        data: createListing(otherAuthor.id, ApprovalStatus.APPROVED, searchTerm),
        select: { id: true },
      }),
      prisma.listing.create({
        data: createListing(otherAuthor.id, ApprovalStatus.APPROVED, controlTerm),
        select: { id: true },
      }),
      prisma.listing.create({
        data: createListing(owner.id, ApprovalStatus.PENDING, searchTerm),
        select: { id: true },
      }),
      prisma.listing.create({
        data: createListing(owner.id, ApprovalStatus.PENDING, controlTerm),
        select: { id: true },
      }),
      prisma.listing.create({
        data: createListing(otherAuthor.id, ApprovalStatus.PENDING, searchTerm),
        select: { id: true },
      }),
    ])

    const toFixtureListing = (id: string) => ({ id, path: `/listings/${id}` })
    const listings: HandheldSearchFixture['listings'] = {
      approvedMatch: toFixtureListing(approvedMatch.id),
      approvedControl: toFixtureListing(approvedControl.id),
      ownerPendingMatch: toFixtureListing(ownerPendingMatch.id),
      ownerPendingControl: toFixtureListing(ownerPendingControl.id),
      otherPendingMatch: toFixtureListing(otherPendingMatch.id),
    }

    return {
      searchTerm,
      listings,
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
          in: Object.values(fixture.listings).map((listing) => listing.id),
        },
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function withHandheldSearchFixture(
  ownerEmail: string,
  run: (fixture: HandheldSearchFixture) => Promise<void>,
): Promise<void> {
  const fixture = await createHandheldSearchFixture(ownerEmail)

  try {
    await run(fixture)
  } finally {
    await deleteHandheldSearchFixture(fixture)
  }
}

test.describe('Handheld Report search visibility by role', () => {
  for (const accessCase of SEARCH_ACCESS_CASES) {
    test(`filters results for ${accessCase.label}`, async ({ browser }) => {
      await withHandheldSearchFixture(accessCase.ownerEmail, async (fixture) => {
        await withContext(browser, accessCase.storageState, async (page) => {
          const listingsPage = new ListingsPage(page)
          await listingsPage.goto()
          await listingsPage.verifyPageLoaded()

          await listingsPage.searchListings(fixture.searchTerm)

          await expect(listingsPage.listingItems).toHaveCount(accessCase.expectedListings.length)

          for (const key of SEARCH_LISTING_KEYS) {
            const listing = fixture.listings[key]
            const link = page.locator(`a[href="${listing.path}"]`)
            if (accessCase.expectedListings.includes(key)) {
              await expect(link.first()).toBeVisible()
            } else {
              await expect(link).toHaveCount(0)
            }
          }
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
