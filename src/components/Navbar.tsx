'use client'

import { hasPermission } from '@/utils/permissions'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { signOut, useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ui'
import { Role } from '@orm'

function Navbar() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const getNavItemClass = useCallback(
    (path: string) => {
      const dynamicClassNames =
        pathname === path
          ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'

      return `${dynamicClassNames} block px-3 py-2 rounded-md text-base font-medium`
    },
    [pathname],
  )

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-lg sticky top-0 z-50 transition-all">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo/EmuReady_icon_logo.png"
                alt="EmuReady Logo"
                width={40}
                height={40}
                className="h-14 w-14"
              />
            </Link>
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-green-600 via-green-400 to-purple-600 dark:from-green-300 dark:via-green-200 dark:to-purple-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
                EmuReady
              </span>
              <p className="hidden sm:block font-medium text-sm text-gray-600 dark:text-blue-100  ">
                Know before you load
              </p>
            </Link>

            <p className="pl-8 sm:block text-sm text-red-400 font-medium">
              [BETA] - This is a work in progress, all data is mock data for
              testing purposes
            </p>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className={getNavItemClass('/')}>
                  Home
                </Link>
                <Link href="/listings" className={getNavItemClass('/listings')}>
                  Listings
                </Link>
                <Link href="/games" className={getNavItemClass('/games')}>
                  Games
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              <ThemeToggle />

              {session ? (
                <div className="flex items-center space-x-3">
                  <Link href="/profile" className={getNavItemClass('/profile')}>
                    Profile
                  </Link>
                  {hasPermission(session?.user?.role, Role.AUTHOR) && (
                    <Link
                      href="/listings/new"
                      className={getNavItemClass('/listings/new')}
                    >
                      Create Listing
                    </Link>
                  )}
                  {hasPermission(session?.user?.role, Role.ADMIN) && (
                    <Link href="/admin" className={getNavItemClass('/admin')}>
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-white dark:bg-gray-800 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            <Link
              href="/"
              className={getNavItemClass('/')}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/listings"
              className={getNavItemClass('/listings')}
              onClick={() => setMobileMenuOpen(false)}
            >
              Listings
            </Link>
            <Link
              href="/games"
              className={getNavItemClass('/games')}
              onClick={() => setMobileMenuOpen(false)}
            >
              Games
            </Link>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pb-3 pt-4">
            <div className="flex items-center px-5">
              <ThemeToggle className="ml-auto" />
            </div>
            <div className="mt-3 space-y-1 px-2">
              {session ? (
                <>
                  <Link
                    href="/profile"
                    className={getNavItemClass('/profile')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {hasPermission(session?.user?.role, Role.AUTHOR) && (
                    <Link
                      href="/listings/new"
                      className={getNavItemClass('/listings/new')}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Listing
                    </Link>
                  )}
                  {hasPermission(session?.user?.role, Role.ADMIN) && (
                    <Link
                      href="/admin"
                      className={getNavItemClass('admin')}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      // TODO: handle errors
                      signOut().catch(console.error)
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
