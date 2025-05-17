function getSafePlaceholderImageUrl(title?: string | null): string {
  // Ensure string, remove non-printable ASCII, remove percent signs and other potentially harmful characters
  const safeTitle = String(title ?? '')
    .replace(/[^ -~]/g, '') // remove non-printable ASCII
    .replace(/[%<>(){}[\]\\/=+]/g, '') // remove potentially dangerous characters
    .trim()
    .substring(0, 15) // limit length

  // Directly encode the string to prevent any potential XSS in URL
  return `/api/proxy-image?url=https://placehold.co/400x300/9ca3af/1e293b?text=${encodeURIComponent(safeTitle)}`
}

export default getSafePlaceholderImageUrl
