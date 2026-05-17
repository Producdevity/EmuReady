import {
  createCustomFieldValuesSchema,
  type CustomFieldDefinitionWithOptions,
} from '@/utils/custom-field-validation'
import pcListingFormSchema from './pcListingFormSchema'

export type { CustomFieldDefinitionWithOptions }

function createDynamicPcListingSchema(customFields: CustomFieldDefinitionWithOptions[]) {
  if (customFields.length === 0) return pcListingFormSchema

  return pcListingFormSchema.extend({
    customFieldValues: createCustomFieldValuesSchema(customFields),
  })
}

export default createDynamicPcListingSchema
