'use client'

import Link from 'next/link'
import KofiFooterButton from '@/components/footer/KofiFooterButton'
import GitHubIcon from '@/components/icons/GitHubIcon'
import { ThemeSelect } from '@/components/ui'
import analytics from '@/lib/analytics'

const discordUrl = process.env.NEXT_PUBLIC_DISCORD_LINK
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
                  Know before you load. The ultimate community-driven platform
                  for emulation compatibility reports.
                </p>
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
                  <KofiFooterButton />
                </div>

                <div className="inline-flex p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <ThemeSelect />
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="group">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></span>
                About
              </h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href={githubReadmeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="EmuReady Documentation"
                    className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                    onClick={() => {
                      analytics.contentDiscovery.externalLinkClicked({
                        url: githubReadmeUrl,
                        context: 'footer_about_link',
                      })
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    About
                  </a>
                </li>
                <li>
                  <a
                    href={githubSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="EmuReady Support"
                    className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                    onClick={() => {
                      analytics.contentDiscovery.externalLinkClicked({
                        url: githubSupportUrl,
                        context: 'footer_support_link',
                      })
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    Support
                  </a>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    aria-label="Privacy Policy"
                    className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                  >
                    <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    aria-label="Terms of Service"
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
                  <a
                    href={githubContributingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contribute to EmuReady"
                    className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                    onClick={() => {
                      analytics.contentDiscovery.externalLinkClicked({
                        url: githubContributingUrl,
                        context: 'footer_contribute_link',
                      })
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    Contribute
                  </a>
                </li>
                <li>
                  <a
                    href={githubRequestEmulatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Add your Emulator"
                    className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                    onClick={() => {
                      analytics.contentDiscovery.externalLinkClicked({
                        url: githubRequestEmulatorUrl,
                        context: 'footer_add_emulator_link',
                      })
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    Add Your Emulator
                  </a>
                </li>
                <li>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="EmuReady GitHub"
                    className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                    onClick={() => {
                      analytics.contentDiscovery.externalLinkClicked({
                        url: githubUrl || '',
                        context: 'footer_github_community_link',
                      })
                    }}
                  >
                    <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    GitHub
                  </a>
                </li>
                {discordUrl && (
                  <li>
                    <a
                      href={discordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="EmuReady Discord"
                      className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                      onClick={() => {
                        analytics.contentDiscovery.externalLinkClicked({
                          url: discordUrl,
                          context: 'footer_discord_link',
                        })
                      }}
                    >
                      <span className="w-1.5 h-1.5 bg-current rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                      Discord
                    </a>
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
                  Built with ❤️ for the emulation community
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Badge - Repositioned to prevent overlaps */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
        <div className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm border border-orange-400/20 animate-pulse-slow">
          BETA
        </div>
      </div>
    </footer>
  )
}

export default Footer
