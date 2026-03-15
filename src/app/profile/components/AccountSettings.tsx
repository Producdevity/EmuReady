'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { Download, Globe, KeyRound, LogOut, Mail, Monitor, Shield, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, LoadingSpinner, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import SettingsSection from './SettingsSection'

function AccountSettings() {
  const { user } = useUser()
  const { openUserProfile } = useClerk()
  const confirm = useConfirmDialog()

  const sessionsQuery = api.account.getSessions.useQuery()
  const utils = api.useUtils()

  const revokeSessionMutation = api.account.revokeSession.useMutation({
    onSuccess: () => {
      toast.success('Session revoked')
      utils.account.getSessions.invalidate().catch(console.error)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const handleRevokeSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: 'Revoke Session',
      description:
        'Are you sure you want to revoke this session? The device will be signed out immediately.',
      confirmText: 'Revoke',
    })
    if (!confirmed) return
    revokeSessionMutation.mutate({ sessionId })
  }

  if (!user) return null

  const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
  const connectedAccounts = user.externalAccounts ?? []

  return (
    <div className="space-y-8">
      {/* Email & Password */}
      <SettingsSection
        title="Email & Password"
        description="Manage your login credentials"
        icon={<Mail className="w-6 h-6" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Email Address</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {primaryEmail?.emailAddress ?? 'No email set'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => openUserProfile()} icon={Mail}>
              Change
            </Button>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700" />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.passwordEnabled ? 'Password is set' : 'No password set (using social login)'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => openUserProfile()} icon={KeyRound}>
              {user.passwordEnabled ? 'Change' : 'Set Password'}
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* Connected Accounts */}
      <SettingsSection
        title="Connected Accounts"
        description="Manage your linked social accounts"
        icon={<Globe className="w-6 h-6" />}
      >
        <div className="space-y-3">
          {connectedAccounts.length > 0 ? (
            connectedAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <ProviderIcon provider={account.provider} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {account.provider}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {account.emailAddress || 'Connected'}
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  Connected
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-3">
              No connected accounts.{' '}
              <button
                type="button"
                onClick={() => openUserProfile()}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Connect one
              </button>
            </p>
          )}
        </div>
      </SettingsSection>

      {/* Active Sessions */}
      <SettingsSection
        title="Active Sessions"
        description="Devices where you are currently signed in"
        icon={<Monitor className="w-6 h-6" />}
      >
        <div className="space-y-3">
          {sessionsQuery.isPending && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}
          {sessionsQuery.data && sessionsQuery.data.sessions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-3">
              No active sessions found
            </p>
          )}
          {sessionsQuery.data?.sessions.map((session) => {
            const isCurrentSession = session.id === sessionsQuery.data.currentSessionId
            const activity = session.latestActivity

            return (
              <div
                key={session.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity?.browserName ?? 'Unknown browser'}
                        {activity?.deviceType ? ` on ${activity.deviceType}` : ''}
                      </p>
                      {isCurrentSession && (
                        <Badge variant="success" size="sm">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last active:{' '}
                      {session.lastActiveAt
                        ? new Date(session.lastActiveAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={revokeSessionMutation.isPending}
                  icon={LogOut}
                  className="text-gray-500 hover:text-red-600"
                >
                  Revoke
                </Button>
              </div>
            )
          })}
        </div>
      </SettingsSection>

      {/* Data & Privacy */}
      <SettingsSection
        title="Data & Privacy"
        description="Manage your data and account"
        icon={<Shield className="w-6 h-6" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Download My Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get a copy of all your EmuReady data
              </p>
            </div>
            <Button variant="outline" size="sm" icon={Download} asChild>
              <Link href="/account/data">Download</Link>
            </Button>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700" />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => openUserProfile()} icon={Trash2}>
              Delete Account
            </Button>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}

function ProviderIcon(props: { provider: string }) {
  switch (props.provider.toLowerCase()) {
    case 'google':
      return <span className="text-sm font-bold text-blue-500">G</span>
    case 'github':
      return <span className="text-sm font-bold text-gray-900 dark:text-white">GH</span>
    case 'apple':
      return <span className="text-sm font-bold text-gray-900 dark:text-white">A</span>
    case 'discord':
      return <span className="text-sm font-bold text-indigo-500">D</span>
    default:
      return <Globe className="w-4 h-4 text-gray-500" />
  }
}

export default AccountSettings
