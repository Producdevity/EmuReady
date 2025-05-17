import './globals.css'
import { ErrorFallback } from '@/components/ui'
import { type PropsWithChildren, type ErrorInfo } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ErrorBoundary } from 'react-error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'EmuReady - Know before you load',
  description: 'Community-driven Android emulation compatibility hub',
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

const handleError = (error: Error, info: ErrorInfo) => {
  // TODO: Log error to an error tracking service
  console.error('ErrorBoundary caught an error', error, info)
}

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={(details) => {
                  console.error('ErrorBoundary reset', details)
                  // TODO: Log reset event to an error tracking service
                  // TODO: Reset any state in your app that caused the error instead of reloading
                  window.location.reload()
                }}
                onError={handleError}
              >
                {props.children}
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
      <SpeedInsights />
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  )
}
