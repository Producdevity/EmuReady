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
    label: 'Handheld',
  },
  {
    href: '/pc-listings',
    label: 'PC',
  },
]
