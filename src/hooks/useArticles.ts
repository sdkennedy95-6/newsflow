import { useState, useEffect, useCallback, useRef } from 'react'
import type { Article, Category, RSSResponse, RSSItem } from '../types'
import { supabase } from '../lib/supabase'

const READ_KEY = 'newsfeed_read'
const RSS2JSON = 'https://api.rss2json.com/v1/api.json'
const CACHE_TTL = 5 * 60 * 1000

interface CacheEntry { articles: Article[]; fetchedAt: number }

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

function extractImage(item: RSSItem): string | null {
  if (item.thumbnail?.startsWith('http')) return item.thumbnail
  if (item.enclosure?.link && item.enclosure.type?.startsWith('image')) return item.enclosure.link
  const match = item.content?.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match ? match[1] : null
}

function extractAudio(item: RSSItem): string | null {
  if (item.enclosure?.link && item.enclosure.type?.startsWith('audio')) return item.enclosure.link
  return null
}

function itemToArticle(item: RSSItem, categoryId: string, feedName: string, savedIds: Set<string>, readIds: Set<string>): Article {
  const id = item.guid || item.link || `${categoryId}_${item.title}`
  const audioUrl = extractAudio(item) ?? undefined
  return {
    id,
    title: stripHtml(item.title || ''),
    description: stripHtml(item.description || item.content || '').slice(0, 300),
    link: item.link,
    pubDate: item.pubDate,
    thumbnail: extractImage(item),
    author: item.author || '',
    categoryId,
    feedName,
    isRead: readIds.has(id),
    isSaved: savedIds.has(id),
    contentType: audioUrl ? 'podcast' : 'article',
    audioUrl,
    duration: item.itunes_duration || undefined,
  }
}

