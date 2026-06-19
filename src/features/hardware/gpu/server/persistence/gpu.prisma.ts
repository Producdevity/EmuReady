import type { Prisma } from '@orm/client'

const gpuBrandSelect = {
  id: true,
  name: true,
} satisfies Prisma.DeviceBrandSelect

export const GPU_DETAIL_SELECT = {
  id: true,
  modelName: true,
  brand: { select: gpuBrandSelect },
  _count: { select: { pcListings: true } },
} satisfies Prisma.GpuSelect

export const GPU_SUMMARY_SELECT = {
  id: true,
  modelName: true,
  brand: { select: gpuBrandSelect },
} satisfies Prisma.GpuSelect

export const GPU_MOBILE_LIST_SELECT = {
  id: true,
  brandId: true,
  modelName: true,
  createdAt: true,
  brand: { select: gpuBrandSelect },
  _count: { select: { pcListings: true } },
} satisfies Prisma.GpuSelect

export const GPU_MOBILE_PC_LISTING_SELECT = {
  id: true,
  brandId: true,
  modelName: true,
  createdAt: true,
  brand: { select: gpuBrandSelect },
} satisfies Prisma.GpuSelect

export const GPU_MODEL_CONFLICT_SELECT = {
  id: true,
} satisfies Prisma.GpuSelect

export const GPU_DELETE_GUARD_SELECT = {
  id: true,
  _count: { select: { pcListings: true, presets: true } },
} satisfies Prisma.GpuSelect

export type GpuDetailRecord = Prisma.GpuGetPayload<{ select: typeof GPU_DETAIL_SELECT }>
export type GpuSummaryRecord = Prisma.GpuGetPayload<{ select: typeof GPU_SUMMARY_SELECT }>
export type GpuMobileListRecord = Prisma.GpuGetPayload<{ select: typeof GPU_MOBILE_LIST_SELECT }>
export type GpuMobilePcListingRecord = Prisma.GpuGetPayload<{
  select: typeof GPU_MOBILE_PC_LISTING_SELECT
}>
export type GpuModelNameConflictRecord = Prisma.GpuGetPayload<{
  select: typeof GPU_MODEL_CONFLICT_SELECT
}>
export type GpuDeleteGuardRecord = Prisma.GpuGetPayload<{ select: typeof GPU_DELETE_GUARD_SELECT }>
