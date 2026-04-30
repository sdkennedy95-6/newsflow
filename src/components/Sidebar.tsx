import { useState } from 'react'
import { Plus, Bookmark, Layers, ChevronRight, Pencil, Trash2, Search, LogOut, Tag } from 'lucide-react'
import type { Category, KeywordFilter, SaveLabel } from '../types'
import { COLOR_MAP } from '../defaultCategories'
import { FILTER_COLOR_STYLES } from './KeywordFilterModal'
import { ReadingGoalWidget } from './ReadingGoalWidget'

interface Props {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  savedCount: number
  onAddCategory: () => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (id: string) => void
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
  userEmail?: string
  onSignOut: () => void
}

export function Sidebar({
  categories,
  selectedId,
  onSelect,
  savedCount,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  keywordFilters,
  onAddKeywordFilter,
  onEditKeywordFilter,
  onDeleteKeywordFilter,
  labels,
  labelCounts,
  onAddLabel,
  onEditLabel,
  onDeleteLabel,
  todayCount,
  goal,
  streak,
  goalReached,
  justReached,
  onSetGoal,
  userEmail,
  onSignOut,
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

  const NavItem = ({
    id,
    icon,
    label,
    badge,
  }: {
    id: string | null
    icon: React.ReactNode
    label: string
    badge?: number
  }) => {
    const isActive = selectedId === id
    return (
      <button
        onClick={() => onSelect(id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
            {badge}
          </span>
        )}
        {isActive && <ChevronRight size={14} className="text-blue-400" />}
      </button>
    )
  }

  const SectionHeader = ({ label, onAdd, title }: { label: string; onAdd: () => void; title: string }) => (
    <div className="flex items-center justify-between px-3 mb-1">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <button
        onClick={onAdd}
        className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title={title}
      >
        <Plus size={14} />
      </button>
    </div>
  )

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Layers size={14} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base">NewsFlow</span>
        </div>
      </div>

      {/* Reading goal */}
      <ReadingGoalWidget
        todayCount={todayCount}
        goal={goal}
        streak={streak}
        goalReached={goalReached}
        justReached={justReached}
        onSetGoal={onSetGoal}
      />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
        <NavItem id={null} icon={<Layers size={16} />} label="All Articles" />
        <NavItem id="saved" icon={<Bookmark size={16} />} label="Saved" badge={savedCount} />

        {/* Label sub-items under Saved */}
        {labels.length > 0 && (
          <div className="pl-4 space-y-0.5">
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
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Tag size={11} className={`flex-shrink-0 ${styles.dot.replace('bg-', 'text-')}`} />
                    <span className="flex-1 text-left truncate">{label.name}</span>
                    {count > 0 && (
                      <span className={`text-xs px-1 py-0.5 rounded-full ${isActive ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>

                  {isHovered && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white rounded-md shadow-sm border border-slate-100 px-1 py-0.5 z-10">
                      <button
                        onClick={e => { e.stopPropagation(); onEditLabel(label) }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(label.id, onDeleteLabel) }}
                        className={`p-1 rounded transition-colors ${
                          confirmDelete === label.id ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-500'
                        }`}
                        title={confirmDelete === label.id ? 'Click again to confirm' : 'Delete'}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            <button
              onClick={onAddLabel}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus size={11} /> New label
            </button>
          </div>
        )}

        {/* Categories */}
        <div className="pt-3 pb-1">
          <SectionHeader label="Categories" onAdd={onAddCategory} title="Add category" />

          {categories.map(cat => {
            const colors = COLOR_MAP[cat.color]
            const isActive = selectedId === cat.id
            const isHovered = hoveredId === cat.id

            return (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelect(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? `${colors.bg} ${colors.text}` : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <span className="flex-1 text-left truncate">{cat.icon} {cat.name}</span>
                  {isActive && !isHovered && <ChevronRight size={14} className={colors.text} />}
                </button>

                {isHovered && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white rounded-md shadow-sm border border-slate-100 px-1 py-0.5 z-10">
                    <button
                      onClick={e => { e.stopPropagation(); onEditCategory(cat) }}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(cat.id, onDeleteCategory) }}
                      className={`p-1 rounded transition-colors ${
                        confirmDelete === cat.id ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-500'
                      }`}
                      title={confirmDelete === cat.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {categories.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-2">No categories yet</p>
          )}
        </div>

        {/* Keyword Filters */}
        <div className="pt-2 pb-1">
          <SectionHeader label="Saved Searches" onAdd={onAddKeywordFilter} title="Add keyword filter" />

          {keywordFilters.map(kf => {
            const styles = FILTER_COLOR_STYLES[kf.color] ?? FILTER_COLOR_STYLES['violet']
            const isActive = selectedId === `kf_${kf.id}`
            const isHovered = hoveredId === `kf_${kf.id}`

            return (
              <div
                key={kf.id}
                className="relative"
                onMouseEnter={() => setHoveredId(`kf_${kf.id}`)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelect(`kf_${kf.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
                  <span className="flex-1 text-left truncate">{kf.name}</span>
                  {isActive && !isHovered && <ChevronRight size={14} className="text-slate-400" />}
                </button>

                {isHovered && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white rounded-md shadow-sm border border-slate-100 px-1 py-0.5 z-10">
                    <button
                      onClick={e => { e.stopPropagation(); onEditKeywordFilter(kf) }}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(kf.id, onDeleteKeywordFilter) }}
                      className={`p-1 rounded transition-colors ${
                        confirmDelete === kf.id ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-500'
                      }`}
                      title={confirmDelete === kf.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {keywordFilters.length === 0 && (
            <button
              onClick={onAddKeywordFilter}
              className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1.5"
            >
              <Search size={11} /> Create your first saved search
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0 space-y-1">
        <button onClick={onAddCategory} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Plus size={14} /> New Category
        </button>
        <button onClick={onAddKeywordFilter} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Search size={14} /> New Saved Search
        </button>
        <div className="border-t border-slate-100 pt-2 mt-1">
          {userEmail && <p className="text-xs text-slate-400 px-3 pb-1 truncate">{userEmail}</p>}
          <button onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
