import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@orm/client'

type PrismaClientOptions = NonNullable<ConstructorParameters<typeof PrismaClient>[0]>
type PrismaClientConfig = Omit<PrismaClientOptions, 'adapter' | 'accelerateUrl'>

function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  return connectionString
}

export function createPrismaClient(options?: PrismaClientConfig) {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() })

  return new PrismaClient({
    ...options,
    adapter,
  })
}
