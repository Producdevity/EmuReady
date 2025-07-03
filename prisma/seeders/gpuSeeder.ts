import { type PrismaClient } from '@orm'

const gpuSeeder = async (prisma: PrismaClient) => {
  console.info('🌱 Seeding GPUs...')

  // Create GPU brands first
  const nvidiaBrand = await prisma.deviceBrand.upsert({
    where: { name: 'NVIDIA' },
    update: {},
    create: { name: 'NVIDIA' },
  })

  const amdBrand = await prisma.deviceBrand.upsert({
    where: { name: 'AMD' },
    update: {},
    create: { name: 'AMD' },
  })

  const intelBrand = await prisma.deviceBrand.upsert({
    where: { name: 'Intel' },
    update: {},
    create: { name: 'Intel' },
  })

  // NVIDIA GPUs from last 10 years
  const nvidiaGpus = [
    // RTX 40 Series (2022-2023)
    'GeForce RTX 4090',
    'GeForce RTX 4080',
    'GeForce RTX 4070 Ti',
    'GeForce RTX 4070',
    'GeForce RTX 4060 Ti',
    'GeForce RTX 4060',
    // RTX 30 Series (2020-2021)
    'GeForce RTX 3090 Ti',
    'GeForce RTX 3090',
    'GeForce RTX 3080 Ti',
    'GeForce RTX 3080',
    'GeForce RTX 3070 Ti',
    'GeForce RTX 3070',
    'GeForce RTX 3060 Ti',
    'GeForce RTX 3060',
    'GeForce RTX 3050',
    // RTX 20 Series (2018-2019)
    'GeForce RTX 2080 Ti',
    'GeForce RTX 2080 Super',
    'GeForce RTX 2080',
    'GeForce RTX 2070 Super',
    'GeForce RTX 2070',
    'GeForce RTX 2060 Super',
    'GeForce RTX 2060',
    // GTX 16 Series (2019)
    'GeForce GTX 1660 Ti',
    'GeForce GTX 1660 Super',
    'GeForce GTX 1660',
    'GeForce GTX 1650 Super',
    'GeForce GTX 1650',
    // GTX 10 Series (2016-2017)
    'GeForce GTX 1080 Ti',
    'GeForce GTX 1080',
    'GeForce GTX 1070 Ti',
    'GeForce GTX 1070',
    'GeForce GTX 1060 6GB',
    'GeForce GTX 1060 3GB',
    'GeForce GTX 1050 Ti',
    'GeForce GTX 1050',
    // GTX 900 Series (2014-2015)
    'GeForce GTX 980 Ti',
    'GeForce GTX 980',
    'GeForce GTX 970',
    'GeForce GTX 960',
    'GeForce GTX 950',
  ]

  // AMD GPUs from last 10 years
  const amdGpus = [
    // RX 7000 Series (2022-2023)
    'Radeon RX 7900 XTX',
    'Radeon RX 7900 XT',
    'Radeon RX 7800 XT',
    'Radeon RX 7700 XT',
    'Radeon RX 7600',
    // RX 6000 Series (2020-2021)
    'Radeon RX 6950 XT',
    'Radeon RX 6900 XT',
    'Radeon RX 6800 XT',
    'Radeon RX 6800',
    'Radeon RX 6750 XT',
    'Radeon RX 6700 XT',
    'Radeon RX 6650 XT',
    'Radeon RX 6600 XT',
    'Radeon RX 6600',
    'Radeon RX 6500 XT',
    'Radeon RX 6400',
    // RX 5000 Series (2019-2020)
    'Radeon RX 5700 XT',
    'Radeon RX 5700',
    'Radeon RX 5600 XT',
    'Radeon RX 5500 XT',
    // RX 500 Series (2017-2018)
    'Radeon RX 590',
    'Radeon RX 580',
    'Radeon RX 570',
    'Radeon RX 560',
    'Radeon RX 550',
    // RX 400 Series (2016)
    'Radeon RX 480',
    'Radeon RX 470',
    'Radeon RX 460',
    // R9 Series (2014-2015)
    'Radeon R9 Fury X',
    'Radeon R9 Fury',
    'Radeon R9 390X',
    'Radeon R9 390',
    'Radeon R9 380X',
    'Radeon R9 380',
    'Radeon R9 290X',
    'Radeon R9 290',
    'Radeon R9 285',
    'Radeon R9 280X',
    'Radeon R9 280',
    'Radeon R9 270X',
    'Radeon R9 270',
  ]

  // Intel GPUs (Arc series 2022-2023)
  const intelGpus = ['Arc A770', 'Arc A750', 'Arc A580', 'Arc A380', 'Arc A310']

  // Seed NVIDIA GPUs
  for (const modelName of nvidiaGpus) {
    await prisma.gpu.upsert({
      where: {
        brandId_modelName: {
          brandId: nvidiaBrand.id,
          modelName,
        },
      },
      update: {},
      create: {
        brandId: nvidiaBrand.id,
        modelName,
      },
    })
  }

  // Seed AMD GPUs
  for (const modelName of amdGpus) {
    await prisma.gpu.upsert({
      where: {
        brandId_modelName: {
          brandId: amdBrand.id,
          modelName,
        },
      },
      update: {},
      create: {
        brandId: amdBrand.id,
        modelName,
      },
    })
  }

  // Seed Intel GPUs
  for (const modelName of intelGpus) {
    await prisma.gpu.upsert({
      where: {
        brandId_modelName: {
          brandId: intelBrand.id,
          modelName,
        },
      },
      update: {},
      create: {
        brandId: intelBrand.id,
        modelName,
      },
    })
  }

  console.info(
    `✅ GPUs seeded: ${nvidiaGpus.length} NVIDIA + ${amdGpus.length} AMD + ${intelGpus.length} Intel`,
  )
}

export default gpuSeeder
