import { checkAuth, fetchAllArticles } from './_shared'
import type { ArticleOut } from './_shared'

export const config = { runtime: 'edge' }

const PAGE_LIMIT = 50

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function buildHtml(articles: ArticleOut[]): string {
  const now = new Date().toISOString()
  const rows = articles
    .map(
      (a, i) => `
    <article>
      <span class="n">${i + 1}</span>
      <div class="body">
        <a href="${a.url}" rel="noopener noreferrer">${a.title}</a>
        <div class="meta">
          <span class="source">${a.source}</span>
          <span class="sep">·</span>
          <span class="cat">${a.category}</span>
          <span class="sep">·</span>
          <time datetime="${a.publishedAt}" title="${a.publishedAt}">
            ${relativeTime(a.publishedAt)} &nbsp;(${a.publishedAt})
          </time>
        </div>
        ${a.summary ? `<p class="summary">${a.summary}</p>` : ''}
      </div>
    </article>`
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Loop — Digest</title>
  <link rel="alternate" type="application/json" href="/api/articles" title="The Loop JSON feed">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif; background: #f8fafc; color: #0f172a; padding: 2rem 1rem; }
    header { max-width: 720px; margin: 0 auto 2rem; }
    header h1 { font-size: 1.5rem; font-weight: 700; }
    header p { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
    main { max-width: 720px; margin: 0 auto; }
    article { display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #e2e8f0; }
    article:last-child { border-bottom: none; }
    .n { flex-shrink: 0; font-size: 0.75rem; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 100px; align-self: flex-start; margin-top: 2px; }
    .body { flex: 1; min-width: 0; }
    .body a { font-size: 1rem; font-weight: 600; color: #0f172a; text-decoration: none; line-height: 1.4; }
    .body a:hover { color: #2563eb; text-decoration: underline; }
    .meta { display: flex; flex-wrap: wrap; gap: 0.25rem 0; font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; align-items: center; }
    .source { font-weight: 600; color: #475569; }
    .cat { color: #94a3b8; }
    .sep { color: #cbd5e1; margin: 0 0.25rem; }
    time { font-family: monospace; font-size: 0.7rem; color: #94a3b8; }
    .summary { font-size: 0.875rem; color: #475569; line-height: 1.6; margin-top: 0.4rem; }
    footer { max-width: 720px; margin: 2rem auto 0; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
  </style>
</head>
<body>
  <header>
    <h1>The Loop — Digest</h1>
    <p>
      <time datetime="${now}">${fmtDate(now)}</time>
      &nbsp;·&nbsp;${articles.length} articles
      &nbsp;·&nbsp;<a href="/api/articles">JSON feed</a>
    </p>
  </header>
  <main>
    ${rows}
  </main>
  <footer>
    Public read-only digest · <a href="/api/articles">GET /api/articles</a>
  </footer>
</body>
</html>`
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authDenied = checkAuth(req)
  if (authDenied) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer realm="The Loop"' },
    })
  }

  const articles = (await fetchAllArticles()).slice(0, PAGE_LIMIT)
  const html = buildHtml(articles)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=300',
    },
  })
}
