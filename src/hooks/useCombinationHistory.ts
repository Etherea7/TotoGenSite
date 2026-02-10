'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, type GeneratedComboRecord } from '@/lib/combination-db'

export function useCombinationHistory() {
  const [history, setHistory] = useState<GeneratedComboRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    try {
      const records = await db.generatedCombos
        .orderBy('timestamp')
        .reverse()
        .toArray()
      setHistory(records)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const addRecord = useCallback(async (numbers: number[][], strategy: string) => {
    try {
      await db.generatedCombos.add({
        numbers,
        strategy,
        timestamp: new Date(),
        count: numbers.length,
      })
      await loadHistory()
    } catch (err) {
      console.error('Failed to save record:', err)
    }
  }, [loadHistory])

  const deleteRecord = useCallback(async (id: number) => {
    try {
      await db.generatedCombos.delete(id)
      await loadHistory()
    } catch (err) {
      console.error('Failed to delete record:', err)
    }
  }, [loadHistory])

  const clearAll = useCallback(async () => {
    try {
      await db.generatedCombos.clear()
      setHistory([])
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }, [])

  return { history, isLoading, addRecord, deleteRecord, clearAll }
}
