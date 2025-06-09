import './globals.css'
import { type Metadata } from 'next'
import { type PropsWithChildren } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { shadesOfPurple } from '@clerk/themes'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import BetaWarningModal from '@/components/BetaWarningModal'
import Providers from '@/components/Providers'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/Footer'
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
        <body className={inter.className}>
          <Providers>
            <Toaster richColors closeButton />
            <BetaWarningModal />
            <div className="flex flex-col min-h-screen bg-background text-foreground">
              <Navbar />
              <Main>{props.children}</Main>
              <Footer />
            </div>
          </Providers>
          <Analytics />
          <SpeedInsights />
        </body>
        {/* TODO: show annoying cookie banner? */}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </html>
    </ClerkProvider>
  )
}
