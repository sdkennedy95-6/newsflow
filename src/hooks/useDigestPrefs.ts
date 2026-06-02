import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface DigestPrefs {
  digestEmail: string
  enabled: boolean
  sendHour: number // 0–23 UTC
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
      .select('digest_email, enabled, send_hour')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({ digestEmail: data.digest_email, enabled: data.enabled, sendHour: data.send_hour })
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
      const body = await res.json()
      if (!res.ok || body.errors?.length) {
        setSendResult({ ok: false, message: body.errors?.[0] ?? 'Send failed' })
      } else {
        setSendResult({ ok: true, message: 'Digest sent! Check your inbox.' })
      }
    } catch (e) {
      setSendResult({ ok: false, message: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setSending(false)
    }
  }, [])

  return { prefs, loading, saving, sending, sendResult, savePrefs, sendNow }
}
