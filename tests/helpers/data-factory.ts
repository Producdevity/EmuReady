import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { ApprovalStatus, PcOs, PrismaClient } from '@orm'
import { registerCookieConsent } from './cookie-consent'
import { registerExternalServiceMocks } from './external-services'
import type { Browser, Locator, Page } from '@playwright/test'

const VALID_CUSTOM_FIELD_TEXT_VALUE = 'https://example.com'
const HANDHELD_LISTING_GAME_SEARCH_TERM = 'Mario Kart 8 Deluxe'
const HANDHELD_LISTING_EMULATOR_SEARCH_TERM = 'Ryujinx'
const PC_LISTING_GAME_SEARCH_TERM = 'Mario Kart 8 Deluxe'
const PC_LISTING_EMULATOR_SEARCH_TERM = 'Ryujinx'
const PC_LISTING_CPU_BRAND_NAME = 'E2E'
const PC_LISTING_CPU_MODEL_PREFIX = 'E2E CPU'
const REPORT_TARGET_AUTHOR_EMAIL = 'user@emuready.com'
const REPORTER_EMAIL = 'author@emuready.com'

interface PcListingCandidate {
  gameSearchTerm: string
  cpuSearchTerm: string
  gpuSearchTerm?: string
}

interface ListingFixture {
  id: string
  path: string
}

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

  await selectAutocompleteOption(page, /search for a game/i, HANDHELD_LISTING_GAME_SEARCH_TERM)
  await selectAutocompleteOption(page, /search for a device/i, 'Rog')
  await selectAutocompleteOption(
    page,
    /search for emulators/i,
    HANDHELD_LISTING_EMULATOR_SEARCH_TERM,
  )

  await expect(page.getByText('Loading emulator-specific fields...')).toBeHidden()

  await fillAllRequiredCustomFields(page)

  const notesField = page.getByPlaceholder(/share your experience/i)
  await expect(notesField).toBeVisible()
  await notesField.fill('E2E test handheld listing')

  const submitBtn = page.getByRole('button', { name: /create compatibility report/i })
  await submitBtn.click()

  await expect(page).toHaveURL(/\/listings(?!\/new)/)
}

async function fillPcListingForm(page: Page, candidate: PcListingCandidate): Promise<void> {
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

  await selectAutocompleteOption(page, /search for emulators/i, PC_LISTING_EMULATOR_SEARCH_TERM)

  await expect(page.getByText('Loading emulator-specific fields...')).toBeHidden()

  await fillAllRequiredCustomFields(page)

  const notesField = page.getByPlaceholder(/share your experience/i)
  await expect(notesField).toBeVisible()
  await notesField.fill('E2E test PC listing')
}

async function createPcListingCpu(): Promise<string> {
  const prisma = new PrismaClient()
  const modelName = `${PC_LISTING_CPU_MODEL_PREFIX} ${randomUUID()}`

  try {
    const brand = await prisma.deviceBrand.upsert({
      where: { name: PC_LISTING_CPU_BRAND_NAME },
      update: {},
      create: { name: PC_LISTING_CPU_BRAND_NAME },
    })

    await prisma.cpu.create({
      data: {
        brandId: brand.id,
        modelName,
      },
    })
  } finally {
    await prisma.$disconnect()
  }

  return modelName
}

async function createPcListingCpuFixture(prisma: PrismaClient): Promise<string> {
  const modelName = `${PC_LISTING_CPU_MODEL_PREFIX} ${randomUUID()}`

  const brand = await prisma.deviceBrand.upsert({
    where: { name: PC_LISTING_CPU_BRAND_NAME },
    update: {},
    create: { name: PC_LISTING_CPU_BRAND_NAME },
  })

  const cpu = await prisma.cpu.create({
    data: {
      brandId: brand.id,
      modelName,
    },
    select: { id: true },
  })

  return cpu.id
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
  await fillPcListingForm(page, {
    gameSearchTerm: PC_LISTING_GAME_SEARCH_TERM,
    cpuSearchTerm: await createPcListingCpu(),
  })

  const result = await submitPcListingForm(page)
  if (result === 'created') return page.url()

  throw new Error('createPcListing: unique CPU fixture still produced a duplicate listing')
}

function getListingIdFromDetailUrl(detailUrl: string): string {
  const segments = new URL(detailUrl, 'http://localhost:3000').pathname.split('/').filter(Boolean)
  const listingId = segments[segments.length - 1]

  if (!listingId) throw new Error(`Could not determine listing id from ${detailUrl}`)

  return listingId
}

async function getE2EUserId(prisma: PrismaClient, email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })

  if (!user) throw new Error(`Could not find E2E user: ${email}`)

  return user.id
}

