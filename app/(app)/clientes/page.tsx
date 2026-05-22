'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PageHead } from '@/components/brasa/page-head'
import { Plus, X, Check } from '@/components/brasa/icons'

const supabase = createClient()

function BRL(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

interface ClienteData {
  id: string
  nome: string
  telefone: string | null
  createdAt: string
  total_selos: number       // all items ever bought
  selos_usados: number      // stamps spent on rewards
  selos_disponiveis: number // net available
  recompensas_ganhas: number
  total_gasto: number
  ultima_compra: string | null
}

// ─── Stamp card visual ───────────────────────────────────────────────────────

function StampCard({
  selos,
  meta,
  recompensas,
}: {
  selos: number
  meta: number
  recompensas: number
}) {
  const progresso = selos % meta // stamps in current card
  const cells = Array.from({ length: meta }, (_, i) => i < progresso)

  return (
    <div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10,
      }}>
        {cells.map((filled, i) => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: 10,
            border: '1px solid ' + (filled ? 'rgba(255,199,54,.5)' : 'var(--border)'),
            background: filled
              ? 'linear-gradient(180deg,rgba(255,199,54,.22),rgba(255,199,54,.06))'
              : 'rgba(255,245,230,0.03)',
            display: 'grid', placeItems: 'center',
            fontSize: 16,
            boxShadow: filled ? '0 4px 10px -4px rgba(255,199,54,.4)' : 'none',
            transition: 'all 200ms',
          }}>
            {filled ? '🔥' : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>
          {progresso}/{meta} selos
        </span>
        {recompensas > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(74,222,128,0.14)', color: 'var(--status-done)',
          }}>
            🎁 {recompensas} prêmio{recompensas > 1 ? 's' : ''} disponível{recompensas > 1 ? 'is' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Client card ─────────────────────────────────────────────────────────────

function ClienteCard({
  c,
  meta,
  descricao,
  onDarPremio,
  onSelect,
}: {
  c: ClienteData
  meta: number
  descricao: string
  onDarPremio: () => void
  onSelect: () => void
}) {
  const iniciais = c.nome.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
  const progresso = c.selos_disponiveis % meta
  const prontoParaPremio = c.recompensas_ganhas > 0
  const pct = meta > 0 ? (progresso / meta) * 100 : 0

  return (
    <div
      className="card"
      style={{
        padding: 14,
        border: '1px solid ' + (prontoParaPremio ? 'rgba(74,222,128,0.35)' : 'var(--border)'),
        background: prontoParaPremio
          ? 'linear-gradient(180deg,rgba(74,222,128,.07),rgba(74,222,128,.01))'
          : 'var(--card)',
      }}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: prontoParaPremio
            ? 'linear-gradient(135deg,#4ade80,#16a34a)'
            : 'linear-gradient(135deg, var(--gold-400), var(--brasa-500))',
          display: 'grid', placeItems: 'center',
          color: '#1c1208', fontWeight: 800, fontSize: 14,
          boxShadow: prontoParaPremio ? '0 0 0 1px rgba(74,222,128,.4)' : '0 0 0 1px var(--border-strong)',
        }}>{iniciais}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{c.nome}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2 }}>
            {c.total_selos} selos no total · {BRL(c.total_gasto)} gasto
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {progresso}<span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 500 }}>/{meta}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>selos</div>
        </div>
      </div>

      <div className="bar" style={{ marginTop: 12, height: 6 }}>
        <span style={{ width: pct + '%', background: prontoParaPremio ? 'linear-gradient(90deg,#4ade80,#22c55e)' : undefined }} />
      </div>

      {prontoParaPremio && (
        <button
          className="btn btn-primary"
          onClick={e => { e.stopPropagation(); onDarPremio() }}
          style={{ width: '100%', marginTop: 12, padding: '11px', fontSize: 13, borderRadius: 12, background: 'linear-gradient(180deg,#4ade80,#16a34a)', color: '#052e16' }}
        >
          🎁 Dar prêmio · {descricao}
        </button>
      )}
    </div>
  )
}

// ─── Add client sheet ─────────────────────────────────────────────────────────

function AddClienteSheet({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [nome, setNome] = useState('')
  const [tel, setTel] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('clientes').insert({
        user_id: user.id,
        nome: nome.trim(),
        telefone: tel.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      onClose()
    },
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,245,230,0.04)',
    border: '1px solid var(--border-strong)',
    borderRadius: 12, color: 'var(--text)',
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border-strong)', borderBottom: 'none',
        padding: '12px 20px 40px', zIndex: 50,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.14em' }}>Fidelidade</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>Novo cliente</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} sw={2.2} /></button>
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>
            Nome *
          </label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
            autoFocus
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>
            WhatsApp (opcional)
          </label>
          <input
            type="tel"
            value={tel}
            onChange={e => setTel(e.target.value)}
            placeholder="(11) 99999-9999"
            style={inputStyle}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => mutation.mutate()}
          disabled={!nome.trim() || mutation.isPending}
          style={{ width: '100%', padding: '15px', fontSize: 15, opacity: (!nome.trim() || mutation.isPending) ? .5 : 1 }}
        >
          <Check size={18} sw={2.6} />
          {mutation.isPending ? 'Salvando...' : 'Cadastrar cliente'}
        </button>
      </div>
    </>
  )
}

