import Dexie, { type EntityTable } from 'dexie'

export interface GeneratedComboRecord {
  id?: number
  numbers: number[][]
  strategy: string
  timestamp: Date
  count: number
}

const db = new Dexie('TotoGeneratorDB') as Dexie & {
  generatedCombos: EntityTable<GeneratedComboRecord, 'id'>
}

db.version(1).stores({
  generatedCombos: '++id, strategy, timestamp',
})

export { db }
