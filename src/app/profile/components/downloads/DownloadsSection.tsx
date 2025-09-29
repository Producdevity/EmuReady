'use client'

import { Download, Link as LinkIcon, Hash, HardDrive, Layers } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  LoadingSpinner,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { copyToClipboard } from '@/utils/copyToClipboard'
import EligibilityPanel from './EligibilityPanel'
import { bytesToHuman } from './utils'

interface LatestJson {
  channel: 'stable' | 'beta'
  versionCode: number
  versionName: string
  apkUrl: string
  sha256?: string
  sizeBytes?: number
  notesUrl?: string
  id?: string
}

export default function DownloadsSection() {
  const latestQuery = api.releases.latest.useQuery({})
  const latest = (latestQuery.data ?? null) as LatestJson | null
  const entitlementQuery = api.entitlements.getMy.useQuery()
  const eligible = entitlementQuery.data?.eligible ?? false
  const signDownload = api.releases.signDownload.useMutation()

  // derive href if present (DB release), else none

  if (latestQuery.isPending) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">EmuReady Beta — Latest Build</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download the latest APK. Purchasers on Google Play or supporters on Patreon for at
              least one month have lifetime access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {latest?.channel && (
              <Badge variant="primary" pill>
                {latest.channel}
              </Badge>
            )}
            {latest?.versionName && <Badge pill>v{latest.versionName}</Badge>}
            {latest?.versionCode != null && <Badge pill>code {latest.versionCode}</Badge>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Layers className="w-4 h-4" /> Version
              </div>
              <div className="mt-1 font-medium">
                {latest ? `${latest.versionName} (code ${latest.versionCode})` : '—'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <HardDrive className="w-4 h-4" /> Size
              </div>
              <div className="mt-1 font-medium">{bytesToHuman(latest?.sizeBytes) ?? '—'}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Hash className="w-4 h-4" /> Checksum (SHA‑256)
                </div>
                {latest?.sha256 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => copyToClipboard(latest.sha256 ?? '', 'checksum')}
                      >
                        Copy
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Copy checksum</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="mt-1 font-mono text-xs break-all">{latest?.sha256 ?? '—'}</div>
            </div>
          </div>

          {/* Action */}
          <div className="flex flex-col items-start gap-3 md:items-end">
            {eligible ? (
              latest?.id ? (
                <Button
                  onClick={async () => {
                    try {
                      const { url } = await signDownload.mutateAsync({ releaseId: latest.id! })
                      analytics.conversion.appDownloadClicked({
                        appName: 'EmuReady Beta',
                        platform: 'android',
                        location: 'profile_downloads',
                        url,
                      })
                      window.location.href = url
                    } catch {}
                  }}
                >
                  <Download className="w-4 h-4" /> Download APK
                </Button>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  No Android build is currently available.
                </div>
              )
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400 max-w-sm text-right md:text-left">
                You’re not yet eligible to download. Use the actions below to verify your purchase
                or link Patreon (one paid month unlocks lifetime downloads).
              </div>
            )}

            {latest?.notesUrl && (
              <a
                href={latest.notesUrl}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <LinkIcon className="w-4 h-4" /> Release notes
              </a>
            )}
          </div>
        </div>
      </Card>

      <EligibilityPanel />
    </div>
  )
}
