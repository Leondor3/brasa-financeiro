import { formatBRL } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number
  icon: LucideIcon
  variant?: 'default' | 'green' | 'red' | 'yellow'
  sublabel?: string
}

const variants = {
  default: 'bg-white border-gray-200',
  green: 'bg-green-50 border-green-200',
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
}

const iconVariants = {
  default: 'text-gray-500',
  green: 'text-green-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
}

export function MetricCard({ label, value, icon: Icon, variant = 'default', sublabel }: MetricCardProps) {
  return (
    <div className={cn('rounded-2xl border p-4 flex flex-col gap-2', variants[variant])}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <Icon size={16} className={iconVariants[variant]} />
      </div>
      <span className="text-2xl font-bold text-gray-900 leading-none">
        {formatBRL(value)}
      </span>
      {sublabel && <span className="text-xs text-gray-500">{sublabel}</span>}
    </div>
  )
}
