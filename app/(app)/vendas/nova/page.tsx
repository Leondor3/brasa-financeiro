'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PageHead } from '@/components/brasa/page-head'
import { ArrowRight, Check, X } from '@/components/brasa/icons'
import { useRouter } from 'next/navigation'
import type { Produto } from '@/lib/supabase/types'

const supabase = createClient()

function BRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── ClientePicker ────────────────────────────────────────────────────────────

interface ClienteOption { id: string; nome: string; isNew?: boolean }

function ClientePicker({
  value,
  onChange,
  required,
}: {
  value: ClienteOption | null
  onChange: (c: ClienteOption | null) => void
  required?: boolean
}) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-lista'],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('id, nome').order('nome')
      return data ?? []
    },
  })

  const query = input.trim().toLowerCase()
  const matches = query
    ? clientes.filter(c => c.nome.toLowerCase().includes(query))
    : clientes.slice(0, 5)

  const showCreate = query.length > 0 && !clientes.some(
    c => c.nome.toLowerCase() === query
  )

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (c: ClienteOption) => {
    onChange(c)
    setInput('')
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setInput('')
  }

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,245,230,0.04)',
    border: '1px solid ' + (required ? 'rgba(255,199,54,.5)' : 'var(--border-strong)'),
    borderRadius: 12, color: 'var(--text)',
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
  }

  // Selected state — show chip
  if (value) {
    const iniciais = value.nome.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: 'linear-gradient(180deg,rgba(255,199,54,.1),rgba(255,199,54,.03))',
        border: '1px solid rgba(255,199,54,.4)',
        borderRadius: 12,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,var(--gold-400),var(--brasa-500))',
          display: 'grid', placeItems: 'center',
          color: '#1c1208', fontWeight: 800, fontSize: 12,
        }}>{iniciais}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{value.nome}</div>
          {value.isNew && (
            <div style={{ fontSize: 11, color: 'var(--gold-200)', marginTop: 1 }}>✨ novo cadastro</div>
          )}
        </div>
        <button
          onClick={clear}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', padding: 4 }}
        >
          <X size={16} sw={2.2} />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={input}
        onChange={e => { setInput(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={required ? 'Buscar cliente...' : 'Buscar ou criar cliente...'}
        style={iStyle}
        autoComplete="off"
      />

      {open && (matches.length > 0 || showCreate) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,.6)',
          zIndex: 50,
        }}>
          {matches.map((c, i) => {
            const iniciais = c.nome.split(' ').slice(0, 2).map((n: string) => n[0]?.toUpperCase() ?? '').join('')
            return (
              <button
                key={c.id}
                onMouseDown={e => { e.preventDefault(); select(c) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: i < matches.length - 1 || showCreate ? '1px solid var(--hairline)' : 'none',
                  color: 'var(--text)', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: 'linear-gradient(135deg,var(--gold-400),var(--brasa-500))',
                  display: 'grid', placeItems: 'center',
                  color: '#1c1208', fontWeight: 800, fontSize: 11,
                }}>{iniciais}</div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{c.nome}</span>
              </button>
            )
          })}

          {showCreate && (
            <button
              onMouseDown={e => { e.preventDefault(); select({ id: 'new', nome: input.trim(), isNew: true }) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text)', textAlign: 'left',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: 'rgba(255,199,54,.15)', border: '1px dashed rgba(255,199,54,.4)',
                display: 'grid', placeItems: 'center', fontSize: 16,
              }}>+</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Criar "{input.trim()}"</div>
                <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>novo cadastro</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Product tile ─────────────────────────────────────────────────────────────

function ProductTile({ p, qty, onAdd, onSub }: { p: Produto; qty: number; onAdd: () => void; onSub: () => void }) {
  return (
    <button onClick={onAdd} style={{
      appearance: 'none',
      border: '1px solid ' + (qty > 0 ? 'rgba(255,199,54,0.5)' : 'var(--border)'),
      background: qty > 0 ? 'linear-gradient(180deg,rgba(255,199,54,.12),rgba(255,199,54,.03))' : 'var(--card)',
      borderRadius: 16, padding: '14px 12px', textAlign: 'left',
      cursor: 'pointer', color: 'inherit', position: 'relative',
      boxShadow: qty > 0 ? '0 8px 24px -10px rgba(255,199,54,.35)' : 'none',
    }}>
      <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6 }}>🍖</div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nome}</div>
      <div style={{ fontSize: 13, color: 'var(--text-mute)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {BRL(Number(p.precoVenda))}
      </div>
      {qty > 0 && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(0,0,0,.55)', padding: '4px 4px 4px 8px',
          borderRadius: 999, border: '1px solid rgba(255,199,54,.4)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-200)', fontVariantNumeric: 'tabular-nums' }}>{qty}×</span>
          <span onClick={e => { e.stopPropagation(); onSub() }} style={{
            width: 22, height: 22, borderRadius: 999,
            display: 'grid', placeItems: 'center',
            background: 'rgba(255,90,77,.18)', color: 'var(--red-400)',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>−</span>
        </div>
      )}
    </button>
  )
}

