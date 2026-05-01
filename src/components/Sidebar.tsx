import { useState } from 'react'
import { Plus, Bookmark, Layers, Pencil, Trash2, Search, LogOut, Tag, Check, ChevronUp, ChevronDown } from 'lucide-react'
import type { Category, KeywordFilter, SaveLabel } from '../types'
import { COLOR_MAP } from '../defaultCategories'
import { FILTER_COLOR_STYLES } from './KeywordFilterModal'
import { ReadingGoalWidget } from './ReadingGoalWidget'
import { PurgeControl } from './PurgeControl'

interface Props {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  savedCount: number
  onAddCategory: () => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (id: string) => void
  onReorderCategory: (id: string, direction: 'up' | 'down') => void
  keywordFilters: KeywordFilter[]
  onAddKeywordFilter: () => void
  onEditKeywordFilter: (f: KeywordFilter) => void
  onDeleteKeywordFilter: (id: string) => void
  labels: SaveLabel[]
  labelCounts: Record<string, number>
  onAddLabel: () => void
  onEditLabel: (label: SaveLabel) => void
  onDeleteLabel: (id: string) => void
  todayCount: number
  goal: number
  streak: number
  goalReached: boolean
  justReached: boolean
  onSetGoal: (n: number) => void
  purgeDays: number
  protectSaved: boolean
  onChangePurgeDays: (days: number) => void
  onToggleProtectSaved: () => void
  userEmail?: string
  onSignOut: () => void
}

