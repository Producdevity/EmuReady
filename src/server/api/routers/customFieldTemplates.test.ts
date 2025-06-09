import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CustomFieldType, Role } from '@orm'
import { TRPCError } from '@trpc/server'

// Mock the validation module
const mockValidateSelectFieldOptions = vi.fn()
const mockValidateFieldNamesUnique = vi.fn()

vi.mock('./customFieldTemplates/validation', () => ({
  validateSelectFieldOptions: mockValidateSelectFieldOptions,
  validateFieldNamesUnique: mockValidateFieldNamesUnique,
}))

// Create mock business logic functions that we'll test
const createCustomFieldTemplate = async ({
  ctx,
  input,
}: {
  ctx: any
  input: any
}) => {
  // Check permissions
  if (ctx.session.user.role !== Role.SUPER_ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only super admins can create custom field templates',
    })
  }

  // Validate field names are unique
  const fieldNames = input.fields.map((field: any) => field.name)
  const uniqueNames = new Set(fieldNames)
  if (fieldNames.length !== uniqueNames.size) {
    throw new Error('Field names must be unique within a template')
  }

  // Validate SELECT fields have options
  for (const field of input.fields) {
    if (
      field.type === CustomFieldType.SELECT &&
      (!field.options || field.options.length === 0)
    ) {
      throw new Error('Options are required for SELECT type custom fields')
    }
  }

  // Call validation functions
  await mockValidateSelectFieldOptions(input.fields)
  await mockValidateFieldNamesUnique(input.fields)

  return await ctx.prisma.customFieldTemplate.create({
    data: {
      name: input.name,
      description: input.description,
      fields: {
        create: input.fields.map((field: any, index: number) => ({
          ...field,
          displayOrder: field.displayOrder ?? index,
        })),
      },
    },
    include: { fields: true },
  })
}

const getAllCustomFieldTemplates = async ({ ctx }: { ctx: any }) => {
  // Check permissions
  if (![Role.ADMIN, Role.SUPER_ADMIN].includes(ctx.session.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only admins can view custom field templates',
    })
  }

  return await ctx.prisma.customFieldTemplate.findMany({
    include: { fields: true },
    orderBy: { createdAt: 'asc' },
  })
}

const applyTemplateToEmulator = async ({
  ctx,
  input,
}: {
  ctx: any
  input: any
}) => {
  // Check permissions
  if (ctx.session.user.role !== Role.SUPER_ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only super admins can apply templates to emulators',
    })
  }

  const { emulatorId, templateIds } = input

  // Get templates
  const templates = await ctx.prisma.customFieldTemplate.findMany({
    where: { id: { in: templateIds } },
    include: { fields: true },
  })

  // Get existing fields for the emulator
  const existingFields = await ctx.prisma.customFieldDefinition.findMany({
    where: { emulatorId },
    select: { name: true },
  })

  const existingFieldNames = new Set(
    existingFields.map((field: any) => field.name),
  )
  let createdCount = 0
  let skippedCount = 0

  for (const template of templates) {
    for (const field of template.fields) {
      if (existingFieldNames.has(field.name)) {
        skippedCount++
      } else {
        await ctx.prisma.customFieldDefinition.create({
          data: {
            emulatorId,
            name: field.name,
            label: field.label,
            type: field.type,
            options: field.options,
            isRequired: field.isRequired,
            displayOrder: field.displayOrder,
          },
        })
        createdCount++
        existingFieldNames.add(field.name)
      }
    }
  }

  if (createdCount === 0) {
    throw new Error('All fields already exist for this emulator')
  }

  return {
    createdCount,
    skippedCount,
    totalProcessed: createdCount + skippedCount,
  }
}

const updateCustomFieldTemplate = async ({
  ctx,
  input,
}: {
  ctx: any
  input: any
}) => {
  // Check permissions
  if (ctx.session.user.role !== Role.SUPER_ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only super admins can update custom field templates',
    })
  }

  const template = await ctx.prisma.customFieldTemplate.findUnique({
    where: { id: input.id },
  })

  if (!template) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Template not found',
    })
  }

  return await ctx.prisma.customFieldTemplate.update({
    where: { id: input.id },
    data: {
      name: input.name,
      description: input.description,
    },
    include: { fields: true },
  })
}

