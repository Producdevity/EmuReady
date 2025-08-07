'use client'

import { X, Copy, Download, Check } from 'lucide-react'
import { useState } from 'react'
import { Prism } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '@/components/ui'
import toast from '@/lib/toast'
import {
  ConfigTypeUtils,
  type EmulatorConfigType,
} from '@/server/utils/emulator-config/constants'
import { getConfigDisplayName } from '@/server/utils/emulator-config/emulator-detector'

interface Props {
  isOpen: boolean
  onClose: () => void
  configData: {
    type: EmulatorConfigType
    filename: string
    content: string
    listing: {
      id: string
      game: string
      system: string
      emulator: string
    }
  }
}

function ViewConfigModal(props: Props) {
  const [copied, setCopied] = useState(false)

  if (!props.isOpen) return null

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(props.configData.content)
      setCopied(true)
      toast.success('Configuration copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleSaveFile = () => {
    try {
      const blob = new Blob([props.configData.content], {
        type: ConfigTypeUtils.getMimeType(props.configData.type),
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = props.configData.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Configuration file saved')
    } catch {
      toast.error('Failed to save file')
    }
  }

  const getLanguage = () => {
    return ConfigTypeUtils.getSyntaxLanguage(props.configData.type)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={props.onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {getConfigDisplayName(props.configData.type)}
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-medium">
                {props.configData.listing.game}
              </span>
              {' on '}
              <span className="font-medium">
                {props.configData.listing.emulator}
              </span>
              {' ('}
              <span className="font-medium">
                {props.configData.listing.system}
              </span>
              {')'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveFile}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save File
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={props.onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filename: {props.configData.filename}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                {props.configData.type}
              </span>
            </div>
          </div>

          {/* Code Block with Syntax Highlighting */}
          <div className="relative">
            <Prism
              language={getLanguage()}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                maxHeight: '60vh',
                overflow: 'auto',
              }}
              showLineNumbers={true}
              wrapLines={true}
              wrapLongLines={true}
            >
              {props.configData.content}
            </Prism>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewConfigModal
