import type { SupabaseClient } from '@supabase/supabase-js'

export async function getEstoqueAtual(tenantId: string, sb: SupabaseClient) {
  const { data, error } = await sb.rpc('get_estoque_atual', { p_tenant_id: tenantId })
  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => {
    const qtd = Number(r.quantidade)
    const pv = Number(r.precoVenda)
    const pc = Number(r.precoCusto)
    const rend = Number(r.rendimento)
    return {
      id: r.id as string,
      nome: r.nome as string,
      precoVenda: pv,
      precoCusto: pc,
      rendimento: rend,
      quantidade: qtd,
      faturamentoPotencial: qtd * rend * pv,
      lucroPotencial: qtd * rend * pv - qtd * pc,
    }
  })
}

export async function registrarVendaComLedger(
  tenantId: string,
  userId: string,
  payload: {
    clienteId?: string
    formaPagamento: string
    notas?: string
    itens: Array<{
      produtoId: string
      quantidade: number
      precoUnitario: number
      custoUnitario: number
    }>
  },
  sb: SupabaseClient
) {
  const total = payload.itens.reduce((sum, i) => sum + i.quantidade * i.precoUnitario, 0)

  const { data: venda, error: vendaErr } = await sb
    .from('vendas')
    .insert({
      tenantId,
      userId,
      clienteId: payload.clienteId ?? null,
      total,
      formaPagamento: payload.formaPagamento,
      status: payload.formaPagamento === 'FIADO' ? 'FIADO' : 'PAGA',
      notas: payload.notas ?? null,
    })
    .select('id')
    .single()
  if (vendaErr) throw vendaErr

  const { error: itensErr } = await sb.from('item_vendas').insert(
    payload.itens.map((i) => ({
      vendaId: venda.id,
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      custoUnitario: i.custoUnitario,
      subtotal: i.quantidade * i.precoUnitario,
    }))
  )
  if (itensErr) throw itensErr

  const { error: estoqueErr } = await sb.from('estoque_movimentos').insert(
    payload.itens.map((i) => ({
      tenantId,
      produtoId: i.produtoId,
      quantidadeDelta: -i.quantidade,
      tipo: 'VENDA',
      referenciaId: venda.id,
      referenciaTipo: 'venda',
      custo: i.custoUnitario,
    }))
  )
  if (estoqueErr) throw estoqueErr

  const { error: ledgerErr } = await sb.from('ledger_entries').insert({
    tenantId,
    tipo: 'VENDA',
    direcao: 'CREDITO',
    valor: total,
    descricao: `Venda #${venda.id.slice(-6).toUpperCase()}`,
    referenciaId: venda.id,
    referenciaTipo: 'venda',
  })
  if (ledgerErr) throw ledgerErr

  if (payload.formaPagamento === 'FIADO' && payload.clienteId) {
    const { error: fiadoErr } = await sb.from('fiados').insert({
      tenantId,
      clienteId: payload.clienteId,
      vendaId: venda.id,
      valorOriginal: total,
    })
    if (fiadoErr) throw fiadoErr
  }

  return venda
}

export async function registrarCompraComLedger(
  tenantId: string,
  payload: {
    fornecedor?: string
    notas?: string
    itens: Array<{
      produtoId: string
      quantidade: number
      precoUnitario: number
    }>
  },
  sb: SupabaseClient
) {
  const total = payload.itens.reduce((sum, i) => sum + i.quantidade * i.precoUnitario, 0)

  const { data: compra, error: compraErr } = await sb
    .from('compras')
    .insert({
      tenantId,
      fornecedor: payload.fornecedor ?? null,
      total,
      notas: payload.notas ?? null,
    })
    .select('id')
    .single()
  if (compraErr) throw compraErr

  const { error: itensErr } = await sb.from('compra_itens').insert(
    payload.itens.map((i) => ({
      compraId: compra.id,
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      subtotal: i.quantidade * i.precoUnitario,
    }))
  )
  if (itensErr) throw itensErr

  const { error: estoqueErr } = await sb.from('estoque_movimentos').insert(
    payload.itens.map((i) => ({
      tenantId,
      produtoId: i.produtoId,
      quantidadeDelta: i.quantidade,
      tipo: 'COMPRA',
      referenciaId: compra.id,
      referenciaTipo: 'compra',
      custo: i.precoUnitario,
    }))
  )
  if (estoqueErr) throw estoqueErr

  const { error: ledgerErr } = await sb.from('ledger_entries').insert({
    tenantId,
    tipo: 'COMPRA_INSUMO',
    direcao: 'DEBITO',
    valor: total,
    descricao: `Compra de insumos${payload.fornecedor ? ` — ${payload.fornecedor}` : ''}`,
    referenciaId: compra.id,
    referenciaTipo: 'compra',
  })
  if (ledgerErr) throw ledgerErr

  return compra
}
