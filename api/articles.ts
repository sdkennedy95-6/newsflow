import {
  checkAuth,
  fetchAllArticles,
  clampLimit,
  parseMultiParam,
  applyFilters,
  paginateArticles,
} from './_shared.js'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const authDenied = checkAuth(req)
  if (authDenied) return authDenied

  const url = new URL(req.url)

  const limit = clampLimit(url.searchParams.get('limit'))

  const sinceRaw = url.searchParams.get('since')
  const sinceMs = sinceRaw ? new Date(sinceRaw).getTime() : null

  const sources = parseMultiParam(url.searchParams.getAll('source'))
  const categories = parseMultiParam(url.searchParams.getAll('category'))
  const paginate = url.searchParams.has('paginate')
  const cursor = url.searchParams.get('cursor')

  // Fetch, filter — always filter before limiting
  let articles = await fetchAllArticles()
  articles = applyFilters(articles, {
    sources,
    categories,
    sinceMs: sinceMs !== null && !isNaN(sinceMs) ? sinceMs : null,
  })

  const cacheHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 's-maxage=300, stale-while-revalidate=300',
    'Access-Control-Allow-Origin': '*',
  }

  if (paginate) {
    // New paginated shape: { articles, nextCursor, total }
    const { page, nextCursor, total } = paginateArticles(articles, cursor, limit)
    return new Response(JSON.stringify({ articles: page, nextCursor, total }), {
      headers: cacheHeaders,
    })
  }

  // Legacy shape kept for backward compatibility: { articles, count }
  const page = articles.slice(0, limit)
  return new Response(JSON.stringify({ articles: page, count: page.length }), {
    headers: cacheHeaders,
  })
}
