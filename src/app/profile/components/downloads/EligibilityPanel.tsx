'use client'

import { BadgeCheck, Handshake, Shield } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card } from '@/components/ui'
import { api } from '@/lib/api'
import ClaimPlayPurchaseDialog from './ClaimPlayPurchaseDialog'
import LinkPatreonDialog from './LinkPatreonDialog'

type Props = Record<string, never>

export default function EligibilityPanel(_: Props) {
  const [openClaim, setOpenClaim] = useState(false)
  const [openPatreon, setOpenPatreon] = useState(false)
  const entitlementsQuery = api.entitlements.getMy.useQuery()
  type EntRow = { source: 'PLAY' | 'PATREON' | 'MANUAL'; grantedAt: string | Date }
  const items = useMemo(
    () => (entitlementsQuery.data?.items ?? []) as EntRow[],
    [entitlementsQuery.data?.items],
  )
  const play = useMemo(() => items.find((e) => e.source === 'PLAY'), [items])
  const patreon = useMemo(() => items.find((e) => e.source === 'PATREON'), [items])
  const hasPlayEntitlement = Boolean(play)

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold">Who can download?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you purchased EmuReady Beta on Google Play in the past or supported us on Patreon for
            at least one month, you have lifetime access to downloads.
          </p>

          {/* Status chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {play ? (
              <Badge variant="success" pill className="inline-flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" /> Google Play verified
              </Badge>
            ) : (
              <Badge variant="default" pill className="inline-flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" /> Play not verified
              </Badge>
            )}

            {patreon ? (
              <Badge variant="info" pill className="inline-flex items-center gap-1.5">
                <Handshake className="w-3.5 h-3.5" /> Patreon linked
              </Badge>
            ) : (
              <Badge variant="default" pill className="inline-flex items-center gap-1.5">
                <Handshake className="w-3.5 h-3.5" /> Patreon not linked
              </Badge>
            )}
          </div>

          {/* Small meta line */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {play && (
              <span className="mr-4">
                Verified on {new Date(play.grantedAt).toLocaleDateString()}
              </span>
            )}
            {patreon && <span>Linked on {new Date(patreon.grantedAt).toLocaleDateString()}</span>}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {!hasPlayEntitlement && (
              <Button onClick={() => setOpenClaim(true)}>Verify Play Purchase</Button>
            )}
            <Button variant="secondary" onClick={() => setOpenPatreon(true)}>
              Link Patreon
            </Button>
          </div>
        </div>
      </div>

      {openClaim && <ClaimPlayPurchaseDialog onClose={() => setOpenClaim(false)} />}
      {openPatreon && <LinkPatreonDialog onClose={() => setOpenPatreon(false)} />}
    </Card>
  )
}