// ─── Config sheet ─────────────────────────────────────────────────────────────

function ConfigSheet({ config, onClose }: { config: { selos: number; descricao: string } | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [selos, setSelos] = useState(config?.selos ?? 10)
  const [descricao, setDescricao] = useState(config?.descricao ?? '1 espetinho grátis')

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('fidelidade_config').upsert({
        user_id: user.id,
        selos_para_recompensa: selos,
        descricao_recompensa: descricao,
        ativo: true,
      }, { onConflict: 'user_id' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fidelidade_config'] })
      onClose()
    },
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,245,230,0.04)',
    border: '1px solid var(--border-strong)',
    borderRadius: 12, color: 'var(--text)',
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border-strong)', borderBottom: 'none',
        padding: '12px 20px 40px', zIndex: 50,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.14em' }}>Configurar</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>Cartão fidelidade</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} sw={2.2} /></button>
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>
            Selos para ganhar prêmio
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {[5, 8, 10, 12, 15].map(n => (
              <button
                key={n}
                onClick={() => setSelos(n)}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  background: selos === n ? 'linear-gradient(180deg,var(--accent-2),var(--accent))' : 'rgba(255,245,230,0.04)',
                  border: '1px solid ' + (selos === n ? 'transparent' : 'var(--border-strong)'),
                  color: selos === n ? '#1c1208' : 'var(--text)',
                }}
              >{n}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>
            O que o cliente ganha
          </label>
          <input
            type="text"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Ex: 1 espetinho grátis"
            style={inputStyle}
          />
        </div>

        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,199,54,.06)', border: '1px solid rgba(255,199,54,.2)', fontSize: 13, color: 'var(--gold-200)' }}>
          A cada <b style={{ color: 'var(--gold-400)' }}>{selos} selos</b> comprados, o cliente ganha <b style={{ color: 'var(--gold-400)' }}>{descricao || '...'}</b>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{ width: '100%', padding: '15px', fontSize: 15, opacity: mutation.isPending ? .5 : 1 }}
        >
          <Check size={18} sw={2.6} />
          {mutation.isPending ? 'Salvando...' : 'Salvar configuração'}
        </button>
      </div>
    </>
  )
}

// ─── Client detail sheet ───────────────────────────────────────────────────────

