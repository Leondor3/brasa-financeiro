'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PageHead } from '@/components/brasa/page-head'
import { Check } from '@/components/brasa/icons'

const supabase = createClient()

function BRL(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

type SortKey = 'atraso' | 'valor' | 'nome'

const COLORS = {
  ok:      { dot: 'var(--status-done)', text: '#b6f0c8', label: 'Em dia' },
  warn:    { dot: 'var(--gold-400)',    text: '#fff3b8', label: 'Esfriou' },
  late:    { dot: 'var(--red-400)',     text: '#ffb1aa', label: 'Atrasado' },
}

function diasAtras(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

interface FiadoItem {
  id: string
  valor_original: number
  valor_pago: number
  status: string
  created_at: string
  cliente: { id: string; nome: string; telefone: string | null }
}

function FiadoCard({ f, onReceber }: { f: FiadoItem; onReceber: (id: string) => void }) {
  const dias = diasAtras(f.created_at)
  const restante = f.valor_original - f.valor_pago
  const color = dias >= 7 ? COLORS.late : dias >= 3 ? COLORS.warn : COLORS.ok
  const iniciais = f.cliente.nome.split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('')

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--gold-400), var(--brasa-500))',
          display: 'grid', placeItems: 'center',
          color: '#1c1208', fontWeight: 700, fontSize: 14, flexShrink: 0,
          boxShadow: '0 0 0 1px var(--border-strong)',
        }}>{iniciais}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.005em' }}>{f.cliente.nome}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: color.text }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: color.dot, display: 'inline-block' }} />
              {dias === 0 ? 'hoje' : dias === 1 ? '1 dia' : `${dias} dias`}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--brasa-200)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em' }}>
            {BRL(restante)}
          </div>
          {f.cliente.telefone && (
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 1 }}>{f.cliente.telefone}</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)', display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={() => onReceber(f.id)}
          style={{ flex: 1, padding: '10px 12px', fontSize: 13, borderRadius: 11 }}
        >
          <Check size={14} sw={2.6} />
          Recebi {BRL(restante)}
        </button>
        {f.cliente.telefone && (
          <a
            href={`https://wa.me/55${f.cliente.telefone.replace(/\D/g, '')}?text=Oi+${encodeURIComponent(f.cliente.nome.split(' ')[0])}%2C+tudo+bem%3F+Passa+aqui+pra+acertar+o+fiado+de+${encodeURIComponent(BRL(restante))}+%F0%9F%99%8F`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ padding: '10px 14px', fontSize: 13, borderRadius: 11, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
          >
            📱
          </a>
        )}
      </div>
    </div>
  )
}

export default function FiadoPage() {
  const qc = useQueryClient()
  const [sort, setSort] = useState<SortKey>('atraso')

  const { data: fiados = [], isLoading } = useQuery({
    queryKey: ['fiados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiados')
        .select('id, valor_original, valor_pago, status, created_at, clientes(id, nome, telefone)')
        .eq('status', 'aberto')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data.map(f => ({
        ...f,
        cliente: (f.clientes as unknown) as { id: string; nome: string; telefone: string | null },
      })) as FiadoItem[]
    },
    refetchInterval: 30000,
  })

  const receber = useMutation({
    mutationFn: async (id: string) => {
      const fiado = fiados.find(f => f.id === id)
      if (!fiado) throw new Error('Fiado não encontrado')
      const { error } = await supabase
        .from('fiados')
        .update({ valor_pago: fiado.valor_original, status: 'pago' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fiados'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const totalAberto = fiados.reduce((a, f) => a + (f.valor_original - f.valor_pago), 0)
  const atrasados = fiados.filter(f => diasAtras(f.created_at) >= 7)

  const sorted = [...fiados].sort((a, b) => {
    if (sort === 'atraso') return diasAtras(b.created_at) - diasAtras(a.created_at)
    if (sort === 'valor')  return (b.valor_original - b.valor_pago) - (a.valor_original - a.valor_pago)
    return a.cliente.nome.localeCompare(b.cliente.nome)
  })

  return (
    <div className="screen-fade">
      <PageHead
        kicker="📒 A receber"
        title="Fiado"
        sub={fiados.length > 0 ? `${fiados.length} ${fiados.length === 1 ? 'cliente' : 'clientes'} devendo` : 'Sem fiados em aberto'}
      />

      <div style={{ padding: '0 20px 14px' }}>
        <div className="card card-elev" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 11.5, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Total em aberto
              </span>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, lineHeight: 1 }}>
                {BRL(totalAberto)}
              </div>
              {atrasados.length > 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(255,90,77,0.16)', color: 'var(--red-400)', letterSpacing: '0.02em',
                  }}>
                    {atrasados.length} {atrasados.length === 1 ? 'atrasado' : 'atrasados'}
                  </span>
                  <span>+ 7 dias</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 44, lineHeight: 1, opacity: 0.7 }}>📒</div>
          </div>
        </div>
      </div>

      {fiados.length > 0 && (
        <div className="chip-row">
          {(['atraso', 'valor', 'nome'] as SortKey[]).map(s => (
            <div key={s} className={'chip' + (sort === s ? ' is-active' : '')} onClick={() => setSort(s)}>
              {s === 'atraso' ? 'Mais atrasados' : s === 'valor' ? 'Maior valor' : 'A → Z'}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 120, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))
        ) : sorted.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Tudo em dia!</div>
            <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>Nenhum fiado em aberto</div>
          </div>
        ) : (
          sorted.map(f => (
            <FiadoCard
              key={f.id}
              f={f}
              onReceber={(id) => receber.mutate(id)}
            />
          ))
        )}
      </div>

      <div style={{ height: 10 }} />
    </div>
  )
}