async function getFixtureListingDependencies(prisma: PrismaClient) {
  const game = await prisma.game.findFirst({
    where: { status: ApprovalStatus.APPROVED },
    select: { id: true, systemId: true },
  })
  if (!game) throw new Error('Could not find approved game for report fixture')

  const emulator = await prisma.emulator.findFirst({
    where: { systems: { some: { id: game.systemId } } },
    select: { id: true },
  })
  if (!emulator) throw new Error('Could not find emulator for report fixture')

  const performance = await prisma.performanceScale.findFirst({ select: { id: true } })
  if (!performance) throw new Error('Could not find performance scale for report fixture')

  return { emulator, game, performance }
}

export async function createPendingHandheldListingFixture(
  authorEmail: string = REPORTER_EMAIL,
): Promise<ListingFixture> {
  const prisma = new PrismaClient()

  try {
    const authorId = await getE2EUserId(prisma, authorEmail)
    const { game, emulator, performance } = await getFixtureListingDependencies(prisma)
    const device = await prisma.device.findFirst({ select: { id: true } })
    if (!device) throw new Error('Could not find device for pending report fixture')

    const listing = await prisma.listing.create({
      data: {
        authorId,
        gameId: game.id,
        emulatorId: emulator.id,
        deviceId: device.id,
        performanceId: performance.id,
        status: ApprovalStatus.PENDING,
        notes: `E2E pending report fixture ${randomUUID()}`,
      },
      select: { id: true },
    })

    return { id: listing.id, path: `/listings/${listing.id}` }
  } finally {
    await prisma.$disconnect()
  }
}

export async function createPendingPcListingFixture(
  authorEmail: string = REPORTER_EMAIL,
): Promise<ListingFixture> {
  const prisma = new PrismaClient()

  try {
    const authorId = await getE2EUserId(prisma, authorEmail)
    const { game, emulator, performance } = await getFixtureListingDependencies(prisma)
    const cpuId = await createPcListingCpuFixture(prisma)

    const pcListing = await prisma.pcListing.create({
      data: {
        authorId,
        gameId: game.id,
        emulatorId: emulator.id,
        cpuId,
        memorySize: 16,
        os: PcOs.WINDOWS,
        osVersion: 'Windows 11',
        performanceId: performance.id,
        status: ApprovalStatus.PENDING,
        notes: `E2E pending PC report fixture ${randomUUID()}`,
      },
      select: { id: true },
    })

    return { id: pcListing.id, path: `/pc-listings/${pcListing.id}` }
  } finally {
    await prisma.$disconnect()
  }
}

async function createApprovedHandheldListingFixture(authorEmail: string): Promise<ListingFixture> {
  const prisma = new PrismaClient()

  try {
    const authorId = await getE2EUserId(prisma, authorEmail)
    const { game, emulator, performance } = await getFixtureListingDependencies(prisma)
    const device = await prisma.device.findFirst({ select: { id: true } })
    if (!device) throw new Error('Could not find device for report fixture')

    const listing = await prisma.listing.create({
      data: {
        authorId,
        gameId: game.id,
        emulatorId: emulator.id,
        deviceId: device.id,
        performanceId: performance.id,
        status: ApprovalStatus.APPROVED,
        processedAt: new Date(),
        notes: `E2E report fixture ${randomUUID()}`,
      },
      select: { id: true },
    })

    return { id: listing.id, path: `/listings/${listing.id}` }
  } finally {
    await prisma.$disconnect()
  }
}

