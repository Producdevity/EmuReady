const CACHE_NAME = 'emuready_v0.9.8'

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
    window.location.hostname === 'dev.emuready.com' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.local') ||
    window.location.hostname.startsWith('dev.') ||
    window.location.protocol === 'http:'

  if (isDevelopment) {
    console.log('Service Worker disabled in development mode')
  } else {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(function (registration) {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch(function (error) {
          console.error('Service Worker registration failed:', error)
        })
    })
  }
}