function ClienteDetailSheet({
  c,
  meta,
  descricao,
  onDarPremio,
  onClose,
}: {
  c: ClienteData
  meta: number
  descricao: string
  onDarPremio: () => void
  onClose: () => void
}) {
  const iniciais = c.nome.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border-strong)', borderBottom: 'none',
        padding: '12px 20px 36px', zIndex: 50,
        display: 'flex', flexDirection: 'column', gap: 14,
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 4px', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--gold-400), var(--brasa-500))',
            display: 'grid', placeItems: 'center',
            color: '#1c1208', fontWeight: 800, fontSize: 16,
          }}>{iniciais}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{c.nome}</div>
            {c.telefone && (
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>{c.telefone}</div>
            )}
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} sw={2.2} /></button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Selos totais', value: c.total_selos.toString(), color: 'var(--accent-2)' },
            { label: 'Gasto total', value: BRL(c.total_gasto).replace('R$ ', 'R$'), color: 'var(--gold-400)' },
            { label: 'Prêmios dados', value: Math.floor(c.selos_usados / meta).toString(), color: 'var(--status-done)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 10px', borderRadius: 12, background: 'rgba(255,245,230,0.03)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Stamp card */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Cartão atual
          </div>
          <StampCard selos={c.selos_disponiveis} meta={meta} recompensas={c.recompensas_ganhas} />
        </div>

        {c.recompensas_ganhas > 0 && (
          <button
            className="btn btn-primary"
            onClick={() => { onDarPremio(); onClose() }}
            style={{ width: '100%', padding: '14px', fontSize: 15, background: 'linear-gradient(180deg,#4ade80,#16a34a)', color: '#052e16' }}
          >
            🎁 Dar prêmio · {descricao}
          </button>
        )}

        {c.telefone && (
          <a
            href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}?text=Oi+${encodeURIComponent(c.nome.split(' ')[0])}%21+Seu+cart%C3%A3o+fidelidade+est%C3%A1+em+${c.selos_disponiveis % meta}%2F${meta}+selos+%F0%9F%94%A5`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ width: '100%', padding: '13px', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            📱 Avisar no WhatsApp
          </a>
        )}
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface FiadoItem {
  id: string
  valorOriginal: number
  valorPago: number
  status: string
  criadoEm: string
  cliente: { id: string; nome: string; telefone: string | null }
}

function diasAtras(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function FiadoCard({ f, onReceber }: { f: FiadoItem; onReceber: () => void }) {
  const dias = diasAtras(f.criadoEm)
  const restante = f.valorOriginal - f.valorPago
  const iniciais = f.cliente.nome.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
  const late = dias >= 7; const warn = dias >= 3 && !late

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--gold-400), var(--brasa-500))',
          display: 'grid', placeItems: 'center',
          color: '#1c1208', fontWeight: 800, fontSize: 13,
        }}>{iniciais}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{f.cliente.nome}</div>
          <div style={{ fontSize: 11.5, color: late ? 'var(--red-400)' : warn ? 'var(--gold-400)' : 'var(--text-mute)', marginTop: 1 }}>
            {dias === 0 ? 'hoje' : dias === 1 ? '1 dia atrás' : `${dias} dias atrás`}
          </div>
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--brasa-200)', fontVariantNumeric: 'tabular-nums' }}>
          {BRL(restante)}
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={onReceber}
          style={{ flex: 1, padding: '9px 12px', fontSize: 13, borderRadius: 11 }}
        >
          <Check size={14} sw={2.6} />
          Recebi {BRL(restante)}
        </button>
        {f.cliente.telefone && (
          <a
            href={`https://wa.me/55${f.cliente.telefone.replace(/\D/g, '')}?text=Oi+${encodeURIComponent(f.cliente.nome.split(' ')[0])}%21+Me+lembra+do+fiado+de+${encodeURIComponent(BRL(restante))}+%F0%9F%98%80`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ padding: '9px 14px', fontSize: 13, borderRadius: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            📱
          </a>
        )}
      </div>
    </div>
  )
}

