import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { shadesOfPurple } from '@clerk/themes'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { type Metadata, type Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { type PropsWithChildren } from 'react'
import { Toaster } from 'sonner'
import CookieConsent from '@/components/CookieConsent'
import { Footer } from '@/components/footer/Footer'
import Navbar from '@/components/navbar/Navbar'
import PageViewTracker from '@/components/PageViewTracker'
import Providers from '@/components/Providers'
import SessionTracker from '@/components/SessionTracker'
import KofiWidget from '@/components/ui/KofiWidget'
import { cn } from '@/lib/utils'
import Main from './Main'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://emuready.com'

export const metadata: Metadata = {
  applicationName: 'EmuReady',
  title: {
    template: '%s | EmuReady',
    default: 'EmuReady',
  },
  description: 'Find the perfect emulator settings for your games and devices',
  creator: 'Producdevity',
  other: {
    'theme-color': '#111828',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EmuReady',
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
  metadataBase: new URL(appUrl),
  openGraph: {
    type: 'website',
    url: appUrl,
    title: 'EmuReady - Know before you load',
    description:
      'Find the perfect emulator settings for your games and devices!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EmuReady - Know before you load',
    description: `Find the perfect emulator settings for your games and devices on ${appUrl}`,
  },
  alternates: {
    canonical: appUrl,
  },
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const ENABLE_SW = process.env.NEXT_PUBLIC_ENABLE_SW === 'true'

export default function RootLayout(props: PropsWithChildren) {
  return (
    <ClerkProvider appearance={{ baseTheme: shadesOfPurple }}>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Service Worker Registration */}
          {ENABLE_SW && (
            <Script src="/sw-register.js" strategy="afterInteractive" />
          )}

          {/* Initialize dataLayer for Google Analytics */}
          <Script id="google-analytics-dataLayer" strategy="beforeInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            `}
          </Script>
        </head>
        <body
          className={cn(
            inter.className,
            'min-h-screen bg-background font-sans antialiased',
          )}
        >
          <Providers>
            <SessionTracker />
            <PageViewTracker />
            <Toaster richColors closeButton />
            <CookieConsent />
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <Navbar />
              <Main>{props.children}</Main>
              <Footer />
            </div>
          </Providers>
          <Analytics />
          <SpeedInsights />
          {IS_PRODUCTION && <KofiWidget />}
          {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
        </body>
      </html>
    </ClerkProvider>
  )
}
