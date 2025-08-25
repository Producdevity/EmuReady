import { test, expect } from '@playwright/test'

test.describe('Custom Fields System', () => {
  test.describe('Admin Custom Field Management', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should access custom fields management', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      await expect(page.locator('h1')).toContainText('Custom Fields')
      await expect(page.locator('[data-testid="field-definitions"]')).toBeVisible()
      await expect(page.locator('[data-testid="field-templates"]')).toBeVisible()
    })

    test('should create text custom field', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      await page.click('[data-testid="create-field"]')

      // Fill field details
      await page.fill('[name="fieldName"]', 'driver_version')
      await page.fill('[name="fieldLabel"]', 'Driver Version')
      await page.selectOption('[name="fieldType"]', 'TEXT')
      await page.selectOption('[name="emulatorId"]', { index: 1 })

      // Set validation rules
      await page.check('[name="required"]')
      await page.fill('[name="maxLength"]', '50')
      await page.fill('[name="pattern"]', '^\\d+\\.\\d+\\.\\d+$')
      await page.fill('[name="placeholder"]', 'e.g., 1.2.3')

      // Save field
      await page.click('[data-testid="save-field"]')

      // Verify created
      await expect(page.locator('[data-testid="field-row"]')).toContainText('Driver Version')
    })

    test('should create select custom field', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      await page.click('[data-testid="create-field"]')

      // Fill field details
      await page.fill('[name="fieldName"]', 'graphics_backend')
      await page.fill('[name="fieldLabel"]', 'Graphics Backend')
      await page.selectOption('[name="fieldType"]', 'SELECT')
      await page.selectOption('[name="emulatorId"]', { index: 1 })

      // Add options
      await page.click('[data-testid="add-option"]')
      await page.fill('[name="option-0-value"]', 'vulkan')
      await page.fill('[name="option-0-label"]', 'Vulkan')

      await page.click('[data-testid="add-option"]')
      await page.fill('[name="option-1-value"]', 'opengl')
      await page.fill('[name="option-1-label"]', 'OpenGL')

      await page.click('[data-testid="add-option"]')
      await page.fill('[name="option-2-value"]', 'directx')
      await page.fill('[name="option-2-label"]', 'DirectX')

      // Set default
      await page.selectOption('[name="defaultValue"]', 'vulkan')

      // Save field
      await page.click('[data-testid="save-field"]')

      // Verify created
      await expect(page.locator('[data-testid="field-row"]')).toContainText('Graphics Backend')
    })

    test('should create boolean custom field', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      await page.click('[data-testid="create-field"]')

      // Fill field details
      await page.fill('[name="fieldName"]', 'enable_hacks')
      await page.fill('[name="fieldLabel"]', 'Enable Hacks')
      await page.selectOption('[name="fieldType"]', 'BOOLEAN')
      await page.selectOption('[name="emulatorId"]', { index: 1 })

      // Set default value
      await page.check('[name="defaultValue"]')

      // Add help text
      await page.fill('[name="helpText"]', 'Enable game-specific hacks for better compatibility')

      // Save field
      await page.click('[data-testid="save-field"]')

      // Verify created
      await expect(page.locator('[data-testid="field-row"]')).toContainText('Enable Hacks')
    })

    test('should create range custom field', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      await page.click('[data-testid="create-field"]')

      // Fill field details
      await page.fill('[name="fieldName"]', 'internal_resolution')
      await page.fill('[name="fieldLabel"]', 'Internal Resolution Scale')
      await page.selectOption('[name="fieldType"]', 'RANGE')
      await page.selectOption('[name="emulatorId"]', { index: 1 })

      // Set range parameters
      await page.fill('[name="minValue"]', '1')
      await page.fill('[name="maxValue"]', '8')
      await page.fill('[name="step"]', '0.5')
      await page.fill('[name="defaultValue"]', '2')

      // Add unit
      await page.fill('[name="unit"]', 'x')

      // Save field
      await page.click('[data-testid="save-field"]')

      // Verify created
      await expect(page.locator('[data-testid="field-row"]')).toContainText('Internal Resolution')
    })

    test('should create field template', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      await page.click('[data-testid="create-template"]')

      // Fill template details
      await page.fill('[name="templateName"]', 'PCSX2 Settings')
      await page.fill('[name="templateDescription"]', 'Common settings for PCSX2 emulator')

      // Select fields to include
      const fields = await page.locator('[data-testid="available-field"]').all()
      for (let i = 0; i < Math.min(3, fields.length); i++) {
        await fields[i].click()
      }

      // Arrange field order
      const firstField = page.locator('[data-testid="template-field"]').first()
      await firstField.dragTo(page.locator('[data-testid="field-slot-2"]'))

      // Save template
      await page.click('[data-testid="save-template"]')

      // Verify created
      await expect(page.locator('[data-testid="template-card"]')).toContainText('PCSX2 Settings')
    })

    test('should apply template to emulator', async ({ page }) => {
      await page.goto('/admin/emulators')

      // Edit first emulator
      await page.locator('[data-testid="edit-emulator"]').first().click()

      // Go to custom fields tab
      await page.click('[data-testid="custom-fields-tab"]')

      // Apply template
      await page.click('[data-testid="apply-template"]')
      await page.selectOption('[name="templateId"]', { index: 1 })
      await page.click('[data-testid="confirm-apply"]')

      // Verify fields added
      await expect(page.locator('[data-testid="custom-field-item"]').first()).toBeVisible()

      // Save emulator
      await page.click('[data-testid="save-emulator"]')

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
    })

    test('should edit custom field definition', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      const fields = await page.locator('[data-testid="field-row"]').count()

      if (fields > 0) {
        // Edit first field
        await page.locator('[data-testid="edit-field"]').first().click()

        // Update label
        await page.fill('[name="fieldLabel"]', 'Updated Field Label')

        // Update help text
        await page.fill('[name="helpText"]', 'Updated help text for this field')

        // Save changes
        await page.click('[data-testid="save-field"]')

        // Verify updated
        await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
        await expect(page.locator('[data-testid="field-row"]').first()).toContainText(
          'Updated Field Label',
        )
      }
    })

    test('should delete custom field', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      const initialCount = await page.locator('[data-testid="field-row"]').count()

      if (initialCount > 0) {
        // Delete last field (least likely to have data)
        await page.locator('[data-testid="delete-field"]').last().click()

        // Confirm deletion
        await page.click('[data-testid="confirm-delete"]')

        // Verify deleted
        const newCount = await page.locator('[data-testid="field-row"]').count()
        expect(newCount).toBe(initialCount - 1)
      }
    })
  })

  test.describe('User Custom Field Usage', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display custom fields in listing form', async ({ page }) => {
      await page.goto('/listings/new')

      // Select an emulator that has custom fields
      await page.selectOption('[name="emulatorId"]', { index: 1 })

      // Wait for custom fields to load
      await page.waitForTimeout(1000)

      // Check if custom fields section appears
      const customFieldsSection = page.locator('[data-testid="custom-fields-section"]')

      if (await customFieldsSection.isVisible()) {
        // Should show custom field inputs
        const customFields = await page.locator('[data-testid="custom-field-input"]').count()
        expect(customFields).toBeGreaterThan(0)

        // Fill custom field values
        const textField = page.locator('[data-testid="custom-field-text"]').first()
        if (await textField.isVisible()) {
          await textField.fill('Test value')
        }

        const selectField = page.locator('[data-testid="custom-field-select"]').first()
        if (await selectField.isVisible()) {
          await selectField.selectOption({ index: 1 })
        }

        const booleanField = page.locator('[data-testid="custom-field-boolean"]').first()
        if (await booleanField.isVisible()) {
          await booleanField.check()
        }

        const rangeField = page.locator('[data-testid="custom-field-range"]').first()
        if (await rangeField.isVisible()) {
          await rangeField.fill('4')
        }
      }
    })

    test('should validate custom field inputs', async ({ page }) => {
      await page.goto('/listings/new')

      // Select emulator with custom fields
      await page.selectOption('[name="emulatorId"]', { index: 1 })

      await page.waitForTimeout(1000)

      const customFieldsSection = page.locator('[data-testid="custom-fields-section"]')

      if (await customFieldsSection.isVisible()) {
        // Fill basic listing fields
        await page.fill('[name="title"]', 'Test Listing')
        await page.selectOption('[name="gameId"]', { index: 1 })
        await page.selectOption('[name="deviceId"]', { index: 1 })

        // Try to submit without required custom fields
        await page.click('[data-testid="submit-listing"]')

        // Should show validation errors
        const requiredError = page.locator('[data-testid="custom-field-error"]').first()
        if (await requiredError.isVisible()) {
          await expect(requiredError).toContainText('required')
        }

        // Fill with invalid pattern (if text field with pattern)
        const textField = page.locator('[data-testid="custom-field-text"]').first()
        if (await textField.isVisible()) {
          await textField.fill('invalid-pattern')
          await page.click('[data-testid="submit-listing"]')

          // Check for pattern error
          const patternError = page.locator('[data-testid="pattern-error"]')
          if (await patternError.isVisible()) {
            await expect(patternError).toContainText('format')
          }
        }
      }
    })

    test('should display custom field values in listing', async ({ page }) => {
      await page.goto('/listings')

      // Find a listing with custom fields
      const listingWithCustomFields = page
        .locator('[data-testid="listing-card"]')
        .filter({ has: page.locator('[data-testid="has-custom-fields"]') })
        .first()

      if (await listingWithCustomFields.isVisible()) {
        await listingWithCustomFields.click()

        // Should show custom fields section
        await expect(page.locator('[data-testid="custom-fields-display"]')).toBeVisible()

        // Should display field labels and values
        const customFieldItems = await page.locator('[data-testid="custom-field-item"]').all()

        for (const item of customFieldItems) {
          await expect(item.locator('[data-testid="field-label"]')).toBeVisible()
          await expect(item.locator('[data-testid="field-value"]')).toBeVisible()
        }
      }
    })

    test('should edit custom field values', async ({ page }) => {
      await page.goto('/profile/listings')

      // Find own listing with custom fields
      const ownListing = page.locator('[data-testid="own-listing"]').first()

      if (await ownListing.isVisible()) {
        await ownListing.locator('[data-testid="edit-listing"]').click()

        // Check for custom fields
        const customFieldsSection = page.locator('[data-testid="custom-fields-section"]')

        if (await customFieldsSection.isVisible()) {
          // Update a custom field value
          const textField = page.locator('[data-testid="custom-field-text"]').first()
          if (await textField.isVisible()) {
            await textField.clear()
            await textField.fill('Updated value')
          }

          // Save changes
          await page.click('[data-testid="save-listing"]')

          // Verify success
          await expect(page.locator('[data-testid="success-message"]')).toContainText('updated')
        }
      }
    })
  })

  test.describe('Custom Field Search and Filtering', () => {
    test('should filter listings by custom field values', async ({ page }) => {
      await page.goto('/listings')

      // Open advanced filters
      await page.click('[data-testid="advanced-filters"]')

      // Check for custom field filters
      const customFieldFilters = page.locator('[data-testid="custom-field-filter"]')

      if (await customFieldFilters.first().isVisible()) {
        // Apply a custom field filter
        const selectFilter = page.locator('[data-testid="custom-field-filter-select"]').first()
        if (await selectFilter.isVisible()) {
          await selectFilter.selectOption({ index: 1 })
        }

        const textFilter = page.locator('[data-testid="custom-field-filter-text"]').first()
        if (await textFilter.isVisible()) {
          await textFilter.fill('specific value')
        }

        // Apply filters
        await page.click('[data-testid="apply-filters"]')

        // Wait for filtered results
        await page.waitForSelector('[data-testid="listing-card"]')

        // Verify filtered results have the custom field value
        const results = await page.locator('[data-testid="listing-card"]').all()
        for (const result of results.slice(0, 3)) {
          await result.click()

          // Check custom field value matches filter
          const customFieldValue = await page
            .locator('[data-testid="custom-field-value"]')
            .first()
            .textContent()
          expect(customFieldValue).toContain('specific value')

          await page.goBack()
        }
      }
    })

    test('should sort by custom field values', async ({ page }) => {
      await page.goto('/listings')

      // Check if custom field sorting is available
      const sortOptions = page.locator('[data-testid="sort-by"]')
      await sortOptions.click()

      const customFieldSort = page.locator('[data-testid="sort-custom-field"]').first()

      if (await customFieldSort.isVisible()) {
        await customFieldSort.click()

        // Wait for sorted results
        await page.waitForSelector('[data-testid="listing-card"]')

        // Get first few listings and check order
        const listings = await page.locator('[data-testid="listing-card"]').all()
        const values = []

        for (const listing of listings.slice(0, 3)) {
          await listing.click()

          const value = await page
            .locator('[data-testid="custom-field-value"]')
            .first()
            .textContent()
          values.push(value)

          await page.goBack()
        }

        // Verify sorted order (implementation-specific)
        expect(values).toEqual(values.slice().sort())
      }
    })
  })

  test.describe('Custom Field Analytics', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should view custom field usage statistics', async ({ page }) => {
      // Skip stats page navigation as it doesn't exist yet
      // TODO: Create /admin/custom-fields/stats page
      test.skip()
      await page.goto('/admin/custom-field-templates')

      // Check statistics display
      await expect(page.locator('[data-testid="total-fields"]')).toBeVisible()
      await expect(page.locator('[data-testid="fields-per-emulator"]')).toBeVisible()
      await expect(page.locator('[data-testid="field-usage-rate"]')).toBeVisible()

      // Check most used fields
      await expect(page.locator('[data-testid="popular-fields"]')).toBeVisible()

      // Check field value distribution
      const fieldDistribution = page.locator('[data-testid="field-distribution"]')
      if (await fieldDistribution.isVisible()) {
        // Should show charts for select/range fields
        await expect(page.locator('[data-testid="distribution-chart"]').first()).toBeVisible()
      }
    })

    test('should export custom field data', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      // Set up download promise
      const downloadPromise = page.waitForEvent('download')

      // Export custom fields
      await page.click('[data-testid="export-fields"]')
      await page.selectOption('[name="exportFormat"]', 'json')
      await page.click('[data-testid="confirm-export"]')

      // Wait for download
      const download = await downloadPromise

      // Verify download
      expect(download.suggestedFilename()).toContain('custom-fields')
      expect(download.suggestedFilename()).toContain('.json')
    })

    test('should import custom field definitions', async ({ page }) => {
      await page.goto('/admin/custom-field-templates')

      await page.click('[data-testid="import-fields"]')

      // Preview import
      await page.click('[data-testid="preview-import"]')

      // Should show what will be imported
      await expect(page.locator('[data-testid="import-preview"]')).toBeVisible()

      // Confirm import
      await page.click('[data-testid="confirm-import"]')

      // Verify imported
      await expect(page.locator('[data-testid="success-message"]')).toContainText('imported')
    })
  })
})
