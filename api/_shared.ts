// Shared utilities for public API endpoints (articles + digest page).
// Prefixed with _ so Vercel does not treat this as a route.

export interface FeedDef {
  url: string
  name: string
  category: string
}

// Mirrors the feeds in src/defaultCategories.ts — the source of truth for
// what "default feeds" means to the app. Keep in sync manually.
export const DEFAULT_FEEDS: FeedDef[] = [
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'Technology' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', category: 'Technology' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'Technology' },
  { url: 'https://medcitynews.com/feed/', name: 'MedCity News', category: 'Health Tech' },
  { url: 'https://www.mobihealthnews.com/rss.xml', name: 'MobiHealthNews', category: 'Health Tech' },
  { url: 'https://www.healthcareitnews.com/rss.xml', name: 'Healthcare IT News', category: 'Health Tech' },
  { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN', category: 'Sports' },
  { url: 'http://feeds.bbci.co.uk/sport/rss.xml', name: 'BBC Sport', category: 'Sports' },
  { url: 'https://sports.yahoo.com/rss/', name: 'Yahoo Sports', category: 'Sports' },
  { url: 'https://feeds.npr.org/1014/rss.xml', name: 'NPR Politics', category: 'Politics' },
  { url: 'https://rss.politico.com/politics-news.xml', name: 'Politico', category: 'Politics' },
  { url: 'https://thehill.com/rss/syndicator/19110', name: 'The Hill', category: 'Politics' },
  { url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', name: 'CNBC', category: 'Business' },
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', name: 'MarketWatch', category: 'Business' },
  { url: 'https://fortune.com/feed/', name: 'Fortune', category: 'Business' },
  { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'Science Daily', category: 'Science' },
  { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', name: 'NASA', category: 'Science' },
  { url: 'https://www.newscientist.com/feed/home/', name: 'New Scientist', category: 'Science' },
]

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
  const results = await Promise.allSettled(DEFAULT_FEEDS.map(fetchFeed))
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
