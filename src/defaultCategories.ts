import type { Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'technology',
    name: 'Technology',
    color: 'blue',
    icon: '💻',
    isDefault: true,
    feeds: [
      { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
      { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' },
      { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
    ],
  },
  {
    id: 'health-tech',
    name: 'Health Tech',
    color: 'purple',
    icon: '🏥',
    isDefault: true,
    feeds: [
      { url: 'https://medcitynews.com/feed/', name: 'MedCity News' },
      { url: 'https://www.mobihealthnews.com/rss.xml', name: 'MobiHealthNews' },
      { url: 'https://www.healthcareitnews.com/rss.xml', name: 'Healthcare IT News' },
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    color: 'green',
    icon: '⚽',
    isDefault: true,
    feeds: [
      { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN' },
      { url: 'http://feeds.bbci.co.uk/sport/rss.xml', name: 'BBC Sport' },
      { url: 'https://sports.yahoo.com/rss/', name: 'Yahoo Sports' },
    ],
  },
  {
    id: 'politics',
    name: 'Politics',
    color: 'red',
    icon: '🏛️',
    isDefault: true,
    feeds: [
      { url: 'https://feeds.npr.org/1014/rss.xml', name: 'NPR Politics' },
      { url: 'https://rss.politico.com/politics-news.xml', name: 'Politico' },
      { url: 'https://thehill.com/rss/syndicator/19110', name: 'The Hill' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    color: 'amber',
    icon: '📈',
    isDefault: true,
    feeds: [
      { url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', name: 'CNBC' },
      { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', name: 'MarketWatch' },
      { url: 'https://fortune.com/feed/', name: 'Fortune' },
    ],
  },
  {
    id: 'science',
    name: 'Science',
    color: 'cyan',
    icon: '🔬',
    isDefault: true,
    feeds: [
      { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'Science Daily' },
      { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', name: 'NASA' },
      { url: 'https://www.newscientist.com/feed/home/', name: 'New Scientist' },
    ],
  },
]

export const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string; dot: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   badge: 'bg-cyan-100 text-cyan-700',   dot: 'bg-cyan-500' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200',   badge: 'bg-pink-100 text-pink-700',   dot: 'bg-pink-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-700',   dot: 'bg-teal-500' },
}
