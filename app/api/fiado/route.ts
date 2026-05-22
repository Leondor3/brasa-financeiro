import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const pagamentoSchema = z.object({
  fiadoId: z.string(),
  valor: z.number().positive(),
  notas: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: dbUser } = await supabase.from('users').select('tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'ABERTO'

    const { data, error } = await supabase
      .from('fiados')
      .select('*,clientes(*),vendas(*,item_vendas(*,produtos(*))),fiado_pagamentos(*)')
      .eq('tenantId', dbUser.tenantId)
      .eq('status', status)
      .order('criadoEm', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = pagamentoSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: dbUser } = await supabase.from('users').select('tenantId').eq('id', user.id).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { fiadoId, valor, notas } = parsed.data

    const { data: fiado } = await supabase
      .from('fiados')
      .select('id,valorOriginal,valorPago')
      .eq('id', fiadoId)
      .eq('tenantId', dbUser.tenantId)
      .single()
    if (!fiado) return NextResponse.json({ error: 'Fiado não encontrado' }, { status: 404 })

    await supabase.from('fiado_pagamentos').insert({ fiadoId, valor, notas: notas ?? null })

    const novoValorPago = Number(fiado.valorPago) + valor
    const novoStatus = novoValorPago >= Number(fiado.valorOriginal) ? 'QUITADO' : 'PARCIAL'

    const { data: fiadoAtualizado, error: updateErr } = await supabase
      .from('fiados')
      .update({
        valorPago: novoValorPago,
        status: novoStatus,
        quitadoEm: novoStatus === 'QUITADO' ? new Date().toISOString() : null,
      })
      .eq('id', fiadoId)
      .select()
      .single()

    if (updateErr) throw updateErr

    await supabase.from('ledger_entries').insert({
      tenantId: dbUser.tenantId,
      tipo: 'RECEBIMENTO_FIADO',
      direcao: 'CREDITO',
      valor,
      descricao: 'Recebimento de fiado',
      referenciaId: fiadoId,
      referenciaTipo: 'fiado',
    })

    return NextResponse.json(fiadoAtualizado)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
