import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle, Newspaper, Search, ArrowUpDown, Layers, Bookmark, Check } from 'lucide-react'
import type { Article, Category, KeywordFilter, SaveLabel } from '../types'
import { ArticleCard } from './ArticleCard'
import { FILTER_COLOR_STYLES } from './KeywordFilterModal'
import { PurgeControl } from './PurgeControl'

type SortOrder = 'newest' | 'oldest'

const PREFS_KEY = 'newsfeed_feed_prefs'
function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') } catch { return {} } }
function savePrefs(prefs: object) { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) }

interface Props {
  categoryId: string | null
  categories: Category[]
  articles: Article[]
  loading: boolean
  error: string | undefined
  onRefresh: () => void
  onMarkRead: (id: string) => void
  labels: SaveLabel[]
  onSaveArticle: (id: string, labelId?: string) => void
  onUnsaveArticle: (id: string) => void
  onCreateLabel: () => void
  onPlayEpisode: (article: Article) => void
  searchQuery: string
  activeKeywordFilter?: KeywordFilter | null
  purgeDays: number
  protectSaved: boolean
  onChangePurgeDays: (days: number) => void
  onToggleProtectSaved: () => void
}

/* M3 Filter Chip */
function FilterChip({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        active
          ? 'bg-blue-100 text-blue-900 border-blue-200'
          : 'bg-transparent text-slate-600 border-slate-300 hover:bg-slate-50'
      }`}
    >
      {active && <Check size={11} className="flex-shrink-0" />}
      {!active && <span className="text-slate-400">{icon}</span>}
      {active && <span className="text-blue-700">{icon}</span>}
      {label}
    </button>
  )
}

function GroupHeader({ feedName, count }: { feedName: string; count: number }) {
  return (
    <div className="col-span-full flex items-center gap-3 mt-2 mb-2 first:mt-0">
      <span className="text-sm font-medium text-slate-700">{feedName}</span>
      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

export function ArticleFeed({
  categoryId, categories, articles, loading, error,
  onRefresh, onMarkRead, labels, onSaveArticle, onUnsaveArticle, onCreateLabel, onPlayEpisode,
  searchQuery, activeKeywordFilter,
  purgeDays, protectSaved, onChangePurgeDays, onToggleProtectSaved,
}: Props) {
  const prefs = loadPrefs()
  const [sortOrder, setSortOrder] = useState<SortOrder>(prefs.sortOrder ?? 'newest')
  const [groupByFeed, setGroupByFeed] = useState<boolean>(prefs.groupByFeed ?? false)
  const [savedFirst, setSavedFirst] = useState<boolean>(prefs.savedFirst ?? false)
  const [visibleCount, setVisibleCount] = useState(20)
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null)

  useEffect(() => { setVisibleCount(20); setSelectedFeed(null) }, [categoryId])
  useEffect(() => { if (!groupByFeed) setSelectedFeed(null) }, [groupByFeed])
  useEffect(() => { savePrefs({ sortOrder, groupByFeed, savedFirst }) }, [sortOrder, groupByFeed, savedFirst])

  const category = categories.find(c => c.id === categoryId)
  const isKeywordView = !!activeKeywordFilter
  const isLabelView = !!categoryId?.startsWith('saved:')
  const activeLabelId = isLabelView ? categoryId!.slice(6) : null
  const activeLabel = labels.find(l => l.id === activeLabelId)
  const isSavedView = categoryId === 'saved' || isLabelView
  const showCategory = categoryId === null || isSavedView || isKeywordView

  const cutoffTime = purgeDays > 0 ? Date.now() - purgeDays * 24 * 60 * 60 * 1000 : 0
  const passesPurge = (a: Article) => {
    if (cutoffTime === 0) return true
    if (protectSaved && a.isSaved) return true
    try { return new Date(a.pubDate).getTime() >= cutoffTime } catch { return true }
  }

  const filtered = articles.filter(a => {
    if (!passesPurge(a)) return false
    const text = `${a.title} ${a.description}`.toLowerCase()
    if (activeKeywordFilter) return activeKeywordFilter.keywords.some(kw => text.includes(kw.toLowerCase()))
    if (!searchQuery) return true
    return text.includes(searchQuery.toLowerCase())
  })

  const sorted = [...filtered].sort((a, b) => {
    const diff = new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    return sortOrder === 'newest' ? diff : -diff
  })

  const arranged = savedFirst && !isSavedView
    ? [...sorted.filter(a => a.isSaved), ...sorted.filter(a => !a.isSaved)]
    : sorted

  type FeedGroup = { feedName: string; articles: Article[] }
  const allGroups: FeedGroup[] = groupByFeed
    ? Object.entries(
        arranged.reduce<Record<string, Article[]>>((acc, a) => {
          const key = a.feedName || 'Unknown'; (acc[key] ??= []).push(a); return acc
        }, {})
      ).map(([feedName, articles]) => ({ feedName, articles }))
    : []

  const groups: FeedGroup[] = groupByFeed
    ? (selectedFeed ? allGroups.filter(g => g.feedName === selectedFeed) : allGroups)
    : [{ feedName: '', articles: arranged.slice(0, visibleCount) }]

  const totalCount = selectedFeed
    ? (allGroups.find(g => g.feedName === selectedFeed)?.articles.length ?? 0)
    : arranged.length

  const title = isLabelView && activeLabel ? activeLabel.name
    : isKeywordView ? activeKeywordFilter!.name
    : categoryId === null ? 'All Articles'
    : categoryId === 'saved' ? 'Saved Articles'
    : category ? `${category.icon} ${category.name}`
    : 'Articles'

  const filterStyles = isKeywordView
    ? FILTER_COLOR_STYLES[activeKeywordFilter!.color] ?? FILTER_COLOR_STYLES['violet']
    : isLabelView && activeLabel
    ? FILTER_COLOR_STYLES[activeLabel.color] ?? FILTER_COLOR_STYLES['violet']
    : null

  const renderCard = (article: Article) => {
    const cat = categories.find(c => c.id === article.categoryId)
    return (
      <ArticleCard
        key={article.id} article={article} category={cat}
        onMarkRead={onMarkRead} labels={labels}
        onSaveArticle={onSaveArticle} onUnsaveArticle={onUnsaveArticle}
        onCreateLabel={onCreateLabel} onPlayEpisode={onPlayEpisode}
        showCategory={showCategory}
        highlightKeywords={isKeywordView ? activeKeywordFilter!.keywords : undefined}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* M3 Page header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isKeywordView && <Search size={18} className="text-slate-400 flex-shrink-0" />}
            {isLabelView && activeLabel && filterStyles && (
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${filterStyles.badge}`}>Label</span>
            )}
            {/* M3 Headline Small */}
            <h2 className="text-2xl font-normal text-slate-900 tracking-tight">{title}</h2>
          </div>
          {isKeywordView && activeKeywordFilter!.keywords.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-xs text-slate-400">matching:</span>
              {activeKeywordFilter!.keywords.map(kw => (
                <span key={kw} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${filterStyles!.badge}`}>{kw}</span>
              ))}
            </div>
          )}
          {!loading && (
            <p className="text-sm text-slate-500 mt-1">
              {totalCount} {totalCount === 1 ? 'article' : 'articles'}
              {searchQuery && !isKeywordView && ` matching "${searchQuery}"`}
            </p>
          )}
        </div>

        {!isSavedView && !isKeywordView && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {/* M3 Filter Chips toolbar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <FilterChip
          active={sortOrder === 'oldest'}
          onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
          icon={<ArrowUpDown size={12} />}
          label={sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
        />
        <FilterChip
          active={groupByFeed}
          onClick={() => setGroupByFeed(v => !v)}
          icon={<Layers size={12} />}
          label="Group by feed"
        />
        {!isSavedView && (
          <FilterChip
            active={savedFirst}
            onClick={() => setSavedFirst(v => !v)}
            icon={<Bookmark size={12} />}
            label="Saved first"
          />
        )}
        <PurgeControl
          purgeDays={purgeDays} protectSaved={protectSaved}
          onChangeDays={onChangePurgeDays} onToggleProtect={onToggleProtectSaved}
        />
      </div>

      {/* Feed picker pills (group by feed) */}
      {groupByFeed && allGroups.length > 1 && (
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedFeed(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedFeed === null ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            All
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedFeed === null ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {arranged.length}
            </span>
          </button>
          {allGroups.map(group => (
            <button
              key={group.feedName}
              onClick={() => setSelectedFeed(group.feedName)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedFeed === group.feedName ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="truncate max-w-[140px]">{group.feedName}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${selectedFeed === group.feedName ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {group.articles.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl text-sm mb-5">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* M3 Loading skeleton */}
      {loading && articles.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-100" />
              <div className="p-4 space-y-2.5">
                <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
                <div className="h-3.5 bg-slate-100 rounded-full w-full" />
                <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Newspaper size={56} className="text-slate-200 mb-5" />
          <p className="text-slate-500 font-medium">
            {isKeywordView ? 'No articles match these keywords yet — try refreshing'
              : isLabelView ? 'No articles saved with this label'
              : searchQuery ? 'No articles match your search'
              : 'No articles yet'}
          </p>
          {!searchQuery && !isSavedView && !isKeywordView && (
            <button onClick={onRefresh} className="mt-4 px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Load articles
            </button>
          )}
          {isKeywordView && (
            <button onClick={onRefresh} className="mt-4 px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Refresh all categories
            </button>
          )}
        </div>
      )}

      {/* Articles — flat */}
      {totalCount > 0 && !groupByFeed && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups[0].articles.map(renderCard)}
          </div>
          {visibleCount < totalCount && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisibleCount(c => c + 20)}
                className="px-6 py-2.5 rounded-full border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Load more ({totalCount - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Articles — grouped */}
      {totalCount > 0 && groupByFeed && (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.feedName}>
              {!selectedFeed && <GroupHeader feedName={group.feedName} count={group.articles.length} />}
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
