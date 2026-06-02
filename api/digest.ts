// No SDK imports — use direct fetch calls so this runs on Edge runtime.
// Edge runtime gives 25 s on hobby vs 10 s for Node.js serverless.
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'edge' }

const RSS2JSON = 'https://api.rss2json.com/v1/api.json'
const FEED_TIMEOUT_MS = 5_000

const REQUIRED_ENV = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'RESEND_API_KEY',
] as const

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawArticle {
  title: string
  link: string
  feedName: string
  categoryName: string
  pubDate: string
  description: string
}

interface DigestArticle extends RawArticle {
  summary: string
}

// ── Anthropic via direct fetch (SDK uses Node built-ins, incompatible w/ Edge)

async function callClaude(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json() as { content: Array<{ type: string; text: string }> }
  return data.content?.[0]?.text ?? ''
}

// ── RSS fetching ──────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

async function fetchArticlesForUser(
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<RawArticle[]> {
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, feeds')
    .eq('user_id', userId)

  if (!categories?.length) return []

  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  const articles: RawArticle[] = []

  await Promise.allSettled(
    categories.flatMap((cat) => {
      const feeds = (cat.feeds as Array<{ url: string; name: string }>) ?? []
      return feeds.map(async (feed) => {
        try {
          const res = await fetch(
            `${RSS2JSON}?rss_url=${encodeURIComponent(feed.url)}`,
            { signal: AbortSignal.timeout(FEED_TIMEOUT_MS) }
          )
          if (!res.ok) return
          const data = await res.json() as { status: string; items?: Array<Record<string, string>> }
          if (data.status !== 'ok') return
          for (const item of data.items ?? []) {
            if (!item['link']) continue
            if (new Date(item['pubDate']).getTime() < cutoff) continue
            articles.push({
              title: stripHtml(item['title'] ?? ''),
              link: item['link'],
              feedName: feed.name,
              categoryName: cat.name,
              pubDate: item['pubDate'],
              description: stripHtml(item['description'] || item['content'] || '').slice(0, 400),
            })
          }
        } catch {
          // skip failed feed
        }
      })
    })
  )

  const seen = new Set<string>()
  return articles
    .filter((a) => (seen.has(a.link) ? false : (seen.add(a.link), true)))
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
}

// ── Claude: pick top 10 + summarise ──────────────────────────────────────────

async function selectAndSummarize(
  articles: RawArticle[],
  apiKey: string
): Promise<DigestArticle[]> {
  if (articles.length === 0) return []

  const pool = articles.slice(0, 60)
  const articleList = pool
    .map(
      (a, i) =>
        `${i + 1}. [${a.categoryName} / ${a.feedName}] ${a.title}\n` +
        `   ${a.description}\n` +
        `   Published: ${a.pubDate} | URL: ${a.link}`
    )
    .join('\n\n')

  const raw = await callClaude(
    apiKey,
    'You are a skilled news editor curating a daily digest email. ' +
      'Select stories that are important, timely, and varied across topics. ' +
      'Write summaries that are informative and engaging — no fluff.',
    `From the articles below, select the 10 most newsworthy or interesting stories. ` +
      `For each, write a summary in 100 words or fewer that captures the key facts and why it matters.\n\n` +
      `Return ONLY a valid JSON array — no markdown, no commentary:\n` +
      `[{"index": <1-based number>, "summary": "<summary text>"}]\n\n` +
      `Articles:\n\n${articleList}`
  )

  let selections: Array<{ index: number; summary: string }> = []
  try {
    const clean = raw.replace(/^```json\s*|\s*```$/g, '').trim()
    selections = JSON.parse(clean)
  } catch {
    return pool.slice(0, 10).map((a) => ({ ...a, summary: a.description }))
  }

  return selections
    .slice(0, 10)
    .map((s) => {
      const article = pool[s.index - 1]
      if (!article) return null
      return { ...article, summary: s.summary }
    })
    .filter((a): a is DigestArticle => a !== null)
}

// ── Email template ────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch { return dateStr }
}

