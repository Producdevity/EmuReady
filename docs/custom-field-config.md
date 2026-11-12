# Copying and editing custom field configurations

Open an emulator’s custom fields page and choose **Copy / Edit JSON**. Select a source emulator and **Load into editor**, or paste/edit a configuration. Review it, then choose **Apply to <emulator>** and confirm the named destination.

![Configuration editor using local test data](images/custom-field-config-desktop.jpg)

## Save behavior

- Field and category names identify matches within the destination emulator.
- New names are added. Matching names update their settings and ordering.
- Omitted fields and categories stay in place. Deletion remains in the existing field/category controls.
- Destination field IDs and existing Handheld/PC Report values are preserved.
- Source IDs are excluded from exports and rejected on import.
- Type changes, removed select options, and narrower ranges are rejected for fields that already have report values. Adding options and widening ranges are supported.
- Closing or loading over an unsaved draft requires confirmation.
- Concurrent edits return a conflict instead of overwriting a newer configuration. Copy the draft, reopen the editor, and reconcile it with the current configuration.

Categories include empty categories. `displayOrder` controls category/global field order; `categoryOrder` controls order within a category. Renaming an item in JSON adds a new name while preserving the original item.

## JSON format

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

Uncategorized fields use `category: null`. Range fields use `rangeMin`, `rangeMax`, `rangeUnit`, and `rangeDecimals`. Text/URL fields may use `placeholder`. Boolean and numeric defaults retain their JSON types, including `false` and `0`. Unknown properties, duplicate names/options, dangling categories, invalid defaults, and invalid ranges produce validation errors before saving.

## Implementation

The feature lives under `src/features/emulators/custom-field-config/`. Shared Zod contracts define the JSON format. The tRPC router exposes `customFieldConfigs.sources`, `get`, and `save`, with explicit output schemas. Services enforce permissions, destination access, revision checks, and value compatibility. The Prisma repository owns persistence and saves the complete operation in a serializable transaction.

Users need `MANAGE_CUSTOM_FIELDS`. Moderators and higher roles may manage all destinations; other users with that permission must be verified developers of the destination emulator. Source reads use the same management permission.

No schema migration, seed, deployment, or production data write is required for this feature.

## Verification

- Shared-schema tests cover types, defaults, duplicates, categories and invalid input.
- Real tRPC caller tests exercise the input/output contract, permission rejection, and authenticated actor.
- Service tests cover destination access, stale revisions, field/category copying, and protection of both Handheld and PC Report values.
- Repository tests check serializable transactions, conflict translation, stable identity, explicit null handling, and boolean defaults.
- React tests cover load, validation, cancellation, conflict recovery, and unsaved drafts.
- Browser verification used actual project components/styles with an isolated in-memory transport. It covered copying, invalid JSON, confirmation, save success, clipboard categories, and a 390 px layout. It did not write to a database or change production.

[Phone layout](images/custom-field-config-mobile.jpg)
