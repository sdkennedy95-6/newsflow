import { describe, it, expect } from 'vitest'
import {
  clampLimit,
  parseMultiParam,
  applyFilters,
  encodeCursor,
  decodeCursor,
  paginateArticles,
  compareArticles,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from './_shared.js'
import type { ArticleOut } from './_shared.js'

function makeArticle(overrides: Partial<ArticleOut> = {}): ArticleOut {
  return {
    title: 'Test Article',
    source: 'Test Source',
    category: 'Test Category',
    url: 'https://example.com/article',
    publishedAt: '2026-10-01T10:00:00.000Z',
    summary: null,
    ...overrides,
  }
}

// Build a sorted list of N distinct articles, newest first
function makeArticles(n: number, baseMs = 1_760_000_000_000): ArticleOut[] {
  return Array.from({ length: n }, (_, i) =>
    makeArticle({
      url: `https://example.com/${String(i).padStart(4, '0')}`,
      publishedAt: new Date(baseMs - i * 60_000).toISOString(),
    })
  )
}

// ── clampLimit ────────────────────────────────────────────────────────────────

describe('clampLimit', () => {
  it(`defaults to ${DEFAULT_LIMIT} when param is absent`, () => {
    expect(clampLimit(null)).toBe(DEFAULT_LIMIT)
  })
  it('accepts a value within range', () => {
    expect(clampLimit('100')).toBe(100)
  })
  it(`clamps above ${MAX_LIMIT} to ${MAX_LIMIT}`, () => {
    expect(clampLimit(String(MAX_LIMIT + 1))).toBe(MAX_LIMIT)
    expect(clampLimit('9999')).toBe(MAX_LIMIT)
  })
  it(`allows exactly ${MAX_LIMIT}`, () => {
    expect(clampLimit(String(MAX_LIMIT))).toBe(MAX_LIMIT)
  })
  it('clamps 0 to 1', () => {
    expect(clampLimit('0')).toBe(1)
  })
  it('clamps negative to 1', () => {
    expect(clampLimit('-10')).toBe(1)
  })
  it(`falls back to default for non-numeric`, () => {
    expect(clampLimit('abc')).toBe(DEFAULT_LIMIT)
    expect(clampLimit('')).toBe(DEFAULT_LIMIT)
  })
})

// ── parseMultiParam ───────────────────────────────────────────────────────────

describe('parseMultiParam', () => {
  it('lowercases and trims', () => {
    expect(parseMultiParam(['  HIT Consultant  '])).toEqual(['hit consultant'])
  })
  it('splits comma-separated values', () => {
    expect(parseMultiParam(['HIT Consultant,Health API Guy'])).toEqual([
      'hit consultant',
      'health api guy',
    ])
  })
  it('handles repeated params', () => {
    expect(parseMultiParam(['ESPN', 'BBC Sport'])).toEqual(['espn', 'bbc sport'])
  })
  it('combines comma-separated and repeated', () => {
    expect(parseMultiParam(['MedCity,HIT', 'ESPN'])).toEqual(['medcity', 'hit', 'espn'])
  })
  it('returns empty array for empty input', () => {
    expect(parseMultiParam([])).toEqual([])
  })
  it('filters blank entries', () => {
    expect(parseMultiParam([',,,'])).toEqual([])
  })
})

// ── applyFilters ──────────────────────────────────────────────────────────────

describe('applyFilters', () => {
  const articles = [
    makeArticle({ source: 'MedCity News',    category: 'Health Tech', url: 'https://a.com', publishedAt: '2026-10-01T10:00:00Z' }),
    makeArticle({ source: 'ESPN',            category: 'Sports',      url: 'https://b.com', publishedAt: '2026-10-01T09:00:00Z' }),
    makeArticle({ source: 'HIT Consultant',  category: 'Health Tech', url: 'https://c.com', publishedAt: '2026-09-30T10:00:00Z' }),
    makeArticle({ source: 'Health API Guy',  category: 'Health Tech', url: 'https://d.com', publishedAt: '2026-09-29T10:00:00Z' }),
  ]
  const noFilter = { sources: [], categories: [], sinceMs: null }

  it('returns all articles with no filters', () => {
    expect(applyFilters(articles, noFilter)).toHaveLength(4)
  })

  it('filters by source substring (case-insensitive)', () => {
    const r = applyFilters(articles, { ...noFilter, sources: ['medcity'] })
    expect(r).toHaveLength(1)
    expect(r[0].source).toBe('MedCity News')
  })

  it('filters by multiple sources (OR semantics)', () => {
    const r = applyFilters(articles, { ...noFilter, sources: ['medcity', 'hit consultant'] })
    expect(r).toHaveLength(2)
    expect(r.map(a => a.source).sort()).toEqual(['HIT Consultant', 'MedCity News'].sort())
  })

  it('filters by comma-parsed source values', () => {
    const sources = parseMultiParam(['MedCity News,HIT Consultant'])
    const r = applyFilters(articles, { ...noFilter, sources })
    expect(r).toHaveLength(2)
  })

  it('filters by category substring', () => {
    const r = applyFilters(articles, { ...noFilter, categories: ['health tech'] })
    expect(r).toHaveLength(3)
  })

  it('filters by multiple categories (OR semantics)', () => {
    const r = applyFilters(articles, { ...noFilter, categories: ['health tech', 'sports'] })
    expect(r).toHaveLength(4)
  })

  it('?since= excludes articles at or before the boundary', () => {
    const sinceMs = new Date('2026-10-01T00:00:00Z').getTime()
    const r = applyFilters(articles, { ...noFilter, sinceMs })
    expect(r).toHaveLength(2)
    expect(r.every(a => new Date(a.publishedAt).getTime() > sinceMs)).toBe(true)
  })

  it('combines source + category + since', () => {
    const sinceMs = new Date('2026-10-01T00:00:00Z').getTime()
    const r = applyFilters(articles, { sources: ['medcity'], categories: ['health tech'], sinceMs })
    expect(r).toHaveLength(1)
    expect(r[0].source).toBe('MedCity News')
  })
})

// ── cursor encoding ───────────────────────────────────────────────────────────

describe('encodeCursor / decodeCursor', () => {
  const a = makeArticle({ url: 'https://example.com/test', publishedAt: '2026-10-01T12:00:00Z' })

  it('round-trips cleanly', () => {
    const cursor = encodeCursor(a)
    const decoded = decodeCursor(cursor)
    expect(decoded).not.toBeNull()
    expect(decoded!.t).toBe(new Date(a.publishedAt).getTime())
    expect(decoded!.u).toBe(a.url)
  })

  it('produces URL-safe characters only', () => {
    const cursor = encodeCursor(a)
    expect(cursor).toMatch(/^[A-Za-z0-9\-_]+$/)
  })

  it('returns null for invalid cursor', () => {
    expect(decodeCursor('not-valid-base64!!!')).toBeNull()
    expect(decodeCursor('aW52YWxpZA')).toBeNull() // valid b64 but wrong shape
  })
})

// ── paginateArticles ──────────────────────────────────────────────────────────

describe('paginateArticles', () => {
  const N = 27
  const articles = makeArticles(N)

  it('first page returns correct count', () => {
    const { page } = paginateArticles(articles, null, 10)
    expect(page).toHaveLength(10)
  })

  it('first page starts with the newest article', () => {
    const { page } = paginateArticles(articles, null, 10)
    expect(page[0].url).toBe(articles[0].url)
  })

  it('total always reflects the full filtered set', () => {
    const { total } = paginateArticles(articles, null, 5)
    expect(total).toBe(N)
  })

  it('nextCursor is null on the last page', () => {
    const { nextCursor } = paginateArticles(articles, null, N)
    expect(nextCursor).toBeNull()
  })

  it('nextCursor is null when limit exceeds count', () => {
    const { nextCursor } = paginateArticles(articles, null, N + 100)
    expect(nextCursor).toBeNull()
  })

  it('pages cover every article with no duplicates or gaps', () => {
    const seen = new Set<string>()
    let cursor: string | null = null
    let collected = 0
    do {
      const { page, nextCursor } = paginateArticles(articles, cursor, 10)
      for (const a of page) {
        expect(seen.has(a.url), `duplicate: ${a.url}`).toBe(false)
        seen.add(a.url)
      }
      collected += page.length
      cursor = nextCursor
    } while (cursor)
    expect(collected).toBe(N)
    expect(seen.size).toBe(N)
  })

  it('pages are ordered newest first within and across pages', () => {
    let prevMs = Infinity
    let cursor: string | null = null
    do {
      const { page, nextCursor } = paginateArticles(articles, cursor, 10)
      for (const a of page) {
        const t = new Date(a.publishedAt).getTime()
        expect(t).toBeLessThanOrEqual(prevMs)
        prevMs = t
      }
      cursor = nextCursor
    } while (cursor)
  })

  it('invalid cursor falls back to first page', () => {
    const { page } = paginateArticles(articles, 'garbage', 10)
    expect(page[0].url).toBe(articles[0].url)
  })

  it('handles same-timestamp articles without gaps', () => {
    const sameTime = Array.from({ length: 10 }, (_, i) =>
      makeArticle({
        url: `https://same.com/${String(i).padStart(2, '0')}`,
        publishedAt: '2026-10-01T10:00:00.000Z',
      })
    ).sort(compareArticles)

    const seen = new Set<string>()
    let cursor: string | null = null
    do {
      const { page, nextCursor } = paginateArticles(sameTime, cursor, 4)
      for (const a of page) {
        expect(seen.has(a.url)).toBe(false)
        seen.add(a.url)
      }
      cursor = nextCursor
    } while (cursor)
    expect(seen.size).toBe(10)
  })
})
