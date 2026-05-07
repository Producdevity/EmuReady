import path from 'path'
import { test, expect, type Page } from '@playwright/test'

async function openFilter(page: Page, buttonName: RegExp) {
  const button = page.getByRole('button', { name: buttonName }).first()
  await expect(button).toBeVisible()
  await button.click()
  return button
}

async function getFilterOptionLabels(page: Page): Promise<string[]> {
  const options = page.locator('label:has(input[type="checkbox"])')
  // Dropdown can open before React has populated its contents.
  await options.first().waitFor({ state: 'visible', timeout: 5000 })
  const count = await options.count()
  const labels: string[] = []
  for (let i = 0; i < count; i += 1) {
    const text = await options.nth(i).innerText()
    labels.push(text.trim())
  }
  return labels
}

test.describe('Platform-aware PC filters (D3)', () => {
  test('emulator filter on /pc-listings hides mobile-only emulators', async ({ page }) => {
    await page.goto('/pc-listings')
    await page.waitForLoadState('domcontentloaded')

    const emulatorFilter = await openFilter(page, /emulators multi-select/i)
    const labels = await getFilterOptionLabels(page)

    expect(labels.length).toBeGreaterThan(0)
    const mobileOnlyEmulators = ['AetherSX2', 'DraStic', 'Lemuroid', 'Skyline']
    for (const name of mobileOnlyEmulators) {
      expect(labels.some((label) => label.includes(name))).toBe(false)
    }

    await emulatorFilter.click()
  })

  test('emulator filter on /pc-listings keeps desktop-capable emulators', async ({ page }) => {
    await page.goto('/pc-listings')
    await page.waitForLoadState('domcontentloaded')

    await openFilter(page, /emulators multi-select/i)
    const labels = await getFilterOptionLabels(page)

    const desktopEmulators = ['Dolphin', 'PCSX2', 'RPCS3', 'Ryujinx', 'RetroArch']
    for (const name of desktopEmulators) {
      expect(labels.some((label) => label.includes(name))).toBe(true)
    }
  })

  test('system filter on /listings still lists Microsoft Windows (handheld page uses no scope filter)', async ({
    page,
  }) => {
    await page.goto('/listings')
    await page.waitForLoadState('domcontentloaded')

    await openFilter(page, /systems multi-select/i)
    const labels = await getFilterOptionLabels(page)

    expect(labels.length).toBeGreaterThan(0)
    expect(labels.some((label) => /^microsoft windows$/i.test(label))).toBe(true)
  })
})

test.describe('Platform shown on existing listings (backfill visibility)', () => {
  test('PC listing detail page renders the OS field label', async ({ page }) => {
    await page.goto('/pc-listings')
    await page.waitForLoadState('domcontentloaded')

    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()
    const link = firstRow.locator('a[href*="/pc-listings/"]').first()
    await link.click()
    await expect(page).toHaveURL(/\/pc-listings\/[a-z0-9]/)

    const osTerm = page
      .locator('dt')
      .filter({ hasText: /^OS\s*:/i })
      .first()
    await expect(osTerm).toBeVisible()
  })
})

