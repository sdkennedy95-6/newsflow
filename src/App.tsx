import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './hooks/useAuth'
import { useCategories } from './hooks/useCategories'
import { useArticles } from './hooks/useArticles'
import { useKeywordFilters } from './hooks/useKeywordFilters'
import { useSaveLabels } from './hooks/useSaveLabels'
import { usePodcastPlayer } from './hooks/usePodcastPlayer'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { ArticleFeed } from './components/ArticleFeed'
import { CategoryModal } from './components/CategoryModal'
import { KeywordFilterModal } from './components/KeywordFilterModal'
import { SaveLabelModal } from './components/SaveLabelModal'
import { PodcastPlayer } from './components/PodcastPlayer'
import { AuthScreen } from './components/AuthScreen'
import type { Category, KeywordFilter, SaveLabel } from './types'

const PURGE_PREFS_KEY = 'newsfeed_purge_prefs'

function loadPurgePrefs() {
  try { return JSON.parse(localStorage.getItem(PURGE_PREFS_KEY) || '{}') } catch { return {} }
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const userId = user?.id ?? null

  const { categories, addCategory, updateCategory, deleteCategory } = useCategories(userId)
  const { filters: keywordFilters, addFilter, updateFilter, deleteFilter } = useKeywordFilters(userId)
  const { labels, addLabel, updateLabel, deleteLabel } = useSaveLabels(userId)
  const { articlesByCategory, allArticles, savedArticles, loading, errors, fetchCategory, markRead, saveArticle, unsaveArticle, purgeOldSaved } = useArticles(categories, userId)
  const podcastPlayer = usePodcastPlayer()

  const [selectedId, setSelectedId] = useState<string | null>(categories[0]?.id ?? null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [catModal, setCatModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null })
  const [kfModal, setKfModal] = useState<{ open: boolean; editing: KeywordFilter | null }>({ open: false, editing: null })
  const [labelModal, setLabelModal] = useState<{ open: boolean; editing: SaveLabel | null }>({ open: false, editing: null })

  // Purge settings — default 30 days, protect saved
  const prefs = loadPurgePrefs()
  const [purgeDays, setPurgeDays] = useState<number>(prefs.purgeDays ?? 30)
  const [protectSaved, setProtectSaved] = useState<boolean>(prefs.protectSaved ?? true)

  useEffect(() => {
    localStorage.setItem(PURGE_PREFS_KEY, JSON.stringify({ purgeDays, protectSaved }))
  }, [purgeDays, protectSaved])

  // When protectSaved is off and purgeDays is set, delete old saved articles from DB
  useEffect(() => {
    if (!protectSaved && purgeDays > 0 && userId) {
      purgeOldSaved(purgeDays)
    }
  }, [purgeDays, protectSaved, userId])

  useEffect(() => {
    if (!selectedId || selectedId === 'saved' || selectedId.startsWith('saved:')) return
    if (selectedId.startsWith('kf_')) { categories.forEach(cat => fetchCategory(cat)); return }
    const cat = categories.find(c => c.id === selectedId)
    if (cat) fetchCategory(cat)
  }, [selectedId, categories])

  useEffect(() => {
    if (categories.length > 0) fetchCategory(categories[0])
  }, [])

  const activeKeywordFilter = selectedId?.startsWith('kf_')
    ? keywordFilters.find(f => `kf_${f.id}` === selectedId) ?? null
    : null

  const isLabelView = !!selectedId?.startsWith('saved:')
  const activeLabelId = isLabelView ? selectedId!.slice(6) : null

  const currentArticles = activeKeywordFilter
    ? allArticles
    : selectedId === null ? allArticles
    : selectedId === 'saved' ? savedArticles
    : isLabelView ? savedArticles.filter(a => a.labelId === activeLabelId)
    : (articlesByCategory[selectedId] ?? [])

  const currentLoading = !activeKeywordFilter && selectedId !== null && selectedId !== 'saved' && !isLabelView
    ? (loading[selectedId] ?? false) : false

  const currentError = !activeKeywordFilter && selectedId !== null && selectedId !== 'saved' && !isLabelView
    ? errors[selectedId] : undefined

  const handleRefresh = useCallback(() => {
    if (activeKeywordFilter || selectedId === null) { categories.forEach(cat => fetchCategory(cat, true)); return }
    if (selectedId === 'saved' || isLabelView) return
    const cat = categories.find(c => c.id === selectedId)
    if (cat) fetchCategory(cat, true)
  }, [selectedId, activeKeywordFilter, isLabelView, categories, fetchCategory])

  const handleSelect = (id: string | null) => {
    setSelectedId(id)
    setSidebarOpen(false)
    setSearchQuery('')
    if (id === null) categories.forEach(cat => fetchCategory(cat))
  }

  const handleSaveCategory = (data: Omit<Category, 'id'>) => {
    if (catModal.editing) {
      updateCategory(catModal.editing.id, data)
    } else {
      const newId = addCategory(data)
      setSelectedId(newId)
      setTimeout(() => fetchCategory({ ...data, id: newId }), 100)
    }
    setCatModal({ open: false, editing: null })
  }

  const handleSaveKeywordFilter = (data: Omit<KeywordFilter, 'id'>) => {
    if (kfModal.editing) {
      updateFilter(kfModal.editing.id, data)
    } else {
      const newId = addFilter(data)
      setSelectedId(`kf_${newId}`)
      categories.forEach(cat => fetchCategory(cat))
    }
    setKfModal({ open: false, editing: null })
  }

  const handleSaveLabel = (data: Omit<SaveLabel, 'id'>) => {
    if (labelModal.editing) {
      updateLabel(labelModal.editing.id, data)
    } else {
      addLabel(data)
    }
    setLabelModal({ open: false, editing: null })
  }

  // Save article with optional label — looks up article data from live state
  const handleSaveArticle = useCallback((articleId: string, labelId?: string) => {
    const article = allArticles.find(a => a.id === articleId)
      ?? savedArticles.find(a => a.id === articleId)
    if (article) saveArticle(articleId, article, labelId)
  }, [allArticles, savedArticles, saveArticle])

  const handleUnsaveArticle = useCallback((articleId: string) => {
    unsaveArticle(articleId)
  }, [unsaveArticle])

  // Count per label for sidebar badges
  const labelCounts = labels.reduce<Record<string, number>>((acc, l) => {
    acc[l.id] = savedArticles.filter(a => a.labelId === l.id).length
    return acc
  }, {})

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed lg:static inset-y-0 left-0 z-30 lg:z-auto transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar
          categories={categories}
          selectedId={selectedId}
          onSelect={handleSelect}
          savedCount={savedArticles.length}
          onAddCategory={() => setCatModal({ open: true, editing: null })}
          onEditCategory={cat => setCatModal({ open: true, editing: cat })}
          onDeleteCategory={id => {
            deleteCategory(id)
            if (selectedId === id) setSelectedId(categories.find(c => c.id !== id)?.id ?? null)
          }}
          keywordFilters={keywordFilters}
          onAddKeywordFilter={() => setKfModal({ open: true, editing: null })}
          onEditKeywordFilter={f => setKfModal({ open: true, editing: f })}
          onDeleteKeywordFilter={id => {
            deleteFilter(id)
            if (selectedId === `kf_${id}`) setSelectedId(categories[0]?.id ?? null)
          }}
          labels={labels}
          labelCounts={labelCounts}
          onAddLabel={() => setLabelModal({ open: true, editing: null })}
          onEditLabel={l => setLabelModal({ open: true, editing: l })}
          onDeleteLabel={id => {
            deleteLabel(id)
            if (selectedId === `saved:${id}`) setSelectedId('saved')
          }}
          userEmail={user.email}
          onSignOut={signOut}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <ArticleFeed
              categoryId={selectedId}
              categories={categories}
              articles={currentArticles}
              loading={currentLoading}
              error={currentError}
              onRefresh={handleRefresh}
              onMarkRead={markRead}
              labels={labels}
              onSaveArticle={handleSaveArticle}
              onUnsaveArticle={handleUnsaveArticle}
              onCreateLabel={() => setLabelModal({ open: true, editing: null })}
              onPlayEpisode={podcastPlayer.play}
              searchQuery={searchQuery}
              activeKeywordFilter={activeKeywordFilter}
              purgeDays={purgeDays}
              protectSaved={protectSaved}
              onChangePurgeDays={setPurgeDays}
              onToggleProtectSaved={() => setProtectSaved(v => !v)}
            />
          </div>
        </main>

        <PodcastPlayer player={podcastPlayer} />
      </div>

      {catModal.open && (
        <CategoryModal category={catModal.editing} onSave={handleSaveCategory} onClose={() => setCatModal({ open: false, editing: null })} />
      )}
      {kfModal.open && (
        <KeywordFilterModal filter={kfModal.editing} onSave={handleSaveKeywordFilter} onClose={() => setKfModal({ open: false, editing: null })} />
      )}
      {labelModal.open && (
        <SaveLabelModal label={labelModal.editing} onSave={handleSaveLabel} onClose={() => setLabelModal({ open: false, editing: null })} />
      )}
    </div>
  )
}
