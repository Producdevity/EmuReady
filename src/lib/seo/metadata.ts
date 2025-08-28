import { escape } from 'html-escaper'
import { type Metadata } from 'next'

const appName = 'EmuReady'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://emuready.com'
const appDescription = 'Find the perfect emulator settings for your games and devices'

export const siteConfig = {
  name: appName,
  url: appUrl,
  description: appDescription,
  creator: 'Producdevity',
  keywords: [
    'emulator',
    'emulation',
    'game compatibility',
    'retro gaming',
    'android emulator',
    'pc emulator',
    'game settings',
    'performance',
    'gaming',
    'compatibility database',
    'Eden emulator',
    'Dolphin emulator',
    'Winlator emulator',
  ],
  authors: [{ name: 'Producdevity', url: appUrl }],
} as const

export const defaultMetadata: Metadata = {
  applicationName: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  title: {
    template: `%s | ${siteConfig.name}`,
    default: siteConfig.name,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [...siteConfig.authors],
  creator: siteConfig.creator,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - Know before you load`,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Know before you load`,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Know before you load`,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.png`],
    creator: '@producdevity',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'theme-color': '#111828',
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '', // TODO: add if we start caring
    'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '', // TODO: add if we start caring
    'yandex-verification': process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || '', // TODO: add if we start caring
    'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '', // TODO: add if we start caring
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION, // TODO: add if we start caring
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION, // TODO: add if we start caring
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteConfig.name,
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      {
        url: '/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  alternates: {
    canonical: siteConfig.url,
  },
}

export function generatePageMetadata(
  title: string,
  description?: string,
  path?: string,
  image?: string,
): Metadata {
  const startTime = performance.now()

  const pageUrl = path ? `${siteConfig.url}${path}` : siteConfig.url
  const ogImage = image || `${siteConfig.url}/og-image.png`

  // Escape user-generated content to prevent XSS
  const escapedTitle = escape(title)
  const escapedDescription = description ? escape(description) : siteConfig.description

  const metadata: Metadata = {
    title: escapedTitle,
    description: escapedDescription,
    openGraph: {
      title: `${escapedTitle} | ${siteConfig.name}`,
      description: escapedDescription,
      url: pageUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: escapedTitle,
        },
      ],
    },
    twitter: {
      title: `${escapedTitle} | ${siteConfig.name}`,
      description: escapedDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: pageUrl,
    },
  }

  // Track metadata generation performance
  const generationTime = performance.now() - startTime
  if (generationTime > 50) {
    console.warn(
      `[SEO] Slow metadata generation for ${path || '/'}: ${generationTime.toFixed(2)}ms`,
    )
  }

  return metadata
}

interface StructuredDataBase {
  name?: string
  description?: string
  url?: string
  authorName?: string
  datePublished?: string
  compatibilityNotes?: string
  reviewBody?: string
  performanceRating?: number
  gameName?: string
  emulatorName?: string
  deviceName?: string
  numberOfItems?: number
  items?: { url: string; name: string }[]
}

export function generateStructuredData(
  type: 'WebSite' | 'WebPage' | 'Review' | 'ItemList' | 'BreadcrumbList' | 'Organization',
  data: StructuredDataBase,
) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  }

  switch (type) {
    case 'WebSite':
      return {
        ...baseData,
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/games?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        ...data,
      }
    case 'WebPage':
      return {
        ...baseData,
        name: data.name ? escape(data.name) : undefined,
        description: data.description ? escape(data.description) : undefined,
        url: data.url,
        isPartOf: {
          '@type': 'WebSite',
          name: siteConfig.name,
          url: siteConfig.url,
        },
        ...data,
      }
    case 'Review':
      return {
        ...baseData,
        author: {
          '@type': 'Person',
          name: data.authorName ? escape(data.authorName) : undefined,
        },
        datePublished: data.datePublished,
        reviewBody: data.compatibilityNotes
          ? escape(data.compatibilityNotes)
          : data.reviewBody
            ? escape(data.reviewBody)
            : undefined,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: data.performanceRating,
          bestRating: 5,
          worstRating: 1,
        },
        itemReviewed: {
          '@type': 'SoftwareApplication',
          name: data.gameName ? escape(data.gameName) : undefined,
          operatingSystem: data.emulatorName ? escape(data.emulatorName) : undefined,
          applicationCategory: 'GameApplication',
        },
        about: {
          '@type': 'Thing',
          name:
            data.gameName && data.emulatorName
              ? escape(`${data.gameName} on ${data.emulatorName}`)
              : undefined,
          description:
            data.gameName && data.emulatorName && data.deviceName
              ? escape(
                  `Compatibility report for ${data.gameName} running on ${data.emulatorName} using ${data.deviceName}`,
                )
              : undefined,
        },
        ...data,
      }
    case 'ItemList':
      return {
        ...baseData,
        numberOfItems: data.numberOfItems,
        itemListElement: data.items?.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: item.url,
          name: escape(item.name),
        })),
        ...data,
      }
    case 'BreadcrumbList':
      return {
        ...baseData,
        itemListElement: data.items?.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@id': `${siteConfig.url}${item.url}`,
            name: escape(item.name),
          },
        })),
      }
    case 'Organization':
      return {
        ...baseData,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/favicon/android-chrome-512x512.png`,
        sameAs: [
          process.env.NEXT_PUBLIC_TWITTER_URL || '',
          process.env.NEXT_PUBLIC_GITHUB_URL || '',
        ].filter(Boolean),
        ...data,
      }
    default:
      return baseData
  }
}

export function generateBreadcrumbStructuredData(breadcrumbs: { name: string; url: string }[]) {
  return generateStructuredData('BreadcrumbList', {
    items: breadcrumbs,
  })
}
