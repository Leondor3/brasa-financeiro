'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/brasa/top-bar'
import { HeroVendido, CountUp } from '@/components/brasa/count-up'
import { LiveFeed } from '@/components/brasa/live-feed'
import { ArrowRight, TrendUp, Plus } from '@/components/brasa/icons'
import { fmtClock } from '@/lib/hooks/use-live-ops'
import type { LiveEvent } from '@/lib/hooks/use-live-ops'
import Link from 'next/link'

const supabase = createClient()
const META_ALVO = 5000

function BRLshort(v: number) {
  if (v >= 1000) return 'R$' + (v / 1000).toFixed(1) + 'k'
  return 'R$' + v.toFixed(0)
}

const PAGAMENTO_LABEL: Record<string, string> = {
  PIX: 'PIX', DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartão', CARTAO_DEBITO: 'Débito', FIADO: 'Fiado',
}

function tipoFromPagamento(p: string): LiveEvent['tipo'] {
  const m: Record<string, LiveEvent['tipo']> = {
    PIX: 'pix', DINHEIRO: 'dinheiro',
    CARTAO_CREDITO: 'cartao', CARTAO_DEBITO: 'cartao', FIADO: 'fiado',
  }
  return m[p] ?? 'pix'
}

function todayISO() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString()
}
function firstOfMonthISO() {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString()
}

