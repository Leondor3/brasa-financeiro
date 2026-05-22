import Dexie, { type Table } from 'dexie'

export interface PendingMutation {
  id?: number
  tipo: string
  payload: unknown
  createdAt: Date
  synced: boolean
  retries: number
}

export class CocadaOfflineDB extends Dexie {
  pendingMutations!: Table<PendingMutation>

  constructor() {
    super('cocada_offline')
    this.version(1).stores({
      pendingMutations: '++id, tipo, createdAt, synced',
    })
  }
}

export const offlineDb = new CocadaOfflineDB()
