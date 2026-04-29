import { useState, useEffect, useCallback } from 'react'
import type { KeywordFilter } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'newsfeed_keyword_filters'

const FILTER_COLORS = ['violet', 'rose', 'sky', 'emerald', 'amber', 'fuchsia', 'lime', 'orange']
export { FILTER_COLORS }

async function loadFromSupabase(userId: string): Promise<KeywordFilter[] | null> {
  const { data, error } = await supabase
    .from('keyword_filters')
    .select('id,name,keywords,color')
    .eq('user_id', userId)
  if (error || !data) return null
  if (data.length === 0) return null
  return data as KeywordFilter[]
}

async function saveToSupabase(filters: KeywordFilter[], userId: string) {
  await supabase.from('keyword_filters').delete().eq('user_id', userId)
  if (filters.length === 0) return
  await supabase.from('keyword_filters').insert(
    filters.map(f => ({ id: f.id, user_id: userId, name: f.name, keywords: f.keywords, color: f.color }))
  )
}

export function useKeywordFilters(userId: string | null) {
  const [filters, setFilters] = useState<KeywordFilter[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  useEffect(() => {
    if (!userId) { setSynced(false); return }
    loadFromSupabase(userId).then(remote => {
      if (remote) setFilters(remote)
      else saveToSupabase(filters, userId)
      setSynced(true)
    })
  }, [userId])

  useEffect(() => {
    if (!userId || !synced) return
    saveToSupabase(filters, userId)
  }, [filters, userId, synced])

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
