export function formatBRL(value: number | string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

export function parseBRL(value: string): number {
  return Number(value.replace(/[R$\s.]/g, '').replace(',', '.'))
}
