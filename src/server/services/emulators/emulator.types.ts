import type { Emulator, System, CustomFieldDefinition } from '@orm'

export interface EmulatorWithRelations extends Emulator {
  systems: System[]
  _count: {
    listings: number
  }
}

export interface EmulatorWithDetails extends EmulatorWithRelations {
  customFieldDefinitions: CustomFieldDefinition[]
}
