'use client'

import Script from 'next/script'

function KofiWidget() {
  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      onLoad={() => {
        if (window.kofiWidgetOverlay) {
          window.kofiWidgetOverlay.draw('producdevity', {
            type: 'floating-chat',
            'floating-chat.donateButton.text': 'Support Us',
            'floating-chat.donateButton.background-color': '#6a64ff',
            'floating-chat.donateButton.text-color': '#fff',
          })
        }
      }}
    />
  )
}

export default KofiWidget
