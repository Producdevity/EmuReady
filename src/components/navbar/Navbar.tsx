'use client'

import { hasPermission } from '@/utils/permissions'
import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ui'
import { Role } from '@orm'
import LoadingIcon from '@/components/icons/LoadingIcon'
import LogoIcon from '@/components/icons/LogoIcon'
import { navbarItems } from './data'

function Navbar() {
  const { user, isLoaded } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Handle scroll effect for navbar
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get user role with proper type casting
  const userRole = user?.publicMetadata?.role as Role | null

  const getNavItemClass = useCallback(
    (path: string) => {
      const isActive = pathname === path
      return `relative px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ease-out group overflow-hidden ${
        isActive
          ? 'text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25'
          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
      }`
    },
    [pathname],
  )

  const getMobileNavItemClass = useCallback(
    (path: string) => {
      const isActive = pathname === path
      return `block px-4 py-3 rounded-xl font-semibold text-base transition-all duration-300 ${
        isActive
          ? 'text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`
    },
    [pathname],
  )

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-2xl shadow-black/5'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <LogoIcon animation />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              </div>
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-600 bg-clip-text text-transparent tracking-tight">
                  EmuReady
                </span>
                <p className="hidden sm:block font-medium text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Know before you load
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-1.5 backdrop-blur-sm">
              {navbarItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={getNavItemClass(item.href)}
                >
                  <span className="relative z-10">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {!isLoaded ? (
              <div className="flex items-center justify-center w-8 h-8">
                <LoadingIcon />
              </div>
            ) : (
              <>
                {user ? (
                  <div className="flex items-center space-x-3">
                    {userRole && hasPermission(userRole, Role.AUTHOR) && (
                      <Link
                        href="/listings/new"
                        className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105"
                      >
                        Create Listing
                      </Link>
                    )}
                    {userRole && hasPermission(userRole, Role.ADMIN) && (
                      <Link
                        href="/admin"
                        className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Profile
                    </Link>
                    <div className="relative">
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox:
                              'h-9 w-9 ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all duration-300',
                            userButtonPopoverCard:
                              'shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl',
                          },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <SignInButton>
                      <button className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton>
                      <button className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-300"
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-6 h-6">
                <Menu
                  className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                    mobileMenuOpen
                      ? 'opacity-0 rotate-180'
                      : 'opacity-100 rotate-0'
                  }`}
                />
                <X
                  className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                    mobileMenuOpen
                      ? 'opacity-100 rotate-0'
                      : 'opacity-0 -rotate-180'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
          mobileMenuOpen
            ? 'max-h-screen opacity-100 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50'
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-2">
          {navbarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={getMobileNavItemClass(item.href)}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {!isLoaded ? (
            <div className="px-4 py-3 text-gray-500">Loading...</div>
          ) : (
            <>
              {user ? (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/profile"
                    className={getMobileNavItemClass('/profile')}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {userRole && hasPermission(userRole, Role.AUTHOR) && (
                    <Link
                      href="/listings/new"
                      className="block px-4 py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Create Listing
                    </Link>
                  )}
                  {userRole && hasPermission(userRole, Role.ADMIN) && (
                    <Link
                      href="/admin"
                      className="block px-4 py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <div className="px-4 py-3">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'h-10 w-10',
                        },
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <SignInButton>
                    <button
                      className="w-full text-left px-4 py-3 rounded-xl font-semibold text-base text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button
                      className="w-full text-left px-4 py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
