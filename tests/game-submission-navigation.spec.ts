import { test, expect } from './fixtures'

test.describe('Game submission entry point', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  for (const viewport of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'desktop', width: 1280, height: 800 },
  ]) {
    test(`shows the Add Game link on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/games', { waitUntil: 'domcontentloaded' })
      const addGame = page.getByRole('link', { name: 'Add Game', exact: true })
      await expect(addGame).toBeVisible()
      await expect(addGame).toHaveAttribute('href', '/games/new/search/v2')
      await addGame.click()
      await expect(page).toHaveURL(/\/games\/new\/search\/v2$/)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }
})