export function Sidebar({
  categories, selectedId, onSelect, savedCount,
  onAddCategory, onEditCategory, onDeleteCategory, onReorderCategory,
  keywordFilters, onAddKeywordFilter, onEditKeywordFilter, onDeleteKeywordFilter,
  labels, labelCounts, onAddLabel, onEditLabel, onDeleteLabel,
  todayCount, goal, streak, goalReached, justReached, onSetGoal,
  purgeDays, protectSaved, onChangePurgeDays, onToggleProtectSaved,
  userEmail, onSignOut,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleDelete = (id: string, deleteFn: (id: string) => void) => {
    if (confirmDelete === id) {
      deleteFn(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const NavItem = ({ id, icon, label, badge }: {
    id: string | null; icon: React.ReactNode; label: string; badge?: number
  }) => {
    const isActive = selectedId === id
    return (
      <button
        onClick={() => onSelect(id)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-full text-sm font-medium transition-colors ${
          isActive ? 'bg-blue-100 text-blue-900' : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span className={isActive ? 'text-blue-800' : 'text-slate-500'}>{icon}</span>
        <span className="flex-1 text-left tracking-wide">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isActive ? 'bg-blue-200 text-blue-900' : 'bg-slate-200 text-slate-600'
          }`}>
            {badge}
          </span>
        )}
      </button>
    )
  }

  const SectionLabel = ({ label, onAdd, title }: { label: string; onAdd: () => void; title: string }) => (
    <div className="flex items-center justify-between px-4 mb-0.5 mt-2">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{label}</span>
      <button
        onClick={onAdd}
        className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
        title={title}
      >
        <Plus size={14} />
      </button>
    </div>
  )

  return (
    <aside className="w-64 flex-shrink-0 bg-white shadow-md flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex-shrink-0">
        <img src="/logo.svg" alt="The Loop" className="h-10 w-10 rounded-xl" />
      </div>

      {/* Reading goal */}
      <ReadingGoalWidget
        todayCount={todayCount} goal={goal} streak={streak}
        goalReached={goalReached} justReached={justReached} onSetGoal={onSetGoal}
      />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 min-h-0 py-1">
        <NavItem id={null} icon={<Layers size={18} />} label="All Articles" />
        <NavItem id="saved" icon={<Bookmark size={18} />} label="Saved" badge={savedCount} />

        {/* Label sub-items */}
        {labels.length > 0 && (
          <div className="pl-3 space-y-0.5 py-0.5">
            {labels.map(label => {
              const styles = FILTER_COLOR_STYLES[label.color] ?? FILTER_COLOR_STYLES['violet']
              const labelNavId = `saved:${label.id}`
              const isActive = selectedId === labelNavId
              const isHovered = hoveredId === labelNavId
              const count = labelCounts[label.id] ?? 0
              return (
                <div
                  key={label.id}
                  className="relative"
                  onMouseEnter={() => setHoveredId(labelNavId)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    onClick={() => onSelect(labelNavId)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Tag size={11} className={`flex-shrink-0 ${styles.dot.replace('bg-', 'text-')}`} />
                    <span className="flex-1 text-left truncate">{label.name}</span>
                    {count > 0 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{count}</span>
                    )}
                  </button>
                  {isHovered && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white rounded-full shadow border border-slate-100 px-1 py-0.5 z-10">
                      <button onClick={e => { e.stopPropagation(); onEditLabel(label) }} className="p-1 rounded-full text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Pencil size={11} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(label.id, onDeleteLabel) }} className={`p-1 rounded-full transition-colors ${confirmDelete === label.id ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-500'}`} title={confirmDelete === label.id ? 'Confirm' : 'Delete'}><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>
              )
            })}
            <button onClick={onAddLabel} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors">
              <Plus size={11} /> New label
            </button>
          </div>
        )}

        {/* Categories */}
        <div className="pt-2">
          <SectionLabel label="Categories" onAdd={onAddCategory} title="Add category" />
          {categories.map((cat, idx) => {
            const colors = COLOR_MAP[cat.color]
            const isActive = selectedId === cat.id
            const isHovered = hoveredId === cat.id
            return (
              <div key={cat.id} className="relative"
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelect(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-900' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isActive
                    ? <Check size={16} className="text-blue-700 flex-shrink-0" />
                    : <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                  }
                  <span className="flex-1 text-left truncate">{cat.icon} {cat.name}</span>
                </button>
                {isHovered && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white rounded-full shadow border border-slate-100 px-1 py-0.5 z-10">
                    <button
                      onClick={e => { e.stopPropagation(); onReorderCategory(cat.id, 'up') }}
                      disabled={idx === 0}
                      className="p-1 rounded-full text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-30"
                      title="Move up"
                    ><ChevronUp size={11} /></button>
                    <button
                      onClick={e => { e.stopPropagation(); onReorderCategory(cat.id, 'down') }}
                      disabled={idx === categories.length - 1}
                      className="p-1 rounded-full text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-30"
                      title="Move down"
                    ><ChevronDown size={11} /></button>
                    <button onClick={e => { e.stopPropagation(); onEditCategory(cat) }} className="p-1 rounded-full text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Pencil size={11} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(cat.id, onDeleteCategory) }} className={`p-1 rounded-full transition-colors ${confirmDelete === cat.id ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-500'}`} title={confirmDelete === cat.id ? 'Confirm' : 'Delete'}><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
            )
          })}
          {categories.length === 0 && <p className="text-xs text-slate-400 px-4 py-2">No categories yet</p>}
        </div>

        {/* Saved Searches */}
        <div className="pt-2">
          <SectionLabel label="Saved Searches" onAdd={onAddKeywordFilter} title="Add keyword filter" />
          {keywordFilters.map(kf => {
            const styles = FILTER_COLOR_STYLES[kf.color] ?? FILTER_COLOR_STYLES['violet']
            const isActive = selectedId === `kf_${kf.id}`
            const isHovered = hoveredId === `kf_${kf.id}`
            return (
              <div key={kf.id} className="relative"
                onMouseEnter={() => setHoveredId(`kf_${kf.id}`)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelect(`kf_${kf.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-900' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isActive
                    ? <Check size={16} className="text-blue-700 flex-shrink-0" />
                    : <span className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
                  }
                  <span className="flex-1 text-left truncate">{kf.name}</span>
                </button>
                {isHovered && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white rounded-full shadow border border-slate-100 px-1 py-0.5 z-10">
                    <button onClick={e => { e.stopPropagation(); onEditKeywordFilter(kf) }} className="p-1 rounded-full text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Pencil size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(kf.id, onDeleteKeywordFilter) }} className={`p-1 rounded-full transition-colors ${confirmDelete === kf.id ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-500'}`} title={confirmDelete === kf.id ? 'Confirm' : 'Delete'}><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            )
          })}
          {keywordFilters.length === 0 && (
            <button onClick={onAddKeywordFilter} className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-blue-700 transition-colors flex items-center gap-1.5 rounded-full hover:bg-blue-50">
              <Search size={11} /> Create your first saved search
            </button>
          )}
        </div>
      </nav>

      {/* Footer: purge settings + sign out */}
      <div className="px-3 py-3 border-t border-slate-100 flex-shrink-0 space-y-1">
        <div className="px-4 py-1.5">
          <PurgeControl
            purgeDays={purgeDays}
            protectSaved={protectSaved}
            onChangeDays={onChangePurgeDays}
            onToggleProtect={onToggleProtectSaved}
            upward
          />
        </div>
        {userEmail && <p className="text-xs text-slate-400 px-4 pb-1 truncate">{userEmail}</p>}
        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors">
          <LogOut size={16} className="text-slate-400" /> Sign out
        </button>
      </div>
    </aside>
  )
}
