import superjson from 'superjson'
import { z } from 'zod'
import { GetCustomFieldDefinitionsByEmulatorSchema } from '@/schemas/customFieldDefinition'
import { CreateListingSchema } from '@/schemas/listing'
import { CustomFieldType, type CustomFieldDefinition, type Emulator } from '@orm'
import { test, expect } from './fixtures'
import { selectAutocompleteOption } from './helpers/data-factory'
import type { Page, Request } from '@playwright/test'

const TEXT_FIELD_ID = '00000000-0000-4000-a000-000000000101'
const SELECT_FIELD_ID = '00000000-0000-4000-a000-000000000102'

const CustomFieldInputEnvelope = z.object({ json: GetCustomFieldDefinitionsByEmulatorSchema })
const CreateInputEnvelope = z.record(z.object({ json: CreateListingSchema }))

function customFields(emulatorId: string) {
  const base = {
    emulatorId,
    categoryId: null,
    options: null,
    defaultValue: null,
    placeholder: null,
    rangeMin: null,
    rangeMax: null,
    rangeUnit: null,
    rangeDecimals: null,
    isRequired: true,
    displayOrder: 0,
    categoryOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    category: null,
    emulator: { name: 'Test Emulator' },
  }
  return [
    {
      ...base,
      id: TEXT_FIELD_ID,
      name: 'test_driver_version',
      label: 'Driver Version',
      type: CustomFieldType.TEXT,
    },
    {
      ...base,
      id: SELECT_FIELD_ID,
      name: 'test_graphics_setting',
      label: 'Graphics Setting',
      type: CustomFieldType.SELECT,
      displayOrder: 1,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'high', label: 'High' },
      ],
    },
  ] satisfies (CustomFieldDefinition & { category: null; emulator: Pick<Emulator, 'name'> })[]
}

function procedures(url: string): string[] {
  return decodeURIComponent(new URL(url).pathname).split('/').pop()?.split(',') ?? []
}

function isCreateRequest(request: Request): boolean {
  return request.method() === 'POST' && procedures(request.url()).includes('listings.create')
}

async function prepareForm(page: Page, includeFields = true): Promise<Request[]> {
  const createRequests: Request[] = []
  await page.route('**/api/trpc/**', async (route) => {
    const request = route.request()
    if (isCreateRequest(request)) {
      createRequests.push(request)
      await route.abort('blockedbyclient')
      return
    }

    const index = procedures(request.url()).indexOf('customFieldDefinitions.getByEmulator')
    if (index < 0) return route.continue()

    const input = new URL(request.url()).searchParams.get('input')
    const inputs = z.record(z.unknown()).parse(JSON.parse(input ?? '{}'))
    const { json } = CustomFieldInputEnvelope.parse(inputs[String(index)])
    const response = await route.fetch()
    const results = z.array(z.unknown()).parse(await response.json())
    results[index] = {
      result: { data: superjson.serialize(includeFields ? customFields(json.emulatorId) : []) },
    }
    await route.fulfill({ response, json: results })
  })

  await page.goto('/listings/new', { waitUntil: 'domcontentloaded' })
  await selectAutocompleteOption(page, /search for a game/i, 'Mario Kart 8 Deluxe')
  await selectAutocompleteOption(page, /search for a device/i, 'Rog')
  await page.locator('form select').selectOption({ label: 'Perfect' })
  const fieldsLoaded = page.waitForResponse((response) =>
    procedures(response.url()).includes('customFieldDefinitions.getByEmulator'),
  )
  await selectAutocompleteOption(page, /search for emulators/i, 'Ryujinx')
  await fieldsLoaded
  await expect(page.getByText('Loading emulator-specific fields...')).toBeHidden()
  await page.getByPlaceholder(/share your experience/i).fill('Browser validation test')
  if (includeFields) await expect(page.getByLabel(/Driver Version/)).toBeVisible()
  return createRequests
}

test.describe('Handheld report custom-field validation', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('blocks submission with an empty required custom field', async ({ page }) => {
    const requests = await prepareForm(page)
    await page.getByRole('button', { name: 'Create Compatibility Report', exact: true }).click()

    await expect(page.getByText('Driver Version is required', { exact: true })).toBeVisible()
    expect(requests).toHaveLength(0)
  })

  test('submits the values displayed by the custom-field controls', async ({ page }) => {
    await prepareForm(page)
    await page.getByLabel(/Driver Version/).fill('v1.0.0')
    await page.locator('select[name="Graphics Setting"]').selectOption('high')
    const submitted = page.waitForRequest(isCreateRequest)
    await page.getByRole('button', { name: 'Create Compatibility Report', exact: true }).click()
    const payload = CreateInputEnvelope.parse((await submitted).postDataJSON())

    expect(payload['0']?.json.customFieldValues).toEqual([
      { customFieldDefinitionId: TEXT_FIELD_ID, value: 'v1.0.0' },
      { customFieldDefinitionId: SELECT_FIELD_ID, value: 'high' },
    ])
  })

  test('names missing custom fields in the validation summary', async ({ page }) => {
    const requests = await prepareForm(page)
    await page.locator('select[name="Graphics Setting"]').selectOption('')
    await page.getByRole('button', { name: 'Create Compatibility Report', exact: true }).click()

    await expect(
      page.getByRole('heading', { name: 'Please fix the following errors:' }),
    ).toBeVisible()
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Driver Version: Driver Version is required' }),
    ).toBeVisible()
    await expect(
      page
        .getByRole('listitem')
        .filter({ hasText: 'Graphics Setting: Graphics Setting is required' }),
    ).toBeVisible()
    expect(requests).toHaveLength(0)
  })

  test('omits custom-field controls when the emulator has no fields', async ({ page }) => {
    await prepareForm(page, false)
    await expect(page.getByRole('heading', { name: /Emulator-Specific Details/ })).toHaveCount(0)
    const submitted = page.waitForRequest(isCreateRequest)
    await page.getByRole('button', { name: 'Create Compatibility Report', exact: true }).click()
    const payload = CreateInputEnvelope.parse((await submitted).postDataJSON())
    expect(payload['0']?.json.customFieldValues).toEqual([])
  })
})
