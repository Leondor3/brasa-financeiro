'use client'

import { useState, useEffect } from 'react'

export interface LiveEvent {
  id: string | number
  tipo: 'pix' | 'dinheiro' | 'cartao' | 'fiado'
  label: string
  valor: number
  time: string
}

export interface LiveTotals {
  vendido: number
  lucro: number
  pedidos: number
  fiado: number
}

const SALE_PROFILES = [
  { tipo: 'pix'      as const, label: '2× Frango · 1× Coalho · PIX',   range: [22, 38] as [number,number] },
  { tipo: 'pix'      as const, label: 'Picanha · Pão de alho · PIX',   range: [30, 48] as [number,number] },
  { tipo: 'dinheiro' as const, label: '1× Frango · 1× Refri',          range: [12, 22] as [number,number] },
  { tipo: 'dinheiro' as const, label: '3× Frango · 2× Coalho',         range: [38, 56] as [number,number] },
  { tipo: 'pix'      as const, label: 'Combo família · PIX',           range: [60, 110] as [number,number] },
  { tipo: 'cartao'   as const, label: '2× Picanha · Cerveja · Cartão', range: [38, 56] as [number,number] },
  { tipo: 'fiado'    as const, label: 'Fiado — Seu Joaquim',           range: [15, 35] as [number,number] },
  { tipo: 'dinheiro' as const, label: 'Coração · Coalho · Refri',      range: [18, 30] as [number,number] },
  { tipo: 'pix'      as const, label: '2× Kafta · 1× Pão de alho',     range: [22, 38] as [number,number] },
  { tipo: 'fiado'    as const, label: 'Fiado — Tati & Bia',            range: [20, 50] as [number,number] },
]

function fmtClock(d: Date) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function randomSaleEvent(): LiveEvent {
  const p = SALE_PROFILES[Math.floor(Math.random() * SALE_PROFILES.length)]
  const valor = Math.round((p.range[0] + Math.random() * (p.range[1] - p.range[0])) * 100) / 100
  return { id: Date.now() + Math.random(), tipo: p.tipo, label: p.label, valor, time: fmtClock(new Date()) }
}

interface SeedData {
  vendido: number
  lucro: number
  pedidos: number
  fiadoNovo: number
  eventos: LiveEvent[]
}

export function useLiveOps(seed: SeedData) {
  const [totals, setTotals] = useState<LiveTotals>(() => ({
    vendido: seed.vendido,
    lucro:   seed.lucro,
    pedidos: seed.pedidos,
    fiado:   seed.fiadoNovo,
  }))
  const [events, setEvents] = useState<LiveEvent[]>(() => seed.eventos || [])
  const [lastBump, setLastBump] = useState<{ at: number; ev: LiveEvent } | null>(null)

  useEffect(() => {
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const nextDelay = 5500 + Math.random() * 6500
      setTimeout(() => {
        if (cancelled) return
        const ev = randomSaleEvent()
        setEvents(prev => [ev, ...prev].slice(0, 30))
        setTotals(prev => ({
          vendido: prev.vendido + (ev.tipo === 'fiado' ? 0 : ev.valor),
          lucro:   prev.lucro   + (ev.tipo === 'fiado' ? 0 : ev.valor * 0.44),
          pedidos: prev.pedidos + 1,
          fiado:   prev.fiado   + (ev.tipo === 'fiado' ? ev.valor : 0),
        }))
        setLastBump({ at: Date.now(), ev })
        tick()
      }, nextDelay)
    }
    tick()
    return () => { cancelled = true }
  }, [])

  return { totals, events, lastBump }
}

export { fmtClock }
