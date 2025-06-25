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
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(function (registration) {
          console.log(
            'Service Worker registered with scope:',
            registration.scope,
          )
        })
        .catch(function (error) {
          console.error('Service Worker registration failed:', error)
        })
    })
  }
}
