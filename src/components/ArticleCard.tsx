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
    try {
      return formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })
    } catch {
      return ''
    }
  })()

  const handleOpen = () => {
    onMarkRead(article.id)
    window.open(article.link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col ${
        article.isRead ? 'opacity-70' : ''
      }`}
    >
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
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {article.contentType === 'podcast' && (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex-shrink-0">
              <Mic size={10} /> Podcast
            </span>
          )}
          {showCategory && category && article.contentType !== 'podcast' && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
              {category.icon} {category.name}
            </span>
          )}
          <span className="text-xs text-slate-400">{article.feedName}</span>
          {matched.length > 0 && matched.slice(0, 2).map(kw => (
            <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">{kw}</span>
          ))}
          {article.isRead && (
            <span className="text-xs text-slate-300 ml-auto">Read</span>
          )}
        </div>

        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-2 flex-1">
          {article.title}
        </h3>

        {article.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
            {article.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
          <span className="text-xs text-slate-400">{formattedDate}</span>

          <div className="flex items-center gap-1">
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
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 transition-colors"
              >
                <Play size={11} className="fill-current" /> Play
              </button>
            ) : (
              <button
                onClick={handleOpen}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
