import { expect } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'

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
    // Waiting on a filtered match avoids racing the debounced search and
    // clicking an unfiltered option before the filter has applied.
    const matchingOption = options.filter({ hasText: new RegExp(searchTerm, 'i') })
    await expect(matchingOption.first()).toBeVisible()
    await matchingOption.first().click()
  } else {
    await expect(options.first()).toBeVisible()
    await options.first().click()
  }

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
  // Must run before fillEmptyTextInputs — combobox inputs match the generic
  // text-input selector otherwise and get stuffed with a URL instead of a
  // selected option. Game/device/emulator comboboxes are already replaced
  // with cards by the caller, so remaining visible empty comboboxes are
  // custom-field autocompletes (e.g., Driver Version for Eden).
  const comboboxes = page.locator('form [role="combobox"]')
  const comboboxCount = await comboboxes.count()

  for (let i = 0; i < comboboxCount; i++) {
    const combobox = comboboxes.nth(i)
    if (!(await combobox.isVisible())) continue

    const value = await combobox.inputValue()
    if (value && value.length > 0) continue

    // Optional comboboxes (e.g., GPU) live inside a section whose label
    // contains "Optional" — leave them empty.
    const containerText = await combobox
      .locator('xpath=ancestor::div[position() <= 3]')
      .first()
      .textContent()
    if (containerText && /optional/i.test(containerText)) continue

    await combobox.click()
    const listbox = page.locator('[role="listbox"]')
    await expect(listbox).toBeVisible()
    await listbox.locator('[role="option"]').first().click()
    await expect(listbox).toBeHidden()
  }
}

async function fillEmptyTextInputs(page: Page) {
  // `https://example.com` is valid for both plain-text and url-typed custom
  // fields (e.g., YouTube, Screenshots). A plain word like "test" would pass
  // the text fields but fail URL validation on the URL ones.
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
      await input.fill('https://example.com')
    }
  }
}

async function checkRequiredBooleanFields(page: Page) {
  // Required boolean custom fields start as `undefined` and the form validates
  // them as missing until explicitly set. Clicking the checkbox converts
  // undefined → true, satisfying the validation.
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

export async function createPcListing(page: Page): Promise<void> {
  await page.goto('/pc-listings/new')
  await page.waitForLoadState('domcontentloaded')

  await selectAutocompleteOption(page, /search for a game/i, 'Zelda')
  await selectAutocompleteOption(page, /select a cpu/i, 'Intel')

  const memoryInput = page.getByPlaceholder(/e\.g\., 16/i)
  await expect(memoryInput).toBeVisible()
  await memoryInput.fill('16')

  const osSelect = page.locator('select').filter({ hasText: /windows|linux|macos/i })
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

  await page.getByRole('button', { name: /create compatibility report/i }).click()

  await expect(page).toHaveURL(/\/pc-listings/)
}

export async function approveFirstPendingListing(
  page: Page,
  approvalPath: '/admin/approvals' | '/admin/pc-listing-approvals',
): Promise<void> {
  await page.goto(approvalPath, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/loading/i)).toBeHidden()

  // Handheld buttons have title="Approve Listing", PC has "Approve PC Listing".
  const approveButton = page.locator('button[title^="Approve"]').first()
  await expect(approveButton).toBeVisible()

  await approveButton.click()

  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  const confirmBtn = dialog
    .locator('button')
    .filter({ hasText: /confirm|approve/i })
    .last()
  await expect(confirmBtn).toBeVisible()
  await confirmBtn.click()

  await expect(dialog).toBeHidden()
}

export async function rejectFirstPendingListing(
  page: Page,
  approvalPath: '/admin/approvals' | '/admin/pc-listing-approvals',
): Promise<void> {
  await page.goto(approvalPath, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/loading/i)).toBeHidden()

  const rejectButton = page.locator('button[title^="Reject"]').first()
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

export async function createReport(page: Page): Promise<void> {
  await page.goto('/listings')

  const rows = page.locator('table tbody tr')
  await expect(rows.first()).toBeVisible()

  // The Report button only renders for non-author viewers, so we iterate
  // over several listings until we find one the current user didn't author.
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

    // "Already reported" is a valid outcome — the goal is that a report
    // exists in the DB, not that this specific run created it.
    const alreadyReportedError = dialog.getByText(/already reported/i)
    const resolved = await Promise.race([
      dialog.waitFor({ state: 'hidden' }).then(() => 'success' as const),
      alreadyReportedError.waitFor({ state: 'visible' }).then(() => 'already-exists' as const),
    ])

    if (resolved === 'success' || resolved === 'already-exists') return
  }

  throw new Error(`createReport: could not find a listing to report after ${maxAttempts} attempts`)
}

export async function withContext(
  browser: Browser,
  storageState: string,
  fn: (page: Page) => Promise<void>,
) {
  const ctx = await browser.newContext({ storageState })
  await ctx.addInitScript(() => {
    const PREFIX = '@StagingEmuReady_'
    localStorage.setItem(`${PREFIX}cookie_consent`, 'true')
    localStorage.setItem(
      `${PREFIX}cookie_preferences`,
      JSON.stringify({
        necessary: true,
        analytics: false,
        performance: false,
      }),
    )
    localStorage.setItem(`${PREFIX}cookie_consent_date`, new Date().toISOString())
    localStorage.setItem(`${PREFIX}analytics_enabled`, 'false')
    localStorage.setItem(`${PREFIX}performance_enabled`, 'false')
  })
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

  let remaining = currentScore

  while (remaining > 0) {
    const batch = Math.min(remaining, 1000)

    await dialog.getByLabel('Reason for trust adjustment').fill('E2E: resetting trust score')
    await dialog.getByLabel('Custom trust adjustment value').fill(String(-batch))
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
