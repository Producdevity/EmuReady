import type { PrismaClient } from '@orm/client'

export interface CustomFieldCategorySeed {
  name: string
  displayOrder: number
}

export async function syncCustomFieldCategories(
  prisma: PrismaClient,
  emulatorId: string,
  categories: readonly CustomFieldCategorySeed[],
) {
  const categoryIdByName = new Map<string, string>()

  for (const category of categories) {
    const syncedCategory = await prisma.customFieldCategory.upsert({
      where: {
        emulatorId_name: {
          emulatorId,
          name: category.name,
        },
      },
      create: {
        emulatorId,
        name: category.name,
        displayOrder: category.displayOrder,
      },
      update: {
        displayOrder: category.displayOrder,
      },
      select: {
        id: true,
        name: true,
      },
    })

    categoryIdByName.set(syncedCategory.name, syncedCategory.id)
  }

  return categoryIdByName
}
