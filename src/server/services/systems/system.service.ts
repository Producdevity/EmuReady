import { type PrismaClient } from '@orm'

export class SystemService {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.system.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            games: true,
            emulators: true,
          },
        },
      },
    })
  }
}
