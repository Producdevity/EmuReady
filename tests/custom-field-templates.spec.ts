import { randomUUID } from 'node:crypto'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { createPrismaClient } from '@/server/prisma-client'
import { type AppRouter, type RouterInput } from '@/types/trpc'
import { CustomFieldType } from '@orm'
import { test, expect } from './fixtures'

test.describe('Custom field template attributes', () => {
  test.use({ storageState: 'tests/.auth/super_admin.json' })

  test('preserves settings through create, edit, duplicate and apply', async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error('Expected the configured browser test base URL')
    const origin = new URL(baseURL).origin
    const prisma = createPrismaClient()
    const emulatorId = randomUUID()
    const name = `Template attributes ${randomUUID()}`
    const copyName = `Copy of ${name}`
    const fields = [
      {
        name: 'resolution',
        label: 'Resolution',
        type: CustomFieldType.RANGE,
        defaultValue: 1.5,
        rangeMin: 0.25,
        rangeMax: 4,
        rangeUnit: 'x',
        rangeDecimals: 2,
        categoryName: 'Graphics',
        categoryOrder: 3,
        displayOrder: 0,
        isRequired: true,
      },
      {
        name: 'driver',
        label: 'Driver',
        type: CustomFieldType.TEXT,
        defaultValue: 'custom',
        placeholder: 'Enter a driver',
        categoryName: 'Graphics',
        categoryOrder: 4,
        displayOrder: 1,
      },
      {
        name: 'logging',
        label: 'Logging',
        type: CustomFieldType.BOOLEAN,
        defaultValue: false,
        categoryName: 'Debug',
        categoryOrder: 0,
        displayOrder: 2,
      },
      {
        name: 'accuracy',
        label: 'Accuracy',
        type: CustomFieldType.SELECT,
        options: [{ value: 'quality', label: 'Quality' }],
        defaultValue: 'quality',
        categoryName: 'Graphics',
        categoryOrder: 5,
        displayOrder: 3,
      },
    ] satisfies RouterInput['customFieldTemplates']['create']['fields']
    const client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: new URL('/api/trpc', origin).href,
          transformer: superjson,
          headers: async () => ({
            origin,
            cookie: (await page.context().cookies(origin))
              .map((cookie) => `${cookie.name}=${cookie.value}`)
              .join('; '),
          }),
        }),
      ],
    })

    try {
      await prisma.emulator.create({ data: { id: emulatorId, name } })
      await page.goto('/admin/custom-field-templates')
      await expect(page.getByRole('button', { name: 'Create Template', exact: true })).toBeVisible()

      await client.customFieldTemplates.create.mutate({ name, fields })
      const created = (await client.customFieldTemplates.get.query()).find(
        (template) => template.name === name,
      )
      if (!created) throw new Error('Created template was absent from the template catalog')
      expect(
        (await client.customFieldTemplates.byId.query({ id: created.id })).fields,
      ).toMatchObject(fields)

      const updatedFields = fields.map((field) =>
        field.type === CustomFieldType.RANGE
          ? { ...field, defaultValue: 0, rangeMin: -1, rangeMax: 2, rangeDecimals: 4 }
          : field,
      )
      await client.customFieldTemplates.update.mutate({ id: created.id, fields: updatedFields })
      expect(
        (await client.customFieldTemplates.byId.query({ id: created.id })).fields,
      ).toMatchObject(updatedFields)

      await client.customFieldTemplates.duplicate.mutate({ id: created.id })
      const copied = (await client.customFieldTemplates.get.query()).find(
        (template) => template.name === copyName,
      )
      if (!copied) throw new Error('Duplicated template was absent from the template catalog')
      expect(copied.fields).toMatchObject(updatedFields)
      await expect(
        client.customFieldTemplates.applyToEmulator.mutate({
          emulatorId,
          templateIds: [copied.id],
        }),
      ).resolves.toMatchObject({ createdFields: fields.length, skippedFields: 0 })

      const applied = await prisma.customFieldDefinition.findMany({
        where: { emulatorId },
        include: { category: true },
        orderBy: { displayOrder: 'asc' },
      })
      expect(applied).toMatchObject(
        updatedFields.map((field) => {
          const { categoryName, ...attributes } = field
          return { ...attributes, category: { name: categoryName } }
        }),
      )
      await expect(prisma.customFieldCategory.count({ where: { emulatorId } })).resolves.toBe(2)

      const range = applied.find((field) => field.name === 'resolution')
      if (!range) throw new Error('Applied range field was absent')
      await prisma.customFieldDefinition.update({
        where: { id: range.id },
        data: { defaultValue: '0' },
      })
      const snapshot = await client.customFieldConfigs.get.query({ emulatorId })
      expect(
        snapshot.configuration.fields.find((field) => field.name === 'resolution')?.defaultValue,
      ).toBe(0)
      await expect(
        prisma.customFieldDefinition.findUnique({
          where: { id: range.id },
          select: { defaultValue: true },
        }),
      ).resolves.toEqual({ defaultValue: '0' })

      await page.reload()
      await page.getByPlaceholder('Search templates...').fill(copyName)
      const edit = page.getByRole('button', { name: 'Edit', exact: true })
      await expect(edit).toHaveCount(1)
      await edit.click()
      const defaultInput = page.getByRole('spinbutton', { name: 'Resolution default value' })
      await expect(defaultInput).toHaveValue('0')
      await defaultInput.fill('0.5')
      await page.getByRole('button', { name: 'Update Template', exact: true }).click()
      await expect
        .poll(async () => {
          const edited = await client.customFieldTemplates.byId.query({ id: copied.id })
          return edited.fields.find((field) => field.name === 'resolution')?.defaultValue
        })
        .toBe(0.5)
    } finally {
      try {
        await prisma.$transaction([
          prisma.customFieldDefinition.deleteMany({ where: { emulatorId } }),
          prisma.emulator.deleteMany({ where: { id: emulatorId } }),
          prisma.customFieldTemplate.deleteMany({ where: { name: { in: [name, copyName] } } }),
        ])
      } finally {
        await prisma.$disconnect()
      }
    }
  })
})
