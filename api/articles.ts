import { checkAuth, fetchAllArticles } from './_shared'

export const config = { runtime: 'edge' }

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

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

  const rawLimit = parseInt(url.searchParams.get('limit') ?? '', 10)
  const limit = Math.min(
    Math.max(1, isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit),
    MAX_LIMIT
  )

  const sinceParam = url.searchParams.get('since')
  const sinceMs = sinceParam ? new Date(sinceParam).getTime() : null

  let articles = await fetchAllArticles()

  if (sinceMs !== null && !isNaN(sinceMs)) {
    articles = articles.filter(a => new Date(a.publishedAt).getTime() > sinceMs)
  }

  articles = articles.slice(0, limit)

  return new Response(JSON.stringify({ articles, count: articles.length }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
