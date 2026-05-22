'use client'

import { useOnlineStatus } from '@/lib/hooks/use-offline'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-sm font-medium flex items-center justify-center gap-2 py-2">
      <WifiOff size={14} />
      Sem internet — vendas serão sincronizadas quando conectar
    </div>
  )
}
