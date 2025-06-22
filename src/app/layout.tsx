import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { shadesOfPurple } from '@clerk/themes'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { type Metadata } from 'next'
import { Inter } from 'next/font/google'
import { type PropsWithChildren } from 'react'
import { Toaster } from 'sonner'
import BetaWarningModal from '@/components/BetaWarningModal'
import CookieConsent from '@/components/CookieConsent'
import Footer from '@/components/footer/Footer'
import Navbar from '@/components/navbar/Navbar'
import PageViewTracker from '@/components/PageViewTracker'
import Providers from '@/components/Providers'
import SessionTracker from '@/components/SessionTracker'
import KofiWidget from '@/components/ui/KofiWidget'
import Main from './Main'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  applicationName: 'EmuReady',
  title: {
    template: '%s | EmuReady',
    default: 'EmuReady - Know before you load',
  },
  description: 'Community-driven emulation compatibility hub',
  manifest: '/manifest.webmanifest',
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
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout(props: PropsWithChildren) {
  return (
    <ClerkProvider appearance={{ baseTheme: shadesOfPurple }}>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Initialize dataLayer before Google Analytics loads */}
          {GA_ID && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                `,
              }}
            />
          )}
        </head>
        <body className={inter.className}>
          <Providers>
            <SessionTracker />
            <PageViewTracker />
            <Toaster richColors closeButton />
            <BetaWarningModal />
            <CookieConsent />
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <Navbar />
              <Main>{props.children}</Main>
              <Footer />
            </div>
          </Providers>
          <Analytics />
          <SpeedInsights />
          <KofiWidget />
        </body>
        {/* TODO: show annoying cookie banner? */}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </html>
    </ClerkProvider>
  )
}