test.describe('Platform selection UI on new PC listing', () => {
  test.use({ storageState: path.join(__dirname, '.auth/user.json') })

  test('platform selector and helper text appear on /pc-listings/new', async ({ page }) => {
    await page.goto('/pc-listings/new', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: /create.*pc.*compatibility.*report/i }),
    ).toBeVisible()

    const platformLabel = page.getByText(/^Platform \*$/).first()
    await expect(platformLabel).toBeVisible()

    const platformHint = page.getByText(
      /Defaults from your OS choice.*Apple Silicon.*Windows ARM.*ARM Linux/i,
    )
    await expect(platformHint).toBeVisible()

    const osSelect = page.locator('select[name="Operating System"]')
    await expect(osSelect).toBeVisible()
  })

  test('switching OS to MACOS reconciles the platform options to macOS variants', async ({
    page,
  }) => {
    await page.goto('/pc-listings/new', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: /create.*pc.*compatibility.*report/i }),
    ).toBeVisible()

    const osSelect = page.locator('select[name="Operating System"]')
    await expect(osSelect).toBeVisible()
    await osSelect.selectOption('MACOS')

    const platformSelect = page.locator('select[name="Platform"]')
    await expect(platformSelect).toBeVisible()

    await expect
      .poll(
        async () => {
          const options = await platformSelect.locator('option').allInnerTexts()
          return options.join(' | ')
        },
        { timeout: 5000 },
      )
      .toMatch(/macOS/i)

    const joined = (await platformSelect.locator('option').allInnerTexts()).join(' | ')
    expect(joined).toMatch(/macOS/i)
    expect(joined).not.toMatch(/android/i)
    expect(joined).not.toMatch(/iOS/i)
  })

  test('switching OS to LINUX reconciles to Linux variants (including UNIVERSAL linux-arm)', async ({
    page,
  }) => {
    await page.goto('/pc-listings/new', { waitUntil: 'domcontentloaded' })
    const osSelect = page.locator('select[name="Operating System"]')
    await osSelect.selectOption('LINUX')

    const platformSelect = page.locator('select[name="Platform"]')
    await expect
      .poll(
        async () => {
          const options = await platformSelect.locator('option').allInnerTexts()
          return options.join(' | ')
        },
        { timeout: 5000 },
      )
      .toMatch(/Linux/i)

    const joined = (await platformSelect.locator('option').allInnerTexts()).join(' | ')
    expect(joined).toMatch(/Linux/i)
    expect(joined).not.toMatch(/windows/i)
  })
})

test.describe('Platform defaults on new handheld listing (UI smoke)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/user.json') })

  test('new handheld listing form loads and does not expose a global platform selector', async ({
    page,
  }) => {
    await page.goto('/listings/new', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: /create.*handheld.*compatibility.*report/i }),
    ).toBeVisible()

    // Handheld platform selector only shows up once a multi-platform
    // device is picked; on initial load it must not be rendered.
    const explicitPlatformLabel = page.getByText(/^Platform \*$/)
    await expect(explicitPlatformLabel).toHaveCount(0)
  })
})

test.describe('Platform persistence on CREATE (backfill + resolver verification)', () => {
  test('first page of approved PC listings has platformId slugs consistent with each listing OS', async ({
    request,
  }) => {
    // Safety net over recently-approved listings: catches a resolver
    // regression that writes an OS-incompatible platformId.
    const input = encodeURIComponent(JSON.stringify({ '0': { json: { page: 1, limit: 50 } } }))
    const resp = await request.get(`/api/trpc/pcListings.get?batch=1&input=${input}`, {
      headers: {
        Origin: 'http://localhost:3000',
        Referer: 'http://localhost:3000/',
      },
    })
    expect(resp.ok(), `pcListings.get ${resp.status()}`).toBe(true)

    const body = (await resp.json()) as {
      result?: {
        data?: {
          json?: {
            pcListings?: {
              id: string
              os: string | null
              platform: { slug: string } | null
            }[]
          }
        }
      }
    }[]
    const listings = body[0]?.result?.data?.json?.pcListings ?? []
    expect(listings.length).toBeGreaterThan(0)

    const OS_COMPATIBLE: Record<string, readonly string[]> = {
      WINDOWS: ['windows-x86', 'windows-arm', 'linux-arm'],
      LINUX: ['linux-x86', 'linux-arm'],
      MACOS: ['macos-x86', 'macos-arm', 'linux-arm'],
      FREEBSD: ['freebsd', 'linux-arm'],
    }

    const offenders: string[] = []
    for (const listing of listings) {
      if (listing.os === null) continue
      if (listing.os === 'OTHER') continue
      if (!listing.platform) {
        offenders.push(`${listing.id} (os=${listing.os}) → null platform`)
        continue
      }
      const compatible = OS_COMPATIBLE[listing.os]
      if (compatible && !compatible.includes(listing.platform.slug)) {
        offenders.push(`${listing.id} (os=${listing.os}) → ${listing.platform.slug} [incompatible]`)
      }
    }

    expect(offenders, `listings with wrong platform:\n${offenders.join('\n')}`).toEqual([])
  })
})

