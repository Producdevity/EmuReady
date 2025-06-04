import {
  CheckSquare,
  FileText,
  Gamepad2,
  Gauge,
  Monitor,
  Package,
  Play,
  Smartphone,
  Users,
  Layout,
} from 'lucide-react'

const getAdminNavIcon = (href: string, className: string) => {
  if (href.includes('/systems')) return <Monitor className={className} />
  if (href.includes('/games')) return <Gamepad2 className={className} />
  if (href.includes('/brands')) return <Package className={className} />
  if (href.includes('/devices')) return <Smartphone className={className} />
  if (href.includes('/emulators')) return <Play className={className} />
  if (href.includes('/performance')) return <Gauge className={className} />
  if (href.includes('/approvals')) return <CheckSquare className={className} />
  if (href.includes('/users')) return <Users className={className} />
  if (href.includes('/processed-listings'))
    return <FileText className={className} />
  if (href.includes('/custom-field-templates'))
    return <Layout className={className} />
  return <Monitor className={className} />
}

interface Props {
  href: string
  className?: string
}

function AdminNavIcon(props: Props) {
  const NavIcon = getAdminNavIcon(props.href, props.className ?? 'w-5 h-5')

  return <>{NavIcon}</>
}

export default AdminNavIcon
