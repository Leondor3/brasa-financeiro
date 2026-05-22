import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEstoqueAtual } from '@/lib/utils/lucro'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: dbUser } = await supabase.from('users').select('tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const estoque = await getEstoqueAtual(dbUser.tenantId, supabase)
    return NextResponse.json(estoque)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
