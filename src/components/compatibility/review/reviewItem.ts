import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import { type ApprovalStatus, type CustomFieldType } from '@orm'

export type CompatibilityReportReviewDecision =
  | typeof ApprovalStatus.APPROVED
  | typeof ApprovalStatus.REJECTED

export interface FieldValueLike {
  id?: string
  value: unknown
  customFieldDefinition: {
    id?: string
    type: CustomFieldType
    label?: string
    name?: string | null
    options?: unknown
    defaultValue?: unknown
    rangeDecimals?: number | null
    rangeUnit?: string | null
    categoryId?: string | null
    category?: { id: string; name: string } | null
  }
}

export interface CompatibilityReportReviewGame {
  title: string
  imageUrl: string | null
  system: {
    name: string
    key: string | null
  }
}

export interface CompatibilityReportReviewAuthor {
  id: string
  name: string | null
}

export interface CompatibilityReportReviewEmulator {
  name: string
  logo: string | null
}

export interface CompatibilityReportReviewPerformance {
  rank: number
  label: string
  description: string | null
}

export interface HardwareBrandModel {
  brand: { name: string }
  modelName: string
}

export type CompatibilityReportReviewHardware =
  | { type: 'device'; device: HardwareBrandModel }
  | { type: 'pc'; cpu: HardwareBrandModel; gpu?: HardwareBrandModel | null }

export interface CompatibilityReportReviewItem {
  game: CompatibilityReportReviewGame
  hardware: CompatibilityReportReviewHardware
  emulator: CompatibilityReportReviewEmulator
  author: CompatibilityReportReviewAuthor
  createdAt: Date
  performance: CompatibilityReportReviewPerformance | null
  notes: string | null
  customFieldValues?: readonly FieldValueLike[]
  authorRiskProfile?: AuthorRiskProfile | null
  submissionRiskProfile?: SubmissionRiskProfile | null
}

interface ReviewAuthorSource {
  id: string
  name: string | null
}

interface CompatibilityReportReviewSourceBase {
  authorId: string
  game: CompatibilityReportReviewGame
  emulator: CompatibilityReportReviewEmulator
  author?: ReviewAuthorSource | null
  createdAt: Date
  performance: CompatibilityReportReviewPerformance | null
  notes: string | null
  customFieldValues?: readonly FieldValueLike[]
  authorRiskProfile?: AuthorRiskProfile | null
  submissionRiskProfile?: SubmissionRiskProfile | null
}

export interface DeviceCompatibilityReportReviewSource extends CompatibilityReportReviewSourceBase {
  device: HardwareBrandModel
}

export interface PcCompatibilityReportReviewSource extends CompatibilityReportReviewSourceBase {
  cpu: HardwareBrandModel
  gpu?: HardwareBrandModel | null
}

export type CompatibilityReportReviewSource =
  | DeviceCompatibilityReportReviewSource
  | PcCompatibilityReportReviewSource

function toReviewAuthor(
  source: CompatibilityReportReviewSourceBase,
): CompatibilityReportReviewAuthor {
  return {
    id: source.author?.id ?? source.authorId,
    name: source.author?.name ?? null,
  }
}

function toBaseReviewItem(source: CompatibilityReportReviewSourceBase) {
  return {
    game: source.game,
    emulator: source.emulator,
    author: toReviewAuthor(source),
    createdAt: source.createdAt,
    performance: source.performance,
    notes: source.notes,
    customFieldValues: source.customFieldValues,
    authorRiskProfile: source.authorRiskProfile,
    submissionRiskProfile: source.submissionRiskProfile,
  }
}

export function toDeviceCompatibilityReviewItem(
  source: DeviceCompatibilityReportReviewSource,
): CompatibilityReportReviewItem {
  return {
    ...toBaseReviewItem(source),
    hardware: { type: 'device', device: source.device },
  }
}

export function toPcCompatibilityReviewItem(
  source: PcCompatibilityReportReviewSource,
): CompatibilityReportReviewItem {
  return {
    ...toBaseReviewItem(source),
    hardware: { type: 'pc', cpu: source.cpu, gpu: source.gpu },
  }
}

export function toCompatibilityReportReviewItem(
  source: CompatibilityReportReviewSource,
): CompatibilityReportReviewItem {
  return 'device' in source
    ? toDeviceCompatibilityReviewItem(source)
    : toPcCompatibilityReviewItem(source)
}
