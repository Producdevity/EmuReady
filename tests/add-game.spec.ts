import { test, expect } from '@playwright/test'

test.describe('Add Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate to add game page from games section', async ({ page }) => {
    // Go to games page first
    await page.getByRole('link', { name: /games/i }).click()
    await expect(page).toHaveURL('/games')
    
    // Look for add game button/link
    await expect(
      page.getByRole('link', { name: /add game/i })
        .or(page.getByRole('button', { name: /add game/i }))
        .or(page.getByText(/add new game/i))
    ).toBeVisible()
  })

  test('should require authentication to access add game page', async ({ page }) => {
    // Try to access add game page directly
    await page.goto('/games/new')
    
    // Should either redirect to sign in or show authentication required message
    await expect(
      page.getByText(/you need to be logged in/i)
        .or(page.getByText(/please sign in/i))
        .or(page.getByRole('button', { name: /sign in/i }))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should display add game form elements', async ({ page }) => {
    // Skip if authentication is required and we can't bypass it
    test.skip(true, 'Requires authentication setup - test form structure when logged in')
    
    await page.goto('/games/new')
    
    // Check for form elements
    await expect(page.getByRole('heading', { name: /add new game/i })).toBeVisible()
    await expect(page.getByLabel(/game title/i)).toBeVisible()
    await expect(page.getByLabel(/system/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /add game/i })).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    // Try to submit form without filling required fields
    await page.getByRole('button', { name: /add game/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/please fill in all required fields/i)).toBeVisible()
  })

  test('should validate game title input', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    const titleInput = page.getByLabel(/game title/i)
    
    // Test empty title
    await titleInput.fill('')
    await page.getByRole('button', { name: /add game/i }).click()
    await expect(page.getByText(/please fill in all required fields/i)).toBeVisible()
    
    // Test valid title
    await titleInput.fill('Super Mario Bros')
    await expect(titleInput).toHaveValue('Super Mario Bros')
  })

  test('should allow system selection from autocomplete', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    // Click on system autocomplete
    const systemInput = page.getByLabel(/system/i)
    await systemInput.click()
    
    // Should show system options
    await expect(page.getByText(/nintendo/i).or(page.getByText(/playstation/i))).toBeVisible()
    
    // Select a system
    await page.getByText(/nintendo/i).first().click()
    
    // Verify selection
    await expect(systemInput).toHaveValue(/nintendo/i)
  })

  test('should show image selector when game title and system are selected', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    // Fill in title and system
    await page.getByLabel(/game title/i).fill('Super Mario Bros')
    
    const systemInput = page.getByLabel(/system/i)
    await systemInput.click()
    await page.getByText(/nintendo/i).first().click()
    
    // Image selector should become visible
    await expect(page.getByText(/select image/i).or(page.locator('[data-testid="image-selector"]'))).toBeVisible()
  })

  test('should handle form submission success', async ({ page }) => {
    test.skip(true, 'Requires authentication setup and form mocking')
    
    await page.goto('/games/new')
    
    // Fill out the form
    await page.getByLabel(/game title/i).fill('Test Game')
    
    const systemInput = page.getByLabel(/system/i)
    await systemInput.click()
    await page.getByText(/nintendo/i).first().click()
    
    // Submit form
    await page.getByRole('button', { name: /add game/i }).click()
    
    // Should show success message
    await expect(page.getByText(/game added successfully/i)).toBeVisible()
    
    // Should redirect to game detail page
    await expect(page).toHaveURL(/\/games\/[a-zA-Z0-9-]+/)
  })

  test('should show different messages for admin vs regular users', async ({ page }) => {
    test.skip(true, 'Requires authentication setup with different user roles')
    
    // This test would verify that:
    // - Admin users see "Game added successfully!"
    // - Regular users see "Game submitted for approval!" message
    // - The approval notice is shown for regular users but not admins
  })

  test('should handle network errors gracefully', async ({ page }) => {
    test.skip(true, 'Requires authentication setup and network mocking')
    
    await page.goto('/games/new')
    
    // Mock network failure
    await page.route('**/api/trpc/**', route => route.abort())
    
    // Fill and submit form
    await page.getByLabel(/game title/i).fill('Test Game')
    await page.getByRole('button', { name: /add game/i }).click()
    
    // Should show error message
    await expect(page.getByText(/failed to add game/i)).toBeVisible()
  })

  test('should clear success/error messages after timeout', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    // Trigger an error
    await page.getByRole('button', { name: /add game/i }).click()
    await expect(page.getByText(/please fill in all required fields/i)).toBeVisible()
    
    // Wait for message to disappear (should clear after 3 seconds)
    await page.waitForTimeout(3500)
    await expect(page.getByText(/please fill in all required fields/i)).not.toBeVisible()
  })
})

test.describe('Add Game Form Accessibility', () => {
  test('should have proper form labels and accessibility attributes', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    // Check that form inputs have proper labels
    await expect(page.getByLabel(/game title/i)).toBeVisible()
    await expect(page.getByLabel(/system/i)).toBeVisible()
    
    // Check for required field indicators
    const titleInput = page.getByLabel(/game title/i)
    await expect(titleInput).toHaveAttribute('required')
    
    // Check for proper form structure
    await expect(page.locator('form')).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/game title/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/system/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /add game/i })).toBeFocused()
  })
})

test.describe('Add Game Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } })
  
  test('should display properly on mobile devices', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    // Form should be responsive
    await expect(page.getByRole('heading', { name: /add new game/i })).toBeVisible()
    await expect(page.getByLabel(/game title/i)).toBeVisible()
    await expect(page.getByLabel(/system/i)).toBeVisible()
    
    // Form elements should be appropriately sized for mobile
    const titleInput = page.getByLabel(/game title/i)
    const boundingBox = await titleInput.boundingBox()
    expect(boundingBox?.width).toBeGreaterThan(200) // Should be wide enough on mobile
  })

  test('should handle mobile autocomplete interactions', async ({ page }) => {
    test.skip(true, 'Requires authentication setup')
    
    await page.goto('/games/new')
    
    // Test system autocomplete on mobile
    const systemInput = page.getByLabel(/system/i)
    await systemInput.tap()
    
    // Should show options that are mobile-friendly
    await expect(page.getByText(/nintendo/i).or(page.getByText(/playstation/i))).toBeVisible()
  })
}) 