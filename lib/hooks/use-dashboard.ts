'use client'

import { useQuery } from '@tanstack/react-query'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((r) => r.json()),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
