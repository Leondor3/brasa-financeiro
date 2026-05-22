'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const META_ALVO = 5000

function BRL(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function BRLshort(v: number) {
  if (v >= 1000) return 'R$' + (v / 1000).toFixed(1) + 'k'
  return 'R$' + v.toFixed(0)
}

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function dayStart(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function dayEnd(d: Date)   { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

function DayBar({ label, value, maxBar, isToday }: { label: string; value: number; maxBar: number; isToday: boolean }) {
  const h = maxBar ? (value / maxBar) * 100 : 0
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
      {h > 20 && (
        <span style={{ fontSize: 9.5, color: 'var(--accent-2)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginBottom: 4, lineHeight: 1 }}>
          {BRLshort(value)}
        </span>
      )}
      <div style={{
        width: '100%', maxWidth: 26,
        height: `${Math.max(h, 4)}%`,
        background: isToday
          ? 'linear-gradient(180deg, var(--accent-2), var(--accent))'
          : 'rgba(255,199,54,0.3)',
        borderRadius: '8px 8px 4px 4px',
        transition: 'height 600ms cubic-bezier(.2,.7,.2,1)',
        border: isToday ? 'none' : '1px solid rgba(255,199,54,0.2)',
      }} />
      <span style={{ fontSize: 10, color: isToday ? 'var(--accent-2)' : 'var(--text-mute)', marginTop: 6, fontWeight: isToday ? 700 : 600 }}>
        {label}
      </span>
    </div>
  )
}

function CircularGauge({ atual, alvo, paraBater }: { atual: number; alvo: number; paraBater: number }) {
  const pct = Math.min(100, alvo > 0 ? (atual / alvo) * 100 : 0)
  const r = 56, c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-2)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,245,230,0.06)" strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none"
            stroke="url(#gauge-grad)" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.7,.2,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--accent-2)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {Math.round(pct)}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4, fontWeight: 600 }}>da meta</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Atual</div>
          <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--accent-2)' }}>{BRL(atual)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Alvo</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{BRL(alvo)}</div>
        </div>
        {paraBater > 0 && (
          <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,140,26,0.12)', border: '1px solid rgba(255,140,26,0.25)', fontSize: 11.5, fontWeight: 600, color: 'var(--brasa-200)' }}>
            ~{BRLshort(paraBater)}/dia pra bater
          </div>
        )}
      </div>
    </div>
  )
}

function FlowCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,245,230,0.03)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{value}</div>
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[120, 80, 80].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
}

