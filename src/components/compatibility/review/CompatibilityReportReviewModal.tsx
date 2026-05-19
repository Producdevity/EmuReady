'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import { Badge, Button, Input, LocalizedDate, Modal, PerformanceBadge } from '@/components/ui'
import { useEmulatorLogos } from '@/hooks'
import getImageUrl from '@/utils/getImageUrl'
import { ApprovalStatus } from '@orm'
import { CompatibilityReportCustomFieldValue } from './CompatibilityReportCustomFieldValue'
import {
  type CompatibilityReportReviewAuthor,
  type CompatibilityReportReviewDecision,
  type CompatibilityReportReviewEmulator,
  type CompatibilityReportReviewGame,
  type CompatibilityReportReviewHardware,
  type CompatibilityReportReviewItem,
  type CompatibilityReportReviewPerformance,
  type FieldValueLike,
} from './reviewItem'
import { ReviewRiskWarningBanner } from './ReviewRiskWarningBanner'

interface Props {
  isOpen: boolean
  onClose: () => void
  decision: CompatibilityReportReviewDecision
  reportLabel: string
  report: CompatibilityReportReviewItem
  rejectionNotes: string
  onRejectionNotesChange: (notes: string) => void
  onSubmit: () => void | Promise<void>
  isSubmitting: boolean
}

const REJECTION_PRESETS = [
  'Spam',
  'Low effort',
  'Missing information',
  'Incorrect information',
  'Emulator version incorrect/missing',
] as const

function GameInfoSection(props: { game: CompatibilityReportReviewGame }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Game</h3>
      <div className="flex items-center gap-3">
        {props.game.imageUrl && (
          <Image
            src={getImageUrl(props.game.imageUrl, props.game.title)}
            alt={props.game.title}
            width={48}
            height={48}
            className="object-cover rounded"
            unoptimized
          />
        )}
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{props.game.title}</p>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <SystemIcon systemKey={props.game.system.key} name={props.game.system.name} size="sm" />
            {props.game.system.name}
          </div>
        </div>
      </div>
    </div>
  )
}

function HardwareSection(props: { hardware: CompatibilityReportReviewHardware }) {
  if (props.hardware.type === 'device') {
    return (
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Device</h3>
        <p className="text-gray-900 dark:text-white">
          {props.hardware.device.brand.name} {props.hardware.device.modelName}
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Hardware</h3>
      <div className="space-y-1">
        <p className="text-sm text-gray-900 dark:text-white">
          <span className="font-medium">CPU:</span> {props.hardware.cpu.brand.name}{' '}
          {props.hardware.cpu.modelName}
        </p>
        {props.hardware.gpu && (
          <p className="text-sm text-gray-900 dark:text-white">
            <span className="font-medium">GPU:</span> {props.hardware.gpu.brand.name}{' '}
            {props.hardware.gpu.modelName}
          </p>
        )}
      </div>
    </div>
  )
}

function EmulatorInfoSection(props: {
  emulator: CompatibilityReportReviewEmulator
  showLogo: boolean
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Emulator</h3>
      <div className="flex items-center gap-2">
        <EmulatorIcon
          logo={props.emulator.logo}
          name={props.emulator.name}
          size="md"
          showLogo={props.showLogo}
        />
        <span className="text-gray-900 dark:text-white">{props.emulator.name}</span>
      </div>
    </div>
  )
}

function UserInfoSection(props: { author: CompatibilityReportReviewAuthor; createdAt: Date }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Submitted By</h3>
      <div>
        <Link
          href={`/users/${props.author.id}`}
          target="_blank"
          className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {props.author.name || 'Unknown'}
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <LocalizedDate date={props.createdAt} format="dateTime" />
        </p>
      </div>
    </div>
  )
}

function PerformanceSection(props: { performance: CompatibilityReportReviewPerformance | null }) {
  if (!props.performance) return null

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Performance</h3>
      <PerformanceBadge
        className="justify-start"
        rank={props.performance.rank}
        label={props.performance.label}
        description={props.performance.description}
      />
    </div>
  )
}

function NotesSection(props: { notes: string | null }) {
  if (!props.notes) return null

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h3>
      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{props.notes}</p>
    </div>
  )
}

function RejectionNotesInput(props: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Rejection Notes (Optional)
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {REJECTION_PRESETS.map((preset) => (
          <Badge
            key={preset}
            variant={props.value === preset ? 'primary' : 'default'}
            size="sm"
            pill
            onClick={() => props.onChange(props.value === preset ? '' : preset)}
            className="transition-colors"
          >
            {preset}
          </Badge>
        ))}
      </div>
      <Input
        as="textarea"
        id={props.id}
        value={props.value}
        onChange={(ev) => props.onChange(ev.target.value)}
        rows={4}
        placeholder="Reason for rejection..."
        className="w-full"
      />
    </div>
  )
}

