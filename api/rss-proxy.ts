declare const process: { env: Record<string, string | undefined> }

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const rssUrl = url.searchParams.get('rss_url')
  if (!rssUrl) {
    return new Response(JSON.stringify({ status: 'error', message: 'missing rss_url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const upstream = new URL('https://api.rss2json.com/v1/api.json')
  upstream.searchParams.set('rss_url', rssUrl)
  const apiKey = process.env.RSS2JSON_API_KEY
  if (apiKey) upstream.searchParams.set('api_key', apiKey)

  const res = await fetch(upstream.toString(), { signal: AbortSignal.timeout(10_000) })
  const body = await res.text()

  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
