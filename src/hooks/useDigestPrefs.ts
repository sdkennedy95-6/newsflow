import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface DigestPrefs {
  digestEmail: string
  enabled: boolean
  sendHour: number // 0–23 UTC
  categoryIds: string[] | null // null = all categories
}

export function useDigestPrefs(userId: string | null) {
  const [prefs, setPrefs] = useState<DigestPrefs | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (!userId) { setPrefs(null); return }
    setLoading(true)
    supabase
      .from('digest_prefs')
      .select('digest_email, enabled, send_hour, category_ids')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({ digestEmail: data.digest_email, enabled: data.enabled, sendHour: data.send_hour, categoryIds: data.category_ids ?? null })
        }
        setLoading(false)
      })
  }, [userId])

  const savePrefs = useCallback(async (updates: DigestPrefs) => {
    if (!userId) return
    setSaving(true)
    const { error } = await supabase.from('digest_prefs').upsert(
      {
        user_id: userId,
        digest_email: updates.digestEmail,
        enabled: updates.enabled,
        send_hour: updates.sendHour,
        category_ids: updates.categoryIds ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (!error) setPrefs(updates)
    setSaving(false)
  }, [userId])

  const sendNow = useCallback(async () => {
    setSending(true)
    setSendResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      // Always read as text first — a missing env var causes a non-JSON crash response
      const text = await res.text()
      let body: { sent?: number; errors?: string[]; error?: string; message?: string } = {}
      try { body = JSON.parse(text) } catch { /* leave body empty */ }

      if (!res.ok) {
        const detail = body.error ?? text.slice(0, 120)
        setSendResult({ ok: false, message: detail || `Server error (${res.status})` })
      } else if (body.errors?.length) {
        setSendResult({ ok: false, message: body.errors[0] })
      } else if (body.sent === 0) {
        setSendResult({ ok: false, message: 'No digest prefs found. Save your settings first.' })
      } else {
        setSendResult({ ok: true, message: 'Digest sent — check your inbox!' })
      }
    } catch (e) {
      setSendResult({ ok: false, message: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setSending(false)
    }
  }, [])

  return { prefs, loading, saving, sending, sendResult, savePrefs, sendNow }
}
