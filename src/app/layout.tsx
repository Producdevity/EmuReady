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
import { defaultMetadata } from '@/lib/seo/metadata'
import { cn } from '@/lib/utils'
import Main from './Main'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = defaultMetadata

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const GA_ID = process.env.NEXT_PUBLIC_GA_ID as string
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
          {IS_PRODUCTION && GA_ID && (
            <Script
              id="google-analytics-dataLayer"
              strategy="beforeInteractive"
            >
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
              `}
            </Script>
          )}

          {/* Google Analytics Configuration */}
        </head>
        <body
          className={cn(
            inter.className,
            'min-h-screen bg-background font-sans antialiased',
          )}
        >
          <Providers>
            <Toaster richColors closeButton />
            {IS_PRODUCTION && <CookieConsent />}
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <Navbar />
              <Main>{props.children}</Main>
              <Footer />
            </div>
          </Providers>
          {IS_PRODUCTION && (
            <>
              <SessionTracker />
              <PageViewTracker />
              <Analytics />
              <SpeedInsights />
              <KofiWidget />
              <GoogleAnalytics gaId={GA_ID} />
            </>
          )}
        </body>
      </html>
    </ClerkProvider>
  )
}
