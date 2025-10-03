import { PcOs } from '@orm'

export const PC_OS_LABELS: Record<PcOs, string> = {
  [PcOs.WINDOWS]: 'Windows',
  [PcOs.LINUX]: 'Linux',
  [PcOs.MACOS]: 'macOS',
  [PcOs.FREEBSD]: 'FreeBSD',
  [PcOs.OTHER]: 'Other',
} as const

export const PC_OS_OPTIONS = [
  { value: PcOs.WINDOWS, label: PC_OS_LABELS.WINDOWS },
  { value: PcOs.LINUX, label: PC_OS_LABELS.LINUX },
  { value: PcOs.MACOS, label: PC_OS_LABELS.MACOS },
  { value: PcOs.FREEBSD, label: PC_OS_LABELS.FREEBSD },
  { value: PcOs.OTHER, label: PC_OS_LABELS.OTHER },
] as const
