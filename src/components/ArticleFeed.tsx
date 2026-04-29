import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle, Newspaper, Search, ArrowUpDown, Layers, Bookmark } from 'lucide-react'
import type { Article, Category, KeywordFilter } from '../types'
import { ArticleCard } from './ArticleCard'
import { FILTER_COLOR_STYLES } from './KeywordFilterModal'

type SortOrder = 'newest' | 'oldest'

const PREFS_KEY = 'newsfeed_feed_prefs'

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') } catch { return {} }
}

function savePrefs(prefs: object) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

interface Props {
  categoryId: string | null
  categories: Category[]
  articles: Article[]
  loading: boolean
  error: string | undefined
  onRefresh: () => void
  onMarkRead: (id: string) => void
  onToggleSaved: (id: string) => void
  searchQuery: string
  activeKeywordFilter?: KeywordFilter | null
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function GroupHeader({ feedName, count }: { feedName: string; count: number }) {
  return (
    <div className="col-span-full flex items-center gap-3 mt-2 mb-1 first:mt-0">
      <span className="text-sm font-semibold text-slate-700">{feedName}</span>
      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{count}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

export function ArticleFeed({
  categoryId,
  categories,
  articles,
  loading,
  error,
  onRefresh,
  onMarkRead,
  onToggleSaved,
  searchQuery,
  activeKeywordFilter,
}: Props) {
  const prefs = loadPrefs()
  const [sortOrder, setSortOrder] = useState<SortOrder>(prefs.sortOrder ?? 'newest')
  const [groupByFeed, setGroupByFeed] = useState<boolean>(prefs.groupByFeed ?? false)
  const [savedFirst, setSavedFirst] = useState<boolean>(prefs.savedFirst ?? false)
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => { setVisibleCount(20) }, [categoryId])

  // Persist prefs
  useEffect(() => {
    savePrefs({ sortOrder, groupByFeed, savedFirst })
  }, [sortOrder, groupByFeed, savedFirst])

  const category = categories.find(c => c.id === categoryId)
  const isKeywordView = !!activeKeywordFilter
  const showCategory = categoryId === null || categoryId === 'saved' || isKeywordView
  const isSavedView = categoryId === 'saved'

  // 1. Filter
  const filtered = articles.filter(a => {
    const text = `${a.title} ${a.description}`.toLowerCase()
    if (activeKeywordFilter) return activeKeywordFilter.keywords.some(kw => text.includes(kw.toLowerCase()))
    if (!searchQuery) return true
    return text.includes(searchQuery.toLowerCase())
  })

  // 2. Sort
  const sorted = [...filtered].sort((a, b) => {
    const diff = new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    return sortOrder === 'newest' ? diff : -diff
  })

  // 3. Saved first (only when not in the saved view itself)
  const arranged = savedFirst && !isSavedView
    ? [...sorted.filter(a => a.isSaved), ...sorted.filter(a => !a.isSaved)]
    : sorted

  // 4. Group by feed
  type FeedGroup = { feedName: string; articles: Article[] }
  const groups: FeedGroup[] = groupByFeed
    ? Object.entries(
        arranged.reduce<Record<string, Article[]>>((acc, a) => {
          const key = a.feedName || 'Unknown'
          ;(acc[key] ??= []).push(a)
          return acc
        }, {})
      ).map(([feedName, articles]) => ({ feedName, articles }))
    : [{ feedName: '', articles: arranged.slice(0, visibleCount) }]

  const totalCount = arranged.length

  const title = isKeywordView
    ? activeKeywordFilter!.name
    : categoryId === null ? 'All Articles'
    : isSavedView ? 'Saved Articles'
    : category ? `${category.icon} ${category.name}`
    : 'Articles'

  const filterStyles = isKeywordView
    ? FILTER_COLOR_STYLES[activeKeywordFilter!.color] ?? FILTER_COLOR_STYLES['violet']
    : null

  const renderCard = (article: Article) => {
    const cat = categories.find(c => c.id === article.categoryId)
    return (
      <ArticleCard
        key={article.id}
        article={article}
        category={cat}
        onMarkRead={onMarkRead}
        onToggleSaved={onToggleSaved}
        showCategory={showCategory}
        highlightKeywords={isKeywordView ? activeKeywordFilter!.keywords : undefined}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Feed header */}
      <div className="flex items-start justify-between mb-3 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isKeywordView && <Search size={18} className="text-slate-400 flex-shrink-0" />}
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          </div>
          {isKeywordView && activeKeywordFilter!.keywords.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="text-xs text-slate-400">matching:</span>
              {activeKeywordFilter!.keywords.map(kw => (
                <span key={kw} className={`text-xs px-2 py-0.5 rounded-full font-medium ${filterStyles!.badge}`}>{kw}</span>
              ))}
            </div>
          )}
          {!loading && (
            <p className="text-sm text-slate-500 mt-0.5">
              {totalCount} {totalCount === 1 ? 'article' : 'articles'}
              {searchQuery && !isKeywordView && ` matching "${searchQuery}"`}
            </p>
          )}
        </div>

        {categoryId !== 'saved' && !isKeywordView && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {/* Controls toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <ToggleButton
          active={sortOrder === 'oldest'}
          onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
          icon={<ArrowUpDown size={12} />}
          label={sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
        />
        <ToggleButton
          active={groupByFeed}
          onClick={() => setGroupByFeed(v => !v)}
          icon={<Layers size={12} />}
          label="Group by feed"
        />
        {!isSavedView && (
          <ToggleButton
            active={savedFirst}
            onClick={() => setSavedFirst(v => !v)}
            icon={<Bookmark size={12} />}
            label="Saved first"
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4 border border-red-100">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && articles.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Newspaper size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">
            {isKeywordView ? 'No articles match these keywords yet — try refreshing'
              : searchQuery ? 'No articles match your search'
              : 'No articles yet'}
          </p>
          {!searchQuery && !isSavedView && !isKeywordView && (
            <button onClick={onRefresh} className="mt-3 text-sm text-blue-600 hover:underline">Load articles</button>
          )}
          {isKeywordView && (
            <button onClick={onRefresh} className="mt-3 text-sm text-blue-600 hover:underline">Refresh all categories</button>
          )}
        </div>
      )}

      {/* Articles — flat or grouped */}
      {totalCount > 0 && !groupByFeed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups[0].articles.map(renderCard)}
          </div>
          {visibleCount < totalCount && (
            <div className="text-center mt-6">
              <button
                onClick={() => setVisibleCount(c => c + 20)}
                className="px-5 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                Load more ({totalCount - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {totalCount > 0 && groupByFeed && (
        <div className="space-y-2">
          {groups.map(group => (
            <div key={group.feedName}>
              <GroupHeader feedName={group.feedName} count={group.articles.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.articles.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
