import { useState, useEffect, useCallback } from 'react'
import type { SaveLabel } from '../types'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'newsfeed_save_labels'

async function loadFromSupabase(userId: string): Promise<SaveLabel[] | null> {
  const { data, error } = await supabase
    .from('save_labels')
    .select('id,name,color')
    .eq('user_id', userId)
  if (error || !data || data.length === 0) return null
  return data as SaveLabel[]
}

async function saveToSupabase(labels: SaveLabel[], userId: string) {
  await supabase.from('save_labels').delete().eq('user_id', userId)
  if (labels.length === 0) return
  await supabase.from('save_labels').insert(
    labels.map(l => ({ id: l.id, user_id: userId, name: l.name, color: l.color }))
  )
}

export function useSaveLabels(userId: string | null) {
  const [labels, setLabels] = useState<SaveLabel[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels))
  }, [labels])

  useEffect(() => {
    if (!userId) { setSynced(false); return }
    loadFromSupabase(userId).then(remote => {
      if (remote) setLabels(remote)
      else saveToSupabase(labels, userId)
      setSynced(true)
    })
  }, [userId])

  useEffect(() => {
    if (!userId || !synced) return
    saveToSupabase(labels, userId)
  }, [labels, userId, synced])

  const addLabel = useCallback((l: Omit<SaveLabel, 'id'>) => {
    const id = `lbl_${Date.now()}`
    setLabels(prev => [...prev, { ...l, id }])
    return id
  }, [])

  const updateLabel = useCallback((id: string, updates: Partial<SaveLabel>) => {
    setLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }, [])

  const deleteLabel = useCallback((id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id))
  }, [])

  return { labels, addLabel, updateLabel, deleteLabel }
}
