export const config = { runtime: 'edge' }

function extractText(xml: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = xml.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i'))
  if (!m) return ''
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = xml.match(new RegExp(`<${escaped}[^>]*\\s${attr}=["']([^"']+)["']`, 'i'))
  return m ? m[1] : ''
}

function splitItems(xml: string): string[] {
  const items: string[] = []
  let pos = 0
  while (true) {
    const open = xml.indexOf('<item', pos)
    if (open === -1) break
    const closeAngle = xml.indexOf('>', open)
    if (closeAngle === -1) break
    const end = xml.indexOf('</item>', closeAngle)
    if (end === -1) break
    items.push(xml.slice(closeAngle + 1, end))
    pos = end + 7
  }
  return items
}

function parseItems(xml: string) {
  return splitItems(xml).map(item => {
    const encUrl = extractAttr(item, 'enclosure', 'url')
    const encType = extractAttr(item, 'enclosure', 'type')
    const encLen = extractAttr(item, 'enclosure', 'length')
    const thumbUrl =
      extractAttr(item, 'media:thumbnail', 'url') ||
      extractAttr(item, 'media:content', 'url') ||
      null

    // <link> is sometimes an Atom self-closing tag with href attr
    const link =
      extractAttr(item, 'link', 'href') ||
      extractText(item, 'link')

    return {
      title: extractText(item, 'title'),
      pubDate: extractText(item, 'pubDate') || extractText(item, 'dc:date') || extractText(item, 'published'),
      link,
      guid: extractText(item, 'guid'),
      author: extractText(item, 'author') || extractText(item, 'dc:creator'),
      thumbnail: thumbUrl,
      description: extractText(item, 'description'),
      content: extractText(item, 'content:encoded') || extractText(item, 'content'),
      enclosure: encUrl ? { link: encUrl, type: encType, length: parseInt(encLen) || 0 } : {},
      itunes_duration: extractText(item, 'itunes:duration') || undefined,
    }
  })
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const rssUrl = url.searchParams.get('rss_url')
  if (!rssUrl) {
    return new Response(JSON.stringify({ status: 'error', message: 'missing rss_url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let res: Response
  try {
    res = await fetch(rssUrl, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; TheLoop/1.0)',
      },
    })
  } catch {
    return new Response(JSON.stringify({ status: 'error', message: 'fetch failed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  if (!res.ok) {
    return new Response(JSON.stringify({ status: 'error', message: `HTTP ${res.status}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const xml = await res.text()
  const items = parseItems(xml)

  return new Response(JSON.stringify({ status: 'ok', items }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
