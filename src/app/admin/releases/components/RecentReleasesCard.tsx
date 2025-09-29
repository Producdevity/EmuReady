'use client'

import { bytesToHuman } from '@/app/profile/components/downloads/utils'
import { AdminTableContainer } from '@/components/admin'
import { Button, LoadingSpinner, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'

export default function RecentReleasesCard() {
  const listQuery = api.adminReleases.list.useQuery({})
  const utils = api.useUtils()
  const confirm = useConfirmDialog()
  const deleteMutation = api.adminReleases.delete.useMutation({
    onSuccess: async () => {
      await utils.adminReleases.list.invalidate({})
    },
  })
  const publishLatest = api.adminReleases.publishLatest.useMutation()

  return (
    <AdminTableContainer>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Releases</h3>
          {listQuery.isPending && <LoadingSpinner size="sm" />}
        </div>
        <div className="space-y-3">
          {listQuery.data?.length ? (
            listQuery.data.map((r) => (
              <div key={r.id} className="border rounded-lg px-3 py-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 items-start">
                  {/* Meta */}
                  <div className="md:col-span-2 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {r.channel} • v{r.versionName} (code {r.versionCode})
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 min-w-0">
                      <span className="truncate font-mono" title={r.fileSha256}>
                        sha256: {r.fileSha256}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="whitespace-nowrap">{bytesToHuman(Number(r.sizeBytes))}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
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
                      Make latest
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
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
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || ''
                        const url = publicBase ? `${publicBase}/${r.fileKey}` : ''
                        await navigator.clipboard.writeText(url)
                        toast.success('CDN URL copied')
                      }}
                    >
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(r.fileKey)
                        toast.success('Key copied')
                      }}
                    >
                      Copy Key
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(r.fileSha256)
                        toast.success('SHA‑256 copied')
                      }}
                    >
                      Copy SHA
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No releases found</div>
          )}
        </div>
      </div>
    </AdminTableContainer>
  )
}
