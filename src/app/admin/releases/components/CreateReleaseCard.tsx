'use client'

import { useMemo, useState } from 'react'
import { digestSha256 } from '@/app/admin/releases/utils/digestSha256'
import { bytesToHuman } from '@/app/profile/components/downloads/utils'
import { Card, Button, Dropdown, Input, Toggle } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'

interface ChannelOption {
  value: 'stable' | 'beta'
  label: string
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  { value: 'stable', label: 'Stable' },
  { value: 'beta', label: 'Beta' },
]

export default function CreateReleaseCard() {
  const utils = api.useUtils()
  const [channel, setChannel] = useState<ChannelOption['value']>('stable')
  const [versionCode, setVersionCode] = useState('')
  const [versionName, setVersionName] = useState('')
  const [fileKey, setFileKey] = useState('')
  const [fileSha256, setFileSha256] = useState('')
  const [sizeBytes, setSizeBytes] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [autoPublish, setAutoPublish] = useState(true)

  const createMutation = api.adminReleases.create.useMutation({
    onSuccess: async () => {
      toast.success('Release created')
      await utils.adminReleases.list.invalidate({})
    },
  })
  const publishLatest = api.adminReleases.publishLatest.useMutation({
    onSuccess: () => toast.success('latest.json updated'),
  })
  const getUploadUrl = api.adminReleases.getUploadUrl.useMutation()

  const canCreate = useMemo(() => {
    return (
      !!versionName &&
      !!versionCode &&
      !!fileKey &&
      !!fileSha256 &&
      !!sizeBytes &&
      !createMutation.isPending &&
      !isUploading
    )
  }, [
    versionName,
    versionCode,
    fileKey,
    fileSha256,
    sizeBytes,
    createMutation.isPending,
    isUploading,
  ])

  const handleUpload = async () => {
    if (!file) return
    try {
      setIsUploading(true)
      const size = file.size
      const sha256 = await digestSha256(file)
      const res = await getUploadUrl.mutateAsync({ channel, versionName, fileName: file.name })
      await fetch(res.url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/vnd.android.package-archive' },
        body: file,
      })
      setFileKey(res.key)
      setFileSha256(sha256)
      setSizeBytes(String(size))
      toast.success('APK uploaded to R2')
    } catch {
      toast.error('Upload failed. Check R2 permissions/CORS and try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const vc = Number(versionCode)
      const sb = Number(sizeBytes)
      await createMutation.mutateAsync({
        channel,
        versionCode: vc,
        versionName,
        fileKey,
        fileSha256,
        sizeBytes: sb,
        notes: notes || undefined,
      })

      if (autoPublish) {
        await publishLatest.mutateAsync({
          channel,
          versionCode: vc,
          versionName,
          fileKey,
          fileSha256,
          sizeBytes: sb,
        })
      }

      // Reset form (keep channel)
      setVersionCode('')
      setVersionName('')
      setFileKey('')
      setFileSha256('')
      setSizeBytes('')
      setNotes('')
      setFile(null)
    } catch {
      // Errors surfaced by toasts in mutations
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold">Create Release</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Upload an APK to Cloudflare R2, then create a release entry. Optionally publish
        <span className="font-mono"> latest.json </span>
        so the Profile downloads tab updates immediately.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Release Channel
            </label>
            <Dropdown
              options={CHANNEL_OPTIONS}
              value={channel}
              onChange={(value) => setChannel(value as ChannelOption['value'])}
              placeholder="Select channel"
              className="w-full"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Version Code
            </label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              value={versionCode}
              onChange={(e) => setVersionCode((e.target as HTMLInputElement).value)}
              placeholder="e.g. 1031"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Version Name
            </label>
            <Input
              value={versionName}
              onChange={(e) => setVersionName((e.target as HTMLInputElement).value)}
              placeholder="e.g. 0.10.31"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">APK File</label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept=".apk"
              className="flex-1"
              onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] ?? null)}
            />
            <Button
              variant="outline"
              onClick={handleUpload}
              isLoading={isUploading || getUploadUrl.isPending}
              disabled={!file || !versionName}
            >
              Upload to R2
            </Button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {file ? (
              <span className="break-all">
                Selected: {file.name} ({bytesToHuman(file.size)})
              </span>
            ) : (
              <span>Pick an .apk. We’ll compute SHA‑256 and size on upload.</span>
            )}
            {(!versionName || versionName.trim() === '') && (
              <span> Set a Version Name before uploading.</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">R2 Key</label>
            <Input
              value={fileKey}
              onChange={(e) => setFileKey((e.target as HTMLInputElement).value)}
              placeholder="android/stable/emuready_0.10.31.apk"
              readOnly={!fileKey}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SHA‑256</label>
            <Input
              value={fileSha256}
              onChange={(e) => setFileSha256((e.target as HTMLInputElement).value)}
              placeholder="Computed after upload"
              readOnly={!fileSha256}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              value={sizeBytes}
              onChange={(e) => setSizeBytes((e.target as HTMLInputElement).value)}
              placeholder="Bytes"
              readOnly={!sizeBytes}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes (optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes for this release"
            className="w-full rounded-xl border border-gray-200 bg-white/80 py-2 px-3 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Toggle checked={autoPublish} onChange={setAutoPublish} size="sm" />
            <span>Auto‑publish latest.json</span>
          </label>
          <Button
            variant="outline"
            onClick={() => {
              setVersionCode('')
              setVersionName('')
              setFileKey('')
              setFileSha256('')
              setSizeBytes('')
              setNotes('')
              setFile(null)
            }}
          >
            Reset
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate} isLoading={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create release'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
