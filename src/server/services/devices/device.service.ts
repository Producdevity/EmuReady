import { type PrismaClient } from '@orm'
import { BaseService } from '../base.service'
import {
  type DeviceWithRelations,
  type DeviceBrandWithCount,
} from './device.types'

export class DeviceService extends BaseService<
  DeviceWithRelations,
  DeviceWithRelations
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'device')
  }

  protected getDefaultInclude() {
    return {
      brand: true,
      soc: {
        include: {
          cpu: true,
          gpu: true,
        },
      },
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
        { modelName: { contains: search, mode: 'insensitive' as const } },
        { brand: { name: { contains: search, mode: 'insensitive' as const } } },
        { soc: { name: { contains: search, mode: 'insensitive' as const } } },
      ],
    }
  }

  protected getOrderBy() {
    return [{ brand: { name: 'asc' } }, { modelName: 'asc' }]
  }

  async findBrands(): Promise<DeviceBrandWithCount[]> {
    return this.prisma.deviceBrand.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            devices: true,
          },
        },
      },
    })
  }
}