async function fetchFeed(rssUrl: string, categoryId: string, feedName: string, savedIds: Set<string>, readIds: Set<string>): Promise<Article[]> {
  const res = await fetch(`${RSS2JSON}?rss_url=${encodeURIComponent(rssUrl)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: RSSResponse = await res.json()
  if (data.status !== 'ok') throw new Error('RSS error')
  return data.items.map(item => itemToArticle(item, categoryId, feedName, savedIds, readIds))
}

function articleToRow(a: Article, userId: string) {
  return {
    id: a.id, user_id: userId, title: a.title, description: a.description,
    link: a.link, pub_date: a.pubDate, thumbnail: a.thumbnail,
    author: a.author, category_id: a.categoryId, feed_name: a.feedName,
    label_id: a.labelId ?? null,
  }
}

function rowToArticle(r: any): Article {
  return {
    id: r.id, title: r.title, description: r.description || '',
    link: r.link, pubDate: r.pub_date || '', thumbnail: r.thumbnail || null,
    author: r.author || '', categoryId: r.category_id || '',
    feedName: r.feed_name || '', isRead: false, isSaved: true,
    labelId: r.label_id || undefined,
  }
}

export function useArticles(_categories: Category[], userId: string | null) {
  const [articlesByCategory, setArticlesByCategory] = useState<Record<string, Article[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [supabaseSaved, setSupabaseSaved] = useState<Article[]>([])
  const cache = useRef<Record<string, CacheEntry>>({})

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  // maps article id → labelId for quick lookup when decorating RSS articles
  const [savedLabelMap, setSavedLabelMap] = useState<Record<string, string | undefined>>({})
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')) } catch { return new Set() }
  })

  // Load saved IDs from Supabase on login
  useEffect(() => {
    if (!userId) {
      setSavedIds(new Set())
      setSavedLabelMap({})
      setSupabaseSaved([])
      return
    }
    supabase.from('saved_articles').select('*').eq('user_id', userId).then(({ data, error }) => {
      if (error) { console.error('Failed to load saved articles:', error.message); return }
      const rows = data ?? []
      setSavedIds(new Set(rows.map((r: any) => r.id)))
      setSupabaseSaved(rows.map(rowToArticle))
      const labelMap: Record<string, string | undefined> = {}
      rows.forEach((r: any) => { if (r.label_id) labelMap[r.id] = r.label_id })
      setSavedLabelMap(labelMap)
    })
  }, [userId])

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify([...readIds]))
  }, [readIds])

  const fetchCategory = useCallback(async (category: Category, force = false) => {
    const cached = cache.current[category.id]
    if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setArticlesByCategory(prev => ({ ...prev, [category.id]: cached.articles }))
      return
    }
    setLoading(prev => ({ ...prev, [category.id]: true }))
    setErrors(prev => { const n = { ...prev }; delete n[category.id]; return n })

    try {
      const results = await Promise.allSettled(
        category.feeds.map(feed => fetchFeed(feed.url, category.id, feed.name, savedIds, readIds))
      )
      const articles: Article[] = []
      const failed: string[] = []
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') articles.push(...r.value)
        else failed.push(category.feeds[i].name)
      })

      const seen = new Set<string>()
      const deduped = articles
        .filter(a => { if (seen.has(a.link)) return false; seen.add(a.link); return true })
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .map(a => ({ ...a, isSaved: savedIds.has(a.id), labelId: savedLabelMap[a.id] }))

      cache.current[category.id] = { articles: deduped, fetchedAt: Date.now() }
      setArticlesByCategory(prev => ({ ...prev, [category.id]: deduped }))

      if (failed.length === category.feeds.length) {
        setErrors(prev => ({ ...prev, [category.id]: 'Failed to load feeds. Check your connection.' }))
      }
    } catch {
      setErrors(prev => ({ ...prev, [category.id]: 'Unexpected error loading feeds.' }))
    } finally {
      setLoading(prev => ({ ...prev, [category.id]: false }))
    }
  }, [savedIds, readIds, savedLabelMap])

  const markRead = useCallback((articleId: string) => {
    setReadIds(prev => new Set([...prev, articleId]))
    setArticlesByCategory(prev => {
      const updated = { ...prev }
      for (const catId in updated) {
        updated[catId] = updated[catId].map(a => a.id === articleId ? { ...a, isRead: true } : a)
      }
      return updated
    })
  }, [])

  const saveArticle = useCallback((articleId: string, articleData: Article, labelId?: string) => {
    setSavedIds(prev => new Set([...prev, articleId]))
    setSavedLabelMap(prev => ({ ...prev, [articleId]: labelId }))
    setArticlesByCategory(prev => {
      const updated = { ...prev }
      for (const catId in updated) {
        updated[catId] = updated[catId].map(a =>
          a.id === articleId ? { ...a, isSaved: true, labelId } : a
        )
      }
      return updated
    })
    if (userId) {
      const saved = { ...articleData, isSaved: true, labelId }
      setSupabaseSaved(prev => [...prev.filter(a => a.id !== articleId), saved])
      // Delete then insert — avoids needing an UPDATE RLS policy (upsert requires it)
      ;(async () => {
        await supabase.from('saved_articles').delete().eq('id', articleId).eq('user_id', userId)
        const { error } = await supabase.from('saved_articles').insert(articleToRow(saved, userId))
        if (error) console.error('Failed to persist saved article:', error.message, error.details)
      })()
    }
  }, [userId])

  const unsaveArticle = useCallback((articleId: string) => {
    setSavedIds(prev => { const n = new Set(prev); n.delete(articleId); return n })
    setSavedLabelMap(prev => { const n = { ...prev }; delete n[articleId]; return n })
    setArticlesByCategory(prev => {
      const updated = { ...prev }
      for (const catId in updated) {
        updated[catId] = updated[catId].map(a =>
          a.id === articleId ? { ...a, isSaved: false, labelId: undefined } : a
        )
      }
      return updated
    })
    if (userId) {
      setSupabaseSaved(prev => prev.filter(a => a.id !== articleId))
      supabase.from('saved_articles').delete().eq('id', articleId).eq('user_id', userId)
        .then(({ error }) => { if (error) console.error('Failed to unsave article:', error.message) })
    }
  }, [userId])

  // Deletes old saved articles from Supabase DB (used when protectSaved is off)
  const purgeOldSaved = useCallback((days: number) => {
    if (!userId || days <= 0) return
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const toDelete = supabaseSaved.filter(a => {
      try { return new Date(a.pubDate).getTime() < cutoff } catch { return false }
    })
    if (toDelete.length === 0) return
    const deleteIds = toDelete.map(a => a.id)
    supabase.from('saved_articles').delete().eq('user_id', userId).in('id', deleteIds).then()
    setSupabaseSaved(prev => prev.filter(a => !deleteIds.includes(a.id)))
    setSavedIds(prev => { const n = new Set(prev); deleteIds.forEach(id => n.delete(id)); return n })
    setSavedLabelMap(prev => {
      const n = { ...prev }
      deleteIds.forEach(id => delete n[id])
      return n
    })
  }, [userId, supabaseSaved])

  const allArticles = Object.values(articlesByCategory).flat()
    .map(a => ({ ...a, isSaved: savedIds.has(a.id), labelId: savedLabelMap[a.id] }))

  const savedArticles = userId ? supabaseSaved : allArticles.filter(a => a.isSaved)

  return { articlesByCategory, allArticles, savedArticles, loading, errors, fetchCategory, markRead, saveArticle, unsaveArticle, purgeOldSaved }
}
