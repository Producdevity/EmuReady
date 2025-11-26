import Image from 'next/image'
import Link from 'next/link'
import { EmulatorIcon, SystemIcon } from '@/components/icons'
import { LocalizedDate, PerformanceBadge } from '@/components/ui'
import getImageUrl from '@/utils/getImageUrl'

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
