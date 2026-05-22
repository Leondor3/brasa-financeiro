import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const clienteSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: dbUser } = await supabase.from('users').select('tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('tenantId', dbUser.tenantId)
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = clienteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: dbUser } = await supabase.from('users').select('tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('clientes')
      .insert({ tenantId: dbUser.tenantId, ...parsed.data })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
