'use client'

import { Copy, MoreVertical, Trash2, Rocket, Calendar, HardDrive, Check } from 'lucide-react'
import { useState } from 'react'
import { bytesToHuman } from '@/app/profile/components/downloads/utils'
import { AdminTableContainer } from '@/components/admin'
import { Button, LoadingSpinner, useConfirmDialog, Badge } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { formatters, getLocale } from '@/utils/date'

export default function RecentReleasesCard() {
  const listQuery = api.adminReleases.list.useQuery({})
  const utils = api.useUtils()
  const confirm = useConfirmDialog()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const deleteMutation = api.adminReleases.delete.useMutation({
    onSuccess: async () => {
      await utils.adminReleases.list.invalidate({})
    },
  })
  const publishLatest = api.adminReleases.publishLatest.useMutation()

  const copyToClipboard = async (text: string, label: string, id: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <AdminTableContainer>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Releases</h3>
          {listQuery.isPending && <LoadingSpinner size="sm" />}
        </div>
        <div className="space-y-4">
          {listQuery.data?.length ? (
            listQuery.data.map((r) => {
              const isExpanded = expandedId === r.id
              const channelColor =
                r.channel === 'stable'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'

              return (
                <div
                  key={r.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={channelColor} size="sm">
                          {r.channel}
                        </Badge>
                        <span className="font-semibold text-base">v{r.versionName}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          (code {r.versionCode})
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5" />
                          <span>{bytesToHuman(Number(r.sizeBytes))}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatters.timeAgo(new Date(r.createdAt), getLocale())}</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Rocket}
                        onClick={() =>
                          publishLatest
                            .mutateAsync({
                              channel: r.channel as 'stable' | 'beta',
                              versionCode: r.versionCode,
                              versionName: r.versionName,
                              fileKey: r.fileKey,
                              fileSha256: r.fileSha256,
                              sizeBytes: Number(r.sizeBytes),
                            })
                            .catch(console.error)
                        }
                        isLoading={publishLatest.isPending}
                      >
                        Publish
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete release',
                            description:
                              'This will remove the release and its download logs. The APK in R2 is not deleted.',
                            confirmText: 'Delete',
                          })
                          if (!ok) return
                          await deleteMutation.mutateAsync({ id: r.id })
                          const alsoDelete = await confirm({
                            title: 'Also delete file from R2?',
                            description:
                              'Optional: Remove the APK object from Cloudflare R2. This cannot be undone.',
                            confirmText: 'Delete file from R2',
                          })
                          if (alsoDelete) {
                            await deleteMutation.mutateAsync({ id: r.id, deleteFromR2: true })
                            toast.success('File deleted from R2')
                          }
                        }}
                        isLoading={deleteMutation.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={MoreVertical}
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      />
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {/* File Key */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          File Key
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded font-mono break-all">
                            {r.fileKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={copiedId === `key-${r.id}` ? Check : Copy}
                            onClick={() => copyToClipboard(r.fileKey, 'Key', `key-${r.id}`)}
                          />
                        </div>
                      </div>

                      {/* SHA-256 */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          SHA-256
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded font-mono break-all">
                            {r.fileSha256}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={copiedId === `sha-${r.id}` ? Check : Copy}
                            onClick={() => copyToClipboard(r.fileSha256, 'SHA-256', `sha-${r.id}`)}
                          />
                        </div>
                      </div>

                      {/* CDN URL */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          CDN URL
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded font-mono break-all">
                            {process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL
                              ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${r.fileKey}`
                              : 'CDN URL not configured'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={copiedId === `url-${r.id}` ? Check : Copy}
                            onClick={() => {
                              const url = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL
                                ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${r.fileKey}`
                                : ''
                              copyToClipboard(url, 'URL', `url-${r.id}`)
                            }}
                            disabled={!process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-sm text-gray-500">No releases found</div>
          )}
        </div>
      </div>
    </AdminTableContainer>
  )
}
