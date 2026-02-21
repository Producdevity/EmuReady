'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import { Badge, Input, LocalizedDate, PerformanceBadge } from '@/components/ui'
import getImageUrl from '@/utils/getImageUrl'
import { CustomFieldValue, type FieldValueLike } from '../CustomFieldValue'

interface GameInfoSectionProps {
  game: {
    title: string
    imageUrl: string | null
    system: {
      name: string
      key: string | null
    }
  }
}

export function GameInfoSection(props: GameInfoSectionProps) {
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

interface EmulatorInfoSectionProps {
  emulator: {
    name: string
    logo: string | null
  }
  showLogo: boolean
}

export function EmulatorInfoSection(props: EmulatorInfoSectionProps) {
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

interface UserInfoSectionProps {
  author: {
    id: string
    name: string | null
  }
  createdAt: Date
}

export function UserInfoSection(props: UserInfoSectionProps) {
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

interface PerformanceSectionProps {
  performance: {
    rank: number
    label: string
    description: string | null
  } | null
}

export function PerformanceSection(props: PerformanceSectionProps) {
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

interface NotesSectionProps {
  notes: string | null
}

export function NotesSection(props: NotesSectionProps) {
  if (!props.notes) return null

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h3>
      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{props.notes}</p>
    </div>
  )
}

const REJECTION_PRESETS = ['Low effort', 'Missing information', 'Incorrect information'] as const

interface RejectionNotesInputProps {
  id: string
  value: string
  onChange: (value: string) => void
}

export function RejectionNotesInput(props: RejectionNotesInputProps) {
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

interface CustomFieldsApprovalSectionProps {
  fieldValues: FieldValueLike[] | undefined
}

export function CustomFieldsApprovalSection(props: CustomFieldsApprovalSectionProps) {
  const [expanded, setExpanded] = useState(false)

  if (!props.fieldValues || props.fieldValues.length === 0) return null

  const nonEmpty = props.fieldValues.filter((fv) => {
    if (fv.value === null || fv.value === undefined || fv.value === '') return false
    if (typeof fv.value === 'string' && fv.value.trim() === '') return false
    return true
  })

  if (nonEmpty.length === 0) return null

  const firstField = nonEmpty[0]
  const remainingFields = nonEmpty.slice(1)

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
            <CustomFieldValue fieldValue={firstField} />
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
          remainingFields.map((fv) => (
            <div key={fv.customFieldDefinition.label} className="flex items-baseline gap-2">
              <dt className="text-gray-500 dark:text-gray-400 shrink-0">
                {fv.customFieldDefinition.label}
              </dt>
              <dd className="text-gray-900 dark:text-white">
                <CustomFieldValue fieldValue={fv} />
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
