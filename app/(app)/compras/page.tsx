'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PageHead } from '@/components/brasa/page-head'
import { Plus, Calendar, Box, X, Check } from '@/components/brasa/icons'
import type { Produto } from '@/lib/supabase/types'

const supabase = createClient()

function BRL(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function BRLshort(v: number) {
  if (v >= 1000) return 'R$' + (v / 1000).toFixed(1) + 'k'
  return 'R$' + v.toFixed(0)
}
function todayISO() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString() }
function firstOfMonthISO() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString() }
function diasAtras(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  return `${d}d atrás`
}

interface CompraRow {
  id: string
  emoji: string
  nome: string
  quantidade: number
  fornecedor: string | null
  precoUnitario: number
  subtotal: number
  dataCompra: string
}

function NovaCompraSheet({
  produtos,
  onClose,
}: {
  produtos: Produto[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [fornecedor, setFornecedor] = useState('')

  const produto = produtos.find(p => p.id === produtoId)
  const [preco, setPreco] = useState(() => Number(produtos[0]?.precoCusto ?? 0))

  const handleProduto = (id: string) => {
    setProdutoId(id)
    const p = produtos.find(x => x.id === id)
    if (p) setPreco(Number(p.precoCusto))
  }

  const total = qty * preco

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: compra, error: ce } = await supabase.from('compras').insert({
        user_id: user.id,
        fornecedor: fornecedor.trim() || null,
        total: Math.round(total * 100) / 100,
      }).select().single()
      if (ce) throw ce

      const { error: ie } = await supabase.from('compra_itens').insert({
        compra_id: compra.id,
        produtoId: produtoId,
        quantidade: qty,
        precoUnitario: preco,
        subtotal: Math.round(total * 100) / 100,
      })
      if (ie) throw ie

      const { error: me } = await supabase.from('estoque_movimentos').insert({
        user_id: user.id,
        produtoId: produtoId,
        quantidadeDelta: qty,
        tipo: 'compra',
        referencia_id: compra.id,
      })
      if (me) throw me
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras'] })
      qc.invalidateQueries({ queryKey: ['estoque'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,245,230,0.04)',
    border: '1px solid var(--border-strong)',
    borderRadius: 12, color: 'var(--text)',
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
          backdropFilter: 'blur(4px)', zIndex: 40,
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border-strong)', borderBottom: 'none',
        padding: '12px 20px 40px',
        zIndex: 50, display: 'flex', flexDirection: 'column', gap: 14,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 4px', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.14em' }}>Nova entrada</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>Registrar compra</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} sw={2.2} /></button>
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>
            Produto
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {produtos.map(p => (
              <button
                key={p.id}
                onClick={() => handleProduto(p.id)}
                style={{
                  padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                  background: produtoId === p.id
                    ? 'linear-gradient(180deg,rgba(255,199,54,.22),rgba(255,199,54,.08))'
                    : 'rgba(255,245,230,0.04)',
                  border: '1px solid ' + (produtoId === p.id ? 'rgba(255,199,54,.5)' : 'var(--border-strong)'),
                  color: 'var(--text)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>{p.emoji ?? '🍖'}</span> {p.nome}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>
              Quantidade
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>
              Preço unitário
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={preco}
              onChange={e => setPreco(parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>
            Fornecedor (opcional)
          </label>
          <input
            type="text"
            value={fornecedor}
            onChange={e => setFornecedor(e.target.value)}
            placeholder="Ex: Mercado São Jorge"
            style={inputStyle}
          />
        </div>

        {total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,90,77,.08)', border: '1px solid rgba(255,90,77,.2)', borderRadius: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total da compra</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--red-400)', fontVariantNumeric: 'tabular-nums' }}>−{BRL(total)}</span>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !produtoId || qty < 1}
          style={{ width: '100%', padding: '15px', fontSize: 15, opacity: mutation.isPending ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Check size={18} sw={2.6} />
          {mutation.isPending ? 'Salvando...' : `Registrar ${qty}× ${produto?.nome ?? ''}`}
        </button>

        {mutation.isError && (
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,90,77,.12)', border: '1px solid rgba(255,90,77,.3)', color: 'var(--red-400)', fontSize: 13 }}>
            Erro ao salvar. Tente novamente.
          </div>
        )}
      </div>
    </>
  )
}

export default function ComprasPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('produtos').select('*').eq('ativo', true).order('nome')
      if (error) throw error
      return data as Produto[]
    },
  })

  const { data: compras = [], isLoading } = useQuery({
    queryKey: ['compras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras')
        .select('id, fornecedor, total, dataCompra, compra_itens(quantidade, precoUnitario, subtotal, produtos(nome))')
        .order('dataCompra', { ascending: false })
        .limit(50)
      if (error) throw error
      const rows: CompraRow[] = []
      for (const c of data) {
        for (const item of (c.compra_itens as any[])) {
          rows.push({
            id: c.id + (item.produtoId ?? ''),
            emoji: '🍖',
            nome: item.produtos?.nome ?? '',
            quantidade: item.quantidade,
            fornecedor: c.fornecedor,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
            dataCompra: c.dataCompra,
          })
        }
      }
      return rows
    },
  })

  const hojeTotal = compras.filter(c => new Date(c.dataCompra) >= new Date(todayISO())).reduce((a, c) => a + c.subtotal, 0)
  const mesTotal  = compras.filter(c => new Date(c.dataCompra) >= new Date(firstOfMonthISO())).reduce((a, c) => a + c.subtotal, 0)
  const hojeCount = compras.filter(c => new Date(c.dataCompra) >= new Date(todayISO())).length

  return (
    <div className="screen-fade">
      <PageHead
        kicker="Saída · custos"
        title="Compras"
        sub="Tudo que entrou de mercadoria"
        right={
          <button
            className="icon-btn"
            onClick={() => setSheetOpen(true)}
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(180deg, var(--accent-2), var(--accent))',
              borderColor: 'transparent', color: '#1c1208',
            }}
          >
            <Plus size={22} sw={2.5} />
          </button>
        }
      />

      <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="kpi" style={{ padding: 14, minHeight: 90 }}>
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} sw={2.2} /> Hoje
          </span>
          <span className="value" style={{ fontSize: 22, color: 'var(--red-400)' }}>−{BRLshort(hojeTotal)}</span>
          <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{hojeCount} {hojeCount === 1 ? 'entrada' : 'entradas'}</span>
        </div>
        <div className="kpi" style={{ padding: 14, minHeight: 90 }}>
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Box size={12} sw={2.2} /> Mês
          </span>
          <span className="value" style={{ fontSize: 22, color: 'var(--red-400)' }}>−{BRLshort(mesTotal)}</span>
          <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{compras.length} entradas</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 64, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : compras.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Nenhuma compra ainda</div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)', marginBottom: 20 }}>Registre a primeira entrada de mercadoria</div>
          <button
            className="btn btn-primary"
            onClick={() => setSheetOpen(true)}
            style={{ padding: '14px 24px', fontSize: 14 }}
          >
            <Plus size={16} sw={2.4} /> Nova compra
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 20px 16px' }}>
          <div className="card" style={{ padding: '4px 0' }}>
            {compras.map((c, i) => (
              <div key={c.id + i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderBottom: i === compras.length - 1 ? 0 : '1px solid var(--hairline)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center',
                  fontSize: 20, background: 'rgba(255,245,230,0.04)', border: '1px solid var(--border)',
                }}>{c.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                    {c.nome}
                    <span style={{ color: 'var(--text-mute)', fontWeight: 500, marginLeft: 6 }}>{c.quantidade}×</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2 }}>
                    {c.fornecedor ? c.fornecedor + ' · ' : ''}{diasAtras(c.dataCompra)}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red-400)', fontVariantNumeric: 'tabular-nums' }}>
                  −{BRL(c.subtotal)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 16 }} />

      {sheetOpen && <NovaCompraSheet produtos={produtos} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}
