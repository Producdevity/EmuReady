import { test, expect } from './fixtures'
import type { Request } from '@playwright/test'

function serializedRequest(request: Request) {
  return decodeURIComponent(`${request.url()} ${request.postData() ?? ''}`)
}

test.describe('Admin SoCs', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })

  test('requests paginated SoCs and renders the table', async ({ page }) => {
    const socsRequestPromise = page.waitForRequest((request) =>
      request.url().includes('/api/trpc/socs.get'),
    )

    await page.goto('/admin/socs', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/admin\/socs/)

    const socsRequest = await socsRequestPromise
    const requestPayload = serializedRequest(socsRequest)
    expect(requestPayload).toContain('"page":1')
    expect(requestPayload).toContain('"limit":20')

    await expect(page.getByRole('heading', { name: 'System on Chips (SoCs)' })).toBeVisible()

    const socsTable = page.locator('table').first()
    await expect(socsTable).toBeVisible()
    await expect(socsTable.locator('thead')).toContainText('SoC Name')
    await expect(socsTable.locator('thead')).toContainText('Manufacturer')
    await expect(socsTable.locator('tbody tr').first()).toBeVisible()
  })
})
