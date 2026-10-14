import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SESSION_DURATIONS_SECONDS } from '../../lib/timerLogic'
import { useTimer, type SessionRegistration } from './useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renderiza parado em 25:00 no tipo foco ao montar', () => {
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn() }))

    expect(result.current.type).toBe('foco')
    expect(result.current.phase).toBe('parado')
    expect(result.current.remainingSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.foco)
  })

  it('iniciar faz o tempo decrescer', () => {
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn() }))

    act(() => result.current.start())
    expect(result.current.phase).toBe('rodando')

    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.remainingSeconds).toBeCloseTo(DEFAULT_SESSION_DURATIONS_SECONDS.foco - 5, 0)
  })

  it('pausar congela o tempo restante', () => {
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn() }))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(5000))
    act(() => result.current.pause())
    const remainingAoPausar = result.current.remainingSeconds

    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.remainingSeconds).toBe(remainingAoPausar)
    expect(result.current.phase).toBe('pausado')
  })

  it('continuar retoma de onde parou', () => {
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn() }))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(5000))
    act(() => result.current.pause())
    act(() => vi.advanceTimersByTime(10000))
    act(() => result.current.resume())

    expect(result.current.phase).toBe('rodando')
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.remainingSeconds).toBeCloseTo(DEFAULT_SESSION_DURATIONS_SECONDS.foco - 6, 0)
  })

  it('reiniciar volta ao tempo cheio do tipo atual e para', () => {
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn() }))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(60_000))
    act(() => result.current.restart())

    expect(result.current.phase).toBe('parado')
    expect(result.current.type).toBe('foco')
    expect(result.current.remainingSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.foco)
  })

  it('finalizar registra como interrompido com a duração real decorrida e não avança o ciclo', () => {
    const onSessionReady = vi.fn<(r: SessionRegistration) => void>()
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady }))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(10_000))
    act(() => result.current.finalize())

    expect(onSessionReady).toHaveBeenCalledTimes(1)
    const registration = onSessionReady.mock.calls[0][0]
    expect(registration.status).toBe('interrompido')
    expect(registration.type).toBe('foco')
    expect(registration.durationSeconds).toBeCloseTo(10, 0)

    expect(result.current.phase).toBe('parado')
    expect(result.current.type).toBe('foco')
  })

  it('finalizar sem ter iniciado não faz nada', () => {
    const onSessionReady = vi.fn()
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady }))

    act(() => result.current.finalize())

    expect(onSessionReady).not.toHaveBeenCalled()
    expect(result.current.phase).toBe('parado')
  })

  it('ao chegar a 00:00, registra concluído e sugere o próximo tipo (pausa curta)', () => {
    const onSessionReady = vi.fn<(r: SessionRegistration) => void>()
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady }))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(DEFAULT_SESSION_DURATIONS_SECONDS.foco * 1000 + 500))

    expect(onSessionReady).toHaveBeenCalledTimes(1)
    const registration = onSessionReady.mock.calls[0][0]
    expect(registration.status).toBe('concluido')
    expect(registration.durationSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.foco)

    expect(result.current.type).toBe('descanso_curto')
    expect(result.current.phase).toBe('parado')
    expect(result.current.remainingSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.descanso_curto)
  })

  it('ao concluir o 4º foco do ciclo, sugere pausa longa', () => {
    const onSessionReady = vi.fn()
    const { result } = renderHook(() => useTimer({ totalFociCompleted: 3, onSessionReady }))

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(DEFAULT_SESSION_DURATIONS_SECONDS.foco * 1000 + 500))

    expect(result.current.type).toBe('descanso_longo')
  })

  describe('suggestedNextType (US-33b)', () => {
    it('em foco, fora do 4º ciclo, sugere pausa curta', () => {
      const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn() }))

      expect(result.current.suggestedNextType).toBe('descanso_curto')
    })

    it('em foco, com o total já múltiplo de 4, sugere pausa longa', () => {
      // Mesma regra de `nextSuggestedType`/`skip`: não soma +1 (trocar manualmente não conta como
      // concluir o foco atual) — por isso o total aqui já precisa estar em 4, e não em 3.
      const { result } = renderHook(() => useTimer({ totalFociCompleted: 4, onSessionReady: vi.fn() }))

      expect(result.current.suggestedNextType).toBe('descanso_longo')
    })

    it('em pausa curta ou longa, sempre sugere foco', () => {
      const { result: curta } = renderHook(() => useTimer({ totalFociCompleted: 1, onSessionReady: vi.fn() }))
      act(() => curta.current.selectType('descanso_curto'))
      expect(curta.current.suggestedNextType).toBe('foco')

      const { result: longa } = renderHook(() => useTimer({ totalFociCompleted: 3, onSessionReady: vi.fn() }))
      act(() => longa.current.selectType('descanso_longo'))
      expect(longa.current.suggestedNextType).toBe('foco')
    })
  })

  describe('selectType (US-33)', () => {
    it('parado, troca na hora sem registrar nada', () => {
      const onSessionReady = vi.fn()
      const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady }))

      act(() => result.current.selectType('descanso_longo'))

      expect(onSessionReady).not.toHaveBeenCalled()
      expect(result.current.type).toBe('descanso_longo')
      expect(result.current.phase).toBe('parado')
      expect(result.current.remainingSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.descanso_longo)
    })

    it('rodando, registra o período atual como interrompido antes de trocar', () => {
      const onSessionReady = vi.fn<(r: SessionRegistration) => void>()
      const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady }))

      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(8 * 60 * 1000))
      act(() => result.current.selectType('descanso_curto'))

      expect(onSessionReady).toHaveBeenCalledTimes(1)
      const registration = onSessionReady.mock.calls[0][0]
      expect(registration.type).toBe('foco')
      expect(registration.status).toBe('interrompido')
      expect(registration.durationSeconds).toBeCloseTo(8 * 60, 0)

      expect(result.current.type).toBe('descanso_curto')
      expect(result.current.phase).toBe('parado')
    })
  })

  describe('skip (US-34, G-Q4)', () => {
    it('parado, avança para o tipo sugerido sem registrar', () => {
      const onSessionReady = vi.fn()
      const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady }))

      act(() => result.current.skip())

      expect(onSessionReady).not.toHaveBeenCalled()
      expect(result.current.type).toBe('descanso_curto')
      expect(result.current.phase).toBe('parado')
    })

    it('iniciado, registra como interrompido e avança para o tipo sugerido', () => {
      const onSessionReady = vi.fn<(r: SessionRegistration) => void>()
      const { result } = renderHook(() => useTimer({ totalFociCompleted: 0, onSessionReady }))

      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(2 * 60 * 1000))
      act(() => result.current.skip())

      expect(onSessionReady).toHaveBeenCalledTimes(1)
      const registration = onSessionReady.mock.calls[0][0]
      expect(registration.status).toBe('interrompido')
      expect(registration.durationSeconds).toBeCloseTo(2 * 60, 0)

      expect(result.current.type).toBe('descanso_curto')
      expect(result.current.phase).toBe('parado')
    })

    it('um foco pulado não avança o ciclo (não conta como concluído)', () => {
      const onSessionReady = vi.fn()
      const { result } = renderHook(() => useTimer({ totalFociCompleted: 3, onSessionReady }))

      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(60_000))
      act(() => result.current.skip())

      // totalFociCompleted continua 3 (não incrementou), então a sugestão é pausa curta, não longa.
      expect(result.current.type).toBe('descanso_curto')
    })
  })

  describe('durações configuráveis', () => {
    const CUSTOM_DURATIONS = { foco: 40 * 60, descanso_curto: 10 * 60, descanso_longo: 20 * 60 }

    it('uma duração customizada define o countdown inicial', () => {
      const { result } = renderHook(() =>
        useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn(), durations: CUSTOM_DURATIONS }),
      )

      expect(result.current.totalSeconds).toBe(CUSTOM_DURATIONS.foco)
      expect(result.current.remainingSeconds).toBe(CUSTOM_DURATIONS.foco)
    })

    it('mudar `durations` com o timer parado atualiza o countdown imediatamente, sem precisar trocar de tipo', () => {
      const { result, rerender } = renderHook(
        (props: { durations: typeof CUSTOM_DURATIONS }) =>
          useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn(), durations: props.durations }),
        { initialProps: { durations: DEFAULT_SESSION_DURATIONS_SECONDS } },
      )

      expect(result.current.totalSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.foco)

      rerender({ durations: CUSTOM_DURATIONS })

      expect(result.current.totalSeconds).toBe(CUSTOM_DURATIONS.foco)
      expect(result.current.remainingSeconds).toBe(CUSTOM_DURATIONS.foco)
    })

    it('mudar `durations` com o timer rodando não afeta a sessão em curso', () => {
      const onSessionReady = vi.fn()
      const { result, rerender } = renderHook(
        (props: { durations: typeof CUSTOM_DURATIONS }) =>
          useTimer({ totalFociCompleted: 0, onSessionReady, durations: props.durations }),
        { initialProps: { durations: DEFAULT_SESSION_DURATIONS_SECONDS } },
      )

      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(5000))

      rerender({ durations: CUSTOM_DURATIONS })

      // continua com o total/remaining da duração antiga (40min não entra em vigor na sessão já iniciada)
      expect(result.current.totalSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.foco)
      act(() => vi.advanceTimersByTime(1000))
      expect(result.current.remainingSeconds).toBeCloseTo(DEFAULT_SESSION_DURATIONS_SECONDS.foco - 6, 0)
    })

    it('mudar `durations` com o timer pausado não afeta a sessão em curso', () => {
      const { result, rerender } = renderHook(
        (props: { durations: typeof CUSTOM_DURATIONS }) =>
          useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn(), durations: props.durations }),
        { initialProps: { durations: DEFAULT_SESSION_DURATIONS_SECONDS } },
      )

      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(5000))
      act(() => result.current.pause())

      rerender({ durations: CUSTOM_DURATIONS })

      expect(result.current.totalSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.foco)
    })

    it('a nova duração só entra em vigor na próxima sessão (após restart)', () => {
      const { result, rerender } = renderHook(
        (props: { durations: typeof CUSTOM_DURATIONS }) =>
          useTimer({ totalFociCompleted: 0, onSessionReady: vi.fn(), durations: props.durations }),
        { initialProps: { durations: DEFAULT_SESSION_DURATIONS_SECONDS } },
      )

      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(5000))
      rerender({ durations: CUSTOM_DURATIONS })
      act(() => result.current.restart())

      expect(result.current.totalSeconds).toBe(CUSTOM_DURATIONS.foco)
      expect(result.current.remainingSeconds).toBe(CUSTOM_DURATIONS.foco)
    })

    it('a nova duração entra em vigor após a conclusão natural da sessão', () => {
      const onSessionReady = vi.fn<(r: SessionRegistration) => void>()
      const { result, rerender } = renderHook(
        (props: { durations: typeof CUSTOM_DURATIONS }) =>
          useTimer({ totalFociCompleted: 0, onSessionReady, durations: props.durations }),
        { initialProps: { durations: DEFAULT_SESSION_DURATIONS_SECONDS } },
      )

      act(() => result.current.start())
      rerender({ durations: CUSTOM_DURATIONS })
      act(() => vi.advanceTimersByTime(DEFAULT_SESSION_DURATIONS_SECONDS.foco * 1000 + 500))

      // a sessão de foco que estava rodando concluiu com a duração antiga (25min)
      expect(onSessionReady.mock.calls[0][0].durationSeconds).toBe(DEFAULT_SESSION_DURATIONS_SECONDS.foco)
      // a pausa curta seguinte já usa a duração customizada (10min)
      expect(result.current.totalSeconds).toBe(CUSTOM_DURATIONS.descanso_curto)
    })
  })
})