function SemanaView() {
  const { data, isLoading } = useQuery({
    queryKey: ['relatorios', 'semana'],
    queryFn: async () => {
      const d7ago = new Date()
      d7ago.setDate(d7ago.getDate() - 6)
      d7ago.setHours(0, 0, 0, 0)

      const { data: vendas, error } = await supabase
        .from('vendas')
        .select('id, total, lucro, forma_pagamento, created_at, item_vendas(produto_id, quantidade, produtos(nome, emoji))')
        .gte('created_at', d7ago.toISOString())
      if (error) throw error

      const hoje = new Date()
      const dias = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const ds = dayStart(d), de = dayEnd(d)
        const dayV = vendas.filter(v => {
          const t = new Date(v.created_at)
          return t >= ds && t <= de && v.forma_pagamento !== 'Fiado'
        })
        return {
          label: DIAS_PT[d.getDay()],
          value: dayV.reduce((a, v) => a + v.total, 0),
          lucro: dayV.reduce((a, v) => a + v.lucro, 0),
          isToday: d.toDateString() === hoje.toDateString(),
        }
      })

      const faturamento = dias.reduce((a, d) => a + d.value, 0)
      const lucro = dias.reduce((a, d) => a + d.lucro, 0)
      const maxBar = Math.max(...dias.map(d => d.value), 1)

      const comVendas = dias.filter(d => d.value > 0)
      const melhor = comVendas.length ? comVendas.reduce((a, b) => b.value > a.value ? b : a) : null
      const pior   = comVendas.length > 1 ? comVendas.reduce((a, b) => b.value < a.value ? b : a) : null

      // Most sold product
      const prodMap = new Map<string, { nome: string; emoji: string; qty: number }>()
      for (const v of vendas) {
        for (const item of ((v.item_vendas as unknown) as { produto_id: string; quantidade: number; produtos: { nome: string; emoji: string } | null }[])) {
          const p = item.produtos
          if (!p) continue
          const cur = prodMap.get(item.produto_id) ?? { nome: p.nome, emoji: p.emoji, qty: 0 }
          cur.qty += item.quantidade
          prodMap.set(item.produto_id, cur)
        }
      }
      const maisVendido = prodMap.size ? Array.from(prodMap.values()).sort((a, b) => b.qty - a.qty)[0] : null

      return { dias, faturamento, lucro, maxBar, melhor, pior, maisVendido }
    },
  })

  if (isLoading) return <Skeleton />
  if (!data) return null
  const { dias, faturamento, lucro, maxBar, melhor, pior, maisVendido } = data

  return (
    <div className="screen-fade">
      <div style={{ padding: '0 20px 14px' }}>
        <div className="card card-elev" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Últimos 7 dias
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 6 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>Faturamento</div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{BRLshort(faturamento)}</div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--hairline)' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--gold-200)', fontWeight: 600 }}>Lucro</div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--gold-400)', fontVariantNumeric: 'tabular-nums' }}>{BRLshort(lucro)}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 6, height: 150, paddingBottom: 22 }}>
            {dias.map(d => <DayBar key={d.label + d.value} label={d.label} value={d.value} maxBar={maxBar} isToday={d.isToday} />)}
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="kpi">
          <span className="label">⭐ Melhor dia</span>
          <span className="value" style={{ fontSize: 22, color: 'var(--accent-2)' }}>{melhor?.label ?? '—'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{melhor ? BRL(melhor.value) : 'sem vendas'}</span>
        </div>
        <div className="kpi">
          <span className="label">💤 Pior dia</span>
          <span className="value" style={{ fontSize: 22, color: 'var(--text-mute)' }}>{pior?.label ?? '—'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{pior ? BRL(pior.value) : '—'}</span>
        </div>
      </div>

      {maisVendido && (
        <>
          <div className="section-head"><h2>Mais vendido</h2></div>
          <div style={{ padding: '0 20px 14px' }}>
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, var(--brasa-500), var(--red-500))',
                display: 'grid', placeItems: 'center', fontSize: 32,
              }}>{maisVendido.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{maisVendido.nome}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginTop: 2 }}>{maisVendido.qty} unidades vendidas</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>#1</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MesView() {
  const { data, isLoading } = useQuery({
    queryKey: ['relatorios', 'mes'],
    queryFn: async () => {
      const hoje = new Date()
      const firstDay = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

      const [{ data: vendas, error: ve }, { data: compras, error: ce }, { data: fiados, error: fe }] = await Promise.all([
        supabase.from('vendas').select('total, lucro, forma_pagamento').gte('created_at', firstDay.toISOString()),
        supabase.from('compras').select('total').gte('created_at', firstDay.toISOString()),
        supabase.from('fiados').select('valor_original, valor_pago').eq('status', 'aberto'),
      ])
      if (ve) throw ve; if (ce) throw ce; if (fe) throw fe

      const faturamento = vendas!.filter(v => v.forma_pagamento !== 'Fiado').reduce((a, v) => a + v.total, 0)
      const lucro       = vendas!.reduce((a, v) => a + v.lucro, 0)
      const gastos      = compras!.reduce((a, c) => a + c.total, 0)
      const aReceber    = fiados!.reduce((a, f) => a + (f.valor_original - f.valor_pago), 0)
      const margem      = faturamento > 0 ? Math.round((lucro / faturamento) * 100) : 0

      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
      const diasRestantes = diasNoMes - hoje.getDate()
      const paraBater = diasRestantes > 0 ? Math.max(0, (META_ALVO - faturamento) / diasRestantes) : 0

      return { faturamento, lucro, gastos, aReceber, margem, diasRestantes, paraBater }
    },
  })

  if (isLoading) return <Skeleton />
  if (!data) return null
  const { faturamento, lucro, gastos, aReceber, margem, diasRestantes, paraBater } = data
  const hoje = new Date()

  return (
    <div className="screen-fade">
      <div style={{ padding: '0 20px 14px' }}>
        <div className="card card-elev" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
              {BRLshort(faturamento)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>faturamento</span>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0 }}>
            <FlowCell label="Entrou" value={BRLshort(faturamento)} color="var(--text)" />
            <div style={{ display: 'grid', placeItems: 'center', color: 'var(--text-dim)', padding: '0 4px' }}>→</div>
            <FlowCell label="Saiu (compras)" value={'−' + BRLshort(gastos)} color="var(--red-400)" />
          </div>

          <div style={{
            marginTop: 8, padding: '12px 14px', borderRadius: 14,
            background: 'linear-gradient(180deg, rgba(255,199,54,0.12), rgba(255,199,54,0.03))',
            border: '1px solid rgba(255,199,54,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gold-200)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>💰 Lucro estimado</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold-400)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em', marginTop: 2 }}>
                {BRL(lucro)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gold-200)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Margem</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold-400)' }}>{margem}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>Meta de faturamento</h2>
        <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{diasRestantes} dias restantes</span>
      </div>
      <div style={{ padding: '0 20px 14px' }}>
        <div className="card" style={{ padding: 16 }}>
          <CircularGauge atual={faturamento} alvo={META_ALVO} paraBater={paraBater} />
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="kpi">
          <span className="label">📒 A receber</span>
          <span className="value" style={{ fontSize: 22, color: 'var(--brasa-200)' }}>{BRLshort(aReceber)}</span>
          <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>em fiado aberto</span>
        </div>
        <div className="kpi">
          <span className="label">📦 Custo s/ faturamento</span>
          <span className="value" style={{ fontSize: 22 }}>{faturamento > 0 ? Math.round((gastos / faturamento) * 100) : 0}%</span>
          <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>do faturamento</span>
        </div>
      </div>
    </div>
  )
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<'semana' | 'mes'>('semana')

  return (
    <div className="screen-fade">
      <div style={{ padding: '56px 20px 14px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>
          📈 Relatório
        </div>
        <h1 style={{ margin: '4px 0 2px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em' }}>
          Sua brasa em números
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-mute)' }}>Faturamento, lucro e o que vai vir</p>
      </div>

      <div className="tabs">
        <div className={'tab' + (period === 'semana' ? ' is-active' : '')} onClick={() => setPeriod('semana')}>Semana</div>
        <div className={'tab' + (period === 'mes' ? ' is-active' : '')} onClick={() => setPeriod('mes')}>Mês</div>
        <div className="tab" style={{ opacity: 0.5 }}>Ano</div>
      </div>

      {period === 'semana' && <SemanaView />}
      {period === 'mes'    && <MesView />}

      <div style={{ height: 16 }} />
    </div>
  )
}
