import { prisma } from '@/lib/db/client'
import { startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { getEstoqueAtual } from '@/lib/utils/lucro'

export async function getDashboardData(tenantId: string) {
  const agora = new Date()
  const hoje = startOfDay(agora)
  const fimDoDia = endOfDay(agora)
  const inicioSemana = startOfWeek(agora, { weekStartsOn: 1 })
  const inicioMes = startOfMonth(agora)

  const [
    vendasHoje,
    gastosHoje,
    fiadoAberto,
    topProdutosSemana,
    estoque,
    faturamentoDiarioSemana,
    totalVendasMes,
  ] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { tenantId, direcao: 'CREDITO', tipo: 'VENDA', ocorridoEm: { gte: hoje, lte: fimDoDia } },
      _sum: { valor: true },
    }),

    prisma.ledgerEntry.aggregate({
      where: { tenantId, direcao: 'DEBITO', ocorridoEm: { gte: hoje, lte: fimDoDia } },
      _sum: { valor: true },
    }),

    prisma.fiado.aggregate({
      where: { tenantId, status: { in: ['ABERTO', 'PARCIAL'] } },
      _sum: { valorOriginal: true, valorPago: true },
    }),

    prisma.$queryRaw<Array<{ nome: string; qtd: string; receita: string }>>`
      SELECT p.nome, SUM(iv.quantidade)::text AS qtd, SUM(iv.subtotal)::text AS receita
      FROM item_vendas iv
      JOIN produtos p ON iv.produto_id = p.id
      JOIN vendas v ON iv.venda_id = v.id
      WHERE v.tenant_id = ${tenantId}
        AND v.vendido_em >= ${inicioSemana}
        AND v.status = 'PAGA'
      GROUP BY p.id, p.nome
      ORDER BY receita DESC
      LIMIT 5
    `,

    getEstoqueAtual(tenantId),

    prisma.$queryRaw<Array<{ dia: string; valor: string }>>`
      SELECT DATE(vendido_em)::text AS dia, SUM(total)::text AS valor
      FROM vendas
      WHERE tenant_id = ${tenantId}
        AND vendido_em >= ${inicioSemana}
        AND status = 'PAGA'
      GROUP BY DATE(vendido_em)
      ORDER BY dia
    `,

    prisma.venda.aggregate({
      where: { tenantId, status: 'PAGA', vendidoEm: { gte: inicioMes } },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const receitaHoje = Number(vendasHoje._sum.valor ?? 0)
  const gastosHojeVal = Number(gastosHoje._sum.valor ?? 0)
  const fiadoPendente =
    Number(fiadoAberto._sum.valorOriginal ?? 0) - Number(fiadoAberto._sum.valorPago ?? 0)
  const faturamentoPotencialEstoque = estoque.reduce((s, e) => s + e.faturamentoPotencial, 0)
  const lucroPotencialEstoque = estoque.reduce((s, e) => s + e.lucroPotencial, 0)

  return {
    hoje: {
      receita: receitaHoje,
      gastos: gastosHojeVal,
      lucro: receitaHoje - gastosHojeVal,
    },
    mes: {
      faturamento: Number(totalVendasMes._sum.total ?? 0),
      numVendas: totalVendasMes._count,
    },
    fiado: { pendente: fiadoPendente },
    estoque: {
      itens: estoque,
      faturamentoPotencial: faturamentoPotencialEstoque,
      lucroPotencial: lucroPotencialEstoque,
    },
    topProdutos: topProdutosSemana.map((p) => ({
      nome: p.nome,
      qtd: Number(p.qtd),
      receita: Number(p.receita),
    })),
    graficos: {
      semanal: faturamentoDiarioSemana.map((r) => ({
        dia: r.dia,
        valor: Number(r.valor),
      })),
    },
  }
}