function buildEmail(articles: DigestArticle[], date: string): string {
  const cards = articles.map((a, i) => `
    <div style="background:#ffffff;border-radius:14px;padding:22px 24px;margin-bottom:16px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
      <div style="margin-bottom:10px;">
        <span style="display:inline-block;background:#eff6ff;color:#2563eb;font-size:11px;font-weight:700;padding:2px 9px;border-radius:100px;letter-spacing:0.4px;margin-right:8px;">#${i + 1}</span>
        <span style="color:#94a3b8;font-size:12px;">${a.feedName}</span>
        <span style="color:#cbd5e1;font-size:12px;margin:0 5px;">·</span>
        <span style="color:#94a3b8;font-size:12px;">${fmtDate(a.pubDate)}</span>
      </div>
      <h2 style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 10px;line-height:1.45;">${a.title}</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 14px;">${a.summary}</p>
      <a href="${a.link}" style="color:#2B5BAA;font-size:13px;font-weight:600;text-decoration:none;">Read full story →</a>
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>The Loop — Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:36px 16px 52px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:#2B5BAA;border-radius:16px;padding:12px 16px;margin-bottom:14px;">
      <span style="color:#C8E600;font-weight:800;font-size:20px;letter-spacing:-0.5px;font-family:Arial,sans-serif;">The LOOP</span>
    </div>
    <h1 style="color:#0f172a;font-size:26px;font-weight:700;margin:0 0 6px;letter-spacing:-0.4px;">Your Daily Digest</h1>
    <p style="color:#64748b;font-size:14px;margin:0;">${date}&nbsp;·&nbsp;Top ${articles.length} stories</p>
  </div>
  <div style="height:1px;background:#e2e8f0;margin-bottom:24px;"></div>
  ${cards}
  <div style="text-align:center;margin-top:36px;padding-top:24px;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;line-height:1.7;margin:0 0 4px;">
      You're receiving this because you enabled the daily digest in <strong>The Loop</strong>.
    </p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;">To unsubscribe, disable the digest in your sidebar settings.</p>
  </div>
</div>
</body>
</html>`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k])
  if (missing.length) {
    return new Response(
      JSON.stringify({ error: `Missing env vars: ${missing.join(', ')}. Add in Vercel → Settings → Environment Variables, then redeploy.` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const resend = new Resend(process.env.RESEND_API_KEY)
  const anthropicKey = process.env.ANTHROPIC_API_KEY!

  const authHeader = req.headers.get('authorization') ?? ''
  let targetUserId: string | null = null

  if (req.method === 'POST') {
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    targetUserId = data.user.id
  } else if (req.method === 'GET') {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let query = supabase.from('digest_prefs').select('*').eq('enabled', true)
  if (targetUserId) query = query.eq('user_id', targetUserId)

  const { data: prefs, error: prefsError } = await query
  if (prefsError) {
    return new Response(JSON.stringify({ error: prefsError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
  if (!prefs?.length) {
    return new Response(JSON.stringify({ sent: 0, message: 'No active digest subscriptions found. Make sure the digest is enabled and saved.' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'The Loop <onboarding@resend.dev>'

  let sent = 0
  const errors: string[] = []

  for (const pref of prefs) {
    try {
      const articles = await fetchArticlesForUser(pref.user_id, supabase)
      if (articles.length === 0) { errors.push('No articles found in the last 48 h — check your feeds'); continue }

      const top10 = await selectAndSummarize(articles, anthropicKey)
      if (top10.length === 0) continue

      const html = buildEmail(top10, date)

      const { error: sendError } = await resend.emails.send({
        from: fromAddress,
        to: pref.digest_email,
        subject: `The Loop — ${date}`,
        html,
      })

      if (sendError) errors.push(`Email error: ${sendError.message}`)
      else sent++
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
    }
  }

  return new Response(JSON.stringify({ sent, errors }), { headers: { 'Content-Type': 'application/json' } })
}
