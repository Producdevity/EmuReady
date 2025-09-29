export function bytesToHuman(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(1)} ${sizes[i]}`
}
