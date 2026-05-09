import { expect } from '@playwright/test'
import { registerCookieConsent } from './cookie-consent'
import type { Browser, Locator, Page } from '@playwright/test'

const VALID_CUSTOM_FIELD_TEXT_VALUE = 'https://example.com'
const PC_LISTING_GAME_SEARCH_TERMS = ['Zelda', 'Mario', 'Metroid', 'Animal', 'Sonic'] as const
const PC_LISTING_CPU_SEARCH_TERMS = [
  'Core Ultra 9 285K',
  'Ryzen 9 9950X',
  'M4 Max',
  'Core i9-14900K',
  'Ryzen 7 9800X3D',
] as const
const PC_LISTING_GPU_SEARCH_TERMS = [
  undefined,
  'GeForce RTX 5090',
  'GeForce RTX 5080',
  'GeForce RTX 4090',
  'Radeon RX 7900 XTX',
  'Arc B580',
] as const

const PC_LISTING_CANDIDATES = PC_LISTING_GAME_SEARCH_TERMS.flatMap((gameSearchTerm) =>
  PC_LISTING_CPU_SEARCH_TERMS.flatMap((cpuSearchTerm) =>
    PC_LISTING_GPU_SEARCH_TERMS.map((gpuSearchTerm) => ({
      gameSearchTerm,
      cpuSearchTerm,
      gpuSearchTerm,
    })),
  ),
)

export async function selectAutocompleteOption(
  page: Page,
  placeholderPattern: RegExp,
  searchTerm: string,
) {
  const input = page.getByPlaceholder(placeholderPattern)
  await input.click()
  if (searchTerm) {
    await input.fill(searchTerm)
  }

  const listbox = page.locator('[role="listbox"]')
  await expect(listbox).toBeVisible()

  const options = listbox.locator('[role="option"]')

  if (searchTerm) {
    const matchingOption = options.filter({ hasText: new RegExp(searchTerm, 'i') })
    await expect(matchingOption.first()).toBeVisible()
    await matchingOption.first().click()
  } else {
    await expect(options.first()).toBeVisible()
    await options.first().click()
  }

  await expect(listbox).toBeHidden()
}

async function isOptionalCombobox(combobox: Locator): Promise<boolean> {
  const containerText = await combobox
    .locator('xpath=ancestor::div[position() <= 3]')
    .first()
    .textContent()

  return /optional/i.test(containerText ?? '')
}

async function selectFirstComboboxOption(page: Page, combobox: Locator) {
  await combobox.click()
  const listbox = page.locator('[role="listbox"]')
  await expect(listbox).toBeVisible()
  await listbox.locator('[role="option"]').first().click()
  await expect(listbox).toBeHidden()
}

async function fillEmptySelects(page: Page) {
  const selects = page.locator('form select')
  const selectCount = await selects.count()

  for (let i = 0; i < selectCount; i++) {
    const sel = selects.nth(i)
    if (!(await sel.isVisible())) continue

    const currentValue = await sel.inputValue()
    if (currentValue && currentValue.length > 0) continue

    const options = sel.locator('option')
    const optionCount = await options.count()
    if (optionCount < 2) continue

    for (let j = 0; j < optionCount; j++) {
      const value = await options.nth(j).getAttribute('value')
      if (value && value.length > 0) {
        await sel.selectOption(value)
        break
      }
    }
  }
}

async function fillRequiredComboboxes(page: Page) {
  const comboboxes = page.locator('form [role="combobox"]')
  const comboboxCount = await comboboxes.count()

  for (let i = 0; i < comboboxCount; i++) {
    const combobox = comboboxes.nth(i)
    if (!(await combobox.isVisible())) continue

    const value = await combobox.inputValue()
    if (value && value.length > 0) continue

    if (await isOptionalCombobox(combobox)) continue

    await selectFirstComboboxOption(page, combobox)
  }
}

async function fillEmptyTextInputs(page: Page) {
  const textInputs = page.locator(
    'form input[type="text"]:not([role="combobox"]):not([placeholder*="Search" i]):not([placeholder*="Select for" i]), form input[type="number"], form input[type="url"]',
  )
  const inputCount = await textInputs.count()

  for (let i = 0; i < inputCount; i++) {
    const input = textInputs.nth(i)
    if (!(await input.isVisible())) continue

    const currentValue = await input.inputValue()
    if (currentValue && currentValue.length > 0) continue

    const type = await input.getAttribute('type')
    if (type === 'number') {
      await input.fill('1')
    } else {
      await input.fill(VALID_CUSTOM_FIELD_TEXT_VALUE)
    }
  }
}

async function checkRequiredBooleanFields(page: Page) {
  const checkboxes = page.locator('form input[type="checkbox"]')
  const checkboxCount = await checkboxes.count()

  for (let i = 0; i < checkboxCount; i++) {
    const checkbox = checkboxes.nth(i)
    if (!(await checkbox.isVisible())) continue
    if (await checkbox.isChecked()) continue
    await checkbox.check()
  }
}

async function fillAllRequiredCustomFields(page: Page) {
  await fillEmptySelects(page)
  await fillRequiredComboboxes(page)
  await fillEmptyTextInputs(page)
  await checkRequiredBooleanFields(page)
}

