import { formatDistanceToNow } from 'date-fns'
import { Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react'
import type { Article, Category } from '../types'
import { COLOR_MAP } from '../defaultCategories'

interface Props {
  article: Article
  category: Category | undefined
  onMarkRead: (id: string) => void
  onToggleSaved: (id: string) => void
  showCategory?: boolean
  highlightKeywords?: string[]
}

function matchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter(kw => lower.includes(kw.toLowerCase()))
}

export function ArticleCard({ article, category, onMarkRead, onToggleSaved, showCategory, highlightKeywords }: Props) {
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
          {showCategory && category && (
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
            <button
              onClick={() => onToggleSaved(article.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                article.isSaved
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
              title={article.isSaved ? 'Remove from saved' : 'Save article'}
            >
              {article.isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>

            <button
              onClick={handleOpen}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Read <ExternalLink size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
