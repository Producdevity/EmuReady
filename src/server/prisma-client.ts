import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@orm/client'

type PrismaClientOptions = NonNullable<ConstructorParameters<typeof PrismaClient>[0]>
type PrismaClientConfig = Omit<PrismaClientOptions, 'adapter' | 'accelerateUrl'>
const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])

function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  return connectionString
}

function getPoolMax(connectionString: string): number | undefined {
  try {
    const url = new URL(connectionString)
    const raw = url.searchParams.get('connection_limit')
    if (raw) {
      const parsed = Number(raw)
      if (Number.isInteger(parsed) && parsed > 0) return parsed
    }

    return LOCAL_DATABASE_HOSTS.has(url.hostname.toLowerCase()) ? undefined : 1
  } catch {
    return 1
  }
}

export function createPrismaClient(options?: PrismaClientConfig) {
  const connectionString = getDatabaseUrl()
  const poolMax = getPoolMax(connectionString)

  const adapter = new PrismaPg({
    connectionString,
    ...(poolMax ? { max: poolMax } : {}),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  })

  return new PrismaClient({
    ...options,
    adapter,
  })
}
