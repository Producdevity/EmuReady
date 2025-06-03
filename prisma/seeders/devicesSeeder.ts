import { type PrismaClient } from '@orm'

type DeviceData = {
  brandName: string
  modelName: string
  socName?: string
}

const devices: DeviceData[] = [
  // ASUS
  { brandName: 'ASUS', modelName: 'ROG Ally RC71L', socName: 'AMD Z1 Extreme' },
  { brandName: 'ASUS', modelName: 'ROG Ally RC71L-NH001W', socName: 'AMD Z1' },
  { brandName: 'ASUS', modelName: 'ROG Phone 5', socName: 'Snapdragon 888' },
  {
    brandName: 'ASUS',
    modelName: 'ROG Phone 6',
    socName: 'Snapdragon 8+ Gen 1',
  },
  {
    brandName: 'ASUS',
    modelName: 'ROG Phone 7',
    socName: 'Snapdragon 8 Gen 2',
  },

  // AYANEO
  { brandName: 'AYANEO', modelName: 'Air Plus', socName: 'AMD Ryzen 7 6800U' },
  { brandName: 'AYANEO', modelName: 'Air Pro', socName: 'AMD Ryzen 7 5825U' },
  { brandName: 'AYANEO', modelName: 'Air', socName: 'AMD Ryzen 5 5560U' },
  { brandName: 'AYANEO', modelName: 'Kun', socName: 'AMD Ryzen 7 7840U' },
  {
    brandName: 'AYANEO',
    modelName: 'Next Advance',
    socName: 'AMD Ryzen 7 5800U',
  },
  { brandName: 'AYANEO', modelName: 'Next Pro', socName: 'AMD Ryzen 7 5825U' },
  { brandName: 'AYANEO', modelName: 'Next', socName: 'AMD Ryzen 7 5825U' },

  // AYN
  { brandName: 'AYN', modelName: 'Odin 2 Max', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'AYN', modelName: 'Odin 2 Mini', socName: 'Snapdragon 8 Gen 2' },
  {
    brandName: 'AYN',
    modelName: 'Odin 2 Portal',
    socName: 'Snapdragon 8 Gen 2',
  },
  { brandName: 'AYN', modelName: 'Odin 2', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'AYN', modelName: 'Odin', socName: 'Snapdragon 845' },

  // Anbernic
  { brandName: 'Anbernic', modelName: 'RG505', socName: 'Tiger T618' },
  { brandName: 'Anbernic', modelName: 'RG406H', socName: 'Tiger T820' },
  { brandName: 'Anbernic', modelName: 'RG406V', socName: 'Tiger T820' },

  // GPD
  { brandName: 'GPD', modelName: 'Win 4', socName: 'AMD Ryzen 7 6800U' },
  { brandName: 'GPD', modelName: 'Win Max 2', socName: 'AMD Ryzen 7 7840U' },
  { brandName: 'GPD', modelName: 'XP Plus', socName: 'Dimensity 1200' },
  { brandName: 'GPD', modelName: 'XP', socName: 'Helio G95' },

  // Lenovo
  { brandName: 'Lenovo', modelName: 'Legion Go', socName: 'AMD Z1 Extreme' },
  {
    brandName: 'Lenovo',
    modelName: 'Legion Phone Duel 2',
    socName: 'Snapdragon 888',
  },
  {
    brandName: 'Lenovo',
    modelName: 'Legion Phone Duel',
    socName: 'Snapdragon 865+',
  },

  // Logitech
  { brandName: 'Logitech', modelName: 'G Cloud', socName: 'Snapdragon 720G' },

  // MSI
  { brandName: 'MSI', modelName: 'Claw', socName: 'Intel Core Ultra 7 155H' },

  // OnePlus
  { brandName: 'OnePlus', modelName: '10 Pro', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'OnePlus', modelName: '10T', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'OnePlus', modelName: '11', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'OnePlus', modelName: '11R', socName: 'Snapdragon 8+ Gen 1' },
  { brandName: 'OnePlus', modelName: '12', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'OnePlus', modelName: '12R', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'OnePlus', modelName: '13', socName: 'Snapdragon 8 Elite' },
  { brandName: 'OnePlus', modelName: '13R', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'OnePlus', modelName: '9 Pro', socName: 'Snapdragon 888' },
  { brandName: 'OnePlus', modelName: 'Open', socName: 'Snapdragon 8 Gen 2' },

  // Pimax
  { brandName: 'Pimax', modelName: 'Portal', socName: 'Snapdragon 8 Gen 2' },

  // Razer
  { brandName: 'Razer', modelName: 'Edge 5G', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'Razer', modelName: 'Edge', socName: 'Snapdragon 8 Gen 1' },

  // RedMagic
  { brandName: 'RedMagic', modelName: '6R', socName: 'Snapdragon 888' },
  { brandName: 'RedMagic', modelName: '7', socName: 'Snapdragon 8 Gen 1' },
  { brandName: 'RedMagic', modelName: '7 Pro', socName: 'Snapdragon 8 Gen 1' },
  {
    brandName: 'RedMagic',
    modelName: '7S Pro',
    socName: 'Snapdragon 8+ Gen 1',
  },
  { brandName: 'RedMagic', modelName: '8 Pro', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'RedMagic', modelName: '8S Pro', socName: 'Snapdragon 8 Gen 2' },
  { brandName: 'RedMagic', modelName: '9 Pro', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'RedMagic', modelName: '9S Pro', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'RedMagic', modelName: '10 Air', socName: 'Snapdragon 8 Gen 3' },
  { brandName: 'RedMagic', modelName: '10 Pro', socName: 'Snapdragon 8 Elite' },

  { brandName: 'Retroid', modelName: 'Pocket 3', socName: 'Tiger T618' },
  {
    brandName: 'Retroid',
    modelName: 'Pocket 4 Pro',
    socName: 'Dimensity 1100',
  },
  { brandName: 'Retroid', modelName: 'Pocket 4', socName: 'Dimensity 900' },
  { brandName: 'Retroid', modelName: 'Pocket 5', socName: 'Snapdragon 865' },
  {
    brandName: 'Retroid',
    modelName: 'Pocket Classic',
    socName: 'Allwinner H700',
  },
  {
    brandName: 'Retroid',
    modelName: 'Pocket Flip 2 - SD',
    socName: 'Snapdragon 865',
  },
  { brandName: 'Retroid', modelName: 'Pocket Flip', socName: 'Allwinner A133' },
  {
    brandName: 'Retroid',
    modelName: 'Pocket Mini V2',
    socName: 'Snapdragon 865',
  },
  { brandName: 'Retroid', modelName: 'Pocket Mini', socName: 'Snapdragon 865' },

  // Valve
  { brandName: 'Valve', modelName: 'Steam Deck', socName: 'AMD Custom APU' },

  // Xiaomi
  {
    brandName: 'Xiaomi',
    modelName: 'Black Shark 4',
    socName: 'Snapdragon 870',
  },
  {
    brandName: 'Xiaomi',
    modelName: 'Black Shark 5 Pro',
    socName: 'Snapdragon 8 Gen 1',
  },
  {
    brandName: 'Xiaomi',
    modelName: 'Black Shark 5',
    socName: 'Snapdragon 870',
  },
]

async function devicesSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding devices...')

  // Track created brands and get SoCs
  const brandMap = new Map<string, string>()
  const socMap = new Map<string, string>()

  // Load all SoCs into a map for quick lookup
  const socs = await prisma.soC.findMany()
  for (const soc of socs) {
    socMap.set(soc.name, soc.id)
  }

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

    // Get SoC ID if specified
    const socId = device.socName ? socMap.get(device.socName) : undefined

    // Create the device with reference to brand and SoC if it doesn't exist
    await prisma.device.upsert({
      where: {
        brandId_modelName: {
          brandId,
          modelName: device.modelName,
        },
      },
      update: {
        socId: socId ?? null,
      },
      create: {
        brandId,
        modelName: device.modelName,
        socId: socId ?? null,
      },
    })
  }

  console.log('✅ Devices seeded successfully')
}

export default devicesSeeder
