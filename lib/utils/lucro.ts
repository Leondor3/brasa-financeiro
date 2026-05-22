import { prisma } from '@/lib/db/client'
import { startOfDay, endOfDay } from 'date-fns'

export function calcularMargem(precoVenda: number, precoCusto: number): number {
  if (precoVenda === 0) return 0
  return ((precoVenda - precoCusto) / precoVenda) * 100
}

export async function getEstoqueAtual(tenantId: string) {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      nome: string
      preco_venda: string
      preco_custo: string
      rendimento: string
      quantidade: string
    }>
  >`
    SELECT
      p.id,
      p.nome,
      p.preco_venda,
      p.preco_custo,
      p.rendimento,
      COALESCE(SUM(em.quantidade_delta), 0)::text AS quantidade
    FROM produtos p
    LEFT JOIN estoque_movimentos em ON em.produto_id = p.id AND em.tenant_id = ${tenantId}
    WHERE p.tenant_id = ${tenantId} AND p.ativo = true
    GROUP BY p.id, p.nome, p.preco_venda, p.preco_custo, p.rendimento
    HAVING COALESCE(SUM(em.quantidade_delta), 0) > 0
    ORDER BY p.nome
  `

  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    precoVenda: Number(r.preco_venda),
    precoCusto: Number(r.preco_custo),
    rendimento: Number(r.rendimento),
    quantidade: Number(r.quantidade),
    faturamentoPotencial: Number(r.quantidade) * Number(r.rendimento) * Number(r.preco_venda),
    lucroPotencial:
      Number(r.quantidade) * Number(r.rendimento) * Number(r.preco_venda) -
      Number(r.quantidade) * Number(r.preco_custo),
  }))
}

export async function calcularLucroReal(tenantId: string, de: Date, ate: Date) {
  const [creditos, debitos] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: {
        tenantId,
        direcao: 'CREDITO',
        ocorridoEm: { gte: de, lte: ate },
      },
      _sum: { valor: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        tenantId,
        direcao: 'DEBITO',
        ocorridoEm: { gte: de, lte: ate },
      },
      _sum: { valor: true },
    }),
  ])

  const receita = Number(creditos._sum.valor ?? 0)
  const gastos = Number(debitos._sum.valor ?? 0)
  return { receita, gastos, lucro: receita - gastos }
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
  }
) {
  const total = payload.itens.reduce((sum, i) => sum + i.quantidade * i.precoUnitario, 0)

  return prisma.$transaction(async (tx) => {
    const venda = await tx.venda.create({
      data: {
        tenantId,
        userId,
        clienteId: payload.clienteId ?? null,
        total,
        formaPagamento: payload.formaPagamento as never,
        status: payload.formaPagamento === 'FIADO' ? 'FIADO' : 'PAGA',
        notas: payload.notas,
        itens: {
          create: payload.itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
            custoUnitario: i.custoUnitario,
            subtotal: i.quantidade * i.precoUnitario,
          })),
        },
      },
    })

    for (const item of payload.itens) {
      await tx.estoqueMovimento.create({
        data: {
          tenantId,
          produtoId: item.produtoId,
          quantidadeDelta: -item.quantidade,
          tipo: 'VENDA',
          referenciaId: venda.id,
          referenciaTipo: 'venda',
          custo: item.custoUnitario,
        },
      })
    }

    await tx.ledgerEntry.create({
      data: {
        tenantId,
        tipo: 'VENDA',
        direcao: payload.formaPagamento === 'FIADO' ? 'CREDITO' : 'CREDITO',
        valor: total,
        descricao: `Venda #${venda.id.slice(-6).toUpperCase()}`,
        referenciaId: venda.id,
        referenciaTipo: 'venda',
      },
    })

    if (payload.formaPagamento === 'FIADO' && payload.clienteId) {
      await tx.fiado.create({
        data: {
          tenantId,
          clienteId: payload.clienteId,
          vendaId: venda.id,
          valorOriginal: total,
        },
      })
    }

    return venda
  })
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
  }
) {
  const total = payload.itens.reduce((sum, i) => sum + i.quantidade * i.precoUnitario, 0)

  return prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: {
        tenantId,
        fornecedor: payload.fornecedor,
        total,
        notas: payload.notas,
        itens: {
          create: payload.itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
            subtotal: i.quantidade * i.precoUnitario,
          })),
        },
      },
    })

    for (const item of payload.itens) {
      await tx.estoqueMovimento.create({
        data: {
          tenantId,
          produtoId: item.produtoId,
          quantidadeDelta: item.quantidade,
          tipo: 'COMPRA',
          referenciaId: compra.id,
          referenciaTipo: 'compra',
          custo: item.precoUnitario,
        },
      })
    }

    await tx.ledgerEntry.create({
      data: {
        tenantId,
        tipo: 'COMPRA_INSUMO',
        direcao: 'DEBITO',
        valor: total,
        descricao: `Compra de insumos${payload.fornecedor ? ` — ${payload.fornecedor}` : ''}`,
        referenciaId: compra.id,
        referenciaTipo: 'compra',
      },
    })

    return compra
  })
}