test.describe('Platform validation on update endpoints (tRPC)', () => {
  // Moderator auth for the test body — bypasses the 60-minute edit
  // window so we can update any listing. The fixture below is created
  // as the test user (auto-approves) via its own browser context.
  test.use({ storageState: path.join(__dirname, '.auth/moderator.json') })

  const TRPC_HEADERS = {
    'Content-Type': 'application/json',
    Origin: 'http://localhost:3000',
    Referer: 'http://localhost:3000/',
  }

  type PlatformRow = { id: string; slug: string; scope: string }

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

  async function fetchPlatformsByScope(
    page: Page,
    scope: 'DESKTOP' | 'MOBILE' | 'UNIVERSAL',
  ): Promise<PlatformRow[]> {
    return trpcGet<PlatformRow[]>(page, 'platforms.get', { scope })
  }

  // Fingerprint in the notes field so cleanup can verify the row is
  // ours before deleting, on top of the createdByTest flag.
  const FIXTURE_FINGERPRINT = `e2e-platform-layer-fixture-${process.pid}`

  type Fixture = {
    listingId: string
    macosArmPlatformId: string
    iosPlatformId: string
    performanceId: number
    // false = row existed from a previous run's failed cleanup; must
    // NOT be deleted in afterAll.
    createdByTest: boolean
  }

  let fixture: Fixture | null = null

  test.beforeAll(async ({ browser }) => {
    const userCtx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/user.json'),
    })
    try {
      const page = await userCtx.newPage()
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      const [desktopPlatforms, mobilePlatforms] = await Promise.all([
        fetchPlatformsByScope(page, 'DESKTOP'),
        fetchPlatformsByScope(page, 'MOBILE'),
      ])
      const macosArm = desktopPlatforms.find((p) => p.slug === 'macos-arm')
      const ios = mobilePlatforms.find((p) => p.slug === 'ios')
      if (!macosArm) throw new Error('macos-arm platform must be seeded')
      if (!ios) throw new Error('ios platform must be seeded')

      // RetroArch targets every scope (incl. macos-arm), so the
      // emulator-support check always passes and the only remaining
      // rejection path for the OS-consistency test is OS mismatch.
      const emulatorsResult = await trpcGet<{
        emulators: {
          id: string
          name: string
          systems: { id: string }[]
        }[]
      }>(page, 'emulators.get', { search: 'RetroArch', limit: 5 })
      const retroArch = emulatorsResult.emulators.find((e) => e.name === 'RetroArch')
      if (!retroArch) throw new Error('RetroArch emulator must be seeded')
      const retroArchSystemId = retroArch.systems[0]?.id
      if (!retroArchSystemId) throw new Error('RetroArch must have at least one system')

      const gamesResult = await trpcGet<{
        games: { id: string; systemId: string }[]
      }>(page, 'games.get', {
        systemId: retroArchSystemId,
        approvalStatus: 'APPROVED',
        limit: 1,
      })
      const game = gamesResult.games[0]
      if (!game) throw new Error(`No approved games seeded for system ${retroArchSystemId}`)

      const cpusResult = await trpcGet<{ cpus: { id: string }[] }>(page, 'cpus.get', {
        limit: 1,
      })
      const cpu = cpusResult.cpus[0]
      if (!cpu) throw new Error('At least one CPU must be seeded')

      const perfs = await trpcGet<{ id: number }[]>(page, 'performanceScales.get', {})
      const perf = perfs[0]
      if (!perf) throw new Error('At least one performance scale must be seeded')

      // Create as the test user — their listings auto-approve, so the
      // moderator can update the fixture immediately.
      const createResult = await trpcMutation<{ id: string }>(page, 'pcListings.create', {
        gameId: game.id,
        cpuId: cpu.id,
        emulatorId: retroArch.id,
        performanceId: perf.id,
        memorySize: 16,
        os: 'WINDOWS',
        osVersion: 'Windows 11',
        notes: FIXTURE_FINGERPRINT,
      })

      if (createResult.data) {
        fixture = {
          listingId: createResult.data.id,
          macosArmPlatformId: macosArm.id,
          iosPlatformId: ios.id,
          performanceId: perf.id,
          createdByTest: true,
        }
        return
      }

      // "Already exists" = a previous run's cleanup failed. Reuse the
      // row but mark createdByTest=false so afterAll doesn't delete
      // something this run didn't produce.
      if (!/already exists/i.test(createResult.error?.message ?? '')) {
        throw new Error(
          `pcListings.create failed for an unexpected reason: ${createResult.error?.message}`,
        )
      }

      const myListings = await trpcGet<{
        pcListings: {
          id: string
          gameId: string
          cpuId: string
          gpuId: string | null
          performanceId: number
          emulator: { id: string }
          notes: string | null
        }[]
      }>(page, 'pcListings.get', { myListings: true, page: 1, limit: 100 })

      const existing = myListings.pcListings.find(
        (l) =>
          l.gameId === game.id &&
          l.cpuId === cpu.id &&
          l.gpuId === null &&
          l.emulator.id === retroArch.id,
      )
      if (!existing) {
        throw new Error(
          'pcListings.create returned "already exists" but no matching row in myListings — DB state is inconsistent',
        )
      }
      fixture = {
        listingId: existing.id,
        macosArmPlatformId: macosArm.id,
        iosPlatformId: ios.id,
        performanceId: existing.performanceId,
        createdByTest: false,
      }
    } finally {
      await userCtx.close()
    }
  })

  test.afterAll(async ({ browser }) => {
    // Only delete rows this run created — never touch a reused row.
    if (!fixture || !fixture.createdByTest) return
    const userCtx = await browser.newContext({
      storageState: path.join(__dirname, '.auth/user.json'),
    })
    try {
      const page = await userCtx.newPage()
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      // Fingerprint re-check before delete, in case a test bug rewrote
      // notes or the id collided with someone else's row.
      const check = await trpcGet<{
        id: string
        notes: string | null
      }>(page, 'pcListings.byId', { id: fixture.listingId })
      if (check.notes !== FIXTURE_FINGERPRINT) {
        console.warn(
          `[platform-layer.spec] Skipping cleanup: listing ${fixture.listingId} no longer carries the test fingerprint`,
        )
        return
      }

      const result = await trpcMutation<unknown>(page, 'pcListings.delete', {
        id: fixture.listingId,
      })
      if (result.error) {
        console.warn(
          `[platform-layer.spec] Cleanup failed for listing ${fixture.listingId}: ${result.error.message}`,
        )
      }
    } catch (err) {
      console.warn(`[platform-layer.spec] Cleanup threw for listing ${fixture.listingId}`, err)
    } finally {
      await userCtx.close()
    }
  })

  test('rejects an explicit macos-arm platformId when OS is WINDOWS (OS-consistency branch)', async ({
    page,
  }) => {
    if (!fixture) throw new Error('Fixture was not created in beforeAll')
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const result = await trpcMutation<unknown>(page, 'pcListings.update', {
      id: fixture.listingId,
      performanceId: fixture.performanceId,
      memorySize: 16,
      os: 'WINDOWS',
      osVersion: 'Windows 11',
      platformId: fixture.macosArmPlatformId,
    })

    expect(result.error, 'update with macos-arm on WINDOWS must reject').toBeTruthy()
    expect(result.error?.message).toMatch(/does not match the selected operating system/i)
  })

  test('rejects an iOS (MOBILE) platformId regardless of OS (emulator-support branch)', async ({
    page,
  }) => {
    if (!fixture) throw new Error('Fixture was not created in beforeAll')
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const result = await trpcMutation<unknown>(page, 'pcListings.update', {
      id: fixture.listingId,
      performanceId: fixture.performanceId,
      memorySize: 16,
      os: 'WINDOWS',
      osVersion: 'Windows 11',
      platformId: fixture.iosPlatformId,
    })

    expect(result.error, 'update with iOS platformId must reject').toBeTruthy()
    expect(result.error?.message).toMatch(
      /does not match the selected operating system|emulator does not support/i,
    )
  })
})
