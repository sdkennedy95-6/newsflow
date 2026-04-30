import { useState } from 'react'
import { Flame, CheckCircle2, ChevronDown } from 'lucide-react'
import { GOAL_OPTIONS } from '../hooks/useReadingGoals'

interface Props {
  todayCount: number
  goal: number
  streak: number
  goalReached: boolean
  justReached: boolean
  onSetGoal: (n: number) => void
}

export function ReadingGoalWidget({ todayCount, goal, streak, goalReached, justReached, onSetGoal }: Props) {
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const progress = Math.min(todayCount / goal, 1)
  const pct = Math.round(progress * 100)

  return (
    <div className={`mx-3 mb-2 rounded-xl p-3 transition-colors ${
      justReached ? 'bg-emerald-50 border border-emerald-200' :
      goalReached ? 'bg-slate-50 border border-slate-100' :
      'bg-slate-50 border border-slate-100'
    }`}>
      {/* Top row: streak + goal selector */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Flame
            size={14}
            className={streak > 0 ? 'text-orange-500' : 'text-slate-300'}
            fill={streak > 0 ? 'currentColor' : 'none'}
          />
          <span className={`text-xs font-semibold ${streak > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
            {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
          </span>
        </div>

        {/* Goal picker */}
        <div className="relative">
          <button
            onClick={() => setShowGoalPicker(v => !v)}
            className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Goal: {goal}
            <ChevronDown size={10} />
          </button>
          {showGoalPicker && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20 min-w-[80px]">
              {GOAL_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => { onSetGoal(n); setShowGoalPicker(false) }}
                  className={`w-full text-left px-3 py-1 text-xs hover:bg-slate-50 transition-colors ${
                    n === goal ? 'font-semibold text-blue-600' : 'text-slate-700'
                  }`}
                >
                  {n} articles
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            justReached ? 'bg-emerald-500' :
            goalReached ? 'bg-blue-500' :
            'bg-blue-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Bottom row: count + status */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {justReached
            ? '🎉 Goal reached!'
            : goalReached
            ? `${todayCount} read today`
            : `${todayCount} of ${goal} today`}
        </span>
        {goalReached && !justReached && (
          <CheckCircle2 size={12} className="text-blue-500" />
        )}
      </div>
    </div>
  )
}
