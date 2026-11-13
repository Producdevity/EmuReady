import { type z } from 'zod'
import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'
import { paginatedResponse } from '@/server/utils/pagination'
import { Prisma } from '@orm'
import {
  HANDHELD_REPORT_HISTORY_SELECT,
  PC_REPORT_HISTORY_SELECT,
  mapHandheldReport,
  mapPcReport,
} from './persistence/history.prisma'
import type { GetReportHistorySchema } from '../shared/history.schemas'

export class ReportHistoryRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  async list(userId: string, input: z.output<typeof GetReportHistorySchema>) {
    const where = {
      authorId: userId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.search
        ? { game: { title: { contains: input.search, mode: Prisma.QueryMode.insensitive } } }
        : {}),
    } satisfies Prisma.ListingWhereInput & Prisma.PcListingWhereInput
    const pagination = { skip: (input.page - 1) * input.limit, take: input.limit }

    if (input.kind === 'pc') {
      const [reports, total] = await Promise.all([
        this.prisma.pcListing.findMany({
          where,
          ...pagination,
          orderBy: [{ createdAt: Prisma.SortOrder.desc }, { id: Prisma.SortOrder.desc }],
          select: PC_REPORT_HISTORY_SELECT,
        }),
        this.prisma.pcListing.count({ where }),
      ])
      return paginatedResponse({
        items: reports.map(mapPcReport),
        total,
        page: input.page,
        limit: input.limit,
      })
    }

    const [reports, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        ...pagination,
        orderBy: [{ createdAt: Prisma.SortOrder.desc }, { id: Prisma.SortOrder.desc }],
        select: HANDHELD_REPORT_HISTORY_SELECT,
      }),
      this.prisma.listing.count({ where }),
    ])
    return paginatedResponse({
      items: reports.map(mapHandheldReport),
      total,
      page: input.page,
      limit: input.limit,
    })
  }
}
