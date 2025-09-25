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
import Footer from '@/components/footer/Footer'
import Navbar from '@/components/navbar/Navbar'
import PageViewTracker from '@/components/PageViewTracker'
import Providers from '@/components/Providers'
import SessionTracker from '@/components/SessionTracker'
import KofiWidget from '@/components/ui/KofiWidget'
import { env } from '@/lib/env'
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

export default function RootLayout(props: PropsWithChildren) {
  return (
    <ClerkProvider appearance={{ baseTheme: shadesOfPurple }}>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Service Worker Registration / Unregister in dev
           * - In dev (not production), always load to proactively unregister any SW and clear caches
           * - In prod, only load when explicitly enabled via NEXT_PUBLIC_ENABLE_SW
           */}
          {(env.ENABLE_SW || !env.IS_PROD) && (
            <Script src="/sw-register.js" strategy="afterInteractive" />
          )}

          {/* Initialize dataLayer for Google Analytics */}
          {env.IS_PROD && env.GA_ID && (
            <Script id="google-analytics-dataLayer" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
              `}
            </Script>
          )}

          {/* Google Analytics Configuration */}
        </head>
        <body className={cn(inter.className, 'min-h-screen bg-background font-sans antialiased')}>
          <Providers>
            <Toaster richColors closeButton />
            {env.IS_PROD && !env.DISABLE_COOKIE_BANNER && <CookieConsent />}
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <Navbar />
              <Main>{props.children}</Main>
              <Footer />
            </div>
          </Providers>
          {env.IS_PROD && (
            <>
              <SessionTracker />
              <PageViewTracker />
              <SpeedInsights />
              <KofiWidget />
              <GoogleAnalytics gaId={env.GA_ID} />
            </>
          )}
          {env.VERCEL_ANALYTICS_ENABLED && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
