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

interface Props { player: PodcastPlayerState }

export function PodcastPlayer({ player }: Props) {
  const { currentEpisode, isPlaying, currentTime, duration, togglePlayPause, seek, skip, close } = player
  if (!currentEpisode) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    /* M3 Surface Container — sits at the bottom of the content column */
    <div className="flex-shrink-0 bg-[#eef1f8] border-t border-slate-200">
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Podcast icon — M3 tonal icon container */}
        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Mic size={15} className="text-violet-700" />
        </div>

        {/* Episode info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 truncate leading-tight">{currentEpisode.title}</p>
          <p className="text-xs text-slate-500 truncate">{currentEpisode.feedName}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => skip(-15)} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 transition-colors" title="Back 15s">
            <SkipBack size={17} />
          </button>
          <button onClick={togglePlayPause} className="w-10 h-10 rounded-full bg-violet-700 hover:bg-violet-800 flex items-center justify-center transition-colors flex-shrink-0 shadow-sm" title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying
              ? <Pause size={16} className="text-white" />
              : <Play size={16} className="text-white ml-0.5" />}
          </button>
          <button onClick={() => skip(15)} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 transition-colors" title="Forward 15s">
            <SkipForward size={17} />
          </button>
        </div>

        {/* Seek bar + time */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs">
          <span className="text-[11px] text-slate-500 tabular-nums w-8 text-right flex-shrink-0">{formatTime(currentTime)}</span>
          <input
            type="range" min={0} max={duration || 100} value={currentTime}
            onChange={e => seek(Number(e.target.value))}
            className="flex-1 h-1 accent-violet-700 cursor-pointer rounded-full"
            style={{ background: `linear-gradient(to right, #6d28d9 ${progress}%, #c4b5fd ${progress}%)` }}
          />
          <span className="text-[11px] text-slate-500 tabular-nums w-8 flex-shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Close */}
        <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 transition-colors flex-shrink-0" title="Close player">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
