import { parseGameNativeConfigFromJson } from './parser'
import { registerEmulatorConfigMapper } from '../index'
import type { EmulatorConfigMapper } from '../types'

const gamenativeMapper: EmulatorConfigMapper = {
  slug: 'gamenative',
  fileTypes: ['json'],
  parse: parseGameNativeConfigFromJson,
}

registerEmulatorConfigMapper(gamenativeMapper)

export default gamenativeMapper