async function createApprovedPcListingFixture(authorEmail: string): Promise<ListingFixture> {
  const prisma = new PrismaClient()

  try {
    const authorId = await getE2EUserId(prisma, authorEmail)
    const { game, emulator, performance } = await getFixtureListingDependencies(prisma)
    const cpu = await prisma.cpu.findFirst({ select: { id: true } })
    if (!cpu) throw new Error('Could not find CPU for report fixture')

    const pcListing = await prisma.pcListing.create({
      data: {
        authorId,
        gameId: game.id,
        emulatorId: emulator.id,
        cpuId: cpu.id,
        memorySize: 16,
        os: PcOs.WINDOWS,
        osVersion: 'Windows 11',
        performanceId: performance.id,
        status: ApprovalStatus.APPROVED,
        processedAt: new Date(),
        notes: `E2E PC report fixture ${randomUUID()}`,
      },
      select: { id: true },
    })

    return { id: pcListing.id, path: `/pc-listings/${pcListing.id}` }
  } finally {
    await prisma.$disconnect()
  }
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

async function findFirstApprovedPcListing(): Promise<string | null> {
  const prisma = new PrismaClient()

  try {
    const pcListing = await prisma.pcListing.findFirst({
      where: {
        status: ApprovalStatus.APPROVED,
        author: { email: { not: REPORT_TARGET_AUTHOR_EMAIL } },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    return pcListing ? `/pc-listings/${pcListing.id}` : null
  } finally {
    await prisma.$disconnect()
  }
}

export async function ensureApprovedPcListing(): Promise<string> {
  const existing = await findFirstApprovedPcListing()
  if (existing) return existing

  return (await createApprovedPcListingFixture(REPORTER_EMAIL)).path
}

async function submitReportDialog(page: Page, description: string): Promise<Locator> {
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()

  const reasonSelect = dialog.locator('select')
  await expect(reasonSelect).toBeVisible()
  await reasonSelect.selectOption({ index: 1 })

  const textarea = dialog.locator('textarea')
  await expect(textarea).toBeVisible()
  await textarea.fill(description)

  const submitBtn = dialog.getByRole('button', { name: /submit report/i })
  await submitBtn.click()

  return dialog
}

async function openReportDialog(page: Page, listingPath: string): Promise<void> {
  await page.goto(listingPath)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const reportButton = page.getByRole('button', { name: /^report$/i })
  await expect(reportButton).toBeVisible()
  await reportButton.click()
}

export async function createReport(page: Page): Promise<void> {
  const target = await createApprovedHandheldListingFixture(REPORT_TARGET_AUTHOR_EMAIL)

  await openReportDialog(page, target.path)

  const dialog = await submitReportDialog(page, 'E2E test report for admin-reports testing')
  await expect(dialog).toBeHidden()
}

export async function createPcReport(page: Page): Promise<void> {
  const target = await createApprovedPcListingFixture(REPORT_TARGET_AUTHOR_EMAIL)

  await openReportDialog(page, target.path)

  const dialog = await submitReportDialog(page, 'E2E test PC report for admin-reports testing')
  await expect(dialog).toBeHidden()
}

async function expectNoHandheldReportCreated(fixture: ListingFixture): Promise<void> {
  const prisma = new PrismaClient()

  try {
    const reporterId = await getE2EUserId(prisma, REPORTER_EMAIL)
    const reportCount = await prisma.listingReport.count({
      where: { listingId: fixture.id, reportedById: reporterId },
    })

    expect(reportCount).toBe(0)
  } finally {
    await prisma.$disconnect()
  }
}

async function expectNoPcReportCreated(fixture: ListingFixture): Promise<void> {
  const prisma = new PrismaClient()

  try {
    const reporterId = await getE2EUserId(prisma, REPORTER_EMAIL)
    const reportCount = await prisma.pcListingReport.count({
      where: { pcListingId: fixture.id, reportedById: reporterId },
    })

    expect(reportCount).toBe(0)
  } finally {
    await prisma.$disconnect()
  }
}

async function expectOwnReportBlocked(page: Page, fixture: ListingFixture): Promise<void> {
  await page.goto(fixture.path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const reportButton = page.getByRole('button', { name: /^report$/i })
  if ((await reportButton.count()) === 0) {
    await expect(reportButton).toHaveCount(0)
    return
  }

  await reportButton.click()
  const dialog = await submitReportDialog(page, 'E2E own-listing report rejection check')
  await expect(dialog.getByText(/cannot report your own listing/i)).toBeVisible()
}

export async function expectOwnHandheldReportBlocked(page: Page): Promise<void> {
  const target = await createApprovedHandheldListingFixture(REPORTER_EMAIL)

  await expectOwnReportBlocked(page, target)
  await expectNoHandheldReportCreated(target)
}

export async function expectOwnPcReportBlocked(page: Page): Promise<void> {
  const target = await createApprovedPcListingFixture(REPORTER_EMAIL)

  await expectOwnReportBlocked(page, target)
  await expectNoPcReportCreated(target)
}

export async function withContext(
  browser: Browser,
  storageState: string,
  fn: (page: Page) => Promise<void>,
) {
  const ctx = await browser.newContext({ storageState })
  await registerCookieConsent(ctx)
  const page = await ctx.newPage()
  await registerExternalServiceMocks(page)
  try {
    await fn(page)
  } finally {
    await ctx.close()
  }
}

async function openUserDetailsDialog(page: Page, userRow: Locator): Promise<Locator> {
  const viewDetailsButton = userRow.getByRole('button', { name: 'View User Details' })
  await expect(viewDetailsButton).toBeVisible()

  const dialog = page.locator('[role="dialog"]')
  await expect(async () => {
    if (!(await dialog.isVisible())) {
      await viewDetailsButton.click()
    }

    await expect(dialog).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 10000 })

  return dialog
}

export async function resetUserTrustScore(page: Page, targetUserEmail: string): Promise<void> {
  await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/loading/i)).toBeHidden()

  await page.getByPlaceholder(/search.*user/i).fill(targetUserEmail)

  const userRow = page.locator('table tbody tr').filter({ hasText: targetUserEmail }).first()
  await expect(userRow).toBeVisible()
  const dialog = await openUserDetailsDialog(page, userRow)

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
