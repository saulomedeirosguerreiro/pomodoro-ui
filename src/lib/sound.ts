/**
 * US-58: ponto único de disparo do som de fim de sessão. Sintetizado via Web Audio API (duas
 * notas ascendentes, tipo sininho) em vez de um arquivo de áudio — sem asset externo pra
 * carregar/licenciar. Silencioso em ambientes sem suporte (ex. jsdom em testes).
 */
interface WindowWithWebkitAudio {
  webkitAudioContext?: typeof AudioContext
}

export function playSessionEndSound(): void {
  const AudioContextCtor = window.AudioContext ?? (window as unknown as WindowWithWebkitAudio).webkitAudioContext
  if (!AudioContextCtor) {
    return
  }

  try {
    const context = new AudioContextCtor()
    const notes = [523.25, 659.25] // Dó5, Mi5
    const noteDurationSeconds = 0.28

    notes.forEach((frequency, index) => {
      const startTime = context.currentTime + index * noteDurationSeconds * 0.85
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, startTime)

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDurationSeconds)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + noteDurationSeconds)
    })

    const totalDurationMs = (notes.length * noteDurationSeconds * 0.85 + noteDurationSeconds) * 1000
    setTimeout(() => {
      context.close().catch(() => {
        /* já fechado ou navegador sem suporte a close() — sem efeito prático */
      })
    }, totalDurationMs)
  } catch {
    /* ambiente sem suporte real a Web Audio (ex. autoplay bloqueado) — silêncio honesto */
  }
}
