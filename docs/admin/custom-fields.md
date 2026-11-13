# Edit custom fields as JSON

On an emulator's custom fields page, choose **Edit JSON** to paste or edit its fields, attributes, categories and ordering. Choose **Save JSON** and confirm the emulator.

The JSON describes the complete setup. Omitted unused fields and categories are removed. Fields with existing Handheld or PC Report values cannot be removed or changed incompatibly.

## Format

```json
{
  "version": 1,
  "categories": [
    { "name": "Graphics", "displayOrder": 0 }
  ],
  "fields": [
    {
      "name": "renderer",
      "label": "Graphics API",
      "type": "SELECT",
      "category": "Graphics",
      "options": [
        { "value": "vulkan", "label": "Vulkan" },
        { "value": "opengl", "label": "OpenGL" }
      ],
      "defaultValue": "vulkan",
      "isRequired": false,
      "displayOrder": 0,
      "categoryOrder": 0
    }
  ]
}
```

- Keep the exported `id` when renaming an existing field or category. This preserves its identity and report values. New items may omit IDs; pasted items without a matching destination ID are matched by name or created.
- A field's `category` is a category name, or `null` for no group. Update field references when renaming a category. Empty categories are allowed.
- `displayOrder` controls category and global field order. `categoryOrder` controls order within a category.
- Use JSON booleans and numbers for Boolean and Range defaults, including `false` and `0`. A Select default must match an option's `value`.
- Range settings use `rangeMin`, `rangeMax`, `rangeUnit` and `rangeDecimals`. Text, Textarea and URL fields may use `placeholder`.

The [configuration schema](../../src/features/emulators/custom-field-config/shared/config.schemas.ts) defines accepted attributes and validation. The example above is checked against that schema by the test suite.

## Saving and conflicts

Changing populated fields' types, removing select options, changing range units or narrowing ranges is blocked. Rename or relabel items while retaining their IDs to preserve report values.

If another edit changes the setup while the editor is open, saving returns a conflict. Copy the draft, reopen the editor and reconcile it with the current configuration before saving again.

Custom-field management permission is required. Developers must also be verified for the emulator; the [access policy](../../src/features/emulators/custom-field-config/server/config.policy.ts) defines the role checks.
