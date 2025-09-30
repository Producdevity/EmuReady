import { AppError } from '@/lib/errors'
import { type Prisma } from '@orm'
import { BaseRepository } from './base.repository'

export class ReleasesRepository extends BaseRepository {
  static readonly includes = {
    minimal: {} satisfies Prisma.ReleaseInclude,
  } as const

  async create(data: {
    channel: string
    versionCode: number
    versionName: string
    fileKey: string
    fileSha256: string
    sizeBytes: bigint | number
    notes?: string | null
  }) {
    // Ensure unique (channel, versionCode)
    const dup = await this.prisma.release.findFirst({
      where: { channel: data.channel, versionCode: data.versionCode },
      select: { id: true },
    })
    if (dup) return AppError.conflict('Release with this channel and versionCode already exists')

    return this.handleDatabaseOperation(
      () =>
        this.prisma.release.create({
          data: {
            channel: data.channel,
            versionCode: data.versionCode,
            versionName: data.versionName,
            fileKey: data.fileKey,
            fileSha256: data.fileSha256,
            sizeBytes: typeof data.sizeBytes === 'number' ? BigInt(data.sizeBytes) : data.sizeBytes,
            notes: data.notes ?? null,
          },
          include: ReleasesRepository.includes.minimal,
        }),
      'Release',
    )
  }

  async latest(channel: string) {
    return this.prisma.release.findFirst({
      where: { channel },
      orderBy: [{ versionCode: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async list(params?: { channel?: string; limit?: number }) {
    return this.prisma.release.findMany({
      where: params?.channel ? { channel: params.channel } : undefined,
      orderBy: [{ versionCode: 'desc' }, { createdAt: 'desc' }],
      take: params?.limit ?? 50,
      include: ReleasesRepository.includes.minimal,
    })
  }

  async delete(id: string) {
    return this.handleDatabaseOperation(
      () => this.prisma.release.delete({ where: { id } }),
      'Release',
    )
  }
}
