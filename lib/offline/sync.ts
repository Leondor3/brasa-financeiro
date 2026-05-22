import { offlineDb } from './db'

const ENDPOINT_MAP: Record<string, string> = {
  CRIAR_VENDA: '/api/vendas',
  CRIAR_COMPRA: '/api/compras',
  PAGAR_FIADO: '/api/fiado',
}

export async function syncPendingMutations() {
  const pending = await offlineDb.pendingMutations
    .where('synced')
    .equals(0)
    .toArray()

  for (const mutation of pending) {
    const endpoint = ENDPOINT_MAP[mutation.tipo]
    if (!endpoint) continue

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation.payload),
      })

      if (res.ok) {
        await offlineDb.pendingMutations.update(mutation.id!, { synced: true })
      } else {
        await offlineDb.pendingMutations.update(mutation.id!, {
          retries: mutation.retries + 1,
        })
      }
    } catch {
      await offlineDb.pendingMutations.update(mutation.id!, {
        retries: mutation.retries + 1,
      })
    }
  }
}

export async function enqueue(tipo: string, payload: unknown) {
  await offlineDb.pendingMutations.add({
    tipo,
    payload,
    createdAt: new Date(),
    synced: false,
    retries: 0,
  })
}

export async function getPendingCount() {
  return offlineDb.pendingMutations.where('synced').equals(0).count()
}
