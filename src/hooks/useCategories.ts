import { useState, useEffect, useCallback } from 'react'
import type { Category } from '../types'
import { DEFAULT_CATEGORIES } from '../defaultCategories'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'newsfeed_categories'

async function loadFromSupabase(userId: string): Promise<Category[] | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id,name,color,icon,feeds,is_default')
    .eq('user_id', userId)
  if (error || !data) return null
  if (data.length === 0) return null
  return data.map(r => ({ id: r.id, name: r.name, color: r.color, icon: r.icon, feeds: r.feeds, isDefault: r.is_default }))
}

async function saveToSupabase(categories: Category[], userId: string) {
  await supabase.from('categories').delete().eq('user_id', userId)
  if (categories.length === 0) return
  await supabase.from('categories').insert(
    categories.map(c => ({ id: c.id, user_id: userId, name: c.name, color: c.color, icon: c.icon, feeds: c.feeds, is_default: c.isDefault ?? false }))
  )
}

export function useCategories(userId: string | null) {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return DEFAULT_CATEGORIES
  })
  const [synced, setSynced] = useState(false)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
  }, [categories])

  // On login: load from Supabase (source of truth)
  useEffect(() => {
    if (!userId) { setSynced(false); return }
    loadFromSupabase(userId).then(remote => {
      if (remote) {
        setCategories(remote)
      } else {
        // First login — upload existing local categories
        saveToSupabase(categories, userId)
      }
      setSynced(true)
    })
  }, [userId])

  // Sync mutations to Supabase
  useEffect(() => {
    if (!userId || !synced) return
    saveToSupabase(categories, userId)
  }, [categories, userId, synced])

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const id = `cat_${Date.now()}`
    setCategories(prev => [...prev, { ...cat, id }])
    return id
  }, [])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  return { categories, addCategory, updateCategory, deleteCategory }
}
