import {
  GAME_IMAGE_PROVIDER_HOST_PATTERNS,
  NEXT_IMAGE_REMOTE_HOST_PATTERNS,
} from '@config/image-hosts'

export type ImageRenderMode = 'next-image' | 'external-img' | 'invalid'

const BLOCKED_EXACT_HOSTS = new Set(['localhost', '0.0.0.0'])

type IPv4Octets = readonly [number, number, number, number]
type IPv6Groups = readonly [number, number, number, number, number, number, number, number]

function matchesHostPattern(hostname: string, pattern: string): boolean {
  if (!pattern.startsWith('*.')) return hostname === pattern

  const parentHost = pattern.slice(2)
  return hostname.endsWith(`.${parentHost}`)
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '').replace(/\.+$/, '')
}

function parseIPv4Octet(value: string): number | null {
  if (!/^\d+$/.test(value)) return null

  const octet = Number(value)
  return Number.isInteger(octet) && octet >= 0 && octet <= 255 ? octet : null
}

function parseIPv4Address(hostname: string): IPv4Octets | null {
  const parts = hostname.split('.')
  if (parts.length !== 4) return null

  const first = parseIPv4Octet(parts[0] ?? '')
  const second = parseIPv4Octet(parts[1] ?? '')
  const third = parseIPv4Octet(parts[2] ?? '')
  const fourth = parseIPv4Octet(parts[3] ?? '')
  if (first === null || second === null || third === null || fourth === null) return null

  return [first, second, third, fourth]
}

function isBlockedIPv4Address(hostname: string): boolean {
  const octets = parseIPv4Address(hostname)
  if (!octets) return false

  return isBlockedIPv4Octets(octets)
}

function isBlockedIPv4Octets(octets: IPv4Octets): boolean {
  const [first, second, third] = octets

  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 88 && third === 99) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  )
}

function toIPv6Groups(groups: number[]): IPv6Groups | null {
  if (groups.length !== 8) return null

  const [first, second, third, fourth, fifth, sixth, seventh, eighth] = groups
  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    fourth === undefined ||
    fifth === undefined ||
    sixth === undefined ||
    seventh === undefined ||
    eighth === undefined
  ) {
    return null
  }

  return [first, second, third, fourth, fifth, sixth, seventh, eighth]
}

function parseIPv6Group(group: string): number | null {
  if (!/^[0-9a-f]{1,4}$/i.test(group)) return null
  return Number.parseInt(group, 16)
}

function parseIPv6Groups(value: string): number[] | null {
  if (!value) return []

  const parts = value.split(':')
  const groups: number[] = []

  for (const part of parts) {
    if (part.includes('.')) {
      const octets = parseIPv4Address(part)
      if (!octets) return null

      const [first, second, third, fourth] = octets
      groups.push((first << 8) | second, (third << 8) | fourth)
      continue
    }

    const group = parseIPv6Group(part)
    if (group === null) return null
    groups.push(group)
  }

  return groups
}

function parseIPv6Address(hostname: string): IPv6Groups | null {
  if (!hostname.includes(':')) return null

  const doubleColonParts = hostname.split('::')
  if (doubleColonParts.length > 2) return null

  if (doubleColonParts.length === 1) {
    const groups = parseIPv6Groups(hostname)
    return groups ? toIPv6Groups(groups) : null
  }

  const [head = '', tail = ''] = doubleColonParts
  const headGroups = parseIPv6Groups(head)
  const tailGroups = parseIPv6Groups(tail)
  if (!headGroups || !tailGroups) return null

  const missingGroupCount = 8 - headGroups.length - tailGroups.length
  if (missingGroupCount < 1) return null

  return toIPv6Groups([...headGroups, ...Array<number>(missingGroupCount).fill(0), ...tailGroups])
}

