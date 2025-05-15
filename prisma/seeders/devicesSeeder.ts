import { type PrismaClient, type Device } from '@orm'

type DeviceData = Pick<Device, 'brand' | 'modelName'>

const devices: DeviceData[] = [
  { brand: 'Retroid', modelName: 'Pocket 3' },
  { brand: 'Retroid', modelName: 'Pocket 4' },
  { brand: 'Retroid', modelName: 'Pocket 5' },
  { brand: 'AYN', modelName: 'Odin' },
  { brand: 'AYN', modelName: 'Odin 2' },
  { brand: 'AYN', modelName: 'Odin 2 Max' },
  { brand: 'AYN', modelName: 'Odin 2 Portal' },
  { brand: 'Valve', modelName: 'Steam Deck' },
]

async function devicesSeeder(prisma: PrismaClient) {
  await prisma.device.deleteMany()

  for (const device of devices) {
    await prisma.device.upsert({
      where: {
        brand_modelName: {
          brand: device.brand,
          modelName: device.modelName,
        },
      },
      update: {},
      create: device,
    })
  }

  console.log('Devices seeded successfully.')
}

export default devicesSeeder
