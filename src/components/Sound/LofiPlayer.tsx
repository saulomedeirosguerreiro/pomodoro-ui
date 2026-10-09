import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { LOFI_TRACKS } from '../../lib/soundCatalog'

const UNAVAILABLE_MESSAGE = 'Esse áudio ainda não está disponível nesta versão.'

/** US-57: player lo-fi dentro do Checklist, com reprodução real via <audio> (19 faixas Pixabay). */
export function LofiPlayer() {
  const { settings, updateSettings } = useSettings()
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  /** `true` quando a troca de faixa deve retomar a reprodução assim que o novo `src` for aplicado. */
  const autoplayPendingRef = useRef(false)

  const track = LOFI_TRACKS[trackIndex]

  // Sincroniza o volume do elemento com a preferência persistida, inclusive ao montar.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.lofiVolume
    }
  }, [settings.lofiVolume])

  // Retoma a reprodução depois que o React já aplicou o novo `src` da faixa (handleNext pediu via ref).
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

  // Pausa ao desmontar (ex.: sair da tela de Tarefas) — nunca deixa tocando em segundo plano "escondido".
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
        // Arquivo ausente, formato não suportado, ou autoplay bloqueado — mesmo aviso honesto de sempre.
        setMessage(UNAVAILABLE_MESSAGE)
        setIsPlaying(false)
      })
  }

  function handleAudioError() {
    setMessage(UNAVAILABLE_MESSAGE)
    setIsPlaying(false)
  }

  function handleNext() {
    autoplayPendingRef.current = isPlaying
    audioRef.current?.pause()
    setIsPlaying(false)
    setMessage(null)
    setTrackIndex((index) => (index + 1) % LOFI_TRACKS.length)
  }

  return (
    <section className="flex flex-col gap-0.5 border-t border-dashed border-border pt-2">
      <h3 className="text-style-label-md text-text-h">🎧 Lo-Fi para focar</h3>
      <p className="text-style-body-sm text-text">{track.title}</p>
      <p className="text-style-label-sm text-text-muted">Crédito: {track.credit}</p>

      <audio ref={audioRef} src={track.src} loop preload="none" onError={handleAudioError} />

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          className="h-8 w-8 rounded-full border border-border bg-surface"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pausar lo-fi' : 'Tocar lo-fi'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          className="h-8 w-8 rounded-full border border-border bg-surface"
          onClick={handleNext}
          aria-label="Próxima faixa"
        >
          ⏭
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.lofiVolume}
          onChange={(e) => updateSettings({ lofiVolume: Number(e.target.value) })}
          aria-label="Volume do lo-fi"
        />
      </div>

      {message && <p className="text-style-label-sm text-text-muted">{message}</p>}
    </section>
  )
}