function getIPv4FromIPv6Groups(groups: IPv6Groups): IPv4Octets | null {
  const isIPv4Mapped =
    groups[0] === 0 &&
    groups[1] === 0 &&
    groups[2] === 0 &&
    groups[3] === 0 &&
    groups[4] === 0 &&
    groups[5] === 0xffff
  const isIPv4Compatible =
    groups[0] === 0 &&
    groups[1] === 0 &&
    groups[2] === 0 &&
    groups[3] === 0 &&
    groups[4] === 0 &&
    groups[5] === 0

  if (!isIPv4Mapped && !isIPv4Compatible) return null

  return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff]
}

function isBlockedIPv6(hostname: string): boolean {
  const groups = parseIPv6Address(hostname)
  if (!groups) return false

  const embeddedIPv4 = getIPv4FromIPv6Groups(groups)
  if (embeddedIPv4 && isBlockedIPv4Octets(embeddedIPv4)) return true

  const sixToFourIPv4: IPv4Octets | null =
    groups[0] === 0x2002
      ? [groups[1] >> 8, groups[1] & 0xff, groups[2] >> 8, groups[2] & 0xff]
      : null
  if (sixToFourIPv4 && isBlockedIPv4Octets(sixToFourIPv4)) return true

  const isUnspecified = groups.every((group) => group === 0)
  const isLoopback = groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1

  return (
    isUnspecified ||
    isLoopback ||
    (groups[0] & 0xfe00) === 0xfc00 ||
    (groups[0] & 0xffc0) === 0xfe80 ||
    (groups[0] & 0xffc0) === 0xfec0 ||
    (groups[0] & 0xff00) === 0xff00 ||
    (groups[0] === 0x2001 && groups[1] === 0x0db8)
  )
}

function isIPAddressLiteral(hostname: string): boolean {
  return parseIPv4Address(hostname) !== null || parseIPv6Address(hostname) !== null
}

function isLocalImagePath(src: string): boolean {
  return src.startsWith('/') && !src.startsWith('//')
}

function isBlockedImageHostname(hostname: string): boolean {
  const normalizedHostname = normalizeHostname(hostname)

  return (
    BLOCKED_EXACT_HOSTS.has(normalizedHostname) ||
    normalizedHostname.endsWith('.localhost') ||
    (isIPAddressLiteral(normalizedHostname) &&
      (isBlockedIPv4Address(normalizedHostname) || isBlockedIPv6(normalizedHostname)))
  )
}

function parseHttpsImageUrl(src: string): URL | null {
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:') return null
    if (isBlockedImageHostname(url.hostname)) return null
    return url
  } catch {
    return null
  }
}

function isKnownNextImageRemoteUrl(src: string): boolean {
  const url = parseHttpsImageUrl(src)
  if (!url) return false

  return NEXT_IMAGE_REMOTE_HOST_PATTERNS.some((pattern) =>
    matchesHostPattern(normalizeHostname(url.hostname), pattern),
  )
}

export function isKnownGameImageProviderUrl(src: string): boolean {
  const url = parseHttpsImageUrl(src)
  if (!url) return false

  return GAME_IMAGE_PROVIDER_HOST_PATTERNS.some((pattern) =>
    matchesHostPattern(normalizeHostname(url.hostname), pattern),
  )
}

export function getImageRenderMode(src: string): ImageRenderMode {
  if (isLocalImagePath(src) || isKnownNextImageRemoteUrl(src)) return 'next-image'
  if (parseHttpsImageUrl(src)) return 'external-img'
  return 'invalid'
}

export function getGameImageUrlValidationError(src: string): string | null {
  const trimmedSrc = src.trim()
  if (!trimmedSrc) return null

  let url: URL
  try {
    url = new URL(trimmedSrc)
  } catch {
    return 'Enter a valid image URL.'
  }

  if (url.protocol !== 'https:') return 'Image URL must use HTTPS.'
  if (isBlockedImageHostname(url.hostname)) {
    return 'Image URL cannot point to localhost or a private network address.'
  }

  if (url.pathname.toLowerCase().endsWith('.svg')) {
    return 'SVG game images are not allowed.'
  }

  return null
}