export default function ClientesPage() {
  const qc = useQueryClient()
  const [addSheet, setAddSheet] = useState(false)
  const [configSheet, setConfigSheet] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null)
  const [search, setSearch] = useState('')

  // Load fidelidade config
  const { data: fidConfig } = useQuery({
    queryKey: ['fidelidade_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fidelidade_config').select('*').maybeSingle()
      if (error) throw error
      return data
    },
  })

  const meta = fidConfig?.selos_para_recompensa ?? 10
  const descricao = fidConfig?.descricao_recompensa ?? '1 espetinho grátis'

  // Load all clients with their stamp data
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const [
        { data: cli, error: ce },
        { data: vendas, error: ve },
        { data: recomp, error: re },
      ] = await Promise.all([
        supabase.from('clientes').select('id, nome, telefone, createdAt').order('nome'),
        supabase.from('vendas').select('id, total, cliente_id, item_vendas(quantidade)').not('cliente_id', 'is', null),
        supabase.from('recompensas').select('cliente_id, selos_utilizados'),
      ])
      if (ce) throw ce; if (ve) throw ve; if (re) throw re

      return cli!.map(c => {
        const cVendas = vendas!.filter(v => v.cliente_id === c.id)
        const total_selos = cVendas.reduce((a, v) => {
          const items = (v.item_vendas as unknown) as { quantidade: number }[]
          return a + items.reduce((s, i) => s + i.quantidade, 0)
        }, 0)
        const total_gasto = cVendas.reduce((a, v) => a + v.total, 0)
        const selos_usados = recomp!.filter(r => r.cliente_id === c.id).reduce((a, r) => a + r.selos_utilizados, 0)
        const selos_disponiveis = total_selos - selos_usados
        const recompensas_ganhas = Math.floor(selos_disponiveis / meta)
        const ultima_compra = cVendas.length > 0
          ? cVendas.sort((a, b) => 0)[0]?.id ?? null
          : null

        return {
          ...c,
          total_selos,
          selos_usados,
          selos_disponiveis,
          recompensas_ganhas,
          total_gasto,
          ultima_compra,
        } as ClienteData
      })
    },
    refetchInterval: 30000,
  })

  // Load open fiados
  const { data: fiados = [] } = useQuery({
    queryKey: ['fiados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiados')
        .select('id, valorOriginal, valorPago, status, criadoEm, clientes(id, nome, telefone)')
        .eq('status', 'ABERTO')
        .order('criadoEm', { ascending: true })
      if (error) throw error
      return (data ?? []).map(f => ({
        ...f,
        cliente: (f.clientes as unknown) as { id: string; nome: string; telefone: string | null },
      })) as FiadoItem[]
    },
  })

  const receberFiado = useMutation({
    mutationFn: async (id: string) => {
      const fiado = fiados.find(f => f.id === id)
      if (!fiado) return
      const { error } = await supabase.from('fiados').update({
        valorPago: fiado.valorOriginal,
        status: 'QUITADO',
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fiados'] }),
  })

  const darPremio = useMutation({
    mutationFn: async (clienteId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      const { error } = await supabase.from('recompensas').insert({
        user_id: user.id,
        cliente_id: clienteId,
        selos_utilizados: meta,
        observacao: descricao,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })

  const prontoParaPremio = clientes.filter(c => c.recompensas_ganhas > 0)
  const filtered = clientes.filter(c =>
    !search || c.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="screen-fade">
      <PageHead
        kicker="👥 Fidelidade"
        title="Clientes"
        sub={`${clientes.length} cadastrados`}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="icon-btn"
              onClick={() => setConfigSheet(true)}
              style={{ width: 44, height: 44, borderRadius: 14, fontSize: 18 }}
              title="Configurar cartão"
            >⚙️</button>
            <button
              className="icon-btn"
              onClick={() => setAddSheet(true)}
              style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'linear-gradient(180deg, var(--accent-2), var(--accent))',
                borderColor: 'transparent', color: '#1c1208',
              }}
            >
              <Plus size={22} sw={2.5} />
            </button>
          </div>
        }
      />

      {/* Config banner */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          padding: '10px 14px', borderRadius: 14,
          background: 'rgba(255,199,54,.06)', border: '1px solid rgba(255,199,54,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }} onClick={() => setConfigSheet(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Cartão fidelidade ativo</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>
                {meta} selos = {descricao}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--accent-2)', fontWeight: 600 }}>Editar →</span>
        </div>
      </div>

      {/* Prontos para prêmio */}
      {prontoParaPremio.length > 0 && (
        <>
          <div className="section-head" style={{ paddingTop: 0 }}>
            <h2 style={{ color: 'var(--status-done)' }}>🎁 Prontos para prêmio</h2>
            <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{prontoParaPremio.length}</span>
          </div>
          <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prontoParaPremio.map(c => (
              <ClienteCard
                key={c.id}
                c={c}
                meta={meta}
                descricao={descricao}
                onDarPremio={() => darPremio.mutate(c.id)}
                onSelect={() => setSelectedCliente(c)}
              />
            ))}
          </div>
        </>
      )}

      {/* Search */}
      {clientes.length > 3 && (
        <div style={{ padding: '0 20px 10px' }}>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            style={{
              width: '100%', padding: '11px 14px',
              background: 'rgba(255,245,230,0.04)',
              border: '1px solid var(--border-strong)',
              borderRadius: 12, color: 'var(--text)',
              fontSize: 14, fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
      )}

      {/* All clients */}
      <div className="section-head" style={{ paddingTop: 0 }}>
        <h2>Todos os clientes</h2>
        <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{filtered.length}</span>
      </div>

      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 90, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </div>
            {!search && (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-mute)', marginBottom: 20 }}>Cadastre o primeiro cliente do programa</div>
                <button className="btn btn-primary" onClick={() => setAddSheet(true)} style={{ padding: '14px 24px', fontSize: 14 }}>
                  <Plus size={16} sw={2.4} /> Cadastrar cliente
                </button>
              </>
            )}
          </div>
        ) : (
          filtered.map(c => (
            <ClienteCard
              key={c.id}
              c={c}
              meta={meta}
              descricao={descricao}
              onDarPremio={() => darPremio.mutate(c.id)}
              onSelect={() => setSelectedCliente(c)}
            />
          ))
        )}
      </div>

      {/* Fiados em aberto */}
      {fiados.length > 0 && (
        <>
          <div className="section-head" style={{ paddingTop: 0 }}>
            <h2 style={{ color: 'var(--brasa-200)' }}>📒 Fiados em aberto</h2>
            <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>
              {BRL(fiados.reduce((a, f) => a + f.valorOriginal - f.valorPago, 0))}
            </span>
          </div>
          <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fiados.map(f => (
              <FiadoCard key={f.id} f={f} onReceber={() => receberFiado.mutate(f.id)} />
            ))}
          </div>
        </>
      )}

      <div style={{ height: 16 }} />

      {addSheet && <AddClienteSheet onClose={() => setAddSheet(false)} />}
      {configSheet && <ConfigSheet config={fidConfig ? { selos: fidConfig.selos_para_recompensa, descricao: fidConfig.descricao_recompensa } : null} onClose={() => setConfigSheet(false)} />}
      {selectedCliente && (
        <ClienteDetailSheet
          c={selectedCliente}
          meta={meta}
          descricao={descricao}
          onDarPremio={() => darPremio.mutate(selectedCliente.id)}
          onClose={() => setSelectedCliente(null)}
        />
      )}
    </div>
  )
}
