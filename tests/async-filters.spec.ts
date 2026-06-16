import { expect } from '@playwright/test'
import { createPrismaClient } from '@/server/prisma-client'
import { ApprovalStatus } from '@orm/client'
import { test } from './fixtures'
import type { Locator, Page } from '@playwright/test'

async function getAsyncFilterFixtures() {
  const prisma = createPrismaClient()

  try {
    const device = await prisma.device.findFirst({
      where: {
        listings: { some: { status: ApprovalStatus.APPROVED } },
        soc: { isNot: null },
      },
      orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
      select: {
        id: true,
        modelName: true,
        brand: { select: { name: true } },
        soc: { select: { id: true, name: true, manufacturer: true } },
      },
    })
    if (!device) throw new Error('Expected an approved handheld report device fixture')
    if (!device.soc) throw new Error('Expected handheld device fixture to have an SoC')

    const cpu = await prisma.cpu.findFirst({
      where: { pcListings: { some: { status: ApprovalStatus.APPROVED } } },
      orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
      select: {
        id: true,
        modelName: true,
        brand: { select: { name: true } },
      },
    })
    if (!cpu) throw new Error('Expected an approved PC report CPU fixture')

    const gpu =
      (await prisma.gpu.findFirst({
        where: { pcListings: { some: { status: ApprovalStatus.APPROVED } } },
        orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
        select: {
          id: true,
          modelName: true,
          brand: { select: { name: true } },
        },
      })) ??
      (await prisma.gpu.findFirst({
        orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
        select: {
          id: true,
          modelName: true,
          brand: { select: { name: true } },
        },
      }))
    if (!gpu) throw new Error('Expected a GPU fixture')

    return {
      device: {
        label: `${device.brand.name} ${device.modelName}`,
        searchTerm: device.modelName,
      },
      soc: {
        label: `${device.soc.manufacturer} ${device.soc.name}`,
        searchTerm: device.soc.name,
      },
      cpu: {
        label: `${cpu.brand.name} ${cpu.modelName}`,
        searchTerm: cpu.modelName,
      },
      gpu: {
        label: `${gpu.brand.name} ${gpu.modelName}`,
        searchTerm: gpu.modelName,
      },
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function waitForListingsTableIdle(page: Page) {
  const tableBody = page.locator('table tbody').first()
  const firstRow = page.locator('table tbody tr').first()
  const noListingsMessage = page.getByText(/no listings found|no results|empty|nothing found/i)

  await expect(firstRow.or(noListingsMessage)).toBeVisible()
  if (await tableBody.isVisible()) {
    await expect(tableBody).not.toHaveClass(/opacity-50/)
  }
}

async function openFilterDropdown(filterButton: Locator) {
  await filterButton.scrollIntoViewIfNeeded()
  await filterButton.click()
  await expect(filterButton).toHaveAttribute('aria-expanded', 'true')
}

async function selectAsyncFilterOption(
  page: Page,
  filterButton: Locator,
  searchPlaceholder: string,
  fixture: { label: string; searchTerm: string },
  expectedParam: string,
) {
  await openFilterDropdown(filterButton)

  const searchInput = page.getByPlaceholder(searchPlaceholder)
  await expect(searchInput).toBeVisible()
  await searchInput.fill(fixture.searchTerm)

  const option = page
    .getByTestId('async-multi-select-options')
    .locator('label')
    .filter({ hasText: fixture.label })
  await expect(option).toBeVisible()
  await expect(option).toHaveCount(1)
  await option.click()

  await expect(page).toHaveURL(new RegExp(`[?&]${expectedParam}=`))
  await expect(filterButton).toContainText(fixture.label)

  await page.keyboard.press('Escape')
  await expect(filterButton).toHaveAttribute('aria-expanded', 'false')
}

test.describe('Async listing filters', () => {
  test('applies and restores handheld Device and SoC filters', async ({ page }) => {
    const fixtures = await getAsyncFilterFixtures()

    await page.goto('/listings', { waitUntil: 'domcontentloaded' })
    await waitForListingsTableIdle(page)

    const deviceFilter = page.getByRole('button', { name: /devices multi-select/i })
    const socFilter = page.getByRole('button', { name: /socs multi-select/i })

    await selectAsyncFilterOption(
      page,
      deviceFilter,
      'Search devices...',
      fixtures.device,
      'deviceIds',
    )
    await selectAsyncFilterOption(page, socFilter, 'Search SoCs...', fixtures.soc, 'socIds')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForListingsTableIdle(page)

    await expect(deviceFilter).toContainText(fixtures.device.label)
    await expect(socFilter).toContainText(fixtures.soc.label)
    await expect(page.getByText(/devices: 1 selected/i)).toBeVisible()
    await expect(page.getByText(/socs: 1 selected/i)).toBeVisible()
  })

  test('applies and restores PC CPU and GPU filters', async ({ page }) => {
    const fixtures = await getAsyncFilterFixtures()

    await page.goto('/pc-listings', { waitUntil: 'domcontentloaded' })
    await waitForListingsTableIdle(page)

    const cpuFilter = page.getByRole('button', { name: /cpus multi-select/i })
    const gpuFilter = page.getByRole('button', { name: /gpus multi-select/i })

    await selectAsyncFilterOption(page, cpuFilter, 'Search CPUs...', fixtures.cpu, 'cpuIds')
    await selectAsyncFilterOption(page, gpuFilter, 'Search GPUs...', fixtures.gpu, 'gpuIds')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForListingsTableIdle(page)

    await expect(cpuFilter).toContainText(fixtures.cpu.label)
    await expect(gpuFilter).toContainText(fixtures.gpu.label)
    await expect(page.getByText(/cpus: 1 selected/i)).toBeVisible()
    await expect(page.getByText(/gpus: 1 selected/i)).toBeVisible()
  })
})
