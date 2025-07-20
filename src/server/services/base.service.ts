import { type PrismaClient } from '@orm'
import { type PaginationResult, type BaseFindParams } from './types'

interface PrismaModel {
  findMany: (args: unknown) => Promise<unknown[]>
  findUnique: (args: unknown) => Promise<unknown | null>
  count: (args: unknown) => Promise<number>
}

export abstract class BaseService<T, TWithRelations = T> {
  constructor(
    protected prisma: PrismaClient,
    protected modelName: keyof PrismaClient,
  ) {}

  protected abstract getDefaultInclude(): Record<string, unknown>
  protected abstract getSearchConditions(
    search: string,
  ): Record<string, unknown>

  async findMany(
    params: BaseFindParams,
  ): Promise<PaginationResult<TWithRelations>> {
    const { page = 1, limit = 10, search } = params

    const where = search ? this.getSearchConditions(search) : {}

    const model = this.prisma[this.modelName] as unknown as PrismaModel

    const [items, total] = await Promise.all([
      model.findMany({
        where,
        include: this.getDefaultInclude(),
        orderBy: this.getOrderBy(),
        skip: (page - 1) * limit,
        take: limit,
      }) as Promise<TWithRelations[]>,
      model.count({ where }),
    ])

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string): Promise<TWithRelations | null> {
    const model = this.prisma[this.modelName] as unknown as PrismaModel
    return model.findUnique({
      where: { id },
      include: this.getDefaultInclude(),
    }) as Promise<TWithRelations | null>
  }

  protected getOrderBy(): unknown {
    return { name: 'asc' }
  }
}
