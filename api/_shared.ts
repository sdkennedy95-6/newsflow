// Shared utilities for public API endpoints (articles + digest page).
// Prefixed with _ so Vercel does not treat this as a route.

// Edge runtime has process.env but @types/node is not in scope here.
declare const process: { env: Record<string, string | undefined> }

export interface FeedDef {
  url: string
  name: string
  category: string
}

// Fallback used when LOOP_OWNER_USER_ID / Supabase env vars are not set.
// Prefer setting LOOP_OWNER_USER_ID so the API always reflects your live feeds.
export const DEFAULT_FEEDS: FeedDef[] = [
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'Technology' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', category: 'Technology' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'Technology' },
  { url: 'https://medcitynews.com/feed/', name: 'MedCity News', category: 'Health Tech' },
  { url: 'https://www.mobihealthnews.com/rss.xml', name: 'MobiHealthNews', category: 'Health Tech' },
  { url: 'https://www.healthcareitnews.com/rss.xml', name: 'Healthcare IT News', category: 'Health Tech' },
]

// Fetches the owner's configured categories from Supabase via the REST API
// (service role bypasses RLS). Returns DEFAULT_FEEDS if env vars are missing.
async function fetchOwnerFeeds(): Promise<FeedDef[]> {
  const ownerUserId = process.env.LOOP_OWNER_USER_ID
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!ownerUserId || !supabaseUrl || !serviceKey) return DEFAULT_FEEDS

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?user_id=eq.${encodeURIComponent(ownerUserId)}&select=name,feeds`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        signal: AbortSignal.timeout(5_000),
      }
    )
    if (!res.ok) return DEFAULT_FEEDS
    const rows: Array<{ name: string; feeds: Array<{ url: string; name: string }> }> = await res.json()
    if (!rows?.length) return DEFAULT_FEEDS
    return rows.flatMap(cat =>
      (cat.feeds ?? []).map(f => ({ url: f.url, name: f.name, category: cat.name }))
    )
  } catch {
    return DEFAULT_FEEDS
  }
}

export interface ArticleOut {
  title: string
  source: string
  category: string
  url: string
  publishedAt: string
  summary: string | null
}

const RSS2JSON = 'https://api.rss2json.com/v1/api.json'
const FEED_TIMEOUT_MS = 5_000

interface RSSItem {
  title?: string
  pubDate?: string
  link?: string
  description?: string
  content?: string
}

interface RSSResponse {
  status: string
  items?: RSSItem[]
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

function toISO(s: string | undefined): string {
  if (!s) return new Date(0).toISOString()
  const d = new Date(s)
  return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString()
}

export async function fetchFeed(feed: FeedDef): Promise<ArticleOut[]> {
  try {
    const res = await fetch(
      `${RSS2JSON}?rss_url=${encodeURIComponent(feed.url)}`,
      { signal: AbortSignal.timeout(FEED_TIMEOUT_MS) }
    )
    if (!res.ok) return []
    const data: RSSResponse = await res.json()
    if (data.status !== 'ok' || !data.items) return []

    return data.items
      .filter(item => item.link)
      .map(item => ({
        title: stripHtml(item.title ?? ''),
        source: feed.name,
        category: feed.category,
        url: item.link!,
        publishedAt: toISO(item.pubDate),
        summary: item.description
          ? stripHtml(item.description).slice(0, 300) || null
          : null,
      }))
  } catch {
    return []
  }
}

// Returns null if the request is allowed, or a 401 Response if not.
// The check is skipped entirely when DIGEST_TOKEN is not set.
export function checkAuth(req: Request): Response | null {
  const token = process.env.DIGEST_TOKEN
  if (!token) return null

  const authHeader = req.headers.get('authorization') ?? ''
  const keyParam = new URL(req.url).searchParams.get('key') ?? ''

  if (authHeader === `Bearer ${token}` || keyParam === token) return null

  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Bearer realm="The Loop"',
    },
  })
}

export async function fetchAllArticles(): Promise<ArticleOut[]> {
  const feeds = await fetchOwnerFeeds()
  const results = await Promise.allSettled(feeds.map(fetchFeed))
  const seen = new Set<string>()
  return results
    .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    .filter(a => {
      if (seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}
