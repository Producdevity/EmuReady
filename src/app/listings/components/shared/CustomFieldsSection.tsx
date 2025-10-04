'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Filter, FilterX, PencilLine } from 'lucide-react'
import { useState } from 'react'
import { isNullish } from 'remeda'
import {
  CustomFieldValue,
  type FieldValueLike,
} from '@/app/listings/components/shared/CustomFieldValue'
import { DetailFieldRow } from '@/app/listings/components/shared/details/DetailFieldRow'
import { isDefaultValue } from '@/app/listings/components/shared/utils/isDefaultValue'
import { Badge, Button } from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from '@/hooks'
import { cn } from '@/lib/utils'

interface Props {
  title?: string
  fieldValues: (FieldValueLike & { id: string })[]
  alignItems?: 'start' | 'center'
}

const INDICATOR_BORDER_WIDTH = '4px'
const DEFAULT_BORDER_WIDTH = '1px'
const TOGGLE_DELAY_MS = 400

export function CustomFieldsSection(props: Props) {
  const title = props.title ?? 'Emulator-Specific Details'
  const alignItems = props.alignItems ?? 'start'
  const hasFields = Array.isArray(props.fieldValues) && props.fieldValues.length > 0

  const [hideDefaults, setHideDefaults] = useLocalStorage(
    storageKeys.hideDefaultCustomFields,
    false,
  )
  const [isToggling, setIsToggling] = useState(false)

  if (!hasFields) return null

  const nonNullFields = props.fieldValues.filter((fv) => !isNullish(fv.value) && fv.value !== '')
  const customizedFields = nonNullFields.filter((fv) => !isDefaultValue(fv))
  const defaultFields = nonNullFields.filter((fv) => isDefaultValue(fv))

  const fieldsToShow = hideDefaults ? customizedFields : nonNullFields
  const hasDefaultFields = defaultFields.length > 0

  const handleToggle = () => {
    setIsToggling(true)
    setHideDefaults(!hideDefaults)
    setTimeout(() => setIsToggling(false), TOGGLE_DELAY_MS)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        {hasDefaultFields && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={isToggling}
              className="flex items-center gap-2"
            >
              <motion.div animate={{ rotate: isToggling ? 180 : 0 }} transition={{ duration: 0.3 }}>
                {hideDefaults ? <Filter className="w-4 h-4" /> : <FilterX className="w-4 h-4" />}
              </motion.div>
              <span className="hidden sm:inline">
                {hideDefaults ? 'Show All' : 'Hide Defaults'}
              </span>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-1.5 py-0.5 rounded-md bg-blue-500 text-white text-xs font-bold"
              >
                {fieldsToShow.length}
              </motion.div>
            </Button>
          </motion.div>
        )}
      </div>
      <AnimatePresence mode="popLayout">
        <motion.div layout className="space-y-3" transition={{ duration: 0.3, ease: 'easeInOut' }}>
          {fieldsToShow.map((fieldValue, index) => {
            const isCustomized = !isDefaultValue(fieldValue)
            const showIndicator = !hideDefaults && isCustomized

            return (
              <motion.div
                key={fieldValue.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  borderLeftWidth: showIndicator ? INDICATOR_BORDER_WIDTH : DEFAULT_BORDER_WIDTH,
                }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.03,
                  ease: 'easeOut',
                  borderLeftWidth: { duration: 0.5, ease: 'easeInOut' },
                }}
                className={cn(
                  'w-full max-w-full rounded-2xl border p-4 shadow-sm overflow-hidden relative',
                  'bg-white/80 dark:bg-gray-800/80',
                  'transition-colors duration-500 ease-in-out',
                  showIndicator
                    ? 'border-blue-300/70 dark:border-blue-600/70 border-l-blue-500 dark:border-l-blue-400'
                    : 'border-gray-200/70 dark:border-gray-700/70',
                )}
              >
                <AnimatePresence mode="wait">
                  {showIndicator && (
                    <motion.div
                      key="modified-badge"
                      initial={{ opacity: 0, scale: 0.5, x: 10, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, x: 10, rotate: 5 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.1 + index * 0.02,
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="absolute top-3 right-3 z-10"
                    >
                      <Badge
                        variant="default"
                        size="sm"
                        className="bg-blue-500 dark:bg-blue-600 text-white shadow-md"
                      >
                        <PencilLine className="w-3 h-3" />
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
                <dl>
                  <DetailFieldRow
                    align={alignItems}
                    label={fieldValue.customFieldDefinition.label ?? 'Field'}
                    value={
                      <span className="block break-words overflow-wrap-anywhere">
                        <CustomFieldValue fieldValue={fieldValue} />
                      </span>
                    }
                  />
                </dl>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>
      {hideDefaults && defaultFields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center"
        >
          <motion.p initial={{ y: -10 }} animate={{ y: 0 }} transition={{ delay: 0.2 }}>
            {defaultFields.length} default setting{defaultFields.length !== 1 ? 's' : ''} hidden
          </motion.p>
        </motion.div>
      )}
    </div>
  )
}
