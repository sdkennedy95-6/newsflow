import { X, Play, Pause, SkipBack, SkipForward, Mic } from 'lucide-react'
import type { PodcastPlayerState } from '../hooks/usePodcastPlayer'

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

interface Props {
  player: PodcastPlayerState
}

export function PodcastPlayer({ player }: Props) {
  const { currentEpisode, isPlaying, currentTime, duration, togglePlayPause, seek, skip, close } = player
  if (!currentEpisode) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex-shrink-0 bg-white border-t border-slate-200 shadow-lg">
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Podcast icon */}
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Mic size={14} className="text-violet-600" />
        </div>

        {/* Episode info */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{currentEpisode.title}</p>
          <p className="text-xs text-slate-400 truncate">{currentEpisode.feedName}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => skip(-15)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Back 15s"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center transition-colors flex-shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause size={14} className="text-white" />
              : <Play size={14} className="text-white ml-0.5" />
            }
          </button>
          <button
            onClick={() => skip(15)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Forward 15s"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Seek bar + time */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs">
          <span className="text-xs text-slate-400 tabular-nums w-8 text-right flex-shrink-0">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={e => seek(Number(e.target.value))}
            className="flex-1 h-1 accent-violet-600 cursor-pointer"
            style={{ background: `linear-gradient(to right, #7c3aed ${progress}%, #e2e8f0 ${progress}%)` }}
          />
          <span className="text-xs text-slate-400 tabular-nums w-8 flex-shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Close */}
        <button
          onClick={close}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          title="Close player"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
