import { useState, useRef, useEffect } from 'react'
import { Mail, ChevronDown, Send, Check, AlertCircle, Loader2 } from 'lucide-react'
import type { DigestPrefs } from '../hooks/useDigestPrefs'

const SEND_HOURS = [
  { label: '6 am UTC', value: 6 },
  { label: '7 am UTC', value: 7 },
  { label: '8 am UTC', value: 8 },
  { label: '12 pm UTC', value: 12 },
  { label: '5 pm UTC', value: 17 },
]

interface Props {
  prefs: DigestPrefs | null
  loading: boolean
  saving: boolean
  sending: boolean
  sendResult: { ok: boolean; message: string } | null
  onSave: (prefs: DigestPrefs) => void
  onSendNow: () => void
}

export function DigestSettings({ prefs, loading, saving, sending, sendResult, onSave, onSendNow }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [sendHour, setSendHour] = useState(7)
  const [dirty, setDirty] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Sync form state when prefs load
  useEffect(() => {
    if (prefs) {
      setEmail(prefs.digestEmail)
      setEnabled(prefs.enabled)
      setSendHour(prefs.sendHour)
    }
    setDirty(false)
  }, [prefs])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleChange = <K extends keyof DigestPrefs>(field: K, value: DigestPrefs[K]) => {
    if (field === 'digestEmail') setEmail(value as string)
    if (field === 'enabled') setEnabled(value as boolean)
    if (field === 'sendHour') setSendHour(value as number)
    setDirty(true)
  }

  const handleSave = () => {
    onSave({ digestEmail: email, enabled, sendHour })
    setDirty(false)
  }

  const isActive = prefs?.enabled ?? false
  const sendHourLabel = SEND_HOURS.find(h => h.value === sendHour)?.label ?? `${sendHour}:00 UTC`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
          isActive
            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300'
            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
        }`}
      >
        <Mail size={12} />
        {isActive ? 'Digest on' : 'Daily digest'}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-40 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Daily Digest</p>
              <p className="text-xs text-slate-400 mt-0.5">Top 10 stories, summarised by AI</p>
            </div>
            {/* Enable toggle */}
            <button
              onClick={() => handleChange('enabled', !enabled)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${
                enabled ? 'bg-blue-500' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {/* Email address */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                  Send to
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => handleChange('digestEmail', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>

              {/* Send time */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                  Send time
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SEND_HOURS.map(h => (
                    <button
                      key={h.value}
                      onClick={() => handleChange('sendHour', h.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        sendHour === h.value
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status / send result */}
              {sendResult && (
                <div className={`flex items-start gap-2 p-2.5 rounded-xl text-xs ${
                  sendResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {sendResult.ok
                    ? <Check size={13} className="flex-shrink-0 mt-0.5" />
                    : <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  }
                  {sendResult.message}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {dirty ? (
                  <button
                    onClick={handleSave}
                    disabled={saving || !email}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Save
                  </button>
                ) : (
                  <button
                    onClick={onSendNow}
                    disabled={sending || !email || !enabled}
                    title={!enabled ? 'Enable digest first' : !email ? 'Add an email address' : `Send today's digest to ${email}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Send today's digest
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center pb-0.5">
                Sent daily at {sendHourLabel} · powered by Claude AI
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
