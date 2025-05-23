import './globals.css'
import { type Metadata } from 'next'
import { type PropsWithChildren } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from 'sonner'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Main from './Main'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  applicationName: 'EmuReady',
  title: {
    template: '%s | EmuReady',
    default: 'EmuReady - Know before you load',
  },
  description: 'Community-driven Android emulation compatibility hub',
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Toaster richColors closeButton />
          <div className="flex flex-col min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <Navbar />
            <Main>{props.children}</Main>
            <Footer />
          </div>
        </Providers>
      </body>
      <SpeedInsights />
      {/* TODO: show annoying cookie banner? */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  )
}
