import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Play, Mic } from 'lucide-react'
import type { Article, Category, SaveLabel } from '../types'
import { COLOR_MAP } from '../defaultCategories'
import { SaveMenu } from './SaveMenu'

export type ViewMode = 'card' | 'list' | 'expanded'

interface Props {
  article: Article
  category: Category | undefined
  onMarkRead: (id: string) => void
  labels: SaveLabel[]
  onSaveArticle: (id: string, labelId?: string) => void
  onUnsaveArticle: (id: string) => void
  onCreateLabel: () => void
  onPlayEpisode: (article: Article) => void
  showCategory?: boolean
  highlightKeywords?: string[]
  viewMode?: ViewMode
}

function matchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter(kw => lower.includes(kw.toLowerCase()))
}

export function ArticleCard({ article, category, onMarkRead, labels, onSaveArticle, onUnsaveArticle, onCreateLabel, onPlayEpisode, showCategory, highlightKeywords, viewMode = 'card' }: Props) {
  const matched = highlightKeywords
    ? matchedKeywords(`${article.title} ${article.description}`, highlightKeywords)
    : []
  const colors = category ? COLOR_MAP[category.color] : COLOR_MAP['blue']

  const formattedDate = (() => {
    try { return formatDistanceToNow(new Date(article.pubDate), { addSuffix: true }) }
    catch { return '' }
  })()

  const handleOpen = () => {
    onMarkRead(article.id)
    window.open(article.link, '_blank', 'noopener,noreferrer')
  }

  const actionButton = article.contentType === 'podcast' ? (
    <button
      onClick={() => onPlayEpisode(article)}
      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-violet-700 hover:bg-violet-50 transition-colors"
    >
      <Play size={11} className="fill-current" /> Play
    </button>
  ) : (
    <button
      onClick={handleOpen}
      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
    >
      Read <ExternalLink size={11} />
    </button>
  )

  const saveMenu = (
    <SaveMenu
      isSaved={article.isSaved}
      labelId={article.labelId}
      labels={labels}
      onSave={(labelId) => onSaveArticle(article.id, labelId)}
      onUnsave={() => onUnsaveArticle(article.id)}
      onCreateLabel={onCreateLabel}
    />
  )

  /* ── LIST mode ── compact single row */
  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-xl flex items-center gap-3 px-4 py-2.5 hover:shadow-sm transition-shadow ${article.isRead ? 'opacity-60' : ''}`}>
        {article.contentType === 'podcast'
          ? <Mic size={13} className="text-violet-500 flex-shrink-0" />
          : <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate leading-snug">{article.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {showCategory && category && (
              <span className={`text-[11px] px-1.5 py-0 rounded-full font-medium ${colors.badge}`}>{category.icon}</span>
            )}
            <span className="text-[11px] text-slate-400 truncate">{article.feedName}</span>
            <span className="text-[11px] text-slate-300">·</span>
            <span className="text-[11px] text-slate-400 flex-shrink-0">{formattedDate}</span>
            {matched.length > 0 && matched.slice(0, 1).map(kw => (
              <span key={kw} className="text-[11px] px-1.5 py-0 rounded-full bg-amber-100 text-amber-800 font-medium">{kw}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {saveMenu}
          {actionButton}
        </div>
      </div>
    )
  }

  /* ── EXPANDED mode ── single column, full description */
  if (viewMode === 'expanded') {
    return (
      <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${article.isRead ? 'opacity-60' : ''}`}>
        {article.thumbnail && (
          <div className="h-52 overflow-hidden bg-slate-100">
            <img
              src={article.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            {article.contentType === 'podcast' && (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                <Mic size={10} /> Podcast
              </span>
            )}
            {showCategory && category && article.contentType !== 'podcast' && (
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${colors.badge}`}>{category.icon} {category.name}</span>
            )}
            {matched.length > 0 && matched.slice(0, 2).map(kw => (
              <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">{kw}</span>
            ))}
            <span className="text-[11px] text-slate-400 ml-auto">{article.feedName}</span>
            {article.isRead && <span className="text-[11px] text-slate-300">· Read</span>}
          </div>
          <h3 className="text-base font-medium text-slate-900 leading-snug mb-2">{article.title}</h3>
          {article.description && (
            <p className="text-sm text-slate-500 line-clamp-4 mb-4 leading-relaxed">{article.description}</p>
          )}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
            <span className="text-[11px] text-slate-400">{formattedDate}</span>
            <div className="flex items-center gap-0.5">
              {saveMenu}
              {actionButton}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── CARD mode (default) ── grid card with thumbnail */
  return (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden ${article.isRead ? 'opacity-60' : ''}`}>
      {article.thumbnail && (
        <div className="h-44 overflow-hidden bg-slate-100 flex-shrink-0">
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          {article.contentType === 'podcast' && (
            <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
              <Mic size={10} /> Podcast
            </span>
          )}
          {showCategory && category && article.contentType !== 'podcast' && (
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${colors.badge}`}>
              {category.icon} {category.name}
            </span>
          )}
          {matched.length > 0 && matched.slice(0, 2).map(kw => (
            <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">{kw}</span>
          ))}
          <span className="text-[11px] text-slate-400 ml-auto">{article.feedName}</span>
          {article.isRead && <span className="text-[11px] text-slate-300">· Read</span>}
        </div>
        <h3 className="text-sm font-medium text-slate-900 leading-snug line-clamp-2 mb-2 flex-1">{article.title}</h3>
        {article.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{article.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-50">
          <span className="text-[11px] text-slate-400">{formattedDate}</span>
          <div className="flex items-center gap-0.5">
            {saveMenu}
            {actionButton}
          </div>
        </div>
      </div>
    </div>
  )
}
