'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { signOut, useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ui'

function Navbar() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path
  const userRole = session?.user?.role ?? 'USER'

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
              <span className="text-2xl font-extrabold bg-gradient-to-r from-green-300 via-green-200 to-purple-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
                EmuReady
              </span>
              <p className="hidden sm:block text-sm text-blue-100 font-medium">
                Know before you load
              </p>
            </Link>

            <p className="pl-8 sm:block text-sm text-red-400 font-medium">
              [BETA] - This is a work in progress, all data is mock data for
              testing purposes
            </p>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/"
                  className={`${
                    isActive('/')
                      ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } 
                    px-3 py-2 rounded-md text-sm font-medium`}
                >
                  Home
                </Link>
                <Link
                  href="/listings"
                  className={`${
                    isActive('/listings')
                      ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } 
                    px-3 py-2 rounded-md text-sm font-medium`}
                >
                  Listings
                </Link>
                <Link
                  href="/games"
                  className={`${
                    isActive('/games')
                      ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } 
                    px-3 py-2 rounded-md text-sm font-medium`}
                >
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
                  <Link
                    href="/profile"
                    className={`${
                      isActive('/profile')
                        ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } 
                      px-3 py-2 rounded-md text-sm font-medium`}
                  >
                    Profile
                  </Link>
                  {(userRole === 'AUTHOR' ||
                    userRole === 'ADMIN' ||
                    userRole === 'SUPER_ADMIN') && (
                    <Link
                      href="/listings/new"
                      className={`${
                        isActive('/listings/new')
                          ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } 
                        px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Create Listing
                    </Link>
                  )}
                  {userRole === 'ADMIN' ||
                    (userRole === 'SUPER_ADMIN' && (
                      <Link
                        href="/admin"
                        className={`${
                          isActive('/admin')
                            ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } 
                        px-3 py-2 rounded-md text-sm font-medium`}
                      >
                        Admin
                      </Link>
                    ))}
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
              className={`${
                isActive('/')
                  ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } 
                block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/listings"
              className={`${
                isActive('/listings')
                  ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } 
                block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Listings
            </Link>
            <Link
              href="/games"
              className={`${
                isActive('/games')
                  ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } 
                block px-3 py-2 rounded-md text-base font-medium`}
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
                    className={`${
                      isActive('/profile')
                        ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } 
                      block px-3 py-2 rounded-md text-base font-medium`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {(userRole === 'AUTHOR' ||
                    userRole === 'ADMIN' ||
                    userRole === 'SUPER_ADMIN') && (
                    <Link
                      href="/listings/new"
                      className={`${
                        isActive('/listings/new')
                          ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } 
                        block px-3 py-2 rounded-md text-base font-medium`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Listing
                    </Link>
                  )}
                  {userRole === 'ADMIN' ||
                    (userRole === 'SUPER_ADMIN' && (
                      <Link
                        href="/admin"
                        className={`${
                          isActive('/admin')
                            ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } 
                        block px-3 py-2 rounded-md text-base font-medium`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    ))}
                  <button
                    onClick={() => {
                      signOut()
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
