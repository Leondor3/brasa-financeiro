export function calcularMargem(precoVenda: number, precoCusto: number): number {
  if (precoVenda === 0) return 0
  return ((precoVenda - precoCusto) / precoVenda) * 100
}
