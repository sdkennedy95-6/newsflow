import { useState, useEffect, useCallback } from 'react'
import type { KeywordFilter } from '../types'

const STORAGE_KEY = 'newsfeed_keyword_filters'

const FILTER_COLORS = [
  'violet', 'rose', 'sky', 'emerald', 'amber', 'fuchsia', 'lime', 'orange',
]

export { FILTER_COLORS }

export function useKeywordFilters() {
  const [filters, setFilters] = useState<KeywordFilter[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  const addFilter = useCallback((f: Omit<KeywordFilter, 'id'>) => {
    const id = `kf_${Date.now()}`
    setFilters(prev => [...prev, { ...f, id }])
    return id
  }, [])

  const updateFilter = useCallback((id: string, updates: Partial<KeywordFilter>) => {
    setFilters(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const deleteFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id))
  }, [])

  return { filters, addFilter, updateFilter, deleteFilter }
}
