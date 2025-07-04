interface NavbarItem {
  href: string
  label: string
}

export const navbarItems: NavbarItem[] = [
  {
    href: '/',
    label: 'Home',
  },
  {
    href: '/listings',
    label: 'Handheld Compatibility',
  },
  {
    href: '/pc-listings',
    label: 'PC Compatibility',
  },
  {
    href: '/games',
    label: 'Games',
  },
]
