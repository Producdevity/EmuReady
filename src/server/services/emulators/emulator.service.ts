import { type PrismaClient } from '@orm'
import { BaseService } from '../base.service'
import {
  type EmulatorWithRelations,
  type EmulatorWithDetails,
} from './emulator.types'

export class EmulatorService extends BaseService<
  EmulatorWithRelations,
  EmulatorWithRelations
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'emulator')
  }

  protected getDefaultInclude() {
    return {
      systems: true,
      _count: {
        select: {
          listings: true,
        },
      },
    }
  }

  protected getSearchConditions(search: string) {
    return {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }
  }

  async findById(id: string): Promise<EmulatorWithDetails | null> {
    return this.prisma.emulator.findUnique({
      where: { id },
      include: {
        ...this.getDefaultInclude(),
        customFieldDefinitions: true,
      },
    }) as Promise<EmulatorWithDetails | null>
  }
}
