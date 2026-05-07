import { PlatformScope, type PrismaClient } from '@orm'

type PlatformData = {
  name: string
  slug: string
  scope: PlatformScope
  sortOrder: number
}

export const PLATFORMS: PlatformData[] = [
  { name: 'Android', slug: 'android', scope: PlatformScope.MOBILE, sortOrder: 10 },
  { name: 'iOS', slug: 'ios', scope: PlatformScope.MOBILE, sortOrder: 20 },
  { name: 'Windows x86', slug: 'windows-x86', scope: PlatformScope.DESKTOP, sortOrder: 30 },
  { name: 'Windows ARM', slug: 'windows-arm', scope: PlatformScope.DESKTOP, sortOrder: 40 },
  { name: 'macOS x86', slug: 'macos-x86', scope: PlatformScope.DESKTOP, sortOrder: 50 },
  { name: 'macOS ARM', slug: 'macos-arm', scope: PlatformScope.DESKTOP, sortOrder: 60 },
  { name: 'Linux x86', slug: 'linux-x86', scope: PlatformScope.DESKTOP, sortOrder: 70 },
  { name: 'Linux ARM', slug: 'linux-arm', scope: PlatformScope.UNIVERSAL, sortOrder: 80 },
  { name: 'FreeBSD', slug: 'freebsd', scope: PlatformScope.DESKTOP, sortOrder: 90 },
]

async function platformsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding platforms...')

  for (const platform of PLATFORMS) {
    await prisma.platform.upsert({
      where: { slug: platform.slug },
      update: {
        name: platform.name,
        scope: platform.scope,
        sortOrder: platform.sortOrder,
      },
      create: platform,
    })
  }

  console.info('✅ Platforms seeded successfully')
}

export default platformsSeeder