function StockLive({ estoque }: { estoque: { nome: string; qtd: number }[] }) {
  const top3 = estoque.slice(0, 3)
  if (!top3.length) return (
    <div className="card" style={{ padding: '20px 16px' }}>
      <div className="empty">Nenhum movimento de estoque ainda.</div>
    </div>
  )

  return (
    <div className="stock-live">
      {top3.map(t => {
        const level = t.qtd <= 0 ? 'crit' : t.qtd < 5 ? 'warn' : 'ok'
        const max = Math.max(t.qtd * 2, 10)
        const pct = Math.max(0, Math.min(100, (t.qtd / max) * 100))
        return (
          <div key={t.nome} className={'stock-live-row is-' + level}>
            <div className="em">🍖</div>
            <div className="info">
              <div className="name-row">
                <span>{t.nome}</span>
                <span className="qty">{t.qtd}</span>
              </div>
              <div className={'bar ' + (level === 'crit' ? 'crit' : level === 'warn' ? 'warn' : '')} style={{ marginTop: 6, height: 6 }}>
                <span style={{ width: pct + '%' }} />
              </div>
              <div className="meta-row">
                {level === 'crit' && <span style={{ color: 'var(--red-400)', fontWeight: 700 }}>⚠ estoque esgotado</span>}
                {level === 'warn' && <span style={{ color: 'var(--brasa-200)', fontWeight: 600 }}>ficando pouco</span>}
                {level === 'ok' && <span>{t.qtd} unidades disponíveis</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const [clock, setClock] = useState(() => fmtClock(new Date()))
  useEffect(() => {
    const id = setInterval(() => setClock(fmtClock(new Date())), 30000)
    return () => clearInterval(id)
  }, [])

  const hoje = new Date()
  const dateStr = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'hoje'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('total,formaPagamento,item_vendas(quantidade,precoUnitario,custoUnitario)')
        .gte('vendidoEm', todayISO())
        .eq('status', 'PAGA')
      if (error) throw error
      let vendido = 0, lucro = 0, fiado = 0
      for (const v of data) {
        const total = Number(v.total)
        if (v.formaPagamento === 'FIADO') { fiado += total; continue }
        vendido += total
        const itens = (v.item_vendas as unknown) as { quantidade: number; precoUnitario: number; custoUnitario: number }[]
        for (const i of (itens ?? [])) {
          lucro += (Number(i.precoUnitario) - Number(i.custoUnitario)) * Number(i.quantidade)
        }
      }
      return { vendido, lucro, fiado, pedidos: data.length }
    },
    refetchInterval: 20000,
  })

  const { data: eventos = [] } = useQuery({
    queryKey: ['dashboard', 'eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('id,total,formaPagamento,vendidoEm,item_vendas(quantidade,produtos(nome))')
        .order('vendidoEm', { ascending: false })
        .limit(5)
      if (error) throw error
      return data.map(v => {
        const its = (v.item_vendas as unknown) as { quantidade: number; produtos: { nome: string } | null }[]
        const label = its.slice(0, 2).map(i => `${i.quantidade}× ${i.produtos?.nome ?? ''}`).join(' · ')
          + (its.length > 2 ? ` +${its.length - 2}` : '')
          + ` · ${PAGAMENTO_LABEL[v.formaPagamento] ?? v.formaPagamento}`
        return {
          id: v.id,
          tipo: tipoFromPagamento(v.formaPagamento),
          label,
          valor: Number(v.total),
          time: fmtClock(new Date(v.vendidoEm)),
        } as LiveEvent
      })
    },
    refetchInterval: 20000,
  })

  const { data: estoque = [] } = useQuery({
    queryKey: ['estoque'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque_movimentos')
        .select('produtoId,quantidadeDelta,produtos(nome)')
      if (error) throw error
      const map = new Map<string, { nome: string; qtd: number }>()
      for (const m of data) {
        const p = (m.produtos as unknown) as { nome: string } | null
        if (!map.has(m.produtoId)) map.set(m.produtoId, { nome: p?.nome ?? '', qtd: 0 })
        map.get(m.produtoId)!.qtd += Number(m.quantidadeDelta)
      }
      return Array.from(map.values()).sort((a, b) => a.qtd - b.qtd)
    },
    refetchInterval: 20000,
  })

  const { data: mesAtual = 0 } = useQuery({
    queryKey: ['dashboard', 'mes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('total,formaPagamento')
        .gte('vendidoEm', firstOfMonthISO())
        .eq('status', 'PAGA')
      if (error) throw error
      return data.reduce((a, v) => a + (v.formaPagamento !== 'FIADO' ? Number(v.total) : 0), 0)
    },
    refetchInterval: 60000,
  })

  const s = stats ?? { vendido: 0, lucro: 0, pedidos: 0, fiado: 0 }
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
  const diasRestantes = diasNoMes - hoje.getDate()
  const metaPct = Math.min(100, (mesAtual / META_ALVO) * 100)

  return (
    <div className="screen-fade">
      <TopBar name="Espetinho da Cocada" date={dateStr} />

      <div style={{ padding: '4px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="live-pill">
            <span className="dot" />
            Ao vivo · {clock}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-mute)' }}>
            {dateStr}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            Pedidos
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            <CountUp value={s.pedidos} format={(v) => Math.round(v).toString()} duration={400} />
          </div>
        </div>
      </div>

      <div className="hero-live">
        <div style={{ fontSize: 11, color: 'var(--gold-200)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔥 Caixa de hoje
        </div>

        <div style={{ marginTop: 8, marginBottom: 6 }}>
          <HeroVendido value={s.vendido} bumpKey={s.vendido} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--gold-200)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            💰 R$ <CountUp value={s.lucro} format={(v) => v.toFixed(0)} /> lucro
          </span>
          {s.fiado > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>
              <span style={{ color: 'var(--brasa-200)', fontWeight: 600 }}>
                R$ <CountUp value={s.fiado} format={(v) => v.toFixed(0)} />
              </span>
              {' '}em fiado
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-mute)', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span className="pulse-dot" style={{ width: 6, height: 6 }} />
            atualizando
          </span>
        </div>

        <Link href="/vendas/nova" className="hero-cta">
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(20,16,14,0.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Plus size={28} sw={3} />
          </div>
          <div className="label">
            <span className="main" style={{ fontSize: 22 }}>Vender agora</span>
            <span className="top" style={{ marginTop: 2, opacity: 0.75, letterSpacing: '0.1em' }}>
              ⚡ 1 toque · 1 venda
            </span>
          </div>
          <div className="arrow">
            <ArrowRight size={18} sw={2.6} />
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Caixa em movimento
          </h2>
          <span className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--status-done)', boxShadow: '0 0 8px var(--status-done)' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>últimas vendas</span>
      </div>
      <div style={{ padding: '0 20px 16px' }}>
        <div className="card" style={{ padding: '4px 0' }}>
          <LiveFeed events={eventos} max={5} />
        </div>
      </div>

      <div className="section-head">
        <h2>Estoque vivo</h2>
        <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>saldo atual</span>
      </div>
      <div style={{ padding: '0 20px 16px' }}>
        <StockLive estoque={estoque} />
      </div>

      <div style={{ padding: '0 20px 14px' }}>
        <Link
          href="/relatorios"
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', borderRadius: 16,
            background: 'var(--card)', border: '1px solid var(--border)',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'var(--accent-soft)', border: '1px solid rgba(255,199,54,0.3)',
            display: 'grid', placeItems: 'center', color: 'var(--accent-2)', flexShrink: 0,
          }}>
            <TrendUp size={20} sw={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Meta do mês</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(metaPct)}%
              </span>
            </div>
            <div className="bar" style={{ marginTop: 6, height: 6 }}>
              <span style={{ width: metaPct + '%' }} />
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 6 }}>
              <b style={{ color: 'var(--text-2)' }}>{BRLshort(mesAtual)}</b> de {BRLshort(META_ALVO)} · {diasRestantes} dias
            </div>
          </div>
        </Link>
      </div>

      <div style={{ height: 16 }} />
    </div>
  )
}
