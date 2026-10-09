import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { LOFI_TRACKS, type LofiTrackMeta } from '../lib/soundCatalog'
import { useSettings } from './SettingsContext'

const UNAVAILABLE_MESSAGE = 'Esse áudio ainda não está disponível nesta versão.'

interface LofiPlayerContextValue {
  track: LofiTrackMeta
  trackIndex: number
  isPlaying: boolean
  message: string | null
  volume: number
  handlePlayPause: () => void
  handleNext: () => void
  selectTrack: (index: number) => void
  setVolume: (volume: number) => void
}

const LofiPlayerContext = createContext<LofiPlayerContextValue | undefined>(undefined)

/**
 * Estado único de reprodução lo-fi, compartilhado pelo mini player do header (`LofiMiniPlayer`) e
 * pelo player do Checklist de Foco (`LofiPlayer`) — um só `<audio>` real, pra tocar/pausar/trocar de
 * faixa em qualquer um dos dois refletir no outro. Montado em `TimerScope` (`App.tsx`), então
 * sobrevive à navegação entre páginas autenticadas (só pausa se o usuário pausar, ou ao deslogar).
 */
export function LofiPlayerProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings()
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  /** `true` quando a troca de faixa deve retomar a reprodução assim que o novo `src` for aplicado. */
  const autoplayPendingRef = useRef(false)

  const track = LOFI_TRACKS[trackIndex]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.lofiVolume
    }
  }, [settings.lofiVolume])

  useEffect(() => {
    if (!autoplayPendingRef.current) return
    autoplayPendingRef.current = false

    audioRef.current
      ?.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setMessage(UNAVAILABLE_MESSAGE)
        setIsPlaying(false)
      })
  }, [trackIndex])

  // Pausa ao desmontar (ex.: logout, que desmonta o TimerScope inteiro) — nunca fica tocando "escondido".
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
    }
  }, [])

  function handlePlayPause() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    audio
      .play()
      .then(() => {
        setMessage(null)
        setIsPlaying(true)
      })
      .catch(() => {
        setMessage(UNAVAILABLE_MESSAGE)
        setIsPlaying(false)
      })
  }

  function handleAudioError() {
    setMessage(UNAVAILABLE_MESSAGE)
    setIsPlaying(false)
  }

  function handleNext() {
    selectTrack((trackIndex + 1) % LOFI_TRACKS.length)
  }

  /** Escolha direta de uma faixa qualquer (US-57): mesma troca de `handleNext`, mas para um índice arbitrário. */
  function selectTrack(index: number) {
    if (index === trackIndex) return
    autoplayPendingRef.current = isPlaying
    audioRef.current?.pause()
    setIsPlaying(false)
    setMessage(null)
    setTrackIndex(index)
  }

  function setVolume(volume: number) {
    updateSettings({ lofiVolume: volume })
  }

  const value: LofiPlayerContextValue = {
    track,
    trackIndex,
    isPlaying,
    message,
    volume: settings.lofiVolume,
    handlePlayPause,
    handleNext,
    selectTrack,
    setVolume,
  }

  return (
    <LofiPlayerContext.Provider value={value}>
      <audio ref={audioRef} src={track.src} loop preload="none" onError={handleAudioError} />
      {children}
    </LofiPlayerContext.Provider>
  )
}

export function useLofiPlayer(): LofiPlayerContextValue {
  const context = useContext(LofiPlayerContext)
  if (!context) {
    throw new Error('useLofiPlayer precisa ser usado dentro de um LofiPlayerProvider.')
  }
  return context
}
