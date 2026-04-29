export interface RSSFeed {
  url: string
  name: string
}

export interface Category {
  id: string
  name: string
  color: CategoryColor
  icon: string
  feeds: RSSFeed[]
  isDefault?: boolean
}

export type CategoryColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'amber'
  | 'cyan'
  | 'pink'
  | 'indigo'
  | 'orange'
  | 'teal'

export interface Article {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  thumbnail: string | null
  author: string
  categoryId: string
  feedName: string
  isRead: boolean
  isSaved: boolean
  labelId?: string
}

export interface SaveLabel {
  id: string
  name: string
  color: string
}

export interface RSSItem {
  title: string
  pubDate: string
  link: string
  guid: string
  author: string
  thumbnail: string
  description: string
  content: string
  enclosure: { link?: string; type?: string }
}

export interface RSSResponse {
  status: string
  feed: { title: string; link: string; image: string }
  items: RSSItem[]
}

export interface KeywordFilter {
  id: string
  name: string
  keywords: string[]
  color: string
}