function PaymentOption({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  const icons: Record<string, string> = { PIX: '⚡', Dinheiro: '💵', Cartão: '💳', Fiado: '📒' }
  return (
    <button onClick={onClick} style={{
      appearance: 'none',
      border: '1px solid ' + (active ? 'rgba(255,199,54,.5)' : 'var(--border)'),
      background: active ? 'linear-gradient(180deg,rgba(255,199,54,.14),rgba(255,199,54,.03))' : 'var(--card)',
      borderRadius: 14, padding: '14px', textAlign: 'left',
      cursor: 'pointer', color: 'inherit',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: active ? '0 8px 20px -10px var(--accent-glow)' : 'none',
    }}>
      <span style={{ fontSize: 22 }}>{icons[label]}</span>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
      {active && (
        <span style={{
          marginLeft: 'auto', width: 20, height: 20, borderRadius: 999,
          background: 'linear-gradient(180deg,var(--accent-2),var(--accent))',
          color: '#1c1208', display: 'grid', placeItems: 'center',
        }}>
          <Check size={12} sw={3} />
        </span>
      )}
    </button>
  )
}

function SaleSuccess({ total, qty }: { total: number; qty: number }) {
  return (
    <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{
        width: 96, height: 96, borderRadius: 999,
        background: 'linear-gradient(180deg,var(--accent-2),var(--accent))',
        display: 'grid', placeItems: 'center', color: '#1c1208',
        boxShadow: '0 20px 50px -10px var(--accent-glow)',
        animation: 'pop 500ms cubic-bezier(.2,.8,.2,1.2)',
      }}>
        <Check size={48} sw={3.2} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800 }}>Venda registrada!</div>
        <div style={{ fontSize: 15, color: 'var(--text-mute)', marginTop: 4 }}>
          {qty} {qty === 1 ? 'item' : 'itens'} · <b style={{ color: 'var(--gold-400)' }}>{BRL(total)}</b>
        </div>
      </div>
      <style>{`@keyframes pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VenderPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [pagamento, setPagamento] = useState('PIX')
  const [cliente, setCliente] = useState<{ id: string; nome: string; isNew?: boolean } | null>(null)
  const [step, setStep] = useState(1)
  const [flash, setFlash] = useState<{ total: number; qty: number } | null>(null)

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos').select('*').eq('ativo', true).order('nome')
      if (error) throw error
      return data
    },
  })

  const pagamentoEnumMap: Record<string, string> = {
    PIX: 'PIX', Dinheiro: 'DINHEIRO', Cartão: 'CARTAO_CREDITO', Fiado: 'FIADO',
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(cart).map(([id, qty]) => {
        const p = produtos.find(x => x.id === id)!
        return { ...p, qty, precoV: Number(p.precoVenda), precoC: Number(p.precoCusto) }
      })
      const total = items.reduce((a, i) => a + i.precoV * i.qty, 0)

      // 1. Resolve cliente
      let clienteId: string | undefined
      if (cliente) {
        if (cliente.id === 'new') {
          const res = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: cliente.nome }),
          })
          if (!res.ok) throw new Error('Erro ao criar cliente')
          const novo = await res.json()
          clienteId = novo.id
        } else {
          clienteId = cliente.id
        }
      }

      // 2. Registra venda via API (inclui ledger + estoque)
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          formaPagamento: pagamentoEnumMap[pagamento] ?? 'PIX',
          itens: items.map(i => ({
            produtoId: i.id,
            quantidade: i.qty,
            precoUnitario: i.precoV,
            custoUnitario: i.precoC,
          })),
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Erro na venda') }
      const venda = await res.json()

      if (clienteId) qc.invalidateQueries({ queryKey: ['clientes'] })
      if (pagamento === 'Fiado') qc.invalidateQueries({ queryKey: ['fiados'] })
      return { venda, total, qty: items.reduce((a, i) => a + i.qty, 0) }
    },
    onSuccess: ({ total, qty }) => {
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['estoque'] })
      setFlash({ total, qty })
      setTimeout(() => { router.push('/dashboard') }, 1600)
    },
  })

  const add = (id: string) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const sub = (id: string) => setCart(c => {
    const n = { ...c }; n[id] = (n[id] || 0) - 1
    if (n[id] <= 0) delete n[id]
    return n
  })

  const items = Object.entries(cart).map(([id, qty]) => {
    const p = produtos.find(x => x.id === id)!
    return { ...p, qty, precoV: Number(p.precoVenda), precoC: Number(p.precoCusto) }
  })
  const total    = items.reduce((a, i) => a + i.precoV * i.qty, 0)
  const lucro    = items.reduce((a, i) => a + (i.precoV - i.precoC) * i.qty, 0)
  const totalQty = items.reduce((a, i) => a + i.qty, 0)

  const canConfirm = !mutation.isPending && (pagamento !== 'Fiado' || cliente !== null)

  if (flash) return <SaleSuccess {...flash} />

  return (
    <div className="screen-fade">
      <PageHead
        kicker={step === 1 ? '⚡ Nova venda' : '💳 Confirmar'}
        title={step === 1 ? 'O que vai sair?' : 'Como vai pagar?'}
        sub={step === 1 ? 'Toque pra adicionar' : `${totalQty} itens · ${BRL(total)}`}
        right={totalQty > 0 && step === 1 ? (
          <button className="icon-btn" onClick={() => setCart({})}><X size={18} sw={2.2} /></button>
        ) : undefined}
      />

      {step === 1 && (
        <>
          {isLoading ? (
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ height: 90, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px 16px' }}>
              {produtos.map(p => (
                <ProductTile key={p.id} p={p} qty={cart[p.id] || 0} onAdd={() => add(p.id)} onSub={() => sub(p.id)} />
              ))}
            </div>
          )}
          <div style={{ height: 210 }} />
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ padding: '0 20px 14px' }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Resumo</div>
              {items.map(i => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: 18 }}>🍖</span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{i.qty}× {i.nome}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{BRL(i.precoV * i.qty)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--hairline)', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: 19, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{BRL(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11.5, color: 'var(--gold-200)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Lucro estimado</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-400)', fontVariantNumeric: 'tabular-nums' }}>+{BRL(lucro)}</span>
              </div>
            </div>
          </div>

          <div className="section-head" style={{ paddingTop: 0 }}><h2>Forma de pagamento</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 20px 16px' }}>
            {['PIX', 'Dinheiro', 'Cartão', 'Fiado'].map(p => (
              <PaymentOption key={p} active={pagamento === p} label={p} onClick={() => setPagamento(p)} />
            ))}
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>
              {pagamento === 'Fiado' ? '📒 Cliente *' : '👤 Cliente (opcional · conta selos)'}
            </label>
            <ClientePicker
              value={cliente}
              onChange={setCliente}
              required={pagamento === 'Fiado'}
            />
            {cliente && !cliente.isNew && pagamento !== 'Fiado' && (
              <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--gold-200)', display: 'flex', alignItems: 'center', gap: 4 }}>
                🔥 Selos serão contados pro cartão de {cliente.nome.split(' ')[0]}
              </div>
            )}
          </div>

          <div style={{ height: 210 }} />
        </>
      )}

      {totalQty > 0 && (
        <>
          <div style={{
            position: 'fixed', bottom: 'calc(172px + env(safe-area-inset-bottom, 0px))',
            left: 0, right: 0, height: 72,
            background: 'linear-gradient(to bottom, transparent, rgba(10,8,7,.95))',
            zIndex: 19, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'fixed', bottom: 'calc(112px + env(safe-area-inset-bottom, 0px))',
            left: '50%', transform: 'translateX(-50%)',
            width: 'calc(100% - 28px)', maxWidth: 416,
            padding: '14px 14px',
            background: 'rgba(20,16,14,.95)',
            backdropFilter: 'blur(28px)',
            border: '1px solid var(--border-strong)',
            borderRadius: 18, display: 'flex', alignItems: 'center', gap: 10,
            zIndex: 20,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>
                {step === 1 ? 'Carrinho' : 'Receber'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                {BRL(total)} <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 500 }}>· {totalQty} itens</span>
              </div>
            </div>
            {step === 1 ? (
              <button className="btn btn-primary" onClick={() => setStep(2)} style={{ padding: '14px 18px', fontSize: 14 }}>
                Continuar <ArrowRight size={16} sw={2.4} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => mutation.mutate()}
                disabled={!canConfirm}
                style={{ padding: '14px 18px', fontSize: 14, opacity: canConfirm ? 1 : .4 }}
              >
                <Check size={18} sw={2.6} />
                {mutation.isPending ? 'Salvando...' : 'Confirmar'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
