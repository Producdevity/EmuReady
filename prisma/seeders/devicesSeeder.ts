import { type PrismaClient } from '@orm'

type DeviceData = {
  brandName: string
  modelName: string
}

const devices: DeviceData[] = [
  { brandName: 'ASUS', modelName: 'ROG Ally RC71L' },
  { brandName: 'ASUS', modelName: 'ROG Ally RC71L-NH001W' },
  { brandName: 'ASUS', modelName: 'ROG Phone 5' },
  { brandName: 'ASUS', modelName: 'ROG Phone 6' },
  { brandName: 'ASUS', modelName: 'ROG Phone 7' },
  { brandName: 'AYANEO', modelName: 'Air Plus' },
  { brandName: 'AYANEO', modelName: 'Air Pro' },
  { brandName: 'AYANEO', modelName: 'Air' },
  { brandName: 'AYANEO', modelName: 'Kun' },
  { brandName: 'AYANEO', modelName: 'Next Advance' },
  { brandName: 'AYANEO', modelName: 'Next Pro' },
  { brandName: 'AYANEO', modelName: 'Next' },
  { brandName: 'AYN', modelName: 'Odin 2 Max' },
  { brandName: 'AYN', modelName: 'Odin 2 Mini' },
  { brandName: 'AYN', modelName: 'Odin 2 Portal' },
  { brandName: 'AYN', modelName: 'Odin 2' },
  { brandName: 'AYN', modelName: 'Odin' },
  { brandName: 'Anbernic', modelName: 'RG505' },
  { brandName: 'GPD', modelName: 'Win 4' },
  { brandName: 'GPD', modelName: 'Win Max 2' },
  { brandName: 'GPD', modelName: 'XP Plus' },
  { brandName: 'GPD', modelName: 'XP Plus' },
  { brandName: 'GPD', modelName: 'XP' },
  { brandName: 'Lenovo', modelName: 'Legion Go' },
  { brandName: 'Lenovo', modelName: 'Legion Phone Duel 2' },
  { brandName: 'Lenovo', modelName: 'Legion Phone Duel' },
  { brandName: 'Logitech', modelName: 'G Cloud' },
  { brandName: 'MSI', modelName: 'Claw' },
  { brandName: 'OnePlus', modelName: '10 Pro' },
  { brandName: 'OnePlus', modelName: '10T' },
  { brandName: 'OnePlus', modelName: '11' },
  { brandName: 'OnePlus', modelName: '11R' },
  { brandName: 'OnePlus', modelName: '12' },
  { brandName: 'OnePlus', modelName: '12R' },
  { brandName: 'OnePlus', modelName: '13' },
  { brandName: 'OnePlus', modelName: '13R' },
  { brandName: 'OnePlus', modelName: '9 Pro' },
  { brandName: 'OnePlus', modelName: 'Open' },
  { brandName: 'Pimax', modelName: 'Portal' },
  { brandName: 'Razer', modelName: 'Edge 5G' },
  { brandName: 'Razer', modelName: 'Edge' },
  { brandName: 'RedMagic', modelName: '10 Air' },
  { brandName: 'RedMagic', modelName: '10 Pro' },
  { brandName: 'RedMagic', modelName: '7' },
  { brandName: 'RedMagic', modelName: '8 Pro' },
  { brandName: 'RedMagic', modelName: '9 Pro' },
  { brandName: 'Retroid', modelName: 'Pocket 3' },
  { brandName: 'Retroid', modelName: 'Pocket 4 Pro' },
  { brandName: 'Retroid', modelName: 'Pocket 4' },
  { brandName: 'Retroid', modelName: 'Pocket 5' },
  { brandName: 'Retroid', modelName: 'Pocket Classic' },
  { brandName: 'Retroid', modelName: 'Pocket Flip 2' },
  { brandName: 'Retroid', modelName: 'Pocket Flip' },
  { brandName: 'Retroid', modelName: 'Pocket Mini V2' },
  { brandName: 'Retroid', modelName: 'Pocket Mini' },
  { brandName: 'Valve', modelName: 'Steam Deck' },
  { brandName: 'Xiaomi', modelName: 'Black Shark 4' },
  { brandName: 'Xiaomi', modelName: 'Black Shark 5 Pro' },
  { brandName: 'Xiaomi', modelName: 'Black Shark 5' },
]

async function devicesSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding devices...')

  // Track created brands
  const brandMap = new Map<string, string>()

  for (const device of devices) {
    let brandId = brandMap.get(device.brandName)

    // Create brand if it doesn't exist yet
    if (!brandId) {
      const brand = await prisma.deviceBrand.upsert({
        where: { name: device.brandName },
        update: {},
        create: { name: device.brandName },
      })

      brandId = brand.id
      brandMap.set(device.brandName, brandId)
    }

    // Create the device with reference to brand if it doesn't exist
    await prisma.device.upsert({
      where: {
        brandId_modelName: {
          brandId,
          modelName: device.modelName,
        },
      },
      update: {},
      create: {
        brandId,
        modelName: device.modelName,
      },
    })
  }

  console.log('✅ Devices seeded successfully')
}

export default devicesSeeder
