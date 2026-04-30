import { useState, useRef, useCallback, useEffect } from 'react'
import type { Article } from '../types'

export interface PodcastPlayerState {
  currentEpisode: Article | null
  isPlaying: boolean
  currentTime: number
  duration: number
  play: (episode: Article) => void
  togglePlayPause: () => void
  seek: (time: number) => void
  skip: (seconds: number) => void
  close: () => void
}

export function usePodcastPlayer(): PodcastPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState<Article | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Lazily create the audio element once
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'metadata'
    }
    return audioRef.current
  }, [])

  useEffect(() => {
    const audio = getAudio()

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [getAudio])

  const play = useCallback((episode: Article) => {
    if (!episode.audioUrl) return
    const audio = getAudio()
    if (currentEpisode?.id === episode.id) {
      audio.play()
      return
    }
    audio.src = episode.audioUrl
    audio.currentTime = 0
    setCurrentTime(0)
    setDuration(0)
    setCurrentEpisode(episode)
    audio.play()
  }, [currentEpisode, getAudio])

  const togglePlayPause = useCallback(() => {
    const audio = getAudio()
    if (isPlaying) audio.pause()
    else audio.play()
  }, [isPlaying, getAudio])

  const seek = useCallback((time: number) => {
    const audio = getAudio()
    audio.currentTime = time
    setCurrentTime(time)
  }, [getAudio])

  const skip = useCallback((seconds: number) => {
    const audio = getAudio()
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 0))
  }, [getAudio])

  const close = useCallback(() => {
    const audio = getAudio()
    audio.pause()
    audio.src = ''
    setCurrentEpisode(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [getAudio])

  return { currentEpisode, isPlaying, currentTime, duration, play, togglePlayPause, seek, skip, close }
}
