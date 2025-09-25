'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Download, Smartphone } from 'lucide-react'
import { AppPhoneMockup } from '@/components/app/AppPhoneMockup'
import analytics from '@/lib/analytics'
import { motionPresets } from '@/lib/motionPresets'

const appDownloadPath =
  process.env.NEXT_PUBLIC_EMUREADY_LITE_GITHUB_URL ||
  'https://github.com/Producdevity/EmuReadyLite/releases'
const playStoreBetaUrl =
  process.env.NEXT_PUBLIC_EMUREADY_BETA_URL ||
  'https://play.google.com/store/apps/details?id=com.producdevity.emureadyapp'
const emuReadyLiteScreens = [
  '/assets/android-app/emuready-app-ss-1.png',
  '/assets/android-app/emuready-app-ss-2.png',
  '/assets/android-app/emuready-app-ss-3.png',
  '/assets/android-app/emuready-app-ss-4.png',
]

export function HomeAppFeatured() {
  return (
    <section className="relative mb-20">
      {/* Soft gradient accents behind the Android hero */}
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-blue-500/20 via-indigo-500/10 to-transparent dark:from-blue-500/20 dark:via-indigo-500/10" />
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute left-0 top-16 h-56 w-56 -translate-x-[45%] rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-400/20 sm:h-72 sm:w-72 sm:-translate-x-[35%] lg:h-80 lg:w-80 lg:-translate-x-[25%]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-[45%] rounded-full bg-blue-500/20 blur-3xl sm:h-80 sm:w-80 sm:translate-x-[35%] lg:h-96 lg:w-96 lg:translate-x-[25%]" />
      </div>

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-2xl shadow-blue-500/20 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/85 dark:shadow-blue-900/30">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/80 via-white/30 to-transparent dark:from-white/10 dark:via-white/5" />
        <div className="relative z-10 px-6 py-10 lg:px-16">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div {...motionPresets.fadeInUp(0)} className="space-y-10">
              <div className="px-3 py-1.5 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold rounded-full shadow-lg backdrop-blur-sm border border-line-400/20">
                <Smartphone className="h-4 w-4" />
                EmuReady on Android
              </div>
              <div className="space-y-5">
                <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl md:leading-tight">
                  <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    The largest Emulation Compatibility Database
                  </span>{' '}
                  now in your pocket.
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <motion.a
                  {...motionPresets.fadeInUp(0.18)}
                  href={playStoreBetaUrl}
                  title="Get the EmuReady Beta Android App on the Google Play Store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-shadow duration-150 hover:shadow-xl"
                  onClick={() => {
                    analytics.conversion.appDownloadClicked({
                      appName: 'EmuReady Beta',
                      platform: 'android',
                      location: 'homepage_beta_cta',
                      url: playStoreBetaUrl,
                    })
                  }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.12, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ArrowRight className="h-5 w-5" />
                  Get EmuReady Beta
                </motion.a>
                <motion.a
                  {...motionPresets.fadeInUp(0.22)}
                  href={appDownloadPath}
                  title="View EmuReady Lite releases on GitHub"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-shadow duration-150 hover:shadow-xl"
                  onClick={() => {
                    analytics.conversion.appDownloadClicked({
                      appName: 'EmuReady Lite',
                      platform: 'android',
                      location: 'homepage_lite_cta',
                      url: appDownloadPath,
                    })
                  }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.12, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Download className="h-5 w-5" />
                  View Lite Releases
                </motion.a>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <b>EmuReady Beta</b> ships on Google Play with all the latest early access features
                and automatic updates.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <b>EmuReady Lite</b> is the free APK hosted here on emuready.com providing the core
                functionality.
              </p>
            </motion.div>

            <motion.div {...motionPresets.fadeInUp(0.12)} className="relative flex justify-center">
              <AppPhoneMockup
                alt="Preview of the EmuReady Lite Android app"
                imageSrcs={emuReadyLiteScreens}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
