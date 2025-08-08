'use client'

import { Monitor, Users, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { EmulatorIcon, GitHubIcon } from '@/components/icons'
import { Modal } from '@/components/ui'
import { TranslatableMarkdown } from '@/lib/dynamic-imports'
import { type RouterOutput } from '@/types/trpc'

type EmulatorData = RouterOutput['emulators']['get']['emulators'][number]
type EmulatorByIdData = RouterOutput['emulators']['byId']
type EmulatorUnion = EmulatorData | EmulatorByIdData

interface Props {
  isOpen: boolean
  onClose: () => void
  emulatorData: EmulatorUnion | null
}

function EmulatorViewModal(props: Props) {
  if (!props.emulatorData) return null

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Emulator Details" size="2xl">
      <div className="space-y-6">
        {/* Emulator Header */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Emulator
          </label>
          <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <div className="flex items-center gap-3">
              {props.emulatorData.logo ? (
                <EmulatorIcon
                  name={props.emulatorData.name}
                  logo={props.emulatorData.logo}
                  showLogo
                  size="lg"
                />
              ) : (
                <Monitor className="w-8 h-8 text-gray-400" />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-lg">{props.emulatorData.name}</h3>
                {/* URLs */}
                {(props.emulatorData.repositoryUrl || props.emulatorData.officialUrl) && (
                  <div className="flex gap-2 mt-2">
                    {props.emulatorData.repositoryUrl && (
                      <a
                        href={props.emulatorData.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      >
                        <GitHubIcon className="w-3 h-3" />
                        Repository
                      </a>
                    )}
                    {props.emulatorData.officialUrl && (
                      <a
                        href={props.emulatorData.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Official Site
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supported Systems */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supported Systems
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {'systems' in props.emulatorData._count
                    ? `${props.emulatorData._count.systems} system${props.emulatorData._count.systems !== 1 ? 's' : ''}`
                    : `${props.emulatorData.systems?.length ?? 0} system${(props.emulatorData.systems?.length ?? 0) !== 1 ? 's' : ''}`}
                </span>
              </div>
              {props.emulatorData.systems && props.emulatorData.systems.length > 0 ? (
                <div className="space-y-1">
                  {props.emulatorData.systems.map((system) => (
                    <div
                      key={system.id}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-2 mb-1"
                    >
                      {system.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-xs">No systems configured</p>
              )}
            </div>
          </div>

          {/* Verified Developers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verified Developers
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  <Users className="w-4 h-4 inline mr-1" />
                  {props.emulatorData.verifiedDevelopers?.length ?? 0} verified developer
                  {(props.emulatorData.verifiedDevelopers?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
              {props.emulatorData.verifiedDevelopers &&
              props.emulatorData.verifiedDevelopers.length > 0 ? (
                <div className="space-y-2">
                  {props.emulatorData.verifiedDevelopers.map((verifiedDev) => (
                    <div key={verifiedDev.id} className="flex items-center gap-2">
                      {verifiedDev.user.profileImage ? (
                        <Image
                          src={verifiedDev.user.profileImage}
                          alt={verifiedDev.user.name ?? 'Developer'}
                          width={32}
                          height={32}
                          className="rounded-full w-6 h-6"
                          unoptimized
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                      <span className="text-xs font-medium">
                        {verifiedDev.user.name || 'Anonymous Developer'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-xs">No verified developers</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {props.emulatorData.description && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
              <TranslatableMarkdown content={props.emulatorData.description} />
            </div>
          </div>
        )}

        {/* Compatibility Reports */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Compatibility Reports
          </label>
          <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {props.emulatorData._count?.listings ?? 0} compatibility report
                {(props.emulatorData._count?.listings ?? 0) !== 1 ? 's' : ''}
              </span>
              {(props.emulatorData._count?.listings ?? 0) > 0 && (
                <Link
                  href={`/listings?emulatorIds=${props.emulatorData.id}`}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  onClick={props.onClose}
                >
                  View Reports
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={props.onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default EmulatorViewModal
