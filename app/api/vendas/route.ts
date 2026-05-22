import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = vendaSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: dbUser } = await supabase.from('users').select('id,tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const venda = await registrarVendaComLedger(dbUser.tenantId, dbUser.id, parsed.data, supabase)
    return NextResponse.json(venda, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[vendas] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: dbUser } = await supabase.from('users').select('id,tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 20)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: vendas, count, error } = await supabase
      .from('vendas')
      .select('*,item_vendas(*,produtos(*)),clientes(*)', { count: 'exact' })
      .eq('tenantId', dbUser.tenantId)
      .order('vendidoEm', { ascending: false })
      .range(from, to)

    if (error) throw error
    return NextResponse.json({ vendas, total: count ?? 0, page, limit })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
