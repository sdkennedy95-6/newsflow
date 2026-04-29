import { Search, Menu, X } from 'lucide-react'

interface Props {
  searchQuery: string
  onSearchChange: (q: string) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Header({ searchQuery, onSearchChange, sidebarOpen, onToggleSidebar }: Props) {
  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center gap-4 px-4 flex-shrink-0">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search articles…"
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
        <span className="hidden sm:block">Powered by RSS</span>
      </div>
    </header>
  )
}
