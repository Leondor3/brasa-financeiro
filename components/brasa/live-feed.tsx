'use client'

import { useState, useEffect } from 'react'
import { LiveEvent } from '@/lib/hooks/use-live-ops'

const ICONS: Record<string, string> = { pix: '⚡', dinheiro: '💵', cartao: '💳', fiado: '📒' }

export function LiveFeed({ events, max = 5 }: { events: LiveEvent[]; max?: number }) {
  const list = events.slice(0, max)
  if (!list.length) {
    return <div className="empty" style={{ padding: '20px 16px' }}>Aguardando primeira venda...</div>
  }
  return (
    <div>
      {list.map((e, i) => (
        <div key={e.id} className={'feed-row' + (i === 0 ? ' is-new' : '')}>
          <span className="ftime">{e.time}</span>
          <span className={'ficon ' + e.tipo}>{ICONS[e.tipo]}</span>
          <span className="ftext">{e.label}</span>
          <span className={'fval ' + (e.tipo === 'fiado' ? 'out' : 'in')}>
            +R$ {e.valor.toFixed(2).replace('.', ',')}
          </span>
        </div>
      ))}
    </div>
  )
}

interface SaleToastProps {
  lastBump: { at: number; ev: LiveEvent } | null
}

export function SaleToast({ lastBump }: SaleToastProps) {
  const [visible, setVisible] = useState(false)
  const [ev, setEv] = useState<LiveEvent | null>(null)

  useEffect(() => {
    if (!lastBump) return
    setEv(lastBump.ev)
    setVisible(true)
    const id = setTimeout(() => setVisible(false), 2800)
    return () => clearTimeout(id)
  }, [lastBump?.at])

  if (!visible || !ev) return null
  return (
    <div className={'sale-toast' + (ev.tipo === 'fiado' ? ' is-fiado' : '')} key={lastBump?.at}>
      <span>{ICONS[ev.tipo]}</span>
      <span>{ev.tipo === 'fiado' ? 'Fiado' : '+ R$ ' + ev.valor.toFixed(2).replace('.', ',')}</span>
    </div>
  )
}
