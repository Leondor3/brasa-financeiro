import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = compraSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: dbUser } = await supabase.from('users').select('tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const compra = await registrarCompraComLedger(dbUser.tenantId, parsed.data, supabase)
    return NextResponse.json(compra, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: dbUser } = await supabase.from('users').select('tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('compras')
      .select('*,compra_itens(*,produtos(*))')
      .eq('tenantId', dbUser.tenantId)
      .order('dataCompra', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
