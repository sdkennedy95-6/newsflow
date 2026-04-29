import { useState, useRef, useEffect } from 'react'
import { Bookmark, BookmarkCheck, ChevronDown, Tag, Plus } from 'lucide-react'
import type { SaveLabel } from '../types'
import { FILTER_COLOR_STYLES } from './KeywordFilterModal'

interface Props {
  isSaved: boolean
  labelId?: string
  labels: SaveLabel[]
  onSave: (labelId?: string) => void
  onUnsave: () => void
  onCreateLabel: () => void
}

export function SaveMenu({ isSaved, labelId, labels, onSave, onUnsave, onCreateLabel }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeLabel = labels.find(l => l.id === labelId)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center">
        <button
          onClick={() => isSaved ? onUnsave() : onSave()}
          className={`p-1.5 rounded-l-lg transition-colors ${
            isSaved
              ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
          }`}
          title={isSaved ? (activeLabel ? `Saved: ${activeLabel.name}` : 'Saved') : 'Save article'}
        >
          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          className={`p-1 rounded-r-lg border-l transition-colors ${
            isSaved
              ? 'text-amber-400 hover:text-amber-600 bg-amber-50 border-amber-100'
              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50 border-slate-100'
          }`}
          title="Save to label"
        >
          <ChevronDown size={10} />
        </button>
      </div>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30">
          <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Save to</div>

          <button
            onClick={() => { onSave(); setOpen(false) }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
              isSaved && !labelId ? 'text-amber-600 font-medium' : 'text-slate-700'
            }`}
          >
            <Bookmark size={13} className="text-amber-400 flex-shrink-0" />
            Save for later
            {isSaved && !labelId && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>

          {labels.map(label => {
            const styles = FILTER_COLOR_STYLES[label.color] ?? FILTER_COLOR_STYLES['violet']
            const isActive = isSaved && labelId === label.id
            return (
              <button
                key={label.id}
                onClick={() => { onSave(label.id); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
                  isActive ? 'font-medium text-slate-900' : 'text-slate-700'
                }`}
              >
                <Tag size={13} className={`flex-shrink-0 ${styles.dot.replace('bg-', 'text-')}`} />
                <span className="flex-1 text-left truncate">{label.name}</span>
                {isActive && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} flex-shrink-0`} />}
              </button>
            )
          })}

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={() => { onCreateLabel(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus size={13} />
              New label…
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
