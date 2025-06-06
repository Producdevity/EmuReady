import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EmuReady - Know before you load',
    short_name: 'EmuReady',
    description:
      'Discover and share emulation setups, performance data, and game compatibility information',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#353535',
    icons: [
      {
        src: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
