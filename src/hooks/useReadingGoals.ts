import { useState, useCallback, useEffect, useRef } from 'react'

const DAILY_LOG_KEY = 'newsfeed_daily_log'  // Record<YYYY-MM-DD, string[]>
const GOAL_KEY = 'newsfeed_daily_goal'

export const GOAL_OPTIONS = [3, 5, 10, 20]

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadLog(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(DAILY_LOG_KEY) || '{}') } catch { return {} }
}

function computeStreak(log: Record<string, string[]>, goal: number): number {
  const now = new Date()
  let streak = 0
  // Count consecutive completed days going backwards from yesterday
  for (let i = 1; i <= 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if ((log[key]?.length ?? 0) >= goal) streak++
    else break
  }
  // Today counts too once goal is hit
  if ((log[todayStr()]?.length ?? 0) >= goal) streak++
  return streak
}

export function useReadingGoals() {
  const [log, setLog] = useState<Record<string, string[]>>(loadLog)
  const [goal, setGoalState] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(GOAL_KEY) || '5', 10) } catch { return 5 }
  })
  const [justReached, setJustReached] = useState(false)
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const today = todayStr()
  const todayCount = log[today]?.length ?? 0
  const streak = computeStreak(log, goal)
  const goalReached = todayCount >= goal

  const recordRead = useCallback((articleId: string) => {
    setLog(prev => {
      const existing = prev[today] ?? []
      if (existing.includes(articleId)) return prev
      const updated = { ...prev, [today]: [...existing, articleId] }
      localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(updated))
      // Check if this read just completed the goal
      if (existing.length + 1 >= goal) {
        setJustReached(true)
        if (celebrateTimer.current) clearTimeout(celebrateTimer.current)
        celebrateTimer.current = setTimeout(() => setJustReached(false), 3000)
      }
      return updated
    })
  }, [today, goal])

  const setGoal = useCallback((n: number) => {
    setGoalState(n)
    localStorage.setItem(GOAL_KEY, String(n))
  }, [])

  useEffect(() => () => {
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current)
  }, [])

  return { todayCount, goal, setGoal, streak, goalReached, justReached, recordRead }
}
