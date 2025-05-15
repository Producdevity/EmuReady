import { type PrismaClient } from '../generated/client'

type DeviceData = {
  brand: string
  modelName: string
}

const devices: DeviceData[] = [
  { brand: 'Retroid', modelName: 'Pocket 3' },
  { brand: 'Retroid', modelName: 'Pocket 4' },
  { brand: 'Retroid', modelName: 'Pocket 5' },
  { brand: 'AYN', modelName: 'Odin' },
  { brand: 'AYN', modelName: 'Odin 2' },
  { brand: 'AYN', modelName: 'Odin 2 Max' },
  { brand: 'AYN', modelName: 'Odin 2 Portal' },
  { brand: 'AYANEO', modelName: 'Air' },
  { brand: 'AYANEO', modelName: 'Air Pro' },
  { brand: 'AYANEO', modelName: 'Air Plus' },
  { brand: 'AYANEO', modelName: 'Kun' },
  { brand: 'AYANEO', modelName: 'Next' },
  { brand: 'AYANEO', modelName: 'Next Pro' },
  { brand: 'AYANEO', modelName: 'Next Advance' },
  { brand: 'GPD', modelName: 'Win 4' },
  { brand: 'GPD', modelName: 'Win Max 2' },
  { brand: 'GPD', modelName: 'XP Plus' },
  { brand: 'ASUS', modelName: 'ROG Ally RC71L' },
  { brand: 'ASUS', modelName: 'ROG Ally RC71L-NH001W' },
  { brand: 'Lenovo', modelName: 'Legion Go' },
  { brand: 'MSI', modelName: 'Claw' },
]

async function devicesSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding devices...')
  
  // First, delete all existing devices
  await prisma.device.deleteMany()
  
  // Then create new ones
  for (const device of devices) {
    await prisma.device.create({
      data: device,
    })
  }

  console.log('✅ Devices seeded successfully')
}

export default devicesSeeder
