import { Card } from '@/components/ui'
import { formatters, getLocale } from '@/utils/date'
import { formatUserRole } from '@/utils/format'
import { Role } from '@orm'
import { type AdminApiKeyRow } from './types'

interface Props {
  canManageSystemKeys: boolean
  isLoading: boolean
  keys: AdminApiKeyRow[]
}

export function SystemKeySummary(props: Props) {
  const locale = getLocale()

  if (!props.canManageSystemKeys) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">System keys</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          System key management is limited to {formatUserRole(Role.SUPER_ADMIN)}
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">System keys</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Keys flagged as system-level are exempt from rate limits. Use sparingly for official
        applications only.
      </p>
      <div className="mt-4 space-y-2">
        {props.isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading system keys…</p>
        ) : props.keys.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No system keys have been provisioned yet.
          </p>
        ) : (
          props.keys.map((key) => (
            <div
              key={key.id}
              className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-700/60 dark:bg-blue-900/20"
            >
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {key.name ?? 'System key'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Prefix: {key.prefix}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Last used: {key.lastUsedAt ? formatters.dateTime(key.lastUsedAt, locale) : 'Never'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Assigned to: {key.user.email ?? key.user.name ?? key.user.id}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
