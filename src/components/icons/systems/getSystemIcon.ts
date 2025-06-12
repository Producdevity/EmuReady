import { type ReactElement } from 'react'
import { isString } from 'remeda'
import { type Maybe, type Nullable } from '@/types/utils'
import MicrosoftWindowsIcon from './MicrosoftWindowsIcon'
import MicrosoftXbox360Icon from './MicrosoftXbox360Icon'
import MicrosoftXboxIcon from './MicrosoftXboxIcon'
import Nintendo3DSIcon from './Nintendo3DSIcon'
import Nintendo64Icon from './Nintendo64Icon'
import NintendoDSIcon from './NintendoDSIcon'
import NintendoGameCubeIcon from './NintendoGameCubeIcon'
import NintendoSwitchIcon from './NintendoSwitchIcon'
import NintendoWiiIcon from './NintendoWiiIcon'
import NintendoWiiUIcon from './NintendoWiiUIcon'
import SegaDreamcastIcon from './SegaDreamcastIcon'
import SegaSaturnIcon from './SegaSaturnIcon'
import SonyPlaystation2Icon from './SonyPlaystation2Icon'
import SonyPlaystation3Icon from './SonyPlaystation3Icon'
import SonyPlaystation4Icon from './SonyPlaystation4Icon'
import SonyPlaystation5Icon from './SonyPlaystation5Icon'
import SonyPlaystationIcon from './SonyPlaystationIcon'
import SonyPlaystationPortableIcon from './SonyPlaystationPortableIcon'
import SonyPlaystationVitaIcon from './SonyPlaystationVitaIcon'

const systemIcons: Record<string, () => ReactElement> = {
  microsoft_windows: MicrosoftWindowsIcon,
  microsoft_xbox: MicrosoftXboxIcon,
  microsoft_xbox_360: MicrosoftXbox360Icon,
  nintendo_3ds: Nintendo3DSIcon,
  nintendo_64: Nintendo64Icon,
  nintendo_ds: NintendoDSIcon,
  nintendo_gamecube: NintendoGameCubeIcon,
  nintendo_switch: NintendoSwitchIcon,
  nintendo_wii: NintendoWiiIcon,
  nintendo_wii_u: NintendoWiiUIcon,
  sega_dreamcast: SegaDreamcastIcon,
  sega_saturn: SegaSaturnIcon,
  sony_playstation: SonyPlaystationIcon,
  sony_playstation_2: SonyPlaystation2Icon,
  sony_playstation_3: SonyPlaystation3Icon,
  sony_playstation_4: SonyPlaystation4Icon,
  sony_playstation_5: SonyPlaystation5Icon,
  sony_playstation_portable: SonyPlaystationPortableIcon,
  sony_playstation_vita: SonyPlaystationVitaIcon,
}

type Icon = () => ReactElement

function getSystemIcon(systemKey: Maybe<string>): Nullable<Icon> {
  if (!systemKey || !isString(systemKey)) {
    return null
  }

  const icon = systemIcons[systemKey]
  return icon || null
}

export default getSystemIcon
