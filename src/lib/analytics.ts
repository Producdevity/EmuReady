import { sendGAEvent } from '@next/third-parties/google'

const analytics = {
  filter: {
    system: (value: string) => sendGAEvent('filter', 'system', { value }),
    device: (value: string) => sendGAEvent('filter', 'device', { value }),
    emulator: (value: string) => sendGAEvent('filter', 'emulator', { value }),
    performance: (value: string) =>
      sendGAEvent('filter', 'performance', { value }),
    search: (value: string) => sendGAEvent('filter', 'search', { value }),
  },
  event: {
    buttonClicked: (value: string) =>
      sendGAEvent('event', 'buttonClicked', { value }),
  },
}

export default analytics
