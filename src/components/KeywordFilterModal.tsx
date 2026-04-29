import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import type { KeywordFilter } from '../types'
import { FILTER_COLORS } from '../hooks/useKeywordFilters'

const COLOR_STYLES: Record<string, { dot: string; badge: string; ring: string }> = {
  violet:  { dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700',  ring: 'ring-violet-400' },
  rose:    { dot: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700',      ring: 'ring-rose-400' },
  sky:     { dot: 'bg-sky-500',     badge: 'bg-sky-100 text-sky-700',        ring: 'ring-sky-400' },
  emerald: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700',ring: 'ring-emerald-400' },
  amber:   { dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700',    ring: 'ring-amber-400' },
  fuchsia: { dot: 'bg-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-700',ring: 'ring-fuchsia-400' },
  lime:    { dot: 'bg-lime-500',    badge: 'bg-lime-100 text-lime-700',      ring: 'ring-lime-400' },
  orange:  { dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700',  ring: 'ring-orange-400' },
}

export { COLOR_STYLES as FILTER_COLOR_STYLES }

interface Props {
  filter?: KeywordFilter | null
  onSave: (data: Omit<KeywordFilter, 'id'>) => void
  onClose: () => void
}

export function KeywordFilterModal({ filter, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('violet')
  const [keywords, setKeywords] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (filter) {
      setName(filter.name)
      setColor(filter.color)
      setKeywords(filter.keywords)
    } else {
      setName('')
      setColor('violet')
      setKeywords([])
      setInput('')
    }
  }, [filter])

  const addKeyword = () => {
    const trimmed = input.trim().toLowerCase()
    if (!trimmed || keywords.includes(trimmed)) { setInput(''); return }
    setKeywords(prev => [...prev, trimmed])
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword() }
    if (e.key === 'Backspace' && !input && keywords.length > 0) {
      setKeywords(prev => prev.slice(0, -1))
    }
  }

  const removeKeyword = (kw: string) => setKeywords(prev => prev.filter(k => k !== kw))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (keywords.length === 0) e.keywords = 'Add at least one keyword'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // commit any pending input
    const trimmed = input.trim().toLowerCase()
    const finalKeywords = trimmed && !keywords.includes(trimmed) ? [...keywords, trimmed] : keywords
    if (finalKeywords.length === 0 && !name.trim()) {
      setErrors({ name: 'Name is required', keywords: 'Add at least one keyword' })
      return
    }
    if (!name.trim()) { setErrors({ name: 'Name is required' }); return }
    if (finalKeywords.length === 0) { setErrors({ keywords: 'Add at least one keyword' }); return }
    onSave({ name: name.trim(), color, keywords: finalKeywords })
  }

  const styles = COLOR_STYLES[color]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {filter ? 'Edit Keyword Filter' : 'New Keyword Filter'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Filter Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., AI & Machine Learning, Climate Tech"
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-shadow ${
                errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Color</label>
            <div className="flex gap-2">
              {FILTER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full ${COLOR_STYLES[c].dot} transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Keywords <span className="text-red-400">*</span>
            </label>

            {/* Tag input */}
            <div
              className={`min-h-[80px] w-full px-3 py-2 rounded-lg border text-sm flex flex-wrap gap-1.5 items-start cursor-text transition-shadow ${
                errors.keywords ? 'border-red-300' : 'border-slate-200 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400'
              }`}
              onClick={() => inputRef.current?.focus()}
            >
              {keywords.map(kw => (
                <span key={kw} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                  {kw}
                  <button type="button" onClick={() => removeKeyword(kw)} className="hover:opacity-70 ml-0.5">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addKeyword}
                placeholder={keywords.length === 0 ? 'Type a keyword and press Enter…' : 'Add more…'}
                className="outline-none bg-transparent text-sm min-w-[140px] flex-1 placeholder:text-slate-400"
              />
            </div>
            {errors.keywords
              ? <p className="text-xs text-red-500 mt-1">{errors.keywords}</p>
              : <p className="text-xs text-slate-400 mt-1.5">Press <kbd className="bg-slate-100 px-1 rounded text-xs">Enter</kbd> after each keyword. Articles matching <strong>any</strong> keyword will appear.</p>
            }
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {filter ? 'Save Changes' : 'Create Filter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
