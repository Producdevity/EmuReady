import { type PrismaClient } from '@orm'

const cpuSeeder = async (prisma: PrismaClient) => {
  console.info('🌱 Seeding CPUs...')

  // Create CPU brands first
  const intelBrand = await prisma.deviceBrand.upsert({
    where: { name: 'Intel' },
    update: {},
    create: { name: 'Intel' },
  })

  const amdBrand = await prisma.deviceBrand.upsert({
    where: { name: 'AMD' },
    update: {},
    create: { name: 'AMD' },
  })

  // Intel CPUs from last 10 years
  const intelCpus = [
    // 13th Gen (2022-2023)
    'Core i9-13900K',
    'Core i9-13900KF',
    'Core i7-13700K',
    'Core i7-13700KF',
    'Core i5-13600K',
    'Core i5-13600KF',
    'Core i5-13400',
    'Core i5-13400F',
    'Core i3-13100',
    'Core i3-13100F',
    // 12th Gen (2021-2022)
    'Core i9-12900K',
    'Core i9-12900KF',
    'Core i7-12700K',
    'Core i7-12700KF',
    'Core i5-12600K',
    'Core i5-12600KF',
    'Core i5-12400',
    'Core i5-12400F',
    'Core i3-12100',
    'Core i3-12100F',
    // 11th Gen (2020-2021)
    'Core i9-11900K',
    'Core i9-11900KF',
    'Core i7-11700K',
    'Core i7-11700KF',
    'Core i5-11600K',
    'Core i5-11600KF',
    'Core i5-11400',
    'Core i5-11400F',
    // 10th Gen (2019-2020)
    'Core i9-10900K',
    'Core i9-10900KF',
    'Core i7-10700K',
    'Core i7-10700KF',
    'Core i5-10600K',
    'Core i5-10600KF',
    'Core i5-10400',
    'Core i5-10400F',
    // 9th Gen (2018-2019)
    'Core i9-9900K',
    'Core i9-9900KF',
    'Core i7-9700K',
    'Core i7-9700KF',
    'Core i5-9600K',
    'Core i5-9600KF',
    'Core i5-9400',
    'Core i5-9400F',
    // 8th Gen (2017-2018)
    'Core i7-8700K',
    'Core i7-8700',
    'Core i5-8600K',
    'Core i5-8400',
    'Core i3-8350K',
    'Core i3-8100',
    // 7th Gen (2016-2017)
    'Core i7-7700K',
    'Core i7-7700',
    'Core i5-7600K',
    'Core i5-7500',
    'Core i3-7350K',
    'Core i3-7100',
    // 6th Gen (2015-2016)
    'Core i7-6700K',
    'Core i7-6700',
    'Core i5-6600K',
    'Core i5-6500',
    'Core i3-6320',
    'Core i3-6100',
  ]

  // AMD CPUs from last 10 years
  const amdCpus = [
    // Ryzen 7000 Series (2022-2023)
    'Ryzen 9 7950X',
    'Ryzen 9 7900X',
    'Ryzen 7 7800X3D',
    'Ryzen 7 7700X',
    'Ryzen 5 7600X',
    'Ryzen 5 7500F',
    // Ryzen 6000 Series (2022)
    'Ryzen 9 6900HX',
    'Ryzen 7 6800H',
    'Ryzen 5 6600H',
    // Ryzen 5000 Series (2020-2021)
    'Ryzen 9 5950X',
    'Ryzen 9 5900X',
    'Ryzen 7 5800X3D',
    'Ryzen 7 5800X',
    'Ryzen 7 5700X',
    'Ryzen 5 5600X',
    'Ryzen 5 5600G',
    'Ryzen 5 5500',
    'Ryzen 3 5300G',
    // Ryzen 4000 Series (2020)
    'Ryzen 9 4900H',
    'Ryzen 7 4800H',
    'Ryzen 5 4600H',
    'Ryzen 3 4300U',
    // Ryzen 3000 Series (2019)
    'Ryzen 9 3950X',
    'Ryzen 9 3900X',
    'Ryzen 7 3800X',
    'Ryzen 7 3700X',
    'Ryzen 5 3600X',
    'Ryzen 5 3600',
    'Ryzen 5 3500X',
    'Ryzen 3 3300X',
    'Ryzen 3 3100',
    // Ryzen 2000 Series (2018)
    'Ryzen 7 2700X',
    'Ryzen 7 2700',
    'Ryzen 5 2600X',
    'Ryzen 5 2600',
    'Ryzen 5 2500X',
    'Ryzen 3 2300X',
    'Ryzen 3 2200G',
    // Ryzen 1000 Series (2017)
    'Ryzen 7 1800X',
    'Ryzen 7 1700X',
    'Ryzen 7 1700',
    'Ryzen 5 1600X',
    'Ryzen 5 1600',
    'Ryzen 5 1500X',
    'Ryzen 3 1300X',
    'Ryzen 3 1200',
    // FX Series (2015-2016)
    'FX-8370',
    'FX-8350',
    'FX-8320',
    'FX-6350',
    'FX-6300',
    'FX-4350',
    'FX-4300',
  ]

  // Seed Intel CPUs
  for (const modelName of intelCpus) {
    await prisma.cpu.upsert({
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

  // Seed AMD CPUs
  for (const modelName of amdCpus) {
    await prisma.cpu.upsert({
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

  console.info(
    `✅ CPUs seeded: ${intelCpus.length} Intel + ${amdCpus.length} AMD`,
  )
}

export default cpuSeeder
