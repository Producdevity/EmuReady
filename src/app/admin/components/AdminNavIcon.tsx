import {
  CheckSquare,
  FileText,
  Gamepad2,
  Gauge,
  Monitor,
  Package,
  Play,
  Shield,
  Smartphone,
  Users,
  Layout,
  Cpu,
  HardDrive,
  List,
  AlertCircle,
  Gavel,
  TrendingUp,
  Key,
  Activity,
  FileKey,
  Award,
  Microchip,
} from 'lucide-react'

const getAdminNavIcon = (href: string, className: string) => {
  if (href.includes('/cpus')) return <Cpu className={className} />
  if (href.includes('/gpus')) return <HardDrive className={className} />
  if (href.includes('/socs')) return <Microchip className={className} />
  if (href.includes('/manage-listings')) return <List className={className} />
  if (href.includes('/processed-listings')) return <FileText className={className} />
  if (href.includes('/reports')) return <AlertCircle className={className} />
  if (href.includes('/user-bans')) return <Gavel className={className} />
  if (href.includes('/trust-logs')) return <TrendingUp className={className} />
  if (href.includes('/monitoring')) return <Activity className={className} />
  if (href.includes('/permission-logs')) return <FileKey className={className} />
  if (href.includes('/permissions')) return <Key className={className} />
  if (href.includes('/badges')) return <Award className={className} />
  if (href.includes('/systems')) return <Monitor className={className} />
  if (href.includes('/games')) return <Gamepad2 className={className} />
  if (href.includes('/brands')) return <Package className={className} />
  if (href.includes('/devices')) return <Smartphone className={className} />
  if (href.includes('/emulators')) return <Play className={className} />
  if (href.includes('/verified-developers')) return <Shield className={className} />
  if (href.includes('/performance')) return <Gauge className={className} />
  if (href.includes('/approvals')) return <CheckSquare className={className} />
  if (href.includes('/users')) return <Users className={className} />
  if (href.includes('/custom-field-templates')) return <Layout className={className} />

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
