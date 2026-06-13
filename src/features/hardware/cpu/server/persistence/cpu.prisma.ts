import type { Prisma } from '@orm/client'

const cpuBrandSelect = {
  id: true,
  name: true,
} satisfies Prisma.DeviceBrandSelect

export const CPU_DETAIL_SELECT = {
  id: true,
  modelName: true,
  brand: { select: cpuBrandSelect },
  _count: { select: { pcListings: true } },
} satisfies Prisma.CpuSelect

export const CPU_SUMMARY_SELECT = {
  id: true,
  modelName: true,
  brand: { select: cpuBrandSelect },
} satisfies Prisma.CpuSelect

export const CPU_MOBILE_LIST_SELECT = {
  id: true,
  brandId: true,
  modelName: true,
  createdAt: true,
  brand: { select: cpuBrandSelect },
  _count: { select: { pcListings: true } },
} satisfies Prisma.CpuSelect

export const CPU_MOBILE_PC_LISTING_SELECT = {
  id: true,
  brandId: true,
  modelName: true,
  createdAt: true,
  brand: { select: cpuBrandSelect },
} satisfies Prisma.CpuSelect

export const CPU_MODEL_CONFLICT_SELECT = {
  id: true,
} satisfies Prisma.CpuSelect

export const CPU_DELETE_GUARD_SELECT = {
  id: true,
  _count: { select: { pcListings: true, presets: true } },
} satisfies Prisma.CpuSelect

export type CpuDetailRecord = Prisma.CpuGetPayload<{ select: typeof CPU_DETAIL_SELECT }>
export type CpuSummaryRecord = Prisma.CpuGetPayload<{ select: typeof CPU_SUMMARY_SELECT }>
export type CpuMobileListRecord = Prisma.CpuGetPayload<{ select: typeof CPU_MOBILE_LIST_SELECT }>
export type CpuMobilePcListingRecord = Prisma.CpuGetPayload<{
  select: typeof CPU_MOBILE_PC_LISTING_SELECT
}>
export type CpuModelNameConflictRecord = Prisma.CpuGetPayload<{
  select: typeof CPU_MODEL_CONFLICT_SELECT
}>
export type CpuDeleteGuardRecord = Prisma.CpuGetPayload<{ select: typeof CPU_DELETE_GUARD_SELECT }>
