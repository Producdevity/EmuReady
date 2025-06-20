'use client'

import Script from 'next/script'

function KofiWidget() {
  const isMobile =
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )

  return isMobile ? null : (
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