export async function createHandheldListing(page: Page): Promise<void> {
  await page.goto('/listings/new')
  await expect(
    page.getByRole('heading', { name: /create.*handheld.*compatibility.*report/i }),
  ).toBeVisible()

  await selectAutocompleteOption(page, /search for a game/i, 'Mario')
  await selectAutocompleteOption(page, /search for a device/i, 'Rog')
  await selectAutocompleteOption(page, /search for emulators/i, '')

  await expect(page.getByText('Loading emulator-specific fields...')).toBeHidden()

  await fillAllRequiredCustomFields(page)

  const notesField = page.getByPlaceholder(/share your experience/i)
  await expect(notesField).toBeVisible()
  await notesField.fill('E2E test handheld listing')

  const submitBtn = page.getByRole('button', { name: /create compatibility report/i })
  await submitBtn.click()

  await expect(page).toHaveURL(/\/listings(?!\/new)/)
}

async function fillPcListingForm(
  page: Page,
  candidate: (typeof PC_LISTING_CANDIDATES)[number],
): Promise<void> {
  await page.goto('/pc-listings/new')
  await page.waitForLoadState('domcontentloaded')

  await selectAutocompleteOption(page, /search for a game/i, candidate.gameSearchTerm)
  await selectAutocompleteOption(page, /select a cpu/i, candidate.cpuSearchTerm)

  if (candidate.gpuSearchTerm) {
    await selectAutocompleteOption(page, /select a gpu/i, candidate.gpuSearchTerm)
  }

  const memoryInput = page.getByPlaceholder(/e\.g\., 16/i)
  await expect(memoryInput).toBeVisible()
  await memoryInput.fill('16')

  const osSelect = page.locator('select[name="Operating System"]')
  await expect(osSelect).toBeVisible()
  await osSelect.selectOption({ index: 1 })

  const osVersionInput = page.getByPlaceholder(/windows 11|ubuntu/i)
  await expect(osVersionInput).toBeVisible()
  await osVersionInput.fill('Windows 11')

  await selectAutocompleteOption(page, /search for emulators/i, '')

  await expect(page.getByText('Loading emulator-specific fields...')).toBeHidden()

  await fillAllRequiredCustomFields(page)

  const notesField = page.getByPlaceholder(/share your experience/i)
  await expect(notesField).toBeVisible()
  await notesField.fill('E2E test PC listing')
}

