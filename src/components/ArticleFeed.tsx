import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle, Newspaper, Search } from 'lucide-react'
import type { Article, Category, KeywordFilter } from '../types'
import { ArticleCard } from './ArticleCard'
import { FILTER_COLOR_STYLES } from './KeywordFilterModal'

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
  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => {
    setVisibleCount(20)
  }, [categoryId])

  const category = categories.find(c => c.id === categoryId)
  const isKeywordView = !!activeKeywordFilter
  const showCategory = categoryId === null || categoryId === 'saved' || isKeywordView

  const filtered = articles.filter(a => {
    const text = `${a.title} ${a.description}`.toLowerCase()
    if (activeKeywordFilter) {
      return activeKeywordFilter.keywords.some(kw => text.includes(kw.toLowerCase()))
    }
    if (!searchQuery) return true
    return text.includes(searchQuery.toLowerCase())
  })

  const visible = filtered.slice(0, visibleCount)

  const title = isKeywordView
    ? activeKeywordFilter!.name
    : categoryId === null
    ? 'All Articles'
    : categoryId === 'saved'
    ? 'Saved Articles'
    : category
    ? `${category.icon} ${category.name}`
    : 'Articles'

  const filterStyles = isKeywordView
    ? FILTER_COLOR_STYLES[activeKeywordFilter!.color] ?? FILTER_COLOR_STYLES['violet']
    : null

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Feed header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {isKeywordView && <Search size={18} className="text-slate-400 flex-shrink-0" />}
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          </div>

          {/* Keyword chips */}
          {isKeywordView && activeKeywordFilter!.keywords.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="text-xs text-slate-400">matching:</span>
              {activeKeywordFilter!.keywords.map(kw => (
                <span key={kw} className={`text-xs px-2 py-0.5 rounded-full font-medium ${filterStyles!.badge}`}>
                  {kw}
                </span>
              ))}
            </div>
          )}

          {!loading && (
            <p className="text-sm text-slate-500 mt-1">
              {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
              {searchQuery && !isKeywordView && ` matching "${searchQuery}"`}
            </p>
          )}
        </div>

        {categoryId !== 'saved' && !isKeywordView && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {/* Error banner */}
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
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Newspaper size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">
            {isKeywordView
              ? 'No articles match these keywords yet — try refreshing'
              : searchQuery
              ? 'No articles match your search'
              : 'No articles yet'}
          </p>
          {!searchQuery && categoryId !== 'saved' && !isKeywordView && (
            <button onClick={onRefresh} className="mt-3 text-sm text-blue-600 hover:underline">
              Load articles
            </button>
          )}
          {isKeywordView && (
            <button onClick={onRefresh} className="mt-3 text-sm text-blue-600 hover:underline">
              Refresh all categories
            </button>
          )}
        </div>
      )}

      {/* Article grid */}
      {visible.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map(article => {
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
            })}
          </div>

          {visibleCount < filtered.length && (
            <div className="text-center mt-6">
              <button
                onClick={() => setVisibleCount(c => c + 20)}
                className="px-5 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
