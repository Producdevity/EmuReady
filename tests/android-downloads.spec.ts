import { test, expect } from '@playwright/test'

test('Profile downloads tab loads (if feature-flag enabled)', async ({ page }) => {
  await page.goto('/profile?tab=downloads')
  // Page should render without crashing; unauthenticated users see a friendly screen
  await expect(page).toHaveTitle(/My Profile|EmuReady/i)
  const downloadsTab = page.getByRole('tab', { name: /downloads/i })
  if ((await downloadsTab.count()) === 0) {
    test.skip(true, 'Downloads tab feature flag disabled in this environment')
  } else {
    await downloadsTab.click()
    // The section title should be visible when enabled
    await expect(page.getByText(/Latest Build/i)).toBeVisible()
  }
})

test('Patreon callback without params shows error message', async ({ page }) => {
  await page.goto('/auth/patreon/callback')
  await expect(page.getByText(/Missing code or state/i)).toBeVisible()
})
