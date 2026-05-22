import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/db/queries/dashboard'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: dbUser } = await supabase
      .from('users')
      .select('id,tenantId')
      .eq('id', user.id)
      .single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const data = await getDashboardData(dbUser.tenantId, supabase)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[dashboard] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
