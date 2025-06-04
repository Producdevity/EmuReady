import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/server/db'
import { customFieldTemplateRouter } from './customFieldTemplates'
import { CustomFieldType, Role } from '@orm'
import { TRPCError } from '@trpc/server'
import type { TRPCContext } from '@/server/api/trpc'

vi.mock('@/server/db', () => ({
  prisma: {
    customFieldTemplate: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customFieldDefinition: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const mockPrisma = prisma as any

// Create mock TRPC context
function createMockTRPCContext({ role }: { role: Role }): TRPCContext {
  return {
    session: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role,
      },
    },
    prisma: mockPrisma,
  }
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

      mockPrisma.customFieldTemplate.create.mockResolvedValue(mockTemplate)

      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      const result = await caller.create({
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
      })

      expect(result).toEqual(mockTemplate)
    })

    it('should require SUPER_ADMIN permission', async () => {
      const ctx = createMockTRPCContext({ role: Role.ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      await expect(
        caller.create({
          name: 'Test Template',
          fields: [],
        })
      ).rejects.toThrow(TRPCError)
    })

    it('should validate SELECT fields have options', async () => {
      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      await expect(
        caller.create({
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
        })
      ).rejects.toThrow('Options are required for SELECT type custom fields')
    })

    it('should validate field names are unique', async () => {
      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      await expect(
        caller.create({
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
        })
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

      mockPrisma.customFieldTemplate.findMany.mockResolvedValue(mockTemplates)

      const ctx = createMockTRPCContext({ role: Role.ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      const result = await caller.getAll()

      expect(result).toEqual(mockTemplates)
    })

    it('should require ADMIN permission', async () => {
      const ctx = createMockTRPCContext({ role: Role.USER })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      await expect(caller.getAll()).rejects.toThrow(TRPCError)
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
        name: 'driver_version',
        label: 'Driver Version',
        type: CustomFieldType.TEXT,
        options: null,
        isRequired: true,
        displayOrder: 0,
      }

      mockPrisma.customFieldTemplate.findMany.mockResolvedValue(mockTemplates)
      mockPrisma.customFieldDefinition.findMany.mockResolvedValue(mockExistingFields)
      mockPrisma.customFieldDefinition.create.mockResolvedValue(mockCreatedField)

      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      const result = await caller.applyToEmulator({
        emulatorId: '550e8400-e29b-41d4-a716-446655440002',
        templateIds: ['550e8400-e29b-41d4-a716-446655440000'],
      })

      expect(result).toEqual({
        createdFields: 1,
        skippedFields: 0,
        templateNames: ['Template 1'],
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
              name: 'new_field',
              label: 'New Field',
              type: CustomFieldType.TEXT,
              options: null,
              isRequired: false,
              displayOrder: 1,
            },
          ],
        },
      ]

      const mockExistingFields: any[] = [
        {
          name: 'driver_version',
          displayOrder: 0,
        },
      ]

      const mockCreatedField = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'new_field',
        label: 'New Field',
        type: CustomFieldType.TEXT,
      }

      mockPrisma.customFieldTemplate.findMany.mockResolvedValue(mockTemplates)
      mockPrisma.customFieldDefinition.findMany.mockResolvedValue(mockExistingFields)
      mockPrisma.customFieldDefinition.create.mockResolvedValue(mockCreatedField)

      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      const result = await caller.applyToEmulator({
        emulatorId: '550e8400-e29b-41d4-a716-446655440002',
        templateIds: ['550e8400-e29b-41d4-a716-446655440000'],
      })

      expect(result).toEqual({
        createdFields: 1,
        skippedFields: 1,
        templateNames: ['Template 1'],
      })
    })

    it('should throw error when all fields already exist', async () => {
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

      const mockExistingFields: any[] = [
        {
          name: 'driver_version',
          displayOrder: 0,
        },
      ]

      mockPrisma.customFieldTemplate.findMany.mockResolvedValue(mockTemplates)
      mockPrisma.customFieldDefinition.findMany.mockResolvedValue(mockExistingFields)

      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      await expect(
        caller.applyToEmulator({
          emulatorId: '550e8400-e29b-41d4-a716-446655440002',
          templateIds: ['550e8400-e29b-41d4-a716-446655440000'],
        })
      ).rejects.toThrow('All fields from the selected templates already exist for this emulator')
    })

    it('should require SUPER_ADMIN permission', async () => {
      const ctx = createMockTRPCContext({ role: Role.ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      await expect(
        caller.applyToEmulator({
          emulatorId: '550e8400-e29b-41d4-a716-446655440002',
          templateIds: ['550e8400-e29b-41d4-a716-446655440000'],
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('update', () => {
    it('should update template successfully', async () => {
      const mockExistingTemplate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        fields: [],
      }

      const mockUpdatedTemplate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Template',
        description: 'Updated description',
        fields: [],
      }

      mockPrisma.customFieldTemplate.findUnique.mockResolvedValue(mockExistingTemplate)
      mockPrisma.customFieldTemplate.update.mockResolvedValue(mockUpdatedTemplate)

      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      const result = await caller.update({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Template',
        description: 'Updated description',
      })

      expect(result).toEqual(mockUpdatedTemplate)
    })

    it('should throw error if template not found', async () => {
      mockPrisma.customFieldTemplate.findUnique.mockResolvedValue(null)

      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      await expect(
        caller.update({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Updated Template',
        })
      ).rejects.toThrow('Custom field template not found')
    })
  })

  describe('delete', () => {
    it('should delete template successfully', async () => {
      const mockTemplate = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Template to Delete',
      }

      mockPrisma.customFieldTemplate.findUnique.mockResolvedValue(mockTemplate)
      mockPrisma.customFieldTemplate.delete.mockResolvedValue(mockTemplate)

      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      const result = await caller.delete({ id: '550e8400-e29b-41d4-a716-446655440000' })

      expect(result).toEqual(mockTemplate)
    })

    it('should throw error if template not found', async () => {
      mockPrisma.customFieldTemplate.findUnique.mockResolvedValue(null)

      const ctx = createMockTRPCContext({ role: Role.SUPER_ADMIN })
      const caller = customFieldTemplateRouter.createCaller(ctx)

      await expect(caller.delete({ id: '550e8400-e29b-41d4-a716-446655440000' })).rejects.toThrow('Custom field template not found')
    })
  })
}) 