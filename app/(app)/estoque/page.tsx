'use client'

import { useQuery } from '@tanstack/react-query'
import { formatBRL } from '@/lib/utils/currency'
import { calcularMargem } from '@/lib/utils/lucro'
import { Package } from 'lucide-react'

interface ItemEstoque {
  id: string
  nome: string
  quantidade: number
  precoVenda: number
  precoCusto: number
  rendimento: number
  faturamentoPotencial: number
  lucroPotencial: number
}

export default function EstoquePage() {
  const { data: estoque = [], isLoading } = useQuery<ItemEstoque[]>({
    queryKey: ['estoque'],
    queryFn: () => fetch('/api/estoque').then((r) => r.json()),
  })

  const totalFaturamento = estoque.reduce((s, i) => s + i.faturamentoPotencial, 0)
  const totalLucro = estoque.reduce((s, i) => s + i.lucroPotencial, 0)

  if (isLoading) {
    return <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
      ))}
    </div>
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Estoque</h1>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-green-700 font-medium">Pode faturar</p>
          <p className="text-xl font-bold text-green-900">{formatBRL(totalFaturamento)}</p>
        </div>
        <div>
          <p className="text-xs text-green-700 font-medium">Lucro estimado</p>
          <p className="text-xl font-bold text-green-700">{formatBRL(totalLucro)}</p>
        </div>
      </div>

      {estoque.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Package size={48} className="text-gray-300" />
          <p className="text-gray-500">Nenhum item em estoque</p>
        </div>
      )}

      <div className="space-y-2">
        {estoque.map((item) => {
          const margem = calcularMargem(item.precoVenda, item.precoCusto)
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">{item.nome}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantidade} unid × R$ {item.precoVenda} = <span className="font-semibold text-green-600">{formatBRL(item.faturamentoPotencial)}</span>
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${margem >= 40 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {margem.toFixed(0)}% margem
                </span>
              </div>
              <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(margem, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
