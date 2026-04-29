import { useState, useEffect, useCallback } from 'react'
import type { Category } from '../types'
import { DEFAULT_CATEGORIES } from '../defaultCategories'

const STORAGE_KEY = 'newsfeed_categories'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return DEFAULT_CATEGORIES
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
  }, [categories])

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

  const resetToDefaults = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES)
  }, [])

  return { categories, addCategory, updateCategory, deleteCategory, resetToDefaults }
}
