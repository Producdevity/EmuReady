import { existsSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

if (existsSync('.env.local')) {
  loadEnv({ path: '.env.local' })
} else {
  loadEnv()
}

const datasource = process.env.SHADOW_DATABASE_URL
  ? {
      url: process.env.DATABASE_DIRECT_URL ?? env('DATABASE_URL'),
      shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
    }
  : {
      url: process.env.DATABASE_DIRECT_URL ?? env('DATABASE_URL'),
    }

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  typedSql: {
    path: 'prisma/sql',
  },
  datasource,
})
