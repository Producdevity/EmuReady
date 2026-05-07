import path from 'path'
import { test, expect, type Page } from '@playwright/test'

test.describe('Admin emulator platform management', () => {
  test.use({ storageState: path.join(__dirname, '.auth/super_admin.json') })

  const TRPC_HEADERS = {
    'Content-Type': 'application/json',
    Origin: 'http://localhost:3000',
    Referer: 'http://localhost:3000/',
  }

  async function trpcGet<TData>(page: Page, procedure: string, input: unknown): Promise<TData> {
    const encoded = encodeURIComponent(JSON.stringify({ '0': { json: input } }))
    const resp = await page.request.get(`/api/trpc/${procedure}?batch=1&input=${encoded}`, {
      headers: TRPC_HEADERS,
    })
    expect(resp.ok(), `${procedure} GET ${resp.status()}`).toBe(true)
    const body = (await resp.json()) as { result?: { data?: { json?: TData } } }[]
    const data = body[0]?.result?.data?.json
    if (data === undefined) throw new Error(`${procedure} returned no data`)
    return data
  }

  async function trpcMutation<TData>(
    page: Page,
    procedure: string,
    input: unknown,
  ): Promise<{ data: TData | null; error: { message: string } | null }> {
    const resp = await page.request.post(`/api/trpc/${procedure}?batch=1`, {
      data: { '0': { json: input } },
      headers: TRPC_HEADERS,
    })
    const body = (await resp.json()) as {
      result?: { data?: { json?: TData } }
      error?: { json?: { message?: string }; message?: string }
    }[]
    const entry = body[0]
    if (entry?.error) {
      return {
        data: null,
        error: { message: entry.error.json?.message ?? entry.error.message ?? 'unknown' },
      }
    }
    return { data: entry?.result?.data?.json ?? null, error: null }
  }

  type Emulator = {
    id: string
    name: string
    platforms: { platform: { id: string; slug: string } }[]
  }

  // Safety contract: only touch the one emulator picked in beforeAll and
  // restore its exact prior platform set in afterAll. Never delete or
  // mutate anything we did not first observe.
  let fixture: {
    emulatorId: string
    originalPlatformIds: string[]
  } | null = null

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/super_admin.json'),
    })
    try {
      const page = await ctx.newPage()
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      const emulators = await trpcGet<{ emulators: Emulator[] }>(page, 'emulators.get', {
        search: 'RetroArch',
        limit: 5,
      })
      const retroArch = emulators.emulators.find((e) => e.name === 'RetroArch')
      if (!retroArch) throw new Error('RetroArch must be seeded for this test')

      fixture = {
        emulatorId: retroArch.id,
        originalPlatformIds: retroArch.platforms.map((p) => p.platform.id),
      }
    } finally {
      await ctx.close()
    }
  })

  test.afterAll(async ({ browser }) => {
    if (!fixture) return
    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/super_admin.json'),
    })
    try {
      const page = await ctx.newPage()
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      const restore = await trpcMutation(page, 'emulators.updateSupportedPlatforms', {
        emulatorId: fixture.emulatorId,
        platformIds: fixture.originalPlatformIds,
      })
      if (restore.error) {
        console.warn(
          `[admin-platform-management] failed to restore emulator platforms: ${restore.error.message}`,
        )
      }
    } catch (err) {
      console.warn('[admin-platform-management] restore threw', err)
    } finally {
      await ctx.close()
    }
  })

  test('admin can view and update an emulator’s supported platforms', async ({ page }) => {
    if (!fixture) throw new Error('fixture was not created')

    const platforms = await trpcGet<{ id: string; slug: string }[]>(page, 'platforms.get', {
      scope: 'MOBILE',
    })
    const iosPlatform = platforms.find((p) => p.slug === 'ios')
    expect(iosPlatform, 'ios platform must be seeded').toBeTruthy()
    if (!iosPlatform) throw new Error('unreachable')

    const update = await trpcMutation(page, 'emulators.updateSupportedPlatforms', {
      emulatorId: fixture.emulatorId,
      platformIds: [iosPlatform.id],
    })
    expect(update.error, `update must succeed; got ${JSON.stringify(update.error)}`).toBeNull()

    const reread = await trpcGet<{ emulators: Emulator[] }>(page, 'emulators.get', {
      search: 'RetroArch',
      limit: 5,
    })
    const retroArch = reread.emulators.find((e) => e.id === fixture!.emulatorId)
    expect(retroArch).toBeTruthy()
    expect(retroArch?.platforms.map((p) => p.platform.slug)).toEqual(['ios'])
  })

  test('admin emulators list renders the Platforms column + filter', async ({ page }) => {
    await page.goto('/admin/emulators', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /manage emulators/i })).toBeVisible()

    const platformsHeader = page
      .locator('th')
      .filter({ hasText: /^Platforms$/i })
      .first()
    await expect(platformsHeader).toBeVisible()

    const platformFilter = page.getByPlaceholder(/filter by platform/i)
    await expect(platformFilter).toBeVisible()
  })

  test('admin can view the emulator detail page with Supported Platforms section', async ({
    page,
  }) => {
    if (!fixture) throw new Error('fixture was not created')
    await page.goto(`/admin/emulators/${fixture.emulatorId}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByRole('heading', { name: /supported platforms/i })).toBeVisible()
  })
})

test.describe('Admin device platform management', () => {
  test.use({ storageState: path.join(__dirname, '.auth/super_admin.json') })

  test('admin devices list renders the Platforms + Default columns and filter', async ({
    page,
  }) => {
    await page.goto('/admin/devices', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /^devices$/i }).first()).toBeVisible()

    const platformsHeader = page
      .locator('th')
      .filter({ hasText: /^Platforms$/i })
      .first()
    await expect(platformsHeader).toBeVisible()

    const defaultHeader = page
      .locator('th')
      .filter({ hasText: /^Default$/i })
      .first()
    await expect(defaultHeader).toBeVisible()

    const platformFilter = page.getByPlaceholder(/filter by platform/i)
    await expect(platformFilter).toBeVisible()
  })

  test('device detail page exposes the Supported + Default Platform sections', async ({ page }) => {
    await page.goto('/admin/devices', { waitUntil: 'domcontentloaded' })
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()

    const manageLink = firstRow.getByRole('link', { name: /platforms/i }).first()
    await expect(manageLink).toBeVisible()
    await manageLink.click()
    await expect(page).toHaveURL(/\/admin\/devices\/[a-z0-9-]+$/i)

    await expect(page.getByRole('heading', { name: /supported platforms/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /default platform/i })).toBeVisible()
  })
})
