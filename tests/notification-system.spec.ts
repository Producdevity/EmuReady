import { test, expect } from '@playwright/test'

test.describe('Notification System', () => {
  test.describe('Notification Display', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should display notification bell with count', async ({ page }) => {
      await page.goto('/')

      // Check notification bell in header
      await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible()

      // Check for unread count badge
      const unreadBadge = page.locator('[data-testid="unread-count"]')
      if (await unreadBadge.isVisible()) {
        const count = await unreadBadge.textContent()
        expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0)
      }
    })

    test('should open notification dropdown', async ({ page }) => {
      await page.goto('/')

      // Click notification bell
      await page.click('[data-testid="notification-bell"]')

      // Dropdown should appear
      await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible()

      // Should show recent notifications
      const notifications = await page.locator('[data-testid="notification-item"]').count()
      expect(notifications).toBeGreaterThanOrEqual(0)

      // Should have "View all" link
      await expect(page.locator('[data-testid="view-all-notifications"]')).toBeVisible()
    })

    test('should navigate to notifications page', async ({ page }) => {
      await page.goto('/')

      // Click notification bell and then "View all"
      await page.click('[data-testid="notification-bell"]')
      await page.click('[data-testid="view-all-notifications"]')

      // Should navigate to notifications page
      await expect(page).toHaveURL('/notifications')
      await expect(page.locator('h1')).toContainText('Notifications')

      // Should show notification list
      await expect(page.locator('[data-testid="notifications-list"]')).toBeVisible()
    })

    test('should display different notification types', async ({ page }) => {
      await page.goto('/notifications')

      // Check for different notification types
      const notificationTypes = [
        'comment-reply',
        'listing-approved',
        'listing-rejected',
        'vote-received',
        'badge-earned',
        'trust-change',
        'system-announcement',
      ]

      for (const type of notificationTypes) {
        const notification = page.locator(`[data-testid="notification-${type}"]`).first()
        if (await notification.isVisible()) {
          // Each type should have appropriate icon
          await expect(notification.locator('[data-testid="notification-icon"]')).toBeVisible()

          // Should have timestamp
          await expect(notification.locator('[data-testid="notification-time"]')).toBeVisible()

          // Should have message
          await expect(notification.locator('[data-testid="notification-message"]')).toBeVisible()
        }
      }
    })
  })

  test.describe('Notification Interactions', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should mark notification as read', async ({ page }) => {
      await page.goto('/notifications')

      // Find unread notification
      const unreadNotification = page
        .locator('[data-testid="notification-item"][data-read="false"]')
        .first()

      if (await unreadNotification.isVisible()) {
        // Click to mark as read
        await unreadNotification.click()

        // Should be marked as read
        await expect(unreadNotification).toHaveAttribute('data-read', 'true')

        // Unread count should decrease
        const unreadCount = await page.locator('[data-testid="unread-count"]').textContent()
        const initialCount = parseInt(unreadCount || '0')

        await page.reload()

        const newUnreadCount = await page.locator('[data-testid="unread-count"]').textContent()
        const newCount = parseInt(newUnreadCount || '0')

        expect(newCount).toBeLessThan(initialCount)
      }
    })

    test('should mark all notifications as read', async ({ page }) => {
      await page.goto('/notifications')

      const unreadCount = await page
        .locator('[data-testid="notification-item"][data-read="false"]')
        .count()

      if (unreadCount > 0) {
        // Click mark all as read
        await page.click('[data-testid="mark-all-read"]')

        // Confirm action
        await page.click('[data-testid="confirm-mark-all"]')

        // All should be marked as read
        await page.waitForTimeout(1000)
        const newUnreadCount = await page
          .locator('[data-testid="notification-item"][data-read="false"]')
          .count()
        expect(newUnreadCount).toBe(0)

        // Badge should disappear
        await expect(page.locator('[data-testid="unread-count"]')).not.toBeVisible()
      }
    })

    test('should delete notification', async ({ page }) => {
      await page.goto('/notifications')

      const initialCount = await page.locator('[data-testid="notification-item"]').count()

      if (initialCount > 0) {
        // Hover over first notification
        const firstNotification = page.locator('[data-testid="notification-item"]').first()
        await firstNotification.hover()

        // Click delete button
        await firstNotification.locator('[data-testid="delete-notification"]').click()

        // Confirm deletion
        await page.click('[data-testid="confirm-delete"]')

        // Notification should be removed
        const newCount = await page.locator('[data-testid="notification-item"]').count()
        expect(newCount).toBe(initialCount - 1)
      }
    })

    test('should navigate to related content from notification', async ({ page }) => {
      await page.goto('/notifications')

      // Find a listing notification
      const listingNotification = page.locator('[data-testid="notification-listing"]').first()

      if (await listingNotification.isVisible()) {
        // Click on notification link
        await listingNotification.locator('[data-testid="notification-link"]').click()

        // Should navigate to the listing
        await expect(page).toHaveURL(/\/listings\/\d+/)
      }

      // Go back to notifications
      await page.goto('/notifications')

      // Find a comment notification
      const commentNotification = page.locator('[data-testid="notification-comment"]').first()

      if (await commentNotification.isVisible()) {
        await commentNotification.locator('[data-testid="notification-link"]').click()

        // Should navigate to the comment
        await expect(page).toHaveURL(/\/listings\/\d+#comment-\d+/)
      }
    })
  })

  test.describe('Notification Preferences', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should access notification preferences', async ({ page }) => {
      await page.goto('/settings/notifications')

      await expect(page.locator('h1')).toContainText('Notification Preferences')

      // Should show different notification categories
      await expect(page.locator('[data-testid="notifications-listings"]')).toBeVisible()
      await expect(page.locator('[data-testid="notifications-comments"]')).toBeVisible()
      await expect(page.locator('[data-testid="notifications-votes"]')).toBeVisible()
      await expect(page.locator('[data-testid="notifications-badges"]')).toBeVisible()
      await expect(page.locator('[data-testid="notifications-system"]')).toBeVisible()
    })

    test('should toggle notification preferences', async ({ page }) => {
      await page.goto('/settings/notifications')

      // Toggle comment notifications
      const commentToggle = page.locator('[data-testid="toggle-comment-notifications"]')
      const initialState = await commentToggle.isChecked()

      await commentToggle.click()

      // Save preferences
      await page.click('[data-testid="save-preferences"]')

      // Verify saved
      await expect(page.locator('[data-testid="success-message"]')).toContainText('saved')

      // Reload and verify persisted
      await page.reload()
      const newState = await commentToggle.isChecked()
      expect(newState).toBe(!initialState)
    })

    test('should set email notification preferences', async ({ page }) => {
      await page.goto('/settings/notifications')

      // Click email preferences tab
      await page.click('[data-testid="email-preferences-tab"]')

      // Configure email frequency
      await page.selectOption('[name="emailFrequency"]', 'daily')

      // Toggle specific email notifications
      await page.check('[name="emailCommentReplies"]')
      await page.uncheck('[name="emailVotes"]')

      // Save email preferences
      await page.click('[data-testid="save-email-preferences"]')

      // Verify saved
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Email preferences updated',
      )
    })

    test('should set quiet hours', async ({ page }) => {
      await page.goto('/settings/notifications')

      // Click quiet hours tab
      await page.click('[data-testid="quiet-hours-tab"]')

      // Enable quiet hours
      await page.check('[name="enableQuietHours"]')

      // Set quiet hours time
      await page.fill('[name="quietHoursStart"]', '22:00')
      await page.fill('[name="quietHoursEnd"]', '08:00')

      // Save quiet hours
      await page.click('[data-testid="save-quiet-hours"]')

      // Verify saved
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Quiet hours updated',
      )
    })

    test('should configure listing-specific notifications', async ({ page }) => {
      await page.goto('/listings')

      // Click on a listing
      await page.locator('[data-testid="listing-card"]').first().click()

      // Click notification settings for this listing
      await page.click('[data-testid="listing-notifications"]')

      // Configure notifications
      await page.check('[name="notifyNewComments"]')
      await page.check('[name="notifyStatusChanges"]')
      await page.uncheck('[name="notifyVotes"]')

      // Save listing preferences
      await page.click('[data-testid="save-listing-preferences"]')

      // Verify saved
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Notification preferences updated',
      )
    })
  })

  test.describe('Real-time Notifications', () => {
    test('should receive real-time notifications', async ({ browser }) => {
      // User 1 context
      const context1 = await browser.newContext({ storageState: 'tests/.auth/user.json' })
      const page1 = await context1.newPage()

      // User 2 context
      const context2 = await browser.newContext({ storageState: 'tests/.auth/user2.json' })
      const page2 = await context2.newPage()

      // User 1 creates a listing
      await page1.goto('/listings/new')
      await page1.fill('[name="title"]', 'Test listing for notifications')
      await page1.selectOption('[name="gameId"]', { index: 1 })
      await page1.selectOption('[name="deviceId"]', { index: 1 })
      await page1.selectOption('[name="emulatorId"]', { index: 1 })
      await page1.click('[data-testid="submit-listing"]')

      // Get listing URL
      const listingUrl = page1.url()

      // User 2 comments on the listing
      await page2.goto(listingUrl)
      await page2.fill('[data-testid="comment-input"]', 'Great listing!')
      await page2.click('[data-testid="submit-comment"]')

      // User 1 should receive notification
      await page1.goto('/')

      // Check for notification badge update
      await page1.waitForSelector('[data-testid="unread-count"]', { timeout: 10000 })
      const unreadCount = await page1.locator('[data-testid="unread-count"]').textContent()
      expect(parseInt(unreadCount || '0')).toBeGreaterThan(0)

      // Check notification dropdown
      await page1.click('[data-testid="notification-bell"]')
      await expect(page1.locator('[data-testid="notification-item"]').first()).toContainText(
        'commented',
      )

      await context1.close()
      await context2.close()
    })

    test('should show toast notifications', async ({ page }) => {
      await page.goto('/')

      // Trigger an action that generates a notification
      await page.goto('/listings')
      await page.locator('[data-testid="listing-card"]').first().click()

      // Vote on listing
      await page.click('[data-testid="vote-helpful"]')

      // Should show toast notification
      await expect(page.locator('[data-testid="toast-notification"]')).toBeVisible({
        timeout: 5000,
      })
      await expect(page.locator('[data-testid="toast-notification"]')).toContainText('voted')

      // Toast should auto-dismiss
      await page.waitForTimeout(5000)
      await expect(page.locator('[data-testid="toast-notification"]')).not.toBeVisible()
    })
  })

  test.describe('Admin System Notifications', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should create system-wide notification', async ({ page }) => {
      await page.goto('/admin/notifications')

      await page.click('[data-testid="create-system-notification"]')

      // Fill notification details
      await page.fill('[name="title"]', 'System Maintenance Notice')
      await page.fill('[name="message"]', 'The system will be under maintenance on Sunday')
      await page.selectOption('[name="priority"]', 'high')
      await page.selectOption('[name="type"]', 'announcement')

      // Set target audience
      await page.selectOption('[name="audience"]', 'all')

      // Schedule or send immediately
      await page.click('[name="sendImmediately"]')

      // Send notification
      await page.click('[data-testid="send-notification"]')

      // Confirm
      await page.click('[data-testid="confirm-send"]')

      // Verify sent
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Notification sent',
      )
    })

    test('should schedule notification', async ({ page }) => {
      await page.goto('/admin/notifications')

      await page.click('[data-testid="create-system-notification"]')

      // Fill notification details
      await page.fill('[name="title"]', 'Scheduled Announcement')
      await page.fill('[name="message"]', 'This is a scheduled notification')

      // Schedule for future
      await page.uncheck('[name="sendImmediately"]')

      // Set schedule date/time
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('[name="scheduleDate"]', tomorrow.toISOString().split('T')[0])
      await page.fill('[name="scheduleTime"]', '10:00')

      // Save scheduled notification
      await page.click('[data-testid="schedule-notification"]')

      // Verify scheduled
      await expect(page.locator('[data-testid="success-message"]')).toContainText('scheduled')

      // Check scheduled notifications list
      await page.click('[data-testid="scheduled-tab"]')
      await expect(page.locator('[data-testid="scheduled-notification"]')).toContainText(
        'Scheduled Announcement',
      )
    })

    test('should view notification analytics', async ({ page }) => {
      await page.goto('/admin/notifications/analytics')

      // Verify analytics display
      await expect(page.locator('[data-testid="total-sent"]')).toBeVisible()
      await expect(page.locator('[data-testid="read-rate"]')).toBeVisible()
      await expect(page.locator('[data-testid="click-rate"]')).toBeVisible()

      // Check charts
      await expect(page.locator('[data-testid="notifications-timeline"]')).toBeVisible()
      await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible()

      // Check top notifications
      await expect(page.locator('[data-testid="top-notifications"]')).toBeVisible()
    })

    test('should manage notification templates', async ({ page }) => {
      await page.goto('/admin/notifications/templates')

      // Create new template
      await page.click('[data-testid="create-template"]')

      await page.fill('[name="templateName"]', 'Welcome Message')
      await page.selectOption('[name="templateType"]', 'user_welcome')
      await page.fill('[name="templateSubject"]', 'Welcome to {{siteName}}!')
      await page.fill('[name="templateBody"]', 'Hi {{userName}}, welcome to our community!')

      // Add variables
      await page.click('[data-testid="add-variable"]')
      await page.fill('[name="variableName"]', 'siteName')
      await page.fill('[name="variableDefault"]', 'EmuReady')

      // Save template
      await page.click('[data-testid="save-template"]')

      // Verify saved
      await expect(page.locator('[data-testid="template-item"]')).toContainText('Welcome Message')
    })

    test('should view notification queue status', async ({ page }) => {
      await page.goto('/admin/notifications/queue')

      // Check queue status
      await expect(page.locator('[data-testid="queue-size"]')).toBeVisible()
      await expect(page.locator('[data-testid="processing-rate"]')).toBeVisible()
      await expect(page.locator('[data-testid="failed-notifications"]')).toBeVisible()

      // Check pending notifications
      const pendingTab = page.locator('[data-testid="pending-tab"]')
      if (await pendingTab.isVisible()) {
        await pendingTab.click()

        const pendingNotifications = await page
          .locator('[data-testid="pending-notification"]')
          .count()
        expect(pendingNotifications).toBeGreaterThanOrEqual(0)
      }

      // Check failed notifications
      const failedTab = page.locator('[data-testid="failed-tab"]')
      if (await failedTab.isVisible()) {
        await failedTab.click()

        const failedNotifications = await page
          .locator('[data-testid="failed-notification"]')
          .count()

        if (failedNotifications > 0) {
          // Retry failed notification
          await page.locator('[data-testid="retry-notification"]').first().click()
          await expect(page.locator('[data-testid="success-message"]')).toContainText('retrying')
        }
      }
    })
  })

  test.describe('Notification Filtering and Search', () => {
    test.use({ storageState: 'tests/.auth/user.json' })

    test('should filter notifications by type', async ({ page }) => {
      await page.goto('/notifications')

      // Filter by comments
      await page.click('[data-testid="filter-comments"]')

      // All visible notifications should be comment type
      const notifications = await page.locator('[data-testid="notification-item"]:visible').all()
      for (const notification of notifications) {
        const type = await notification.getAttribute('data-type')
        expect(type).toBe('comment')
      }

      // Filter by system
      await page.click('[data-testid="filter-system"]')

      // All visible should be system type
      const systemNotifications = await page
        .locator('[data-testid="notification-item"]:visible')
        .all()
      for (const notification of systemNotifications) {
        const type = await notification.getAttribute('data-type')
        expect(type).toBe('system')
      }
    })

    test('should search notifications', async ({ page }) => {
      await page.goto('/notifications')

      // Search for specific content
      await page.fill('[data-testid="search-notifications"]', 'listing')
      await page.click('[data-testid="search-button"]')

      // Results should contain search term
      const results = await page.locator('[data-testid="notification-item"]:visible').all()
      for (const result of results) {
        const text = await result.textContent()
        expect(text?.toLowerCase()).toContain('listing')
      }
    })

    test('should sort notifications', async ({ page }) => {
      await page.goto('/notifications')

      // Sort by newest first (default)
      await page.selectOption('[data-testid="sort-notifications"]', 'newest')

      // Get timestamps
      const timestamps = await page.locator('[data-testid="notification-time"]').all()
      const times = await Promise.all(
        timestamps.slice(0, 3).map(async (t) => {
          const timeStr = await t.getAttribute('data-timestamp')
          return new Date(timeStr || '').getTime()
        }),
      )

      // Verify descending order
      for (let i = 0; i < times.length - 1; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i + 1])
      }

      // Sort by unread first
      await page.selectOption('[data-testid="sort-notifications"]', 'unread')

      // First notifications should be unread
      const firstNotification = page.locator('[data-testid="notification-item"]').first()
      await expect(firstNotification).toHaveAttribute('data-read', 'false')
    })
  })
})
