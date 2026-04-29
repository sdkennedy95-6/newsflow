import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Trash2, Loader2, Rss, Users } from 'lucide-react'
import type { Category, CategoryColor, RSSFeed } from '../types'
import { COLOR_MAP } from '../defaultCategories'

const COLORS: CategoryColor[] = ['blue', 'green', 'red', 'purple', 'amber', 'cyan', 'pink', 'indigo', 'orange', 'teal']
const EMOJI_OPTIONS = ['📰', '💻', '🏥', '⚽', '🏛️', '📈', '🔬', '🎬', '🌍', '🎮', '🍕', '🎵', '✈️', '🏠', '📚', '🌿']

interface FeedSuggestion {
  title: string
  url: string
  description: string
  subscribers: number
}

interface Props {
  category?: Category | null
  onSave: (data: Omit<Category, 'id'>) => void
  onClose: () => void
}

const EMPTY: Omit<Category, 'id'> = {
  name: '',
  color: 'blue',
  icon: '📰',
  feeds: [{ url: '', name: '' }],
}

async function searchFeeds(query: string): Promise<FeedSuggestion[]> {
  const res = await fetch(`/api/feedly/search/feeds?query=${encodeURIComponent(query)}&count=6`)
  const data = await res.json()
  return (data.results ?? [])
    .filter((r: any) => r.feedId?.startsWith('feed/'))
    .map((r: any) => ({
      title: r.title || query,
      url: r.feedId.replace('feed/', ''),
      description: r.description || '',
      subscribers: r.subscribers || 0,
    }))
}

function FeedRow({
  feed,
  index,
  errors,
  onUpdate,
  onRemove,
  showRemove,
}: {
  feed: RSSFeed
  index: number
  errors: Record<string, string>
  onUpdate: (i: number, field: keyof RSSFeed, value: string) => void
  onRemove: (i: number) => void
  showRemove: boolean
}) {
  const [suggestions, setSuggestions] = useState<FeedSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleNameChange = (value: string) => {
    onUpdate(index, 'name', value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setSuggestions([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchFeeds(value.trim())
        setSuggestions(results)
        setOpen(results.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  const selectSuggestion = (s: FeedSuggestion) => {
    onUpdate(index, 'name', s.title)
    onUpdate(index, 'url', s.url)
    setOpen(false)
    setSuggestions([])
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formatSubscribers = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 space-y-1.5" ref={containerRef}>
        {/* Name field with search */}
        <div className="relative">
          <input
            type="text"
            value={feed.name}
            onChange={e => handleNameChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Feed name — type to search (e.g. TechCrunch)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-shadow pr-8"
            autoComplete="off"
          />
          {searching && (
            <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
          )}

          {/* Suggestions dropdown */}
          {open && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, si) => (
                <button
                  key={si}
                  type="button"
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Rss size={11} className="text-orange-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-800 truncate">{s.title}</span>
                      </div>
                      {s.description && (
                        <p className="text-xs text-slate-400 truncate">{s.description}</p>
                      )}
                      <p className="text-xs text-slate-300 truncate mt-0.5">{s.url}</p>
                    </div>
                    {s.subscribers > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-slate-400 flex-shrink-0 mt-0.5">
                        <Users size={10} />
                        {formatSubscribers(s.subscribers)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* URL field */}
        <input
          type="url"
          value={feed.url}
          onChange={e => onUpdate(index, 'url', e.target.value)}
          placeholder="https://example.com/feed.xml"
          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-shadow ${
            errors[`feed_${index}`]
              ? 'border-red-300 focus:ring-red-200'
              : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
          }`}
        />
        {errors[`feed_${index}`] && (
          <p className="text-xs text-red-500">{errors[`feed_${index}`]}</p>
        )}
      </div>

      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="mt-2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

export function CategoryModal({ category, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<Category, 'id'>>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        color: category.color,
        icon: category.icon,
        feeds: category.feeds.length > 0 ? category.feeds : [{ url: '', name: '' }],
        isDefault: category.isDefault,
      })
    } else {
      setForm(EMPTY)
    }
  }, [category])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const validFeeds = form.feeds.filter(f => f.url.trim())
    if (validFeeds.length === 0) e.feeds = 'Add at least one RSS feed URL'
    validFeeds.forEach((f, i) => {
      try { new URL(f.url) } catch { e[`feed_${i}`] = 'Invalid URL' }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      ...form,
      name: form.name.trim(),
      feeds: form.feeds.filter(f => f.url.trim()),
    })
  }

  const updateFeed = useCallback((i: number, field: keyof RSSFeed, value: string) => {
    setForm(prev => ({
      ...prev,
      feeds: prev.feeds.map((f, idx) => idx === i ? { ...f, [field]: value } : f),
    }))
  }, [])

  const addFeed = () => setForm(prev => ({ ...prev, feeds: [...prev.feeds, { url: '', name: '' }] }))
  const removeFeed = (i: number) => setForm(prev => ({ ...prev, feeds: prev.feeds.filter((_, idx) => idx !== i) }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {category ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, icon: emoji }))}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      form.icon === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Category name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Category Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Health Tech, Sports, Politics"
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-shadow ${
                  errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => {
                  const c = COLOR_MAP[color]
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, color }))}
                      className={`w-7 h-7 rounded-full ${c.dot} transition-transform ${
                        form.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={color}
                    />
                  )
                })}
              </div>
            </div>

            {/* RSS Feeds */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                RSS Feeds <span className="text-red-400">*</span>
              </label>
              {errors.feeds && <p className="text-xs text-red-500 mb-2">{errors.feeds}</p>}

              <div className="space-y-3">
                {form.feeds.map((feed, i) => (
                  <FeedRow
                    key={i}
                    feed={feed}
                    index={i}
                    errors={errors}
                    onUpdate={updateFeed}
                    onRemove={removeFeed}
                    showRemove={form.feeds.length > 1}
                  />
                ))}

                <button
                  type="button"
                  onClick={addFeed}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus size={13} /> Add another feed
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100">
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
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
