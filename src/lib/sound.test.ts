import { afterEach, describe, expect, it, vi } from 'vitest'
import { playSessionEndSound } from './sound'

/** jsdom não implementa a Web Audio API — mockamos o suficiente pra validar o fluxo sem travar. */
function installAudioContextMock() {
  const oscillator = {
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }
  const context = {
    currentTime: 0,
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
    destination: {},
    close: vi.fn(() => Promise.resolve()),
  }
  // function expression (não arrow) — precisa ser construível (`new AudioContext()`).
  const AudioContextMock = vi.fn(function AudioContextImpl() {
    return context
  })
  vi.stubGlobal('AudioContext', AudioContextMock)
  return { AudioContextMock, context, oscillator, gain }
}

describe('playSessionEndSound', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('sem suporte a Web Audio (ex. jsdom padrão), não lança erro', () => {
    expect(() => playSessionEndSound()).not.toThrow()
  })

  it('com suporte, cria e inicia um oscilador por nota (duas notas)', () => {
    const { context } = installAudioContextMock()

    playSessionEndSound()

    expect(context.createOscillator).toHaveBeenCalledTimes(2)
    expect(context.createGain).toHaveBeenCalledTimes(2)
  })

  it('não lança erro mesmo se o ambiente simular falha ao criar o contexto', () => {
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => {
        throw new Error('autoplay bloqueado')
      }),
    )

    expect(() => playSessionEndSound()).not.toThrow()
  })
})
