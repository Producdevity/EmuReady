const CACHE_NAME = 'emuready_v0.10.5'

// Service worker registration script
if ('serviceWorker' in navigator) {
  // Clean up outdated cache versions on load
  window.addEventListener('load', function () {
    if ('caches' in window) {
      caches.keys().then(function (names) {
        for (let name of names) {
          // Remove cache versions prior
          if (name.startsWith('emuready') && name !== CACHE_NAME) {
            caches
              .delete(name)
              .then(function () {
                console.log('Deleted outdated cache:', name)
              })
              .catch(function (err) {
                console.error('Error deleting cache:', name, err)
              })
          }
        }
      })
    }
  })

  // Service worker registration
  const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.local') ||
    (window.location.protocol === 'http:' && !window.location.hostname.includes('emuready'))

  // Allow service worker on dev.emuready.com for testing PWA functionality
  if (isDevelopment) {
    console.log('Service Worker disabled in local development mode')
  } else {
    window.addEventListener('load', async function () {
      const swUrl = '/service-worker.js'

      // Unregister any previous service workers that might be controlling the page
      if (navigator.serviceWorker.getRegistrations) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        const currentSwUrl = new URL(swUrl, window.location.href).href

        for (const registration of registrations) {
          if (registration.active && registration.active.scriptURL !== currentSwUrl) {
            await registration.unregister()
          }
        }
      }

      navigator.serviceWorker
        .register(swUrl, { updateViaCache: 'none' })
        .then(function (registration) {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch(function (error) {
          console.error('Service Worker registration failed:', error)
        })
    })
  }
}
