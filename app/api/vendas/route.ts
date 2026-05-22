import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/client'
import { registrarVendaComLedger } from '@/lib/utils/lucro'

const itemSchema = z.object({
  produtoId: z.string(),
  quantidade: z.number().positive(),
  precoUnitario: z.number().positive(),
  custoUnitario: z.number().min(0),
})

const vendaSchema = z.object({
  clienteId: z.string().optional(),
  formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'FIADO']),
  notas: z.string().optional(),
  itens: z.array(itemSchema).min(1),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = vendaSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const venda = await registrarVendaComLedger(dbUser.tenantId, dbUser.id, parsed.data)
  return NextResponse.json(venda, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 20)

  const [vendas, total] = await Promise.all([
    prisma.venda.findMany({
      where: { tenantId: dbUser.tenantId },
      include: { itens: { include: { produto: true } }, cliente: true },
      orderBy: { vendidoEm: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.venda.count({ where: { tenantId: dbUser.tenantId } }),
  ])

  return NextResponse.json({ vendas, total, page, limit })
}
