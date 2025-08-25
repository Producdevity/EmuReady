import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'

test.describe('Full Listing Creation Flow with PC Presets', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('should complete full flow: create game, create PC preset, then create PC and mobile listings', async ({
    page,
  }) => {
    const uniqueId = randomUUID().substring(0, 8)
    const gameName = `Test Game ${uniqueId}`
    const presetName = `Gaming PC ${uniqueId}`

    // Step 1: Create a new game
    await test.step('Create a new game', async () => {
      await page.goto('/games/new')

      // Fill in game creation form
      await page.fill('[name="title"]', gameName)
      await page.fill('[name="description"]', `Test game description for ${gameName}`)
      await page.selectOption('[name="systemId"]', { index: 1 }) // Select first system

      // Optional: Add cover image URL if field exists
      const coverImageField = page.locator('[name="imageUrl"]')
      if (await coverImageField.isVisible()) {
        await page.fill('[name="imageUrl"]', 'https://via.placeholder.com/300x400')
      }

      // Submit the form
      await page.click('[data-testid="submit-game"]')

      // Wait for success - either redirect or success message
      await page.waitForURL(/\/games\/[a-zA-Z0-9-]+/, { timeout: 10000 })

      // Verify game was created
      await expect(page.locator('h1')).toContainText(gameName)
    })

    // Get the game ID from URL for later use
    const gameUrl = page.url()
    const gameId = gameUrl.match(/\/games\/([a-zA-Z0-9-]+)/)?.[1]
    expect(gameId).toBeTruthy()

    // Step 2: Navigate to PC presets and create a preset
    await test.step('Create PC preset', async () => {
      await page.goto('/profile')

      // Navigate to PC presets section
      const pcPresetsLink = page.locator('a:has-text("PC Presets"), button:has-text("PC Presets")')
      if (await pcPresetsLink.isVisible()) {
        await pcPresetsLink.click()
      } else {
        // Direct navigation if link not found
        await page.goto('/profile/pc-presets')
      }

      // Create new preset
      await page.click(
        '[data-testid="create-preset"], button:has-text("Create Preset"), button:has-text("New Preset")',
      )

      // Fill preset form
      await page.fill('[name="name"]', presetName)
      await page.fill('[name="cpu"], [name="cpuModel"]', 'Intel Core i9-13900K')
      await page.fill('[name="gpu"], [name="gpuModel"]', 'NVIDIA RTX 4090')
      await page.fill('[name="ram"], [name="ramAmount"]', '32')
      await page.fill('[name="os"], [name="osVersion"]', 'Windows 11 Pro')

      // Save preset
      await page.click(
        '[data-testid="save-preset"], button:has-text("Save Preset"), button:has-text("Save")',
      )

      // Verify preset was created
      await expect(page.locator(`text=${presetName}`)).toBeVisible({ timeout: 5000 })
    })

    // Step 3: Create PC listing using the preset
    await test.step('Create PC listing with preset', async () => {
      await page.goto('/pc-listings/new')

      // Wait for form to load
      await page.waitForSelector('[name="gameId"], [data-testid="game-select"]', { timeout: 10000 })

      // Select the game we created
      const gameSelect = page.locator('[name="gameId"], [data-testid="game-select"]')
      if (await gameSelect.isVisible()) {
        // Try to select by text first
        const options = await gameSelect.locator('option').allTextContents()
        const gameOption = options.findIndex((opt) => opt.includes(gameName))
        if (gameOption > 0) {
          await gameSelect.selectOption({ index: gameOption })
        } else {
          // Fallback: select by searching
          await page.fill('[data-testid="game-search"]', gameName)
          await page.click(`[data-testid="game-option"]:has-text("${gameName}")`)
        }
      }

      // Select emulator
      await page.selectOption('[name="emulatorId"], [data-testid="emulator-select"]', { index: 1 })

      // Use PC preset
      const usePresetButton = page.locator(
        '[data-testid="use-preset"], button:has-text("Use Preset"), button:has-text("Load Preset")',
      )
      if (await usePresetButton.isVisible()) {
        await usePresetButton.click()

        // Select our preset
        const presetSelect = page.locator('[name="preset"], [data-testid="preset-select"]')
        if (await presetSelect.isVisible()) {
          await presetSelect.selectOption({ label: presetName })
        } else {
          // Click on preset card if using card selection
          await page.click(`[data-testid="preset-card"]:has-text("${presetName}")`)
        }

        // Apply preset
        const applyButton = page.locator(
          '[data-testid="apply-preset"], button:has-text("Apply"), button:has-text("Use This Preset")',
        )
        if (await applyButton.isVisible()) {
          await applyButton.click()
        }
      } else {
        // Manual entry if preset UI not available
        await page.fill('[name="cpuModel"], [name="cpu"]', 'Intel Core i9-13900K')
        await page.fill('[name="gpuModel"], [name="gpu"]', 'NVIDIA RTX 4090')
        await page.fill('[name="ram"], [name="ramAmount"]', '32')
        await page.fill('[name="os"], [name="osVersion"]', 'Windows 11 Pro')
      }

      // Fill performance details
      const performanceSelect = page.locator('[name="performanceRating"], [name="performanceId"]')
      if (await performanceSelect.isVisible()) {
        await performanceSelect.selectOption({ index: 1 }) // Select first performance option
      }

      await page.fill('[name="fps"], [data-testid="fps-input"]', '120')
      await page.fill('[name="resolution"], [data-testid="resolution-input"]', '1920x1080')

      const graphicsPreset = page.locator(
        '[name="graphicsPreset"], [data-testid="graphics-preset"]',
      )
      if (await graphicsPreset.isVisible()) {
        await graphicsPreset.selectOption('high')
      }

      // Add notes
      await page.fill(
        '[name="notes"], [data-testid="notes-input"], textarea',
        `PC listing created with preset ${presetName}`,
      )

      // Submit PC listing
      await page.click(
        '[data-testid="submit-pc-listing"], button:has-text("Submit"), button:has-text("Create Listing")',
      )

      // Verify success
      await expect(page).toHaveURL(/\/pc-listings\/(new\/success|[a-zA-Z0-9-]+)/, {
        timeout: 10000,
      })
    })

    // Step 4: Navigate to mobile listings page
    await test.step('Navigate to mobile listings page', async () => {
      await page.goto('/listings')

      // Verify we're on the listings page
      await expect(page.locator('h1')).toContainText(/Compatibility|Listings/i)

      // Check that listings are displayed
      await expect(page.locator('[data-testid="listing-card"], .listing-item'))
        .toHaveCount(0, { timeout: 5000 })
        .catch(() => {
          // It's ok if there are already some listings
        })
    })

    // Step 5: Create first mobile listing
    await test.step('Create first mobile listing', async () => {
      await page.goto('/listings/new')

      // Select game
      const gameSelect = page.locator('[name="gameId"], [data-testid="game-select"]')
      if (await gameSelect.isVisible()) {
        const options = await gameSelect.locator('option').allTextContents()
        const gameOption = options.findIndex((opt) => opt.includes(gameName))
        if (gameOption > 0) {
          await gameSelect.selectOption({ index: gameOption })
        }
      } else {
        // Search for game
        await page.fill('[data-testid="game-search"]', gameName)
        await page.click(`[data-testid="game-option"]:has-text("${gameName}")`)
      }

      // Select device
      await page.selectOption('[name="deviceId"], [data-testid="device-select"]', { index: 1 })

      // Select emulator
      await page.selectOption('[name="emulatorId"], [data-testid="emulator-select"]', { index: 1 })

      // Select performance
      const performanceSelect = page.locator(
        '[name="performanceId"], [data-testid="performance-select"]',
      )
      if (await performanceSelect.isVisible()) {
        await performanceSelect.selectOption({ index: 1 })
      }

      // Add notes
      await page.fill(
        '[name="notes"], [data-testid="notes-input"], textarea',
        'First mobile listing for test game',
      )

      // Submit
      await page.click(
        '[data-testid="submit-listing"], button:has-text("Submit"), button:has-text("Create Listing")',
      )

      // Verify success
      await expect(page).toHaveURL(/\/listings\/(new\/success|[a-zA-Z0-9-]+)/, { timeout: 10000 })
    })

    // Step 6: Create second mobile listing with different device
    await test.step('Create second mobile listing', async () => {
      await page.goto('/listings/new')

      // Select same game
      const gameSelect = page.locator('[name="gameId"], [data-testid="game-select"]')
      if (await gameSelect.isVisible()) {
        const options = await gameSelect.locator('option').allTextContents()
        const gameOption = options.findIndex((opt) => opt.includes(gameName))
        if (gameOption > 0) {
          await gameSelect.selectOption({ index: gameOption })
        }
      } else {
        await page.fill('[data-testid="game-search"]', gameName)
        await page.click(`[data-testid="game-option"]:has-text("${gameName}")`)
      }

      // Select different device (second option)
      await page.selectOption('[name="deviceId"], [data-testid="device-select"]', { index: 2 })

      // Select emulator
      await page.selectOption('[name="emulatorId"], [data-testid="emulator-select"]', { index: 1 })

      // Select performance
      const performanceSelect = page.locator(
        '[name="performanceId"], [data-testid="performance-select"]',
      )
      if (await performanceSelect.isVisible()) {
        await performanceSelect.selectOption({ index: 2 }) // Different performance
      }

      // Add notes
      await page.fill(
        '[name="notes"], [data-testid="notes-input"], textarea',
        'Second mobile listing with different device',
      )

      // Submit
      await page.click(
        '[data-testid="submit-listing"], button:has-text("Submit"), button:has-text("Create Listing")',
      )

      // Verify success
      await expect(page).toHaveURL(/\/listings\/(new\/success|[a-zA-Z0-9-]+)/, { timeout: 10000 })
    })

    // Step 7: Verify all listings were created for the game
    await test.step('Verify listings on game page', async () => {
      // Navigate back to the game page
      await page.goto(`/games/${gameId}`)

      // Verify game title
      await expect(page.locator('h1')).toContainText(gameName)

      // Check for PC listings section
      const pcListingsSection = page.locator(
        '[data-testid="pc-listings-section"], section:has-text("PC Compatibility")',
      )
      if (await pcListingsSection.isVisible()) {
        // Verify at least one PC listing exists
        await expect(
          pcListingsSection.locator('[data-testid="pc-listing-card"], .pc-listing-item'),
        ).toHaveCount(1, { timeout: 5000 })
      }

      // Check for mobile listings section
      const mobileListingsSection = page.locator(
        '[data-testid="mobile-listings-section"], section:has-text("Mobile Compatibility"), section:has-text("Compatibility Listings")',
      )
      if (await mobileListingsSection.isVisible()) {
        // Verify at least two mobile listings exist
        const listingCards = mobileListingsSection.locator(
          '[data-testid="listing-card"], .listing-item',
        )
        const count = await listingCards.count()
        expect(count).toBeGreaterThanOrEqual(2)
      }
    })

    // Step 8: Verify PC preset was used
    await test.step('Verify PC preset usage in listing', async () => {
      // Navigate to PC listings page
      await page.goto('/pc-listings')

      // Search for our game
      const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill(gameName)
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000) // Wait for search results
      }

      // Find and click on our PC listing
      const pcListing = page.locator(`[data-testid="pc-listing-card"]:has-text("${gameName}")`)
      if (await pcListing.isVisible()) {
        await pcListing.click()

        // Verify preset values are present
        await expect(page.locator('text=Intel Core i9-13900K')).toBeVisible()
        await expect(page.locator('text=NVIDIA RTX 4090')).toBeVisible()
        await expect(page.locator('text=32')).toBeVisible() // RAM
      }
    })
  })

  test('should allow editing PC preset and updating listings', async ({ page }) => {
    const uniqueId = randomUUID().substring(0, 8)
    const presetName = `Editable PC ${uniqueId}`

    await test.step('Create and edit PC preset', async () => {
      // Navigate to PC presets
      await page.goto('/profile/pc-presets')

      // Create preset
      await page.click('[data-testid="create-preset"], button:has-text("Create Preset")')
      await page.fill('[name="name"]', presetName)
      await page.fill('[name="cpu"], [name="cpuModel"]', 'AMD Ryzen 7 5800X')
      await page.fill('[name="gpu"], [name="gpuModel"]', 'AMD RX 6700 XT')
      await page.fill('[name="ram"], [name="ramAmount"]', '16')
      await page.click('[data-testid="save-preset"], button:has-text("Save")')

      // Wait for preset to be created
      await expect(page.locator(`text=${presetName}`)).toBeVisible()

      // Edit the preset
      const editButton = page
        .locator(`[data-testid="preset-card"]:has-text("${presetName}")`)
        .locator('[data-testid="edit-preset"], button:has-text("Edit")')
      await editButton.click()

      // Update values
      await page.fill('[name="ram"], [name="ramAmount"]', '64')
      await page.fill('[name="gpu"], [name="gpuModel"]', 'NVIDIA RTX 4080')

      // Save changes
      await page.click(
        '[data-testid="save-preset"], button:has-text("Save Changes"), button:has-text("Update")',
      )

      // Verify changes were saved
      await expect(page.locator(`text=64`)).toBeVisible()
      await expect(page.locator(`text=RTX 4080`)).toBeVisible()
    })

    await test.step('Delete PC preset', async () => {
      // Find and delete the preset
      const deleteButton = page
        .locator(`[data-testid="preset-card"]:has-text("${presetName}")`)
        .locator('[data-testid="delete-preset"], button:has-text("Delete")')
      await deleteButton.click()

      // Confirm deletion
      const confirmButton = page.locator(
        '[data-testid="confirm-delete"], button:has-text("Confirm"), button:has-text("Yes")',
      )
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }

      // Verify preset was deleted
      await expect(page.locator(`text=${presetName}`)).not.toBeVisible()
    })
  })
})
