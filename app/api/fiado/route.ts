import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/client'

const pagamentoSchema = z.object({
  fiadoId: z.string(),
  valor: z.number().positive(),
  notas: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'ABERTO'

  const fiados = await prisma.fiado.findMany({
    where: { tenantId: dbUser.tenantId, status: status as never },
    include: {
      cliente: true,
      venda: { include: { itens: { include: { produto: true } } } },
      pagamentos: { orderBy: { pagoEm: 'desc' } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(fiados)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = pagamentoSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { fiadoId, valor, notas } = parsed.data

  const fiado = await prisma.fiado.findFirst({
    where: { id: fiadoId, tenantId: dbUser.tenantId },
  })
  if (!fiado) return NextResponse.json({ error: 'Fiado não encontrado' }, { status: 404 })

  const resultado = await prisma.$transaction(async (tx) => {
    await tx.fiadoPagamento.create({
      data: { fiadoId, valor, notas },
    })

    const novoValorPago = Number(fiado.valorPago) + valor
    const novoStatus =
      novoValorPago >= Number(fiado.valorOriginal)
        ? 'QUITADO'
        : 'PARCIAL'

    const fiadoAtualizado = await tx.fiado.update({
      where: { id: fiadoId },
      data: {
        valorPago: novoValorPago,
        status: novoStatus,
        quitadoEm: novoStatus === 'QUITADO' ? new Date() : null,
      },
    })

    await tx.ledgerEntry.create({
      data: {
        tenantId: dbUser.tenantId,
        tipo: 'RECEBIMENTO_FIADO',
        direcao: 'CREDITO',
        valor,
        descricao: `Recebimento de fiado`,
        referenciaId: fiadoId,
        referenciaTipo: 'fiado',
      },
    })

    return fiadoAtualizado
  })

  return NextResponse.json(resultado)
}