async function submitPcListingForm(page: Page): Promise<'created' | 'already-exists'> {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/trpc/pcListings.create') &&
      response.request().method() === 'POST',
  )

  await page.getByRole('button', { name: /create compatibility report/i }).click()

  const response = await responsePromise
  if (response.status() === 409) return 'already-exists'
  if (!response.ok()) {
    throw new Error(`PC listing creation failed with HTTP ${response.status()}`)
  }

  await page.waitForURL(/\/pc-listings\/(?!new)[^/?#]+/)
  return 'created'
}

export async function createPcListing(page: Page): Promise<string> {
  for (const candidate of PC_LISTING_CANDIDATES) {
    await fillPcListingForm(page, candidate)

    const result = await submitPcListingForm(page)
    if (result === 'created') return page.url()
  }

  throw new Error('createPcListing: every fixture combination already exists')
}

function getListingIdFromDetailUrl(detailUrl: string): string {
  const segments = new URL(detailUrl).pathname.split('/').filter(Boolean)
  const listingId = segments[segments.length - 1]

  if (!listingId) throw new Error(`Could not determine listing id from ${detailUrl}`)

  return listingId
}

async function confirmApprovalDialog(page: Page) {
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  const confirmButton = dialog.getByRole('button', {
    name: /approve anyway|confirm approval/i,
  })
  await expect(confirmButton).toBeVisible()
  await confirmButton.click()

  await expect(dialog).toBeHidden()
}

async function approvePendingListingRow(page: Page, row: Locator) {
  const approveButton = row.locator('button[title^="Approve"]').first()
  await expect(approveButton).toBeVisible()
  await approveButton.click()

  await confirmApprovalDialog(page)
}

export async function approvePendingPcListingByUrl(page: Page, detailUrl: string): Promise<void> {
  const listingId = getListingIdFromDetailUrl(detailUrl)
  await page.goto('/admin/pc-listing-approvals?sortField=createdAt&sortDirection=desc', {
    waitUntil: 'domcontentloaded',
  })
  await expect(page.getByText(/loading/i)).toBeHidden()

  const row = page
    .locator('tbody tr', {
      has: page.locator(`a[href="/pc-listings/${listingId}"]`),
    })
    .first()
  await expect(row).toBeVisible()

  await approvePendingListingRow(page, row)
}

async function rejectPendingListingRow(page: Page, row: Locator): Promise<void> {
  const rejectButton = row.locator('button[title^="Reject"]').first()
  await expect(rejectButton).toBeVisible()

  await rejectButton.click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  const textarea = dialog.locator('textarea')
  await expect(textarea).toBeVisible()
  await textarea.fill('Rejected by E2E test')

  const confirmBtn = dialog
    .locator('button')
    .filter({ hasText: /confirm|reject/i })
    .last()
  await expect(confirmBtn).toBeVisible()
  await confirmBtn.click()

  await expect(dialog).toBeHidden()
}

export async function rejectPendingPcListingByUrl(page: Page, detailUrl: string): Promise<void> {
  const listingId = getListingIdFromDetailUrl(detailUrl)
  await page.goto('/admin/pc-listing-approvals?sortField=createdAt&sortDirection=desc', {
    waitUntil: 'domcontentloaded',
  })
  await expect(page.getByText(/loading/i)).toBeHidden()

  const row = page
    .locator('tbody tr', {
      has: page.locator(`a[href="/pc-listings/${listingId}"]`),
    })
    .first()
  await expect(row).toBeVisible()

  await rejectPendingListingRow(page, row)
}

export async function ensureApprovedPcListing(browser: Browser): Promise<string> {
  const existing = await findFirstApprovedPcListing(browser)
  if (existing) return existing

  let detailUrl = ''

  await withContext(browser, 'tests/.auth/user.json', async (page) => {
    detailUrl = await createPcListing(page)
  })

  await withContext(browser, 'tests/.auth/super_admin.json', async (page) => {
    await approvePendingPcListingByUrl(page, detailUrl)
  })

  return detailUrl
}

async function findFirstApprovedPcListing(browser: Browser): Promise<string | null> {
  let detailUrl: string | null = null

  await withContext(browser, 'tests/.auth/user.json', async (page) => {
    await page.goto('/pc-listings')
    await page.waitForLoadState('domcontentloaded')

    const firstLink = page.locator('tbody tr a[href*="/pc-listings/"]').first()
    if (!(await firstLink.isVisible({ timeout: 2000 }).catch(() => false))) return

    const href = await firstLink.getAttribute('href')
    if (href) detailUrl = new URL(href, page.url()).href
  })

  return detailUrl
}

export async function createReport(page: Page): Promise<void> {
  await page.goto('/listings')

  const rows = page.locator('table tbody tr')
  await expect(rows.first()).toBeVisible()

  const rowCount = await rows.count()
  const maxAttempts = Math.min(rowCount, 15)

  for (let i = 0; i < maxAttempts; i++) {
    await page.goto('/listings')
    await expect(rows.first()).toBeVisible()

    const link = rows.nth(i).locator('a[href*="/listings/"]').first()
    await link.click()
    await expect(page).toHaveURL(/\/listings\/[^/]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const reportButton = page.getByRole('button', { name: /^report$/i })
    if ((await reportButton.count()) === 0) continue
    await reportButton.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    const reasonSelect = dialog.locator('select')
    await expect(reasonSelect).toBeVisible()
    await reasonSelect.selectOption({ index: 1 })

    const textarea = dialog.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.fill('E2E test report for admin-reports testing')

    const submitBtn = dialog.getByRole('button', { name: /submit report/i })
    await submitBtn.click()

    const reportOutcome = await Promise.race([
      dialog.waitFor({ state: 'hidden' }).then(() => 'success' as const),
      dialog
        .getByText(/already reported/i)
        .waitFor({ state: 'visible' })
        .then(() => 'already-exists' as const),
    ])

    if (reportOutcome === 'success' || reportOutcome === 'already-exists') return
  }

  throw new Error(`createReport: could not find a listing to report after ${maxAttempts} attempts`)
}

export async function withContext(
  browser: Browser,
  storageState: string,
  fn: (page: Page) => Promise<void>,
) {
  const ctx = await browser.newContext({ storageState })
  await registerCookieConsent(ctx)
  const page = await ctx.newPage()
  try {
    await fn(page)
  } finally {
    await ctx.close()
  }
}

export async function resetUserTrustScore(page: Page, targetUserEmail: string): Promise<void> {
  await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/loading/i)).toBeHidden()

  await page.getByPlaceholder(/search.*user/i).fill(targetUserEmail)

  const userRow = page.locator('table tbody tr').filter({ hasText: targetUserEmail }).first()
  await expect(userRow).toBeVisible()
  await userRow.locator('button').first().click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  const scoreElement = dialog.getByLabel('Trust score value')
  await expect(scoreElement).toBeVisible()
  const currentScore = parseInt((await scoreElement.textContent()) ?? '0', 10)

  if (currentScore === 0) return

  await dialog.getByRole('button', { name: /trust actions/i }).click()

  let remaining = -currentScore

  while (remaining !== 0) {
    const batch = Math.sign(remaining) * Math.min(Math.abs(remaining), 1000)

    await dialog.getByLabel('Reason for trust adjustment').fill('E2E: resetting trust score')
    await dialog.getByLabel('Custom trust adjustment value').fill(String(batch))
    await dialog.getByRole('button', { name: /apply/i }).click()
    await expect(page.getByText(/trust score adjusted/i)).toBeVisible()

    remaining -= batch
  }

  await dialog.getByRole('button', { name: /close modal/i }).click()
  await expect(dialog).toBeHidden()

  await userRow.locator('button').first().click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Trust score value')).toHaveText('0')
}
