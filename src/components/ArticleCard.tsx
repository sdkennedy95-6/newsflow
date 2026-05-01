import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Play, Mic } from 'lucide-react'
import type { Article, Category, SaveLabel } from '../types'
import { COLOR_MAP } from '../defaultCategories'
import { SaveMenu } from './SaveMenu'

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
}

function matchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter(kw => lower.includes(kw.toLowerCase()))
}

export function ArticleCard({ article, category, onMarkRead, labels, onSaveArticle, onUnsaveArticle, onCreateLabel, onPlayEpisode, showCategory, highlightKeywords }: Props) {
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

  return (
    /* M3 Elevated Card — shadow instead of border, rounded-2xl (20dp), surface background */
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden ${
      article.isRead ? 'opacity-60' : ''
    }`}>
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
        {/* Chips row */}
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

        {/* M3 Title Medium */}
        <h3 className="text-sm font-medium text-slate-900 leading-snug line-clamp-2 mb-2 flex-1">
          {article.title}
        </h3>

        {article.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-50">
          <span className="text-[11px] text-slate-400">{formattedDate}</span>

          <div className="flex items-center gap-0.5">
            <SaveMenu
              isSaved={article.isSaved}
              labelId={article.labelId}
              labels={labels}
              onSave={(labelId) => onSaveArticle(article.id, labelId)}
              onUnsave={() => onUnsaveArticle(article.id)}
              onCreateLabel={onCreateLabel}
            />
            {article.contentType === 'podcast' ? (
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
