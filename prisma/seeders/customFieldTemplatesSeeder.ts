import { CustomFieldTemplateRepository } from '@/features/emulators/custom-field-templates/server/template.repository'
import { CreateCustomFieldTemplateSchema } from '@/features/emulators/custom-field-templates/shared/template.schemas'
import { type PrismaClient } from '@orm/client'
import { customFieldTemplates } from './data/custom-field-templates'

async function customFieldTemplatesSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding custom field templates...')
  const repository = new CustomFieldTemplateRepository(prisma)
  for (const template of customFieldTemplates) {
    await repository.syncCatalogTemplate(CreateCustomFieldTemplateSchema.parse(template))
  }
  console.info('✅ Custom field templates seeded successfully')
}

export default customFieldTemplatesSeeder
