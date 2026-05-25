import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { shadesOfPurple } from '@clerk/themes'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { type Metadata, type Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { connection } from 'next/server'
import { Suspense, type PropsWithChildren } from 'react'
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
import ServiceWorkerRegistrar from './ServiceWorkerRegistrar'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = defaultMetadata

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {env.IS_PROD && env.GA_ID && (
          <Script id="google-analytics-dataLayer" strategy="beforeInteractive">
            {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
              `}
          </Script>
        )}
      </head>
      <body className={cn(inter.className, 'min-h-screen bg-background font-sans antialiased')}>
        <ServiceWorkerRegistrar enabled={env.ENABLE_SW} />
        <ClerkBoundary>
          <Providers>
            <Toaster richColors closeButton />
            {env.IS_PROD && !env.DISABLE_COOKIE_BANNER && <CookieConsent />}
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <Suspense fallback={null}>
                <Navbar />
              </Suspense>
              <Main>{props.children}</Main>
              <Footer />
            </div>
          </Providers>
          {env.IS_PROD && (
            <Suspense fallback={null}>
              <SessionTracker />
              <PageViewTracker />
              <SpeedInsights />
              <KofiWidget />
              <GoogleAnalytics gaId={env.GA_ID} />
            </Suspense>
          )}
          {env.VERCEL_ANALYTICS_ENABLED && (
            <Suspense fallback={null}>
              <Analytics />
            </Suspense>
          )}
        </ClerkBoundary>
      </body>
    </html>
  )
}

function ClerkBoundary(props: PropsWithChildren) {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <Suspense fallback={null}>
        <ClerkProvider appearance={{ baseTheme: shadesOfPurple }}>{props.children}</ClerkProvider>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={null}>
      <DevelopmentClerkProvider>{props.children}</DevelopmentClerkProvider>
    </Suspense>
  )
}

async function DevelopmentClerkProvider(props: PropsWithChildren) {
  await connection()

  return <ClerkProvider appearance={{ baseTheme: shadesOfPurple }}>{props.children}</ClerkProvider>
}
