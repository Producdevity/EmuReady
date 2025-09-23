'use client'

import Link from 'next/link'
import { FooterAppLinks } from '@/components/footer/components/FooterAppLinks'
import { FooterBetaBadge } from '@/components/footer/components/FooterBetaBadge'
import { FooterKofiButton } from '@/components/footer/components/FooterKofiButton'
import { FooterLink } from '@/components/footer/components/FooterLink'
import { FooterPatreonButton } from '@/components/footer/components/FooterPatreonButton'
import { GitHubIcon } from '@/components/icons'
import { ThemeSelect } from '@/components/ui'
import analytics from '@/lib/analytics'

const discordUrl = process.env.NEXT_PUBLIC_DISCORD_LINK
const patreonUrl = process.env.NEXT_PUBLIC_PATREON_LINK
const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL
const githubReadmeUrl = `${process.env.NEXT_PUBLIC_GITHUB_URL}/blob/master/README.md`
const githubSupportUrl = `${process.env.NEXT_PUBLIC_GITHUB_URL}/issues/new?template=question.md`
const githubContributingUrl = `${process.env.NEXT_PUBLIC_GITHUB_URL}/blob/master/CONTRIBUTING.md`
const githubRequestEmulatorUrl = `${process.env.NEXT_PUBLIC_GITHUB_URL}/issues/new?template=emulator_request.md`

function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="absolute inset-0 -z-20 opacity-20">
        <div className="h-full w-full bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>

      <div className="relative bg-gradient-to-b from-white/60 via-gray-50/80 to-white/60 dark:from-gray-900/60 dark:via-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4 py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="mb-6">
                <h3 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-600 bg-clip-text text-transparent mb-3">
                  EmuReady
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed max-w-md">
                  Know before you load. The ultimate community-driven platform for emulation
                  compatibility reports.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Apps
                </span>
                <FooterAppLinks />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EmuReady GitHub"
                  className="inline-flex items-center justify-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    analytics.contentDiscovery.externalLinkClicked({
                      url: githubUrl || '',
                      context: 'footer_github_link',
                    })
                  }}
                >
                  <GitHubIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </a>

                <div className="inline-flex">
                  <FooterKofiButton />
                </div>
                <div className="inline-flex">
                  <FooterPatreonButton />
                </div>

                <div className="inline-flex p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <ThemeSelect />
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="group">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                About
              </h4>
              <ul className="space-y-4">
                <li>
                  <FooterLink
                    href={githubReadmeUrl}
                    label="About"
                    color="blue"
                    analyticsContextKey="footer_about_link"
                  />
                </li>
                <li>
                  <FooterLink
                    href={githubSupportUrl}
                    label="Support"
                    color="blue"
                    analyticsContextKey="footer_support_link"
                  />
                </li>
                <li>
                  <Link
                    href="/privacy"
                    aria-label="Visit EmuReady's Privacy Policy"
                    className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                  >
                    <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    aria-label="Visit EmuReady's Terms of Service"
                    className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                  >
                    <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community Section */}
            <div className="group">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" />
                Community
              </h4>
              <ul className="space-y-4">
                <li>
                  <FooterLink
                    href={githubContributingUrl}
                    label="Contribute"
                    color="purple"
                    analyticsContextKey="footer_contribute_link"
                  />
                </li>
                <li>
                  <FooterLink
                    href={githubRequestEmulatorUrl}
                    label="Add Your Emulator"
                    color="purple"
                    analyticsContextKey="footer_add_emulator_link"
                  />
                </li>
                {githubUrl && (
                  <li>
                    <FooterLink
                      href={githubUrl}
                      label="GitHub"
                      color="purple"
                      analyticsContextKey="footer_github_community_link"
                    />
                  </li>
                )}
                {discordUrl && (
                  <li>
                    <FooterLink
                      href={discordUrl}
                      label="Discord"
                      color="purple"
                      analyticsContextKey="footer_discord_link"
                    />
                  </li>
                )}
                {patreonUrl && (
                  <li>
                    <FooterLink
                      href={patreonUrl}
                      label="Patreon"
                      color="purple"
                      analyticsContextKey="footer_patreon_link"
                    />
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="relative pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                &copy; {new Date().getFullYear()} EmuReady. All rights reserved.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Built with ❤️ by your mom
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterBetaBadge />
    </footer>
  )
}

export default Footer
