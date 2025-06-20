'use client'

import Link from 'next/link'
import { isDefined } from 'remeda'
import AdminNavIcon from '@/app/admin/components/AdminNavIcon'
import { type AdminNavItem } from '@/app/admin/data'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Props {
  isCollapsed: boolean
  isSuperAdmin: boolean
  pathname: string
  adminNavItems: AdminNavItem[]
  superAdminNavItems: AdminNavItem[]
}

function AdminNavbar(props: Props) {
  return (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      {props.adminNavItems.map((item) => {
        const collapsedClass = props.isCollapsed
          ? 'w-0 opacity-0 overflow-hidden'
          : 'w-auto opacity-100'

        const linkElement = (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group relative ${
              (
                item.exact
                  ? props.pathname === item.href
                  : props.pathname.startsWith(item.href)
              )
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex-shrink-0">
              <AdminNavIcon href={item.href} />
            </div>
            <span
              className={cn(
                'truncate transition-all duration-300 ease-in-out',
                collapsedClass,
              )}
            >
              {item.label}
            </span>
            {isDefined(item.count) && item.count > 0 && (
              <Badge
                variant="danger"
                size="sm"
                pill
                className={cn(
                  'transition-all duration-300 ease-in-out',
                  collapsedClass,
                )}
              >
                {item.count}
              </Badge>
            )}
          </Link>
        )

        return props.isCollapsed ? (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          linkElement
        )
      })}

      {props.isSuperAdmin && (
        <>
          <div className="pt-4 pb-2">
            <div className="border-t border-gray-200 dark:border-gray-700" />
            <div
              className={cn(
                'transition-all duration-300 ease-in-out overflow-hidden',
                props.isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100',
              )}
            >
              <p className="mt-4 px-3 text-sm uppercase font-semibold text-gray-500 dark:text-gray-400">
                Super Admin
              </p>
            </div>
          </div>
          {props.superAdminNavItems.map((item) => {
            const linkElement = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group relative',
                  (
                    item.exact
                      ? props.pathname === item.href
                      : props.pathname.startsWith(item.href)
                  )
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                )}
              >
                <div className="flex-shrink-0">
                  <AdminNavIcon href={item.href} />
                </div>
                <span
                  className={cn(
                    'truncate transition-all duration-300 ease-in-out',
                    props.isCollapsed
                      ? 'w-0 opacity-0 overflow-hidden'
                      : 'w-auto opacity-100',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )

            return props.isCollapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              linkElement
            )
          })}
        </>
      )}
    </nav>
  )
}

export default AdminNavbar
