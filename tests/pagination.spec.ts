import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { ListingsPage } from './pages/ListingsPage'
import type { Page } from '@playwright/test'

// The Pagination component renders its navigation buttons twice in the same
// <nav> — once inside a `hidden md:flex` desktop wrapper and once inside a
// `md:hidden` mobile wrapper — so every aria-label resolves to 2 elements.
// Scoping to the desktop wrapper gives strict-mode locators a single match.
function desktopPagination(page: Page) {
  return page.locator('nav[aria-label="Pagination navigation"] > div.hidden.md\\:flex')
}

test.describe('Pagination Tests', () => {
  test('should display pagination controls with previous disabled on first page', async ({
    page,
  }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    const pagination = desktopPagination(page)
    await expect(pagination).toBeVisible()
    await expect(pagination.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
    await expect(pagination.getByRole('button', { name: 'Go to next page' })).toBeEnabled()
    await expect(pagination.locator('button[aria-current="page"]')).toHaveText('1')
  })

  test('should navigate to next page and back with pagination buttons', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    const pagination = desktopPagination(page)
    const currentPage = pagination.locator('button[aria-current="page"]')
    const nextButton = pagination.getByRole('button', { name: 'Go to next page' })
    const prevButton = pagination.getByRole('button', { name: 'Go to previous page' })

    await expect(currentPage).toHaveText('1')

    await nextButton.click()
    await expect(currentPage).toHaveText('2')
    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await expect(prevButton).toBeEnabled()
    await prevButton.click()
    await expect(currentPage).toHaveText('1')
    await expect(page).not.toHaveURL(/[?&]page=2/)
    await expect(listingsPage.listingItems.first()).toBeVisible()
  })

  test('should show "Showing X to Y of Z results" label', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    await expect(
      desktopPagination(page).getByText(/Showing \d+ to \d+ of \d+ results/),
    ).toBeVisible()
  })

  test('should highlight current page number', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    const pagination = desktopPagination(page)
    const currentPage = pagination.locator('button[aria-current="page"]')

    await expect(currentPage).toHaveText('1')
    await pagination.getByRole('button', { name: 'Go to next page' }).click()
    await expect(currentPage).toHaveText('2')
  })

  test('should navigate via numbered page button', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await expect(gamesPage.gameItems.first()).toBeVisible()

    const pagination = desktopPagination(page)
    const page2Button = pagination.getByRole('button', { name: 'Go to page 2' })
    await expect(page2Button).toBeVisible()
    await page2Button.click()

    await expect(pagination.locator('button[aria-current="page"]')).toHaveText('2')
  })

  test('should disable next button on the last page', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await expect(listingsPage.listingItems.first()).toBeVisible()

    const pagination = desktopPagination(page)
    const lastPageButton = pagination.getByRole('button', { name: 'Go to last page' })
    await expect(lastPageButton).toBeVisible()
    await lastPageButton.click()

    await expect(pagination.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
    await expect(pagination.getByRole('button', { name: 'Go to previous page' })).toBeEnabled()
  })
})
