import { CaseSensitive, CheckSquare, FileText, LinkIcon, ListChecks, Sliders } from 'lucide-react'
import { CustomFieldType } from '@orm'
import type { ReactNode } from 'react'

const iconMap: Record<CustomFieldType, ReactNode> = {
  [CustomFieldType.TEXT]: <CaseSensitive className="w-5 h-5" />,
  [CustomFieldType.TEXTAREA]: <FileText className="w-5 h-5" />,
  [CustomFieldType.URL]: <LinkIcon className="w-5 h-5" />,
  [CustomFieldType.BOOLEAN]: <CheckSquare className="w-5 h-5" />,
  [CustomFieldType.SELECT]: <ListChecks className="w-5 h-5" />,
  [CustomFieldType.RANGE]: <Sliders className="w-5 h-5" />,
}

export function getCustomFieldTypeIcon(type: CustomFieldType) {
  return iconMap[type] ?? <FileText className="w-5 h-5" />
}
