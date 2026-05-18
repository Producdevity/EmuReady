import {
  createCustomFieldValuesSchema,
  type CustomFieldDefinitionWithOptions,
} from '@/utils/custom-field-validation'
import listingFormSchema from './listingFormSchema'

function createDynamicListingSchema(customFields: CustomFieldDefinitionWithOptions[]) {
  if (customFields.length === 0) return listingFormSchema

  return listingFormSchema.extend({
    customFieldValues: createCustomFieldValuesSchema(customFields),
  })
}

export default createDynamicListingSchema
