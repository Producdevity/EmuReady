import { parseEdenConfigFromIni } from './parser'
import { registerEmulatorConfigMapper } from '../index'
import type { EmulatorConfigMapper } from '../types'

const edenMapper: EmulatorConfigMapper = {
  slug: 'eden',
  fileTypes: ['ini'],
  parse: parseEdenConfigFromIni,
}

registerEmulatorConfigMapper(edenMapper)

export default edenMapper
