// Service worker registration script
if ('serviceWorker' in navigator) {
  // Disable service worker in development
  const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.local') ||
    window.location.hostname.startsWith('dev.') ||
    window.location.protocol === 'http:'

  if (isDevelopment) {
    console.log('Service Worker disabled in development mode')
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
