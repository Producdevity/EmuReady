'use client'

import { Monitor } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Modal } from '@/components/ui'
import { type RouterOutput } from '@/types/trpc'

type EmulatorData = RouterOutput['emulators']['get']['emulators'][number]

interface Props {
  isOpen: boolean
  onClose: () => void
  emulatorData: EmulatorData | null
}

function EmulatorViewModal(props: Props) {
  if (!props.emulatorData) return null

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Emulator Details"
      size="md"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emulator
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <div className="flex items-center gap-3">
                {props.emulatorData.logo ? (
                  <Image
                    src={props.emulatorData.logo}
                    alt={props.emulatorData.name}
                    width={32}
                    height={32}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <Monitor className="w-8 h-8 text-gray-400" />
                )}
                <span className="font-medium">{props.emulatorData.name}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supported Systems
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {props.emulatorData._count?.systems ?? 0} system
              {(props.emulatorData._count?.systems ?? 0) !== 1 ? 's' : ''}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compatibility Reports
            </label>
            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {props.emulatorData._count?.listings ?? 0} compatibility report
              {(props.emulatorData._count?.listings ?? 0) !== 1 ? 's' : ''}
              {(props.emulatorData._count?.listings ?? 0) > 0 && (
                <div className="mt-2">
                  <Link
                    href={`/listings?emulatorIds=${props.emulatorData.id}`}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    onClick={props.onClose}
                  >
                    View Reports
                  </Link>
                </div>
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
