import { Search, Menu, X } from 'lucide-react'

interface Props {
  searchQuery: string
  onSearchChange: (q: string) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Header({ searchQuery, onSearchChange, sidebarOpen, onToggleSidebar }: Props) {
  return (
    <header className="h-16 bg-white shadow-sm flex items-center gap-3 px-4 flex-shrink-0 z-10">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* M3 Search bar */}
      <div className="relative flex-1 max-w-lg">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search articles…"
          className="w-full pl-11 pr-10 py-2.5 rounded-full bg-slate-100 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 transition-all border-0"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </header>
  )
}
