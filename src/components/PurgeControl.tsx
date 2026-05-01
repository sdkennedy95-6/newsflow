import { useState, useRef, useEffect } from 'react'
import { Trash2, ChevronDown, ShieldCheck } from 'lucide-react'

const PURGE_OPTIONS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '30 days', days: 30 },
  { label: '45 days', days: 45 },
  { label: '90 days', days: 90 },
  { label: 'Never', days: 0 },
]

interface Props {
  purgeDays: number
  protectSaved: boolean
  onChangeDays: (days: number) => void
  onToggleProtect: () => void
}

export function PurgeControl({ purgeDays, protectSaved, onChangeDays, onToggleProtect }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const label = PURGE_OPTIONS.find(o => o.days === purgeDays)?.label ?? `${purgeDays}d`

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
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
          purgeDays > 0
            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
        }`}
      >
        <Trash2 size={12} />
        {purgeDays > 0 ? `Purge >${label}` : 'No purge'}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl shadow-lg border border-slate-100 py-1.5 z-30">
          <div className="px-4 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-widest">Hide articles older than</div>

          {PURGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => { onChangeDays(opt.days); setOpen(false) }}
              className={`w-full flex items-center justify-between px-4 py-1.5 text-sm hover:bg-slate-50 transition-colors ${
                purgeDays === opt.days ? 'text-blue-700 font-medium' : 'text-slate-700'
              }`}
            >
              {opt.label}
              {purgeDays === opt.days && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>
          ))}

          {purgeDays > 0 && (
            <div className="border-t border-slate-100 mt-1 pt-1 px-4 pb-1">
              <button
                onClick={onToggleProtect}
                className="flex items-center gap-2 w-full text-sm text-slate-700 hover:text-slate-900 transition-colors py-1.5"
              >
                <ShieldCheck size={13} className={protectSaved ? 'text-blue-500' : 'text-slate-300'} />
                <span className="flex-1 text-left">Protect saved articles</span>
                <div className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${
                  protectSaved ? 'bg-blue-500' : 'bg-slate-200'
                }`}>
                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                    protectSaved ? 'translate-x-3' : 'translate-x-0'
                  }`} />
                </div>
              </button>
              <p className="text-xs text-slate-400 mt-0.5 pb-0.5">
                {protectSaved
                  ? 'Saved articles are kept regardless of age'
                  : 'Saved articles will also be purged from the database'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
