import { useState, useEffect, useCallback, useRef } from 'react'
import type { Article, Category, RSSResponse, RSSItem } from '../types'

const SAVED_KEY = 'newsfeed_saved'
const READ_KEY = 'newsfeed_read'
const RSS2JSON = 'https://api.rss2json.com/v1/api.json'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  articles: Article[]
  fetchedAt: number
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

function extractImage(item: RSSItem): string | null {
  if (item.thumbnail && item.thumbnail.startsWith('http')) return item.thumbnail
  if (item.enclosure?.link && item.enclosure.type?.startsWith('image')) return item.enclosure.link
  const match = item.content?.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (match) return match[1]
  return null
}

function itemToArticle(item: RSSItem, categoryId: string, feedName: string, savedIds: Set<string>, readIds: Set<string>): Article {
  const id = item.guid || item.link || `${categoryId}_${item.title}`
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
  }
}

async function fetchFeed(rssUrl: string, categoryId: string, feedName: string, savedIds: Set<string>, readIds: Set<string>): Promise<Article[]> {
  const url = `${RSS2JSON}?rss_url=${encodeURIComponent(rssUrl)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: RSSResponse = await res.json()
  if (data.status !== 'ok') throw new Error('RSS error')
  return data.items.map(item => itemToArticle(item, categoryId, feedName, savedIds, readIds))
}

export function useArticles(categories: Category[]) {
  const [articlesByCategory, setArticlesByCategory] = useState<Record<string, Article[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const cache = useRef<Record<string, CacheEntry>>({})

  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')) } catch { return new Set() }
  })
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')) } catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...savedIds]))
  }, [savedIds])

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

      // Sort by date descending, deduplicate by link
      const seen = new Set<string>()
      const deduped = articles
        .filter(a => { if (seen.has(a.link)) return false; seen.add(a.link); return true })
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

      cache.current[category.id] = { articles: deduped, fetchedAt: Date.now() }
      setArticlesByCategory(prev => ({ ...prev, [category.id]: deduped }))

      if (failed.length === category.feeds.length) {
        setErrors(prev => ({ ...prev, [category.id]: 'Failed to load feeds. Check your connection.' }))
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [category.id]: 'Unexpected error loading feeds.' }))
    } finally {
      setLoading(prev => ({ ...prev, [category.id]: false }))
    }
  }, [savedIds, readIds])

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

  const toggleSaved = useCallback((articleId: string) => {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(articleId)) next.delete(articleId)
      else next.add(articleId)
      return next
    })
    setArticlesByCategory(prev => {
      const updated = { ...prev }
      for (const catId in updated) {
        updated[catId] = updated[catId].map(a =>
          a.id === articleId ? { ...a, isSaved: !a.isSaved } : a
        )
      }
      return updated
    })
  }, [])

  const allArticles = Object.values(articlesByCategory).flat()
  const savedArticles = allArticles.filter(a => a.isSaved)

  return {
    articlesByCategory,
    allArticles,
    savedArticles,
    loading,
    errors,
    fetchCategory,
    markRead,
    toggleSaved,
  }
}
