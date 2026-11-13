import type { Prisma } from '@orm/client'

const reportSelect = {
  id: true,
  createdAt: true,
  status: true,
  game: { select: { title: true, system: { select: { name: true } } } },
  emulator: { select: { name: true } },
} as const

export const HANDHELD_REPORT_HISTORY_SELECT = {
  ...reportSelect,
  device: { select: { modelName: true, brand: { select: { name: true } } } },
} satisfies Prisma.ListingSelect

export const PC_REPORT_HISTORY_SELECT = {
  ...reportSelect,
  cpu: { select: { modelName: true, brand: { select: { name: true } } } },
  gpu: { select: { modelName: true, brand: { select: { name: true } } } },
  memorySize: true,
} satisfies Prisma.PcListingSelect

export function mapHandheldReport(
  report: Prisma.ListingGetPayload<{ select: typeof HANDHELD_REPORT_HISTORY_SELECT }>,
) {
  return {
    id: report.id,
    createdAt: report.createdAt,
    status: report.status,
    title: report.game.title,
    systemName: report.game.system.name,
    emulatorName: report.emulator.name,
    hardwareLabel: `${report.device.brand.name} ${report.device.modelName}`,
  }
}

export function mapPcReport(
  report: Prisma.PcListingGetPayload<{ select: typeof PC_REPORT_HISTORY_SELECT }>,
) {
  return {
    id: report.id,
    createdAt: report.createdAt,
    status: report.status,
    title: report.game.title,
    systemName: report.game.system.name,
    emulatorName: report.emulator.name,
    hardwareLabel: [
      `${report.cpu.brand.name} ${report.cpu.modelName}`,
      report.gpu ? `${report.gpu.brand.name} ${report.gpu.modelName}` : 'Integrated graphics',
      `${report.memorySize} GB RAM`,
    ].join(' · '),
  }
}
