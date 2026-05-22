import type { SupabaseClient } from '@supabase/supabase-js'
import { startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { getEstoqueAtual } from '@/lib/utils/lucro'

export async function getDashboardData(tenantId: string, sb: SupabaseClient) {
  const agora = new Date()
  const hoje = startOfDay(agora)
  const fimDoDia = endOfDay(agora)
  const inicioSemana = startOfWeek(agora, { weekStartsOn: 1 })
  const inicioMes = startOfMonth(agora)

  const [
    { data: creditosHoje },
    { data: debitosHoje },
    { data: fiadosAbertos },
    { data: topProdutos },
    estoque,
    { data: faturamentoDiario },
    { data: vendasMes },
  ] = await Promise.all([
    sb
      .from('ledger_entries')
      .select('valor')
      .eq('tenantId', tenantId)
      .eq('direcao', 'CREDITO')
      .eq('tipo', 'VENDA')
      .gte('ocorridoEm', hoje.toISOString())
      .lte('ocorridoEm', fimDoDia.toISOString()),

    sb
      .from('ledger_entries')
      .select('valor')
      .eq('tenantId', tenantId)
      .eq('direcao', 'DEBITO')
      .gte('ocorridoEm', hoje.toISOString())
      .lte('ocorridoEm', fimDoDia.toISOString()),

    sb
      .from('fiados')
      .select('valorOriginal,valorPago')
      .eq('tenantId', tenantId)
      .in('status', ['ABERTO', 'PARCIAL']),

    sb.rpc('get_top_produtos_semana', {
      p_tenant_id: tenantId,
      p_inicio_semana: inicioSemana.toISOString(),
    }),

    getEstoqueAtual(tenantId, sb),

    sb.rpc('get_faturamento_diario_semana', {
      p_tenant_id: tenantId,
      p_inicio_semana: inicioSemana.toISOString(),
    }),

    sb
      .from('vendas')
      .select('total')
      .eq('tenantId', tenantId)
      .eq('status', 'PAGA')
      .gte('vendidoEm', inicioMes.toISOString()),
  ])

  const receitaHoje = (creditosHoje ?? []).reduce((s: number, r: { valor: unknown }) => s + Number(r.valor), 0)
  const gastosHojeVal = (debitosHoje ?? []).reduce((s: number, r: { valor: unknown }) => s + Number(r.valor), 0)
  const fiadoPendente = (fiadosAbertos ?? []).reduce(
    (s: number, f: { valorOriginal: unknown; valorPago: unknown }) =>
      s + Number(f.valorOriginal) - Number(f.valorPago),
    0
  )
  const totalVendasMes = (vendasMes ?? []).reduce((s: number, v: { total: unknown }) => s + Number(v.total), 0)
  const faturamentoPotencialEstoque = estoque.reduce((s: number, e: { faturamentoPotencial: number }) => s + e.faturamentoPotencial, 0)
  const lucroPotencialEstoque = estoque.reduce((s: number, e: { lucroPotencial: number }) => s + e.lucroPotencial, 0)

  return {
    hoje: {
      receita: receitaHoje,
      gastos: gastosHojeVal,
      lucro: receitaHoje - gastosHojeVal,
    },
    mes: {
      faturamento: totalVendasMes,
      numVendas: (vendasMes ?? []).length,
    },
    fiado: { pendente: fiadoPendente },
    estoque: {
      itens: estoque,
      faturamentoPotencial: faturamentoPotencialEstoque,
      lucroPotencial: lucroPotencialEstoque,
    },
    topProdutos: (topProdutos ?? []).map((p: { nome: string; qtd: unknown; receita: unknown }) => ({
      nome: p.nome,
      qtd: Number(p.qtd),
      receita: Number(p.receita),
    })),
    graficos: {
      semanal: (faturamentoDiario ?? []).map((r: { dia: string; valor: unknown }) => ({
        dia: r.dia,
        valor: Number(r.valor),
      })),
    },
  }
}
