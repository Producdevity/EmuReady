import { type PrismaClient } from '@orm'

type SoCData = {
  name: string
  manufacturer: string
  architecture?: string
  processNode?: string
  cpuCores?: number
  gpuModel?: string
}

const socs: SoCData[] = [
  // Qualcomm Snapdragon
  {
    name: 'Snapdragon 8 Gen 3',
    manufacturer: 'Qualcomm',
    architecture: 'ARM64',
    processNode: '4nm',
    cpuCores: 8,
    gpuModel: 'Adreno 750',
  },
  {
    name: 'Snapdragon 8 Gen 2',
    manufacturer: 'Qualcomm',
    architecture: 'ARM64',
    processNode: '4nm',
    cpuCores: 8,
    gpuModel: 'Adreno 740',
  },
  {
    name: 'Snapdragon 8 Gen 1',
    manufacturer: 'Qualcomm',
    architecture: 'ARM64',
    processNode: '4nm',
    cpuCores: 8,
    gpuModel: 'Adreno 730',
  },
  {
    name: 'Snapdragon 888',
    manufacturer: 'Qualcomm',
    architecture: 'ARM64',
    processNode: '5nm',
    cpuCores: 8,
    gpuModel: 'Adreno 660',
  },
  {
    name: 'Snapdragon 870',
    manufacturer: 'Qualcomm',
    architecture: 'ARM64',
    processNode: '7nm',
    cpuCores: 8,
    gpuModel: 'Adreno 650',
  },
  {
    name: 'Snapdragon 865',
    manufacturer: 'Qualcomm',
    architecture: 'ARM64',
    processNode: '7nm',
    cpuCores: 8,
    gpuModel: 'Adreno 650',
  },
  {
    name: 'Snapdragon 855',
    manufacturer: 'Qualcomm',
    architecture: 'ARM64',
    processNode: '7nm',
    cpuCores: 8,
    gpuModel: 'Adreno 640',
  },

  // MediaTek Dimensity
  {
    name: 'Dimensity 9300',
    manufacturer: 'MediaTek',
    architecture: 'ARM64',
    processNode: '4nm',
    cpuCores: 8,
    gpuModel: 'Mali-G720',
  },
  {
    name: 'Dimensity 9200',
    manufacturer: 'MediaTek',
    architecture: 'ARM64',
    processNode: '4nm',
    cpuCores: 8,
    gpuModel: 'Mali-G715',
  },
  {
    name: 'Dimensity 9000',
    manufacturer: 'MediaTek',
    architecture: 'ARM64',
    processNode: '4nm',
    cpuCores: 8,
    gpuModel: 'Mali-G710',
  },
  {
    name: 'Dimensity 8300',
    manufacturer: 'MediaTek',
    architecture: 'ARM64',
    processNode: '4nm',
    cpuCores: 8,
    gpuModel: 'Mali-G615',
  },
  {
    name: 'Dimensity 1200',
    manufacturer: 'MediaTek',
    architecture: 'ARM64',
    processNode: '6nm',
    cpuCores: 8,
    gpuModel: 'Mali-G77',
  },

  // AMD (for handheld gaming devices)
  {
    name: 'AMD Z1 Extreme',
    manufacturer: 'AMD',
    architecture: 'x86_64',
    processNode: '4nm',
    cpuCores: 8,
    gpuModel: 'RDNA 3',
  },
  {
    name: 'AMD Z1',
    manufacturer: 'AMD',
    architecture: 'x86_64',
    processNode: '4nm',
    cpuCores: 6,
    gpuModel: 'RDNA 3',
  },

  // Apple (for reference/comparison)
  {
    name: 'Apple A17 Pro',
    manufacturer: 'Apple',
    architecture: 'ARM64',
    processNode: '3nm',
    cpuCores: 6,
    gpuModel: 'Apple GPU',
  },
  {
    name: 'Apple A16 Bionic',
    manufacturer: 'Apple',
    architecture: 'ARM64',
    processNode: '4nm',
    cpuCores: 6,
    gpuModel: 'Apple GPU',
  },
  {
    name: 'Apple A15 Bionic',
    manufacturer: 'Apple',
    architecture: 'ARM64',
    processNode: '5nm',
    cpuCores: 6,
    gpuModel: 'Apple GPU',
  },

  // NVIDIA (for handheld devices)
  {
    name: 'Tegra X1',
    manufacturer: 'NVIDIA',
    architecture: 'ARM64',
    processNode: '20nm',
    cpuCores: 4,
    gpuModel: 'Maxwell',
  },

  // Unisoc (for budget devices)
  {
    name: 'Tiger T820',
    manufacturer: 'Unisoc',
    architecture: 'ARM64',
    processNode: '6nm',
    cpuCores: 8,
    gpuModel: 'Mali-G57',
  },
  {
    name: 'Tiger T618',
    manufacturer: 'Unisoc',
    architecture: 'ARM64',
    processNode: '12nm',
    cpuCores: 8,
    gpuModel: 'Mali-G52',
  },

  // Allwinner (for retro handheld devices)
  {
    name: 'Allwinner H700',
    manufacturer: 'Allwinner',
    architecture: 'ARM64',
    processNode: '22nm',
    cpuCores: 4,
    gpuModel: 'Mali-G31',
  },
  {
    name: 'Allwinner A133',
    manufacturer: 'Allwinner',
    architecture: 'ARM64',
    processNode: '22nm',
    cpuCores: 4,
    gpuModel: 'PowerVR GE8300',
  },

  // Rockchip (for retro handheld devices)
  {
    name: 'RK3566',
    manufacturer: 'Rockchip',
    architecture: 'ARM64',
    processNode: '22nm',
    cpuCores: 4,
    gpuModel: 'Mali-G52',
  },
  {
    name: 'RK3588',
    manufacturer: 'Rockchip',
    architecture: 'ARM64',
    processNode: '8nm',
    cpuCores: 8,
    gpuModel: 'Mali-G610',
  },

  // Additional SoCs for specific devices
  {
    name: 'Snapdragon 720G',
    manufacturer: 'Qualcomm',
    architecture: 'ARM64',
    processNode: '8nm',
    cpuCores: 8,
    gpuModel: 'Adreno 618',
  },
  {
    name: 'Intel Core Ultra 7 155H',
    manufacturer: 'Intel',
    architecture: 'x86_64',
    processNode: '7nm',
    cpuCores: 16,
    gpuModel: 'Intel Arc',
  },
  {
    name: 'AMD Custom APU',
    manufacturer: 'AMD',
    architecture: 'x86_64',
    processNode: '7nm',
    cpuCores: 4,
    gpuModel: 'RDNA 2',
  },
]

async function socSeeder(prisma: PrismaClient) {
  console.log('�� Seeding SoCs...')

  for (const soc of socs) {
    await prisma.soC.upsert({
      where: { name: soc.name },
      update: {},
      create: soc,
    })
  }

  console.log('✅ SoCs seeded successfully')
}

export default socSeeder
