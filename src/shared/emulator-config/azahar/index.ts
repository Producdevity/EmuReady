import { parseAzaharConfigFromIni } from './parser'
import { registerEmulatorConfigMapper } from '../index'
import type { EmulatorConfigMapper } from '../types'

const azaharMapper: EmulatorConfigMapper = {
  slug: 'azahar',
  fileTypes: ['ini'],
  parse: parseAzaharConfigFromIni,
}

registerEmulatorConfigMapper(azaharMapper)

export default azaharMapper
