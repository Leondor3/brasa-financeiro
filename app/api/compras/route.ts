import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/client'
import { registrarCompraComLedger } from '@/lib/utils/lucro'

const compraSchema = z.object({
  fornecedor: z.string().optional(),
  notas: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string(),
    quantidade: z.number().positive(),
    precoUnitario: z.number().positive(),
  })).min(1),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = compraSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const compra = await registrarCompraComLedger(dbUser.tenantId, parsed.data)
  return NextResponse.json(compra, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const compras = await prisma.compra.findMany({
    where: { tenantId: dbUser.tenantId },
    include: { itens: { include: { produto: true } } },
    orderBy: { dataCompra: 'desc' },
    take: 50,
  })

  return NextResponse.json(compras)
}
