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

  // NVIDIA GPUs from last 20 years (2005-2025)
  const nvidiaGpus = [
    // RTX 50 Series (2025)
    'GeForce RTX 5090',
    'GeForce RTX 5080',
    'GeForce RTX 5070 Ti',
    'GeForce RTX 5070',
    'GeForce RTX 5060 Ti',
    'GeForce RTX 5060',
    'GeForce RTX 5050',
    // RTX 40 SUPER Series (2024-2025)
    'GeForce RTX 4090 Ti',
    'GeForce RTX 4080 Super',
    'GeForce RTX 4070 Ti Super',
    'GeForce RTX 4070 Super',
    'GeForce RTX 4060 Ti Super',
    // RTX 40 Series (2022-2023)
    'GeForce RTX 4090',
    'GeForce RTX 4080',
    'GeForce RTX 4070 Ti',
    'GeForce RTX 4070',
    'GeForce RTX 4060 Ti 16GB',
    'GeForce RTX 4060 Ti 8GB',
    'GeForce RTX 4060',
    'GeForce RTX 4050',
    // RTX 30 Series (2020-2021)
    'GeForce RTX 3090 Ti',
    'GeForce RTX 3090',
    'GeForce RTX 3080 Ti',
    'GeForce RTX 3080 12GB',
    'GeForce RTX 3080',
    'GeForce RTX 3070 Ti',
    'GeForce RTX 3070',
    'GeForce RTX 3060 Ti',
    'GeForce RTX 3060 12GB',
    'GeForce RTX 3060 8GB',
    'GeForce RTX 3050 8GB',
    'GeForce RTX 3050 6GB',
    'GeForce RTX 3050 4GB',
    // RTX 20 Series (2018-2019)
    'GeForce RTX 2080 Ti',
    'GeForce RTX 2080 Super',
    'GeForce RTX 2080',
    'GeForce RTX 2070 Super',
    'GeForce RTX 2070',
    'GeForce RTX 2060 Super',
    'GeForce RTX 2060 12GB',
    'GeForce RTX 2060 6GB',
    // GTX 16 Series (2019)
    'GeForce GTX 1660 Ti',
    'GeForce GTX 1660 Super',
    'GeForce GTX 1660',
    'GeForce GTX 1650 Super',
    'GeForce GTX 1650 GDDR6',
    'GeForce GTX 1650',
    'GeForce GTX 1630',
    // GTX 10 Series (2016-2017)
    'GeForce GTX 1080 Ti',
    'GeForce GTX 1080',
    'GeForce GTX 1070 Ti',
    'GeForce GTX 1070',
    'GeForce GTX 1060 6GB',
    'GeForce GTX 1060 3GB',
    'GeForce GTX 1050 Ti',
    'GeForce GTX 1050 3GB',
    'GeForce GTX 1050 2GB',
    // GTX 900 Series (2014-2015)
    'GeForce GTX 980 Ti',
    'GeForce GTX 980',
    'GeForce GTX 970',
    'GeForce GTX 960',
    'GeForce GTX 950',
    // GTX 700 Series (2013-2014)
    'GeForce GTX 780 Ti',
    'GeForce GTX 780',
    'GeForce GTX 770',
    'GeForce GTX 760',
    'GeForce GTX 750 Ti',
    'GeForce GTX 750',
    // GTX 600 Series (2012-2013)
    'GeForce GTX 690',
    'GeForce GTX 680',
    'GeForce GTX 670',
    'GeForce GTX 660 Ti',
    'GeForce GTX 660',
    'GeForce GTX 650 Ti',
    'GeForce GTX 650',
    // GTX 500 Series (2010-2011)
    'GeForce GTX 590',
    'GeForce GTX 580',
    'GeForce GTX 570',
    'GeForce GTX 560 Ti',
    'GeForce GTX 560',
    'GeForce GTX 550 Ti',
    // GTX 400 Series (2010)
    'GeForce GTX 480',
    'GeForce GTX 470',
    'GeForce GTX 460',
    'GeForce GTX 450',
    // 9000 Series (2008-2009)
    'GeForce 9800 GTX+',
    'GeForce 9800 GTX',
    'GeForce 9800 GT',
    'GeForce 9600 GT',
    'GeForce 9500 GT',
    // 8000 Series (2006-2007)
    'GeForce 8800 Ultra',
    'GeForce 8800 GTX',
    'GeForce 8800 GTS',
    'GeForce 8800 GT',
    'GeForce 8600 GTS',
    'GeForce 8600 GT',
    'GeForce 8500 GT',
    'GeForce 8400 GS',
    // 7000 Series (2005-2006)
    'GeForce 7950 GX2',
    'GeForce 7900 GTX',
    'GeForce 7900 GT',
    'GeForce 7800 GTX',
    'GeForce 7800 GT',
    'GeForce 7600 GT',
    'GeForce 7600 GS',
    'GeForce 7300 GT',
  ]

  // AMD GPUs from last 20 years (2005-2025)
  const amdGpus = [
    // RX 8000 Series RDNA 4 (2024-2025)
    'Radeon RX 8900 XTX',
    'Radeon RX 8800 XT',
    'Radeon RX 8700 XT',
    'Radeon RX 8600 XT',
    'Radeon RX 8500 XT',
    'Radeon RX 8400',
    // RX 7000 Series RDNA 3 (2022-2023)
    'Radeon RX 7900 XTX',
    'Radeon RX 7900 XT',
    'Radeon RX 7900 GRE',
    'Radeon RX 7800 XT',
    'Radeon RX 7700 XT',
    'Radeon RX 7600 XT',
    'Radeon RX 7600',
    'Radeon RX 7500 XT',
    'Radeon RX 7400',
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
    'Radeon RX 5500',
    'Radeon RX 5300',
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
    // Vega Series (2017-2018)
    'Radeon RX Vega 64',
    'Radeon RX Vega 56',
    'Radeon Vega Frontier Edition',
    'Radeon Pro Vega 64',
    'Radeon Pro Vega 56',
    'Radeon Vega 20',
    'Radeon VII',
    // R9 Series (2013-2015)
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
    // HD 7000 Series (2011-2013)
    'Radeon HD 7990',
    'Radeon HD 7970',
    'Radeon HD 7950',
    'Radeon HD 7870',
    'Radeon HD 7850',
    'Radeon HD 7770',
    'Radeon HD 7750',
    'Radeon HD 7730',
    'Radeon HD 7710',
    // HD 6000 Series (2010-2011)
    'Radeon HD 6990',
    'Radeon HD 6970',
    'Radeon HD 6950',
    'Radeon HD 6870',
    'Radeon HD 6850',
    'Radeon HD 6770',
    'Radeon HD 6750',
    'Radeon HD 6670',
    'Radeon HD 6570',
    'Radeon HD 6450',
    // HD 5000 Series (2009-2010)
    'Radeon HD 5970',
    'Radeon HD 5870',
    'Radeon HD 5850',
    'Radeon HD 5770',
    'Radeon HD 5750',
    'Radeon HD 5670',
    'Radeon HD 5570',
    'Radeon HD 5450',
    // HD 4000 Series (2008-2009)
    'Radeon HD 4890',
    'Radeon HD 4870',
    'Radeon HD 4850',
    'Radeon HD 4830',
    'Radeon HD 4770',
    'Radeon HD 4670',
    'Radeon HD 4650',
    'Radeon HD 4550',
    // HD 3000 Series (2007-2008)
    'Radeon HD 3870',
    'Radeon HD 3850',
    'Radeon HD 3690',
    'Radeon HD 3650',
    'Radeon HD 3470',
    'Radeon HD 3450',
    // HD 2000 Series (2006-2007)
    'Radeon HD 2900 XT',
    'Radeon HD 2900 Pro',
    'Radeon HD 2600 XT',
    'Radeon HD 2600 Pro',
    'Radeon HD 2400 XT',
    'Radeon HD 2400 Pro',
    // X1000 Series (2005-2006)
    'Radeon X1950 XTX',
    'Radeon X1950 Pro',
    'Radeon X1900 XTX',
    'Radeon X1900 XT',
    'Radeon X1800 XT',
    'Radeon X1800 XL',
    'Radeon X1650 Pro',
    'Radeon X1600 XT',
    'Radeon X1600 Pro',
    'Radeon X1550',
    'Radeon X1300 XT',
    'Radeon X1300 Pro',
  ]

  // Intel GPUs (2022-2025)
  const intelGpus = [
    // Arc Celestial (2025)
    'Arc C770',
    'Arc C750',
    'Arc C580',
    // Arc Battlemage (2024-2025)
    'Arc B770',
    'Arc B750',
    'Arc B580',
    'Arc B570',
    'Arc B380',
    'Arc B310',
    // Arc Alchemist (2022-2023)
    'Arc A770 16GB',
    'Arc A770 8GB',
    'Arc A750',
    'Arc A580',
    'Arc A380',
    'Arc A310',
    // Xe Graphics (integrated)
    'Xe Graphics 96EU',
    'Xe Graphics 80EU',
    'Xe Graphics 64EU',
    'Xe Graphics 48EU',
    'Xe Graphics 32EU',
  ]

  // Seed NVIDIA GPUs
  for (const modelName of nvidiaGpus) {
    console.info(`Seeding NVIDIA GPU: ${modelName}`)
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
    console.info(`Seeding AMD GPU: ${modelName}`)
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
    console.info(`Seeding Intel GPU: ${modelName}`)
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
