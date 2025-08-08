'use client'

import Script from 'next/script'
import useMounted from '@/hooks/useMounted'

function KofiWidget() {
  const mounted = useMounted()

  if (!mounted) return

  const isMobile =
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  if (isMobile) return

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
