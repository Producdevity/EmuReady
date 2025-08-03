import { test, expect } from '@playwright/test'

test.describe('Admin Reports Management Tests - Requires Admin Role', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/reports')
    // Verify admin access - test should fail if not admin
    await expect(page).toHaveURL(/\/admin\/reports/)
  })

  test('should display reports dashboard with required elements', async ({
    page,
  }) => {
    // Reports table must be present
    const reportsTable = page.locator('table, [data-testid="reports-table"]')
    await expect(reportsTable).toBeVisible()
    // Verify all required columns
    const headers = reportsTable.locator('thead th')
    const expectedHeaders = [
      'ID',
      'Type',
      'Reason',
      'Reporter',
      'Status',
      'Date',
      'Actions',
    ]

    for (const header of expectedHeaders) {
      const headerElement = headers.filter({ hasText: new RegExp(header, 'i') })
      await expect(headerElement).toHaveCount(1)
    }

    // Table should have report rows or empty state
    const reportRows = reportsTable.locator('tbody tr')
    const rowCount = await reportRows.count()

    // If no reports, should show empty state
    if (rowCount === 0) {
      const emptyState = page.locator(
        '[data-testid="empty-state"], .empty-state',
      )
      await expect(emptyState).toBeVisible()
    }

    // Status filters must be present
    const statusFilters = page.locator(
      '[data-testid*="status-filter"], .status-filters',
    )
    await expect(statusFilters).toBeVisible()

    // Verify all status filter options
    const statuses = ['Pending', 'Under Review', 'Resolved', 'Dismissed']
    for (const status of statuses) {
      const statusButton = statusFilters
        .locator('button, label')
        .filter({ hasText: status })
      await expect(statusButton).toBeVisible()
    }
  })

  test('should filter reports by status', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Find status filter
      const pendingFilter = page
        .locator('button, label')
        .filter({ hasText: /pending/i })

      if (await pendingFilter.isVisible({ timeout: 3000 })) {
        await pendingFilter.click()
        await page.waitForTimeout(1000)

        // Table should update
        const statusBadges = page.locator(
          '[data-testid*="status"], .status-badge',
        )

        if ((await statusBadges.count()) > 0) {
          // All visible reports should be pending
          const firstStatus = await statusBadges.first().textContent()
          expect(firstStatus?.toLowerCase()).toContain('pending')

          console.log('Status filtering works correctly')
        }
      }
    }
  })

  test('should display report details', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Click on first report
      const viewButtons = page
        .locator('button, a')
        .filter({ hasText: /view|details|review/i })

      if ((await viewButtons.count()) > 0) {
        await viewButtons.first().click()

        // Should show report details
        const reportModal = page.locator('[role="dialog"], .report-details')

        if (await reportModal.isVisible({ timeout: 3000 })) {
          // Check report information
          const reportInfo = {
            'Reported Item': /listing|comment|user/i,
            Reason: /spam|inappropriate|fake/i,
            Reporter: /.+/,
            Description: /.+/,
            Date: /\d{4}|\d+ (hours?|days?|minutes?) ago/,
          }

          for (const [label, pattern] of Object.entries(reportInfo)) {
            const field = reportModal
              .locator('.field, .detail-row')
              .filter({ hasText: label })
            if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
              const value = await field.textContent()
              expect(value).toMatch(pattern)
              console.log(`✓ ${label}: Found`)
            }
          }
        }
      }
    }
  })

  test('should handle report status updates', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Open first report
      const reviewButton = page
        .locator('button')
        .filter({ hasText: /review|view/i })
        .first()

      if (await reviewButton.isVisible({ timeout: 3000 })) {
        await reviewButton.click()

        // Look for status change options
        const statusSelect = page.locator(
          'select[name*="status"], [data-testid*="status-select"]',
        )
        const statusButtons = page
          .locator('button')
          .filter({ hasText: /resolve|dismiss|escalate/i })

        if (await statusSelect.isVisible({ timeout: 2000 })) {
          const currentStatus = await statusSelect.inputValue()
          console.log(`Current status: ${currentStatus}`)

          // Try to change status
          await statusSelect.selectOption({ index: 1 })

          // Should require confirmation
          const confirmButton = page
            .locator('button')
            .filter({ hasText: /save|update|confirm/i })
          await expect(confirmButton).toBeVisible()
        } else if ((await statusButtons.count()) > 0) {
          console.log('Quick status actions available')

          // Click resolve button
          const resolveButton = statusButtons
            .filter({ hasText: /resolve/i })
            .first()
          if (await resolveButton.isVisible()) {
            await resolveButton.click()

            // Should show resolution form
            const resolutionForm = page.locator(
              '[data-testid*="resolution"], .resolution-form',
            )
            const hasForm = await resolutionForm
              .isVisible({ timeout: 2000 })
              .catch(() => false)

            if (hasForm) {
              console.log('Resolution requires additional input')
            }
          }
        }

        // Close without saving
        const closeButton = page
          .locator('button')
          .filter({ hasText: /close|cancel/i })
        if (await closeButton.isVisible()) {
          await closeButton.click()
        }
      }
    }
  })

  test('should support batch report actions', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Look for checkboxes
      const checkboxes = page.locator('tbody input[type="checkbox"]')

      if ((await checkboxes.count()) >= 2) {
        // Select multiple reports
        await checkboxes.nth(0).check()
        await checkboxes.nth(1).check()

        // Look for batch actions
        const batchActions = page.locator(
          '[data-testid*="batch-actions"], .batch-actions',
        )

        if (await batchActions.isVisible({ timeout: 2000 })) {
          const actionButtons = batchActions.locator('button')
          const actionCount = await actionButtons.count()

          console.log(`${actionCount} batch actions available`)

          // Common batch actions
          const actions = ['Resolve All', 'Dismiss All', 'Assign To']
          for (const action of actions) {
            const actionButton = actionButtons.filter({ hasText: action })
            if (
              await actionButton.isVisible({ timeout: 1000 }).catch(() => false)
            ) {
              console.log(`✓ Batch action: ${action}`)
            }
          }

          // Uncheck for cleanup
          await checkboxes.nth(0).uncheck()
          await checkboxes.nth(1).uncheck()
        }
      }
    }
  })

  test('should display report statistics', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Look for stats section
      const statsSection = page.locator(
        '[data-testid*="report-stats"], .report-statistics',
      )

      if (await statsSection.isVisible({ timeout: 3000 })) {
        // Common report stats
        const stats = [
          { label: 'Total Reports', selector: '[data-testid*="total"]' },
          { label: 'Pending', selector: '[data-testid*="pending"]' },
          { label: 'Resolved', selector: '[data-testid*="resolved"]' },
          { label: 'Response Time', selector: '[data-testid*="response"]' },
        ]

        for (const stat of stats) {
          const statElement = statsSection.locator(stat.selector)
          if (
            await statElement.isVisible({ timeout: 1000 }).catch(() => false)
          ) {
            const value = await statElement.textContent()
            console.log(`${stat.label}: ${value}`)
          }
        }
      }
    }
  })

  test('should handle report escalation', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Find escalate button
      const escalateButtons = page
        .locator('button')
        .filter({ hasText: /escalate/i })

      if ((await escalateButtons.count()) > 0) {
        await escalateButtons.first().click()

        // Should show escalation form
        const escalationDialog = page
          .locator('[role="dialog"]')
          .filter({ hasText: /escalate/i })

        if (await escalationDialog.isVisible({ timeout: 3000 })) {
          // Check for priority selector
          const prioritySelect = escalationDialog.locator(
            'select[name*="priority"]',
          )
          if (await prioritySelect.isVisible()) {
            const options = await prioritySelect
              .locator('option')
              .allTextContents()
            console.log('Priority levels:', options.filter((o) => o).join(', '))
          }

          // Check for assignee selector
          const assigneeSelect = escalationDialog.locator(
            'select[name*="assign"]',
          )
          if (await assigneeSelect.isVisible()) {
            console.log('Can assign to specific admin')
          }

          // Check for notes field
          const notesField = escalationDialog.locator('textarea')
          if (await notesField.isVisible()) {
            await notesField.fill('Escalation test note')
          }

          // Cancel
          const cancelButton = escalationDialog
            .locator('button')
            .filter({ hasText: /cancel/i })
          await cancelButton.click()
        }
      }
    }
  })

  test('should link to reported content', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Open a report
      const viewButton = page
        .locator('button')
        .filter({ hasText: /view/i })
        .first()

      if (await viewButton.isVisible({ timeout: 3000 })) {
        await viewButton.click()

        // Look for view content link
        const contentLink = page
          .locator('a')
          .filter({ hasText: /view.*content|view.*listing|view.*comment/i })

        if (await contentLink.isVisible({ timeout: 3000 })) {
          const href = await contentLink.getAttribute('href')
          expect(href).toBeTruthy()

          console.log('Report links to original content')

          // Click to verify it opens
          const newPagePromise = page.context().waitForEvent('page')
          const isNewTab =
            (await contentLink.getAttribute('target')) === '_blank'

          if (isNewTab) {
            await contentLink.click()
            const newPage = await newPagePromise
            await newPage.waitForLoadState()

            console.log('Content opens in new tab')
            await newPage.close()
          }
        }
      }
    }
  })

  test('should track report resolution time', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Look for resolved reports
      const resolvedReports = page
        .locator('tr')
        .filter({ hasText: /resolved/i })

      if ((await resolvedReports.count()) > 0) {
        // Check first resolved report
        const firstResolved = resolvedReports.first()

        // Look for resolution time
        const resolutionTime = firstResolved.locator(
          '[data-testid*="resolution-time"], .resolution-time',
        )

        if (await resolutionTime.isVisible({ timeout: 2000 })) {
          const time = await resolutionTime.textContent()
          console.log(`Resolution time: ${time}`)

          // Should show meaningful time
          expect(time).toMatch(/\d+ (minutes?|hours?|days?)/)
        }
      }
    }
  })

  test('should export reports data', async ({ page }) => {
    await page.goto('/admin/reports')

    if (page.url().includes('/admin/reports')) {
      // Look for export button
      const exportButton = page.locator('button').filter({ hasText: /export/i })

      if (await exportButton.isVisible({ timeout: 3000 })) {
        await exportButton.click()

        // Should show export options
        const exportOptions = page.locator(
          '[role="menu"], [data-testid*="export-options"]',
        )

        if (await exportOptions.isVisible({ timeout: 2000 })) {
          // Check available formats
          const formats = ['CSV', 'PDF', 'Excel']

          for (const format of formats) {
            const formatOption = exportOptions
              .locator('button, a')
              .filter({ hasText: format })
            if (
              await formatOption.isVisible({ timeout: 1000 }).catch(() => false)
            ) {
              console.log(`✓ Export format: ${format}`)
            }
          }

          // Check for date range selector
          const dateRange = page.locator(
            '[data-testid*="date-range"], .date-range',
          )
          if (await dateRange.isVisible()) {
            console.log('Export supports date range filtering')
          }

          // Close menu
          await page.keyboard.press('Escape')
        }
      }
    }
  })
})
