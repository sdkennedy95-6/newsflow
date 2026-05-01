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

  return (
    /* M3 Surface Container card */
    <div className={`mx-3 mb-1 rounded-2xl p-3.5 transition-colors ${
      justReached ? 'bg-emerald-50' : 'bg-slate-50'
    }`}>
      {/* Top: streak + goal picker */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Flame
            size={14}
            className={streak > 0 ? 'text-orange-500' : 'text-slate-300'}
            fill={streak > 0 ? 'currentColor' : 'none'}
          />
          <span className={`text-xs font-medium ${streak > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
            {streak > 0 ? `${streak}-day streak` : 'Start a streak'}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowGoalPicker(v => !v)}
            className="flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
          >
            Goal: {goal} <ChevronDown size={10} />
          </button>
          {showGoalPicker && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 min-w-[90px]">
              {GOAL_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => { onSetGoal(n); setShowGoalPicker(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors rounded ${
                    n === goal ? 'font-medium text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {n} articles
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* M3 Linear Progress Indicator */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            justReached ? 'bg-emerald-500' : goalReached ? 'bg-blue-600' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Count + status — M3 Label Small */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          {justReached ? '🎉 Goal reached!'
            : goalReached ? `${todayCount} read today`
            : `${todayCount} of ${goal} today`}
        </span>
        {goalReached && !justReached && <CheckCircle2 size={13} className="text-blue-600" />}
      </div>
    </div>
  )
}
