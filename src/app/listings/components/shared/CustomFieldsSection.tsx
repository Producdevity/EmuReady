'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Filter, FilterX, Sparkles } from 'lucide-react'
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
import { sortCustomFieldsByCategory } from '@/utils/sortCustomFields'

interface Props {
  title?: string
  fieldValues: (FieldValueLike & { id: string })[]
}

const TOGGLE_DELAY_MS = 400

export function CustomFieldsSection(props: Props) {
  const title = props.title ?? 'Emulator-Specific Details'
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

  // Group and sort fields by category using utility function
  const categoryGroups = sortCustomFieldsByCategory(fieldsToShow)

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          {title}
        </h2>
        {hasDefaultFields && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={isToggling}
              className="flex items-center gap-2 font-medium"
            >
              <motion.div animate={{ rotate: isToggling ? 180 : 0 }} transition={{ duration: 0.3 }}>
                {hideDefaults ? <Filter className="w-4 h-4" /> : <FilterX className="w-4 h-4" />}
              </motion.div>
              <span className="hidden sm:inline">
                {hideDefaults ? 'Show All' : 'Hide Defaults'}
              </span>
              <Badge variant="default" size="sm" className="ml-1">
                {fieldsToShow.length}
              </Badge>
            </Button>
          </motion.div>
        )}
      </div>
      <motion.div layout className="space-y-8">
        {categoryGroups.map((group) => (
          <motion.div key={group.categoryId} layout>
            <motion.div
              layout
              className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-gray-200 dark:border-gray-700"
            >
              <div className="h-6 w-1.5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {group.categoryName}
              </h3>
              <Badge variant="default" size="sm" className="ml-auto">
                {group.fields.length}
              </Badge>
            </motion.div>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence initial={false}>
                {group.fields.map((fieldValue) => {
                  const isCustomized = !isDefaultValue(fieldValue)
                  const showIndicator = !hideDefaults && isCustomized

                  return (
                    <motion.div
                      key={fieldValue.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        layout: {
                          type: 'spring',
                          stiffness: 350,
                          damping: 30,
                        },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 },
                      }}
                      className={cn(
                        'relative rounded-xl border shadow-sm overflow-hidden',
                        'bg-white dark:bg-gray-800 backdrop-blur-sm',
                        'transition-colors duration-200 ease-in-out',
                        'hover:shadow-md',
                        'p-4',
                        showIndicator
                          ? 'border-l-4 border-l-blue-500 dark:border-l-blue-400 border-blue-200 dark:border-blue-900/50'
                          : 'border-gray-200 dark:border-gray-700',
                      )}
                    >
                      <AnimatePresence>
                        {showIndicator && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-2 right-2 z-10"
                          >
                            <Badge
                              variant="default"
                              size="sm"
                              pill
                              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                            >
                              <Sparkles className="w-3 h-3" />
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <dl className={cn(showIndicator && 'pr-10')}>
                        <DetailFieldRow
                          label={fieldValue.customFieldDefinition.label ?? 'Field'}
                          value={<CustomFieldValue fieldValue={fieldValue} />}
                        />
                      </dl>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
      {hideDefaults && defaultFields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center"
        >
          <motion.p initial={{ y: -10 }} animate={{ y: 0 }} transition={{ delay: 0.2 }}>
            {defaultFields.length} default setting{defaultFields.length !== 1 ? 's' : ''} hidden
          </motion.p>
        </motion.div>
      )}
    </div>
  )
}
