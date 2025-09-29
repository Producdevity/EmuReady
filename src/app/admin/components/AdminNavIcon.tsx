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
  QrCode,
  ServerCog,
  TerminalSquare,
  CloudDownload,
  BadgeCheck,
} from 'lucide-react'
import { ADMIN_ROUTES } from '@/app/admin/config/routes'

const getAdminNavIcon = (href: string, className: string) => {
  if (href.includes(ADMIN_ROUTES.CPUS)) return <Cpu className={className} />
  if (href.includes(ADMIN_ROUTES.GPUS)) return <HardDrive className={className} />
  if (href.includes(ADMIN_ROUTES.SOCS)) return <Microchip className={className} />
  if (href.includes(ADMIN_ROUTES.TITLE_ID_TOOLS)) return <QrCode className={className} />
  if (href.includes(ADMIN_ROUTES.API_ACCESS_DEV)) return <TerminalSquare className={className} />
  if (href.includes(ADMIN_ROUTES.API_ACCESS)) return <ServerCog className={className} />
  if (href.includes(ADMIN_ROUTES.MANAGE_LISTINGS)) return <List className={className} />
  if (href.includes(ADMIN_ROUTES.PROCESSED_LISTINGS)) return <FileText className={className} />
  if (href.includes(ADMIN_ROUTES.REPORTS)) return <AlertCircle className={className} />
  if (href.includes(ADMIN_ROUTES.USER_BANS)) return <Gavel className={className} />
  if (href.includes(ADMIN_ROUTES.TRUST_LOGS)) return <TrendingUp className={className} />
  if (href.includes(ADMIN_ROUTES.MONITORING)) return <Activity className={className} />
  if (href.includes(ADMIN_ROUTES.PERMISSION_LOGS)) return <FileKey className={className} />
  if (href.includes(ADMIN_ROUTES.PERMISSIONS)) return <Key className={className} />
  if (href.includes(ADMIN_ROUTES.BADGES)) return <Award className={className} />
  if (href.includes(ADMIN_ROUTES.SYSTEMS)) return <Monitor className={className} />
  if (href.includes(ADMIN_ROUTES.LISTING_APPROVALS)) return <CheckSquare className={className} />
  if (href.includes(ADMIN_ROUTES.PC_LISTING_APPROVALS)) return <CheckSquare className={className} />
  if (href.includes(ADMIN_ROUTES.GAME_APPROVALS)) return <CheckSquare className={className} />
  if (href.includes(ADMIN_ROUTES.GAMES)) return <Gamepad2 className={className} />
  if (href.includes(ADMIN_ROUTES.BRANDS)) return <Package className={className} />
  if (href.includes(ADMIN_ROUTES.DEVICES)) return <Smartphone className={className} />
  if (href.includes(ADMIN_ROUTES.EMULATORS)) return <Play className={className} />
  if (href.includes(ADMIN_ROUTES.VERIFIED_DEVELOPERS)) return <Shield className={className} />
  if (href.includes(ADMIN_ROUTES.PERFORMANCE)) return <Gauge className={className} />
  if (href.includes(ADMIN_ROUTES.USERS)) return <Users className={className} />
  if (href.includes(ADMIN_ROUTES.FIELD_TEMPLATES)) return <Layout className={className} />
  if (href.includes(ADMIN_ROUTES.ANDROID_RELEASES)) return <CloudDownload className={className} />
  if (href.includes(ADMIN_ROUTES.ENTITLEMENTS)) return <BadgeCheck className={className} />

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
