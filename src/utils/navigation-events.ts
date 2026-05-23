export interface NavigationClickEvent {
  button: number
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  target: EventTarget | null
}

export function shouldOpenInNewTab(event: NavigationClickEvent): boolean {
  return event.button === 1 || event.ctrlKey || event.metaKey || event.shiftKey
}

export function isAnchorNavigationTarget(event: NavigationClickEvent): boolean {
  if (typeof Element === 'undefined' || !(event.target instanceof Element)) {
    return false
  }

  return event.target.closest('a[href]') !== null
}

export function openInNewTab(href: string): void {
  window.open(href, '_blank', 'noopener,noreferrer')
}