function getCustomFieldReviewKey(fieldValue: FieldValueLike, index: number): string {
  const uniqueId = fieldValue.id ?? fieldValue.customFieldDefinition.id
  if (uniqueId) return uniqueId

  const fallback =
    fieldValue.customFieldDefinition.name ??
    fieldValue.customFieldDefinition.label ??
    'custom-field'
  return `${fallback}-${index}`
}

function CustomFieldsApprovalSection(props: {
  fieldValues: readonly FieldValueLike[] | undefined
}) {
  const [expanded, setExpanded] = useState(false)

  if (!props.fieldValues || props.fieldValues.length === 0) return null

  const nonEmpty = props.fieldValues.filter((fieldValue) => {
    if (fieldValue.value === null || fieldValue.value === undefined || fieldValue.value === '') {
      return false
    }
    return !(typeof fieldValue.value === 'string' && fieldValue.value.trim() === '')
  })

  const firstField = nonEmpty[0]
  const remainingFields = nonEmpty.slice(1)

  if (!firstField) return null

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        Emulator Settings
      </h3>
      <dl className="text-sm space-y-1">
        <div className="flex items-baseline gap-2">
          <dt className="text-gray-500 dark:text-gray-400 shrink-0">
            {firstField.customFieldDefinition.label}
          </dt>
          <dd className="text-gray-900 dark:text-white">
            <CompatibilityReportCustomFieldValue fieldValue={firstField} />
          </dd>
        </div>
        {remainingFields.length > 0 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Show {remainingFields.length} more setting{remainingFields.length > 1 ? 's' : ''}
          </button>
        )}
        {expanded &&
          remainingFields.map((fieldValue, index) => (
            <div
              key={getCustomFieldReviewKey(fieldValue, index)}
              className="flex items-baseline gap-2"
            >
              <dt className="text-gray-500 dark:text-gray-400 shrink-0">
                {fieldValue.customFieldDefinition.label}
              </dt>
              <dd className="text-gray-900 dark:text-white">
                <CompatibilityReportCustomFieldValue fieldValue={fieldValue} />
              </dd>
            </div>
          ))}
        {expanded && remainingFields.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Hide settings
          </button>
        )}
      </dl>
    </div>
  )
}

export function CompatibilityReportReviewModal(props: Props) {
  const emulatorLogos = useEmulatorLogos()
  const hasRisk =
    Boolean(props.report.authorRiskProfile?.highestSeverity) ||
    Boolean(props.report.submissionRiskProfile?.highestSeverity)
  const actionText = props.decision === ApprovalStatus.APPROVED ? 'Approve' : 'Reject'
  const modalTitle = `${actionText} ${props.reportLabel}: ${props.report.game.title}`

  const buttonVariant =
    props.decision === ApprovalStatus.REJECTED ? 'danger' : hasRisk ? 'destructive' : 'default'

  const buttonText =
    props.decision === ApprovalStatus.REJECTED
      ? 'Confirm Rejection'
      : hasRisk
        ? 'Approve Anyway'
        : 'Confirm Approval'

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title={modalTitle} size="lg">
      <div className="space-y-4">
        <ReviewRiskWarningBanner
          authorRiskProfile={props.report.authorRiskProfile}
          submissionRiskProfile={props.report.submissionRiskProfile}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GameInfoSection game={props.report.game} />
          <HardwareSection hardware={props.report.hardware} />
          <EmulatorInfoSection
            emulator={props.report.emulator}
            showLogo={emulatorLogos.isHydrated && emulatorLogos.showEmulatorLogos}
          />
          <UserInfoSection author={props.report.author} createdAt={props.report.createdAt} />
        </div>

        <PerformanceSection performance={props.report.performance} />
        <NotesSection notes={props.report.notes} />
        <CustomFieldsApprovalSection fieldValues={props.report.customFieldValues} />

        {props.decision === ApprovalStatus.REJECTED && (
          <RejectionNotesInput
            id="rejectionNotes"
            value={props.rejectionNotes}
            onChange={props.onRejectionNotesChange}
          />
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
          <Button variant="ghost" onClick={props.onClose} disabled={props.isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={buttonVariant}
            onClick={props.onSubmit}
            isLoading={props.isSubmitting}
            disabled={props.isSubmitting}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
