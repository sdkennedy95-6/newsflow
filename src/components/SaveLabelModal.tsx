import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { SaveLabel } from '../types'
import { FILTER_COLORS } from '../hooks/useKeywordFilters'
import { FILTER_COLOR_STYLES } from './KeywordFilterModal'

interface Props {
  label?: SaveLabel | null
  onSave: (data: Omit<SaveLabel, 'id'>) => void
  onClose: () => void
}

export function SaveLabelModal({ label, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('violet')
  const [error, setError] = useState('')

  useEffect(() => {
    if (label) { setName(label.name); setColor(label.color) }
    else { setName(''); setColor('violet') }
  }, [label])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    onSave({ name: name.trim(), color })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{label ? 'Edit Label' : 'New Label'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Label Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="e.g., Save for blog, Read later"
              autoFocus
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-shadow ${
                error ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
              }`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Color</label>
            <div className="flex gap-2">
              {FILTER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full ${FILTER_COLOR_STYLES[c].dot} transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={c}
                />
              ))}
            </div>
          </div>
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
              {label ? 'Save Changes' : 'Create Label'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
