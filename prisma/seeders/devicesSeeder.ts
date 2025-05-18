import { type PrismaClient } from '@orm'

type DeviceData = {
  brandName: string
  modelName: string
}

const devices: DeviceData[] = [
  { brandName: 'Retroid', modelName: 'Pocket 3' },
  { brandName: 'Retroid', modelName: 'Pocket 4' },
  { brandName: 'Retroid', modelName: 'Pocket 5' },
  { brandName: 'Retroid', modelName: 'Pocket Mini' },
  { brandName: 'Retroid', modelName: 'Pocket Flip' },
  { brandName: 'Retroid', modelName: 'Pocket Flip 2' },
  { brandName: 'AYN', modelName: 'Odin' },
  { brandName: 'AYN', modelName: 'Odin 2' },
  { brandName: 'AYN', modelName: 'Odin 2 Mini' },
  { brandName: 'AYN', modelName: 'Odin 2 Max' },
  { brandName: 'AYN', modelName: 'Odin 2 Portal' },
  { brandName: 'AYANEO', modelName: 'Air' },
  { brandName: 'AYANEO', modelName: 'Air Pro' },
  { brandName: 'AYANEO', modelName: 'Air Plus' },
  { brandName: 'AYANEO', modelName: 'Kun' },
  { brandName: 'AYANEO', modelName: 'Next' },
  { brandName: 'AYANEO', modelName: 'Next Pro' },
  { brandName: 'AYANEO', modelName: 'Next Advance' },
  { brandName: 'GPD', modelName: 'Win 4' },
  { brandName: 'GPD', modelName: 'Win Max 2' },
  { brandName: 'GPD', modelName: 'XP Plus' },
  { brandName: 'ASUS', modelName: 'ROG Ally RC71L' },
  { brandName: 'ASUS', modelName: 'ROG Ally RC71L-NH001W' },
  { brandName: 'Lenovo', modelName: 'Legion Go' },
  { brandName: 'MSI', modelName: 'Claw' },
  { brandName: 'Valve', modelName: 'Steam Deck' },
]

async function devicesSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding devices...')

  // First, delete all existing devices and brands
  await prisma.device.deleteMany()
  await prisma.deviceBrand.deleteMany()

  // Track created brands
  const brandMap = new Map<string, string>()

  // Create devices with their brands
  for (const device of devices) {
    // Create brand if it doesn't exist yet
    let brandId = brandMap.get(device.brandName)

    if (!brandId) {
      const brand = await prisma.deviceBrand.create({
        data: {
          name: device.brandName,
        },
      })
      brandId = brand.id
      brandMap.set(device.brandName, brandId)
    }

    // Create the device with reference to brand
    await prisma.device.create({
      data: {
        brandId,
        modelName: device.modelName,
      },
    })
  }

  console.log('✅ Devices seeded successfully')
}

export default devicesSeeder
