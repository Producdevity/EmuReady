import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { CustomFieldType, Role, type Prisma } from '@orm'
import { CustomFieldTemplateRepository } from './template.repository'
import { CustomFieldTemplateService } from './template.service'
import {
  ApplyCustomFieldTemplateSchema,
  CreateCustomFieldTemplateSchema,
  UpdateCustomFieldTemplateSchema,
} from '../shared/template.schemas'
import {
  actor,
  CATEGORY_ID,
  EMULATOR_ID,
  rangeField,
  template,
  TEMPLATE_ID,
  textField,
} from '../tests/fixtures'

const transaction = vi.hoisted(() => ({
  customFieldTemplate: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  emulator: { findUnique: vi.fn() },
  customFieldCategory: { create: vi.fn() },
  customFieldDefinition: { create: vi.fn() },
}))
const database = vi.hoisted(() => ({
  $transaction: vi.fn(),
  customFieldTemplate: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  emulator: { findUnique: vi.fn() },
  customFieldCategory: { create: vi.fn() },
  customFieldDefinition: { create: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: database }))
vi.unmock('@orm')

const transactionClient: Prisma.TransactionClient = {
  ...prisma,
  customFieldTemplate: { ...prisma.customFieldTemplate, ...transaction.customFieldTemplate },
  emulator: { ...prisma.emulator, ...transaction.emulator },
  customFieldCategory: { ...prisma.customFieldCategory, ...transaction.customFieldCategory },
  customFieldDefinition: { ...prisma.customFieldDefinition, ...transaction.customFieldDefinition },
}

function service() {
  return new CustomFieldTemplateService(new CustomFieldTemplateRepository(prisma))
}
const applyInput = ApplyCustomFieldTemplateSchema.parse({
  emulatorId: EMULATOR_ID,
  templateIds: [TEMPLATE_ID],
})
const rangeInput = {
  name: 'resolution',
  label: 'Resolution',
  type: rangeField.type,
  defaultValue: 1.5,
  rangeMin: 0.25,
  rangeMax: 4,
  rangeUnit: 'x',
  rangeDecimals: 2,
  categoryName: 'Graphics',
  categoryOrder: 3,
}

beforeEach(() => {
  vi.resetAllMocks()
  database.$transaction.mockImplementation(
    (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) => operation(transactionClient),
  )
  database.customFieldTemplate.create.mockResolvedValue({ id: TEMPLATE_ID })
  database.customFieldTemplate.update.mockResolvedValue({ id: TEMPLATE_ID })
  transaction.customFieldTemplate.findUnique.mockResolvedValue(template())
  transaction.customFieldTemplate.findMany.mockResolvedValue([template()])
  transaction.customFieldTemplate.create.mockResolvedValue({ id: TEMPLATE_ID })
  transaction.customFieldTemplate.update.mockResolvedValue({ id: TEMPLATE_ID })
  transaction.customFieldTemplate.delete.mockResolvedValue({ id: TEMPLATE_ID })
  transaction.emulator.findUnique.mockResolvedValue({
    id: EMULATOR_ID,
    customFieldCategories: [],
    customFieldDefinitions: [],
  })
  transaction.customFieldCategory.create.mockResolvedValue({ id: CATEGORY_ID })
  transaction.customFieldDefinition.create.mockResolvedValue({ id: TEMPLATE_ID })
})

afterEach(() => {
  expect(database.customFieldTemplate.findUnique).not.toHaveBeenCalled()
  expect(database.customFieldTemplate.findMany).not.toHaveBeenCalled()
  expect(database.emulator.findUnique).not.toHaveBeenCalled()
  expect(database.customFieldCategory.create).not.toHaveBeenCalled()
  expect(database.customFieldDefinition.create).not.toHaveBeenCalled()
})

describe('template attribute persistence', () => {
  it.each(['create', 'update'] as const)(
    'preserves numeric range and category settings on %s',
    async (operation) => {
      const input = { name: 'Graphics', fields: [rangeInput] }
      if (operation === 'create')
        await service().create(actor, CreateCustomFieldTemplateSchema.parse(input))
      else
        await service().update(
          actor,
          UpdateCustomFieldTemplateSchema.parse({ ...input, id: TEMPLATE_ID }),
        )
      expect(database.customFieldTemplate[operation]).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fields: expect.objectContaining({ create: [expect.objectContaining(rangeInput)] }),
          }),
        }),
      )
    },
  )

  it('duplicates all attributes, including placeholders and category order', async () => {
    await service().duplicate(actor, TEMPLATE_ID)
    expect(database.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'Serializable' }),
    )
    expect(transaction.customFieldTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Copy of Graphics',
          fields: {
            create: [
              expect.objectContaining(rangeInput),
              expect.objectContaining({
                placeholder: 'Enter a driver',
                categoryName: 'Graphics',
                categoryOrder: 3,
                defaultValue: 'custom',
              }),
            ],
          },
        }),
      }),
    )
  })

  it('keeps a copied name within the editor limit for a maximum-length original', async () => {
    transaction.customFieldTemplate.findUnique.mockResolvedValue({
      ...template(),
      name: 'x'.repeat(100),
    })
    await service().duplicate(actor, TEMPLATE_ID)
    expect(transaction.customFieldTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: `Copy of ${'x'.repeat(92)}` }),
      }),
    )
  })

  it('applies every attribute and creates a shared category once in a serializable transaction', async () => {
    await expect(service().apply(actor, applyInput)).resolves.toEqual({
      createdFields: 2,
      skippedFields: 0,
      templateNames: ['Graphics'],
    })
    expect(database.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: 'Serializable' }),
    )
    expect(transaction.customFieldCategory.create).toHaveBeenCalledOnce()
    expect(transaction.customFieldDefinition.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          defaultValue: 1.5,
          rangeMin: 0.25,
          rangeMax: 4,
          rangeUnit: 'x',
          rangeDecimals: 2,
          categoryId: CATEGORY_ID,
          categoryOrder: 3,
        }),
      }),
    )
    expect(transaction.customFieldDefinition.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          placeholder: 'Enter a driver',
          categoryId: CATEGORY_ID,
          categoryOrder: 3,
        }),
      }),
    )
  })

  it('skips existing fields and reuses their category without editing them', async () => {
    transaction.emulator.findUnique.mockResolvedValue({
      id: EMULATOR_ID,
      customFieldCategories: [{ id: CATEGORY_ID, name: 'Graphics', displayOrder: 4 }],
      customFieldDefinitions: [{ name: 'resolution', displayOrder: 9 }],
    })
    await expect(service().apply(actor, applyInput)).resolves.toMatchObject({
      createdFields: 1,
      skippedFields: 1,
    })
    expect(transaction.customFieldCategory.create).not.toHaveBeenCalled()
    expect(transaction.customFieldDefinition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'driver', displayOrder: 10 }),
      }),
    )
  })

  it.each([
    { categoryOrder: 0, fieldOrder: 2_147_483_647, distinctCategories: false },
    { categoryOrder: 0, fieldOrder: 2_147_483_646, distinctCategories: false },
    { categoryOrder: 2_147_483_647, fieldOrder: 0, distinctCategories: false },
    { categoryOrder: 2_147_483_646, fieldOrder: 0, distinctCategories: true },
  ])('rejects ordering overflow before any writes %#', async (testCase) => {
    transaction.emulator.findUnique.mockResolvedValue({
      id: EMULATOR_ID,
      customFieldCategories: [
        { id: CATEGORY_ID, name: 'Existing category', displayOrder: testCase.categoryOrder },
      ],
      customFieldDefinitions: [{ name: 'existing_field', displayOrder: testCase.fieldOrder }],
    })
    if (testCase.distinctCategories) {
      transaction.customFieldTemplate.findMany.mockResolvedValue([
        template([rangeField, { ...textField, categoryName: 'Driver settings' }]),
      ])
    }

    await expect(service().apply(actor, applyInput)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(transaction.customFieldCategory.create).not.toHaveBeenCalled()
    expect(transaction.customFieldDefinition.create).not.toHaveBeenCalled()
  })

  it('uses the final field-order slot while reusing a category already at the maximum', async () => {
    transaction.customFieldTemplate.findMany.mockResolvedValue([template([textField])])
    transaction.emulator.findUnique.mockResolvedValue({
      id: EMULATOR_ID,
      customFieldCategories: [{ id: CATEGORY_ID, name: 'Graphics', displayOrder: 2_147_483_647 }],
      customFieldDefinitions: [{ name: 'existing_field', displayOrder: 2_147_483_646 }],
    })

    await expect(service().apply(actor, applyInput)).resolves.toMatchObject({ createdFields: 1 })
    expect(transaction.customFieldCategory.create).not.toHaveBeenCalled()
    expect(transaction.customFieldDefinition.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ displayOrder: 2_147_483_647 }) }),
    )
  })

  it('uses the final category-order slot once for fields sharing a new category', async () => {
    transaction.emulator.findUnique.mockResolvedValue({
      id: EMULATOR_ID,
      customFieldCategories: [
        { id: CATEGORY_ID, name: 'Existing category', displayOrder: 2_147_483_646 },
      ],
      customFieldDefinitions: [],
    })

    await expect(service().apply(actor, applyInput)).resolves.toMatchObject({ createdFields: 2 })
    expect(transaction.customFieldCategory.create).toHaveBeenCalledOnce()
    expect(transaction.customFieldCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ displayOrder: 2_147_483_647 }) }),
    )
  })

  it('preserves the explanatory no-op error when every field already exists', async () => {
    transaction.emulator.findUnique.mockResolvedValue({
      id: EMULATOR_ID,
      customFieldCategories: [{ id: CATEGORY_ID, name: 'Graphics', displayOrder: 0 }],
      customFieldDefinitions: [
        { name: 'resolution', displayOrder: 0 },
        { name: 'driver', displayOrder: 1 },
      ],
    })
    await expect(service().apply(actor, applyInput)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'All fields from the selected templates already exist for this emulator',
    })
    expect(transaction.customFieldCategory.create).not.toHaveBeenCalled()
    expect(transaction.customFieldDefinition.create).not.toHaveBeenCalled()
  })

  it('rejects incomplete stored range settings before creating categories or fields', async () => {
    transaction.customFieldTemplate.findMany.mockResolvedValue([
      template([{ ...rangeField, rangeMin: null }]),
    ])
    await expect(service().apply(actor, applyInput)).rejects.toThrow('Edit the template')
    expect(transaction.customFieldCategory.create).not.toHaveBeenCalled()
    expect(transaction.customFieldDefinition.create).not.toHaveBeenCalled()
  })

  it('ignores unsupported dropdown placeholders left by older catalog data', async () => {
    transaction.customFieldTemplate.findMany.mockResolvedValue([
      template([
        {
          ...textField,
          type: CustomFieldType.SELECT,
          options: [{ value: 'quality', label: 'Quality' }],
          defaultValue: 'quality',
          placeholder: 'Old dropdown hint',
        },
      ]),
    ])
    await service().apply(actor, applyInput)
    expect(transaction.customFieldDefinition.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          placeholder: null,
          defaultValue: 'quality',
          options: [{ value: 'quality', label: 'Quality' }],
        }),
      }),
    )
  })

  it('does not return a success receipt when a field write fails', async () => {
    transaction.customFieldDefinition.create
      .mockResolvedValueOnce({ id: TEMPLATE_ID })
      .mockRejectedValueOnce(new Error('Write failed'))
    await expect(service().apply(actor, applyInput)).rejects.toThrow(
      'Database error during template apply',
    )
    expect(database.$transaction).toHaveBeenCalledOnce()
  })

  it('retries a serialization conflict before returning a successful application', async () => {
    database.$transaction.mockRejectedValueOnce(
      Object.assign(new Error('Write conflict'), { code: 'P2034' }),
    )
    await expect(service().apply(actor, applyInput)).resolves.toMatchObject({ createdFields: 2 })
    expect(database.$transaction).toHaveBeenCalledTimes(2)
    expect(transaction.customFieldCategory.create).toHaveBeenCalledOnce()
  })

  it('retries a conflict inside a duplicate transaction without translating it early', async () => {
    transaction.customFieldTemplate.create.mockRejectedValueOnce(
      Object.assign(new Error('Write conflict'), { code: 'P2034' }),
    )
    await expect(service().duplicate(actor, TEMPLATE_ID)).resolves.toEqual({ success: true })
    expect(database.$transaction).toHaveBeenCalledTimes(2)
    expect(transaction.customFieldTemplate.findUnique).toHaveBeenCalledTimes(2)
  })

  it('reports a duplicate template name without exposing database details', async () => {
    transaction.customFieldTemplate.create.mockRejectedValueOnce(
      Object.assign(new Error('Unique constraint'), { code: 'P2002' }),
    )
    await expect(service().duplicate(actor, TEMPLATE_ID)).rejects.toThrow('Copy of Graphics')
  })

  it('returns a retryable conflict after repeated serialization failures', async () => {
    database.$transaction.mockRejectedValue(
      Object.assign(new Error('Write conflict'), { code: 'P2034' }),
    )
    await expect(service().apply(actor, applyInput)).rejects.toThrow(
      'Template data changed. Retry the operation.',
    )
    expect(database.$transaction).toHaveBeenCalledTimes(3)
  })

  it('rejects missing targets and duplicate fields before writes', async () => {
    transaction.emulator.findUnique.mockResolvedValueOnce(null)
    await expect(service().apply(actor, applyInput)).rejects.toThrow('Emulator not found')
    transaction.customFieldTemplate.findMany.mockResolvedValue([
      template([rangeField, { ...textField, name: rangeField.name }]),
    ])
    await expect(service().apply(actor, applyInput)).rejects.toThrow('duplicate field names')
    expect(transaction.customFieldCategory.create).not.toHaveBeenCalled()
  })
})

describe('template authorization', () => {
  it.each([Role.USER, Role.AUTHOR, Role.DEVELOPER, Role.MODERATOR, Role.ADMIN])(
    'rejects writes by %s before persistence',
    async (role) => {
      const user = { ...actor, role }
      await expect(service().duplicate(user, TEMPLATE_ID)).rejects.toThrow()
      await expect(service().apply(user, applyInput)).rejects.toThrow()
      expect(transaction.customFieldTemplate.findUnique).not.toHaveBeenCalled()
      expect(database.$transaction).not.toHaveBeenCalled()
    },
  )
})