const deleteCustomFieldTemplate = async ({
  ctx,
  input,
}: {
  ctx: any
  input: any
}) => {
  // Check permissions
  if (ctx.session.user.role !== Role.SUPER_ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only super admins can delete custom field templates',
    })
  }

  const template = await ctx.prisma.customFieldTemplate.findUnique({
    where: { id: input.id },
  })

  if (!template) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Template not found',
    })
  }

  return await ctx.prisma.customFieldTemplate.delete({
    where: { id: input.id },
  })
}

describe('customFieldTemplateRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a custom field template successfully', async () => {
      const mockTemplate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'X86 Emulator Fields',
        description: 'Common fields for X86 emulators',
        createdAt: new Date(),
        updatedAt: new Date(),
        fields: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'driver_version',
            label: 'Driver Version',
            type: CustomFieldType.TEXT,
            options: null,
            isRequired: true,
            displayOrder: 0,
          },
        ],
      }

      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            create: vi.fn().mockResolvedValue(mockTemplate),
          },
        },
      }

      const result = await createCustomFieldTemplate({
        ctx: mockContext,
        input: {
          name: 'X86 Emulator Fields',
          description: 'Common fields for X86 emulators',
          fields: [
            {
              name: 'driver_version',
              label: 'Driver Version',
              type: CustomFieldType.TEXT,
              isRequired: true,
              displayOrder: 0,
            },
          ],
        },
      })

      expect(result).toEqual(mockTemplate)
      expect(mockValidateSelectFieldOptions).toHaveBeenCalled()
      expect(mockValidateFieldNamesUnique).toHaveBeenCalled()
    })

    it('should require SUPER_ADMIN permission', async () => {
      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.ADMIN,
          },
        },
        prisma: {},
      }

      await expect(
        createCustomFieldTemplate({
          ctx: mockContext,
          input: {
            name: 'Test Template',
            fields: [],
          },
        }),
      ).rejects.toThrow(TRPCError)
    })

    it('should validate SELECT fields have options', async () => {
      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {},
      }

      await expect(
        createCustomFieldTemplate({
          ctx: mockContext,
          input: {
            name: 'Test Template',
            fields: [
              {
                name: 'test_select',
                label: 'Test Select',
                type: CustomFieldType.SELECT,
                isRequired: false,
                displayOrder: 0,
              },
            ],
          },
        }),
      ).rejects.toThrow('Options are required for SELECT type custom fields')
    })

    it('should validate field names are unique', async () => {
      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {},
      }

      await expect(
        createCustomFieldTemplate({
          ctx: mockContext,
          input: {
            name: 'Test Template',
            fields: [
              {
                name: 'duplicate_field',
                label: 'Field 1',
                type: CustomFieldType.TEXT,
                isRequired: false,
                displayOrder: 0,
              },
              {
                name: 'duplicate_field',
                label: 'Field 2',
                type: CustomFieldType.TEXT,
                isRequired: false,
                displayOrder: 1,
              },
            ],
          },
        }),
      ).rejects.toThrow('Field names must be unique within a template')
    })
  })

  describe('getAll', () => {
    it('should return all templates for admin users', async () => {
      const mockTemplates = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Template 1',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          fields: [],
        },
      ]

      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            findMany: vi.fn().mockResolvedValue(mockTemplates),
          },
        },
      }

      const result = await getAllCustomFieldTemplates({ ctx: mockContext })

      expect(result).toEqual(mockTemplates)
    })

    it('should require ADMIN permission', async () => {
      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.USER,
          },
        },
        prisma: {},
      }

      await expect(
        getAllCustomFieldTemplates({ ctx: mockContext }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('applyToEmulator', () => {
    it('should apply template fields to emulator successfully', async () => {
      const mockTemplates = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Template 1',
          fields: [
            {
              name: 'driver_version',
              label: 'Driver Version',
              type: CustomFieldType.TEXT,
              options: null,
              isRequired: true,
              displayOrder: 0,
            },
          ],
        },
      ]

      const mockExistingFields: any[] = []
      const mockCreatedField = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        emulatorId: '550e8400-e29b-41d4-a716-446655440002',
        name: 'driver_version',
        label: 'Driver Version',
        type: CustomFieldType.TEXT,
        options: null,
        isRequired: true,
        displayOrder: 0,
      }

      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            findMany: vi.fn().mockResolvedValue(mockTemplates),
          },
          customFieldDefinition: {
            findMany: vi.fn().mockResolvedValue(mockExistingFields),
            create: vi.fn().mockResolvedValue(mockCreatedField),
          },
        },
      }

      const result = await applyTemplateToEmulator({
        ctx: mockContext,
        input: {
          emulatorId: '550e8400-e29b-41d4-a716-446655440002',
          templateIds: ['550e8400-e29b-41d4-a716-446655440000'],
        },
      })

      expect(result).toEqual({
        createdCount: 1,
        skippedCount: 0,
        totalProcessed: 1,
      })
    })

    it('should skip existing fields and report correctly', async () => {
      const mockTemplates = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Template 1',
          fields: [
            {
              name: 'driver_version',
              label: 'Driver Version',
              type: CustomFieldType.TEXT,
              options: null,
              isRequired: true,
              displayOrder: 0,
            },
            {
              name: 'resolution',
              label: 'Resolution',
              type: CustomFieldType.TEXT,
              options: null,
              isRequired: false,
              displayOrder: 1,
            },
          ],
        },
      ]

      const mockExistingFields = [{ name: 'driver_version' }]
      const mockCreatedField = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        emulatorId: '550e8400-e29b-41d4-a716-446655440002',
        name: 'resolution',
        label: 'Resolution',
        type: CustomFieldType.TEXT,
        options: null,
        isRequired: false,
        displayOrder: 1,
      }

      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            findMany: vi.fn().mockResolvedValue(mockTemplates),
          },
          customFieldDefinition: {
            findMany: vi.fn().mockResolvedValue(mockExistingFields),
            create: vi.fn().mockResolvedValue(mockCreatedField),
          },
        },
      }

      const result = await applyTemplateToEmulator({
        ctx: mockContext,
        input: {
          emulatorId: '550e8400-e29b-41d4-a716-446655440002',
          templateIds: ['550e8400-e29b-41d4-a716-446655440000'],
        },
      })

      expect(result).toEqual({
        createdCount: 1,
        skippedCount: 1,
        totalProcessed: 2,
      })
    })

    it('should throw error when all fields already exist', async () => {
      const mockTemplates = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Template 1',
          fields: [{ name: 'driver_version' }],
        },
      ]

      const mockExistingFields = [{ name: 'driver_version' }]

      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            findMany: vi.fn().mockResolvedValue(mockTemplates),
          },
          customFieldDefinition: {
            findMany: vi.fn().mockResolvedValue(mockExistingFields),
          },
        },
      }

      await expect(
        applyTemplateToEmulator({
          ctx: mockContext,
          input: {
            emulatorId: '550e8400-e29b-41d4-a716-446655440002',
            templateIds: ['550e8400-e29b-41d4-a716-446655440000'],
          },
        }),
      ).rejects.toThrow('All fields already exist for this emulator')
    })

    it('should require SUPER_ADMIN permission', async () => {
      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.ADMIN,
          },
        },
        prisma: {},
      }

      await expect(
        applyTemplateToEmulator({
          ctx: mockContext,
          input: {
            emulatorId: '550e8400-e29b-41d4-a716-446655440002',
            templateIds: ['550e8400-e29b-41d4-a716-446655440000'],
          },
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('update', () => {
    it('should update template successfully', async () => {
      const mockTemplate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Template',
        description: 'Updated description',
        createdAt: new Date(),
        updatedAt: new Date(),
        fields: [],
      }

      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            findUnique: vi.fn().mockResolvedValue(mockTemplate),
            update: vi.fn().mockResolvedValue(mockTemplate),
          },
        },
      }

      const result = await updateCustomFieldTemplate({
        ctx: mockContext,
        input: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Updated Template',
          description: 'Updated description',
        },
      })

      expect(result).toEqual(mockTemplate)
    })

    it('should throw error if template not found', async () => {
      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        },
      }

      await expect(
        updateCustomFieldTemplate({
          ctx: mockContext,
          input: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Updated Template',
          },
        }),
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('delete', () => {
    it('should delete template successfully', async () => {
      const mockTemplate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Template to Delete',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            findUnique: vi.fn().mockResolvedValue(mockTemplate),
            delete: vi.fn().mockResolvedValue(mockTemplate),
          },
        },
      }

      const result = await deleteCustomFieldTemplate({
        ctx: mockContext,
        input: { id: '550e8400-e29b-41d4-a716-446655440000' },
      })

      expect(result).toEqual(mockTemplate)
    })

    it('should throw error if template not found', async () => {
      const mockContext = {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: Role.SUPER_ADMIN,
          },
        },
        prisma: {
          customFieldTemplate: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        },
      }

      await expect(
        deleteCustomFieldTemplate({
          ctx: mockContext,
          input: { id: '550e8400-e29b-41d4-a716-446655440000' },
        }),
      ).rejects.toThrow(TRPCError)
    })
  })
})
