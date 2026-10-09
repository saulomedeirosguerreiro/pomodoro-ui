import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FlexibleSessionRegistration } from './useFlexibleTimer'
import { useFlexibleTimer } from './useFlexibleTimer'

describe('useFlexibleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('inicia em selecionando_foco com draftMinutes padrão', () => {
    const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

    expect(result.current.phase).toEqual({ kind: 'selecionando_foco' })
    expect(result.current.draftMinutes).toBe(5)
  })

  describe('seleção de duração do foco', () => {
    it('chooseFocusPreset atualiza draftMinutes sem iniciar nada', () => {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

      act(() => result.current.chooseFocusPreset(45))

      expect(result.current.draftMinutes).toBe(45)
      expect(result.current.phase).toEqual({ kind: 'selecionando_foco' })
    })

    it('chooseFocusCustom limita o valor à faixa 5–120', () => {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

      act(() => result.current.chooseFocusCustom(500))
      expect(result.current.draftMinutes).toBe(120)

      act(() => result.current.chooseFocusCustom(0))
      expect(result.current.draftMinutes).toBe(5)
    })
  })

  describe('start', () => {
    it('startFocus usa draftMinutes e vai para foco_rodando', () => {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

      act(() => result.current.chooseFocusPreset(45))
      act(() => result.current.startFocus())

      expect(result.current.phase).toEqual({ kind: 'foco_rodando' })
      expect(result.current.totalSeconds).toBe(45 * 60)
      expect(result.current.remainingSeconds).toBe(45 * 60)
    })

    it('o tempo decresce com o tick', () => {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5000))

      expect(result.current.remainingSeconds).toBeCloseTo(5 * 60 - 5, 0)
    })
  })

  describe('pause/resume', () => {
    it('pause congela o tempo restante e resume retoma', () => {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5000))
      act(() => result.current.pause())
      const remainingAoPausar = result.current.remainingSeconds
      expect(result.current.phase).toEqual({ kind: 'foco_pausado' })

      act(() => vi.advanceTimersByTime(5000))
      expect(result.current.remainingSeconds).toBe(remainingAoPausar)

      act(() => result.current.resume())
      expect(result.current.phase).toEqual({ kind: 'foco_rodando' })
      act(() => vi.advanceTimersByTime(1000))
      expect(result.current.remainingSeconds).toBeCloseTo(remainingAoPausar - 1, 0)
    })
  })

  describe('addTime durante o foco', () => {
    it('durante foco_rodando, soma a totalSeconds sem reiniciar o progresso já feito', () => {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5000))
      act(() => result.current.addTime(5 * 60))

      expect(result.current.phase).toEqual({ kind: 'foco_rodando' })
      expect(result.current.totalSeconds).toBe(5 * 60 + 5 * 60)
      expect(result.current.addedSeconds).toBe(5 * 60)

      // o `remainingSeconds` exibido só recalcula com base no novo total no próximo tick (250ms) —
      // mesmo padrão de `useTimer`, que nunca atualiza o restante fora do efeito de tick.
      act(() => vi.advanceTimersByTime(250))
      expect(result.current.remainingSeconds).toBeCloseTo(5 * 60 + 5 * 60 - 5, 0)
    })

    it('durante foco_pausado, soma a totalSeconds e a remainingSeconds mantendo pausado', () => {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5000))
      act(() => result.current.pause())
      const remainingAntes = result.current.remainingSeconds

      act(() => result.current.addTime(10 * 60))

      expect(result.current.phase).toEqual({ kind: 'foco_pausado' })
      expect(result.current.remainingSeconds).toBe(remainingAntes + 10 * 60)
    })

    it('depois do foco concluído, encadeia um novo bloco de foco já rodando (sem passar pela tela de seleção)', () => {
      const onSessionReady = vi.fn<(r: FlexibleSessionRegistration) => void>()
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))

      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))
      expect(result.current.phase).toEqual({ kind: 'foco_concluido' })
      expect(onSessionReady).toHaveBeenCalledTimes(1)

      act(() => result.current.addTime(5 * 60))

      expect(result.current.phase).toEqual({ kind: 'foco_rodando' })
      expect(result.current.totalSeconds).toBe(5 * 60)
      expect(result.current.remainingSeconds).toBe(5 * 60)
      expect(result.current.addedSeconds).toBe(0)

      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))
      expect(onSessionReady).toHaveBeenCalledTimes(2)
      expect(onSessionReady.mock.calls[1][0].durationSeconds).toBe(5 * 60)
      expect(onSessionReady.mock.calls[1][0].plannedDurationSeconds).toBe(5 * 60)
    })
  })

  describe('conclusão natural', () => {
    it('ao chegar a 0, registra concluido com a duração total e vai para foco_concluido, sem avançar sozinho', () => {
      const onSessionReady = vi.fn<(r: FlexibleSessionRegistration) => void>()
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))

      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))

      expect(onSessionReady).toHaveBeenCalledTimes(1)
      const registration = onSessionReady.mock.calls[0][0]
      expect(registration.type).toBe('foco')
      expect(registration.status).toBe('concluido')
      expect(registration.durationSeconds).toBe(5 * 60)
      expect(registration.mode).toBe('flexivel')
      expect(registration.plannedDurationSeconds).toBe(5 * 60)
      expect(registration.addedSeconds).toBe(0)

      expect(result.current.phase).toEqual({ kind: 'foco_concluido' })

      // nunca avança sozinho: mesmo passado mais tempo, continua em foco_concluido
      act(() => vi.advanceTimersByTime(60_000))
      expect(result.current.phase).toEqual({ kind: 'foco_concluido' })
      expect(onSessionReady).toHaveBeenCalledTimes(1)
    })

    it('registra a duração total (planejada + adicionada) quando houve +tempo antes de concluir', () => {
      const onSessionReady = vi.fn<(r: FlexibleSessionRegistration) => void>()
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))

      act(() => result.current.startFocus())
      act(() => result.current.addTime(60))
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 60 * 1000 + 500))

      expect(onSessionReady.mock.calls[0][0].durationSeconds).toBe(5 * 60 + 60)
      expect(onSessionReady.mock.calls[0][0].addedSeconds).toBe(60)
    })
  })

  describe('as 4 opções pós-foco', () => {
    function completeFocus(onSessionReady = vi.fn()) {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))
      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))
      return result
    }

    it('startBreak abre a seleção de pausa', () => {
      const result = completeFocus()
      act(() => result.current.startBreak())
      expect(result.current.phase).toEqual({ kind: 'selecionando_descanso' })
      expect(result.current.draftMinutes).toBe(5)
    })

    it('startAnotherFocus volta para a seleção de foco', () => {
      const result = completeFocus()
      act(() => result.current.startAnotherFocus())
      expect(result.current.phase).toEqual({ kind: 'selecionando_foco' })
    })

    it('addTime encadeia um novo bloco (coberto em detalhe acima)', () => {
      const result = completeFocus()
      act(() => result.current.addTime(10 * 60))
      expect(result.current.phase).toEqual({ kind: 'foco_rodando' })
    })

    it('endSession encerra a sessão', () => {
      const result = completeFocus()
      act(() => result.current.endSession())
      expect(result.current.phase).toEqual({ kind: 'encerrado' })
    })
  })

  describe('seleção e execução da pausa', () => {
    function reachSelectingBreak(onSessionReady = vi.fn()) {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))
      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))
      act(() => result.current.startBreak())
      return result
    }

    it('chooseBreakPreset/chooseBreakCustom atualizam draftMinutes', () => {
      const result = reachSelectingBreak()
      act(() => result.current.chooseBreakPreset(20))
      expect(result.current.draftMinutes).toBe(20)

      act(() => result.current.chooseBreakCustom(500))
      expect(result.current.draftMinutes).toBe(60)
    })

    it('startBreak confirma e decide descanso_curto para <= 30min', () => {
      const result = reachSelectingBreak()
      act(() => result.current.chooseBreakPreset(20))
      act(() => result.current.startBreak())

      expect(result.current.phase).toEqual({ kind: 'descanso_rodando' })
      expect(result.current.breakType).toBe('descanso_curto')
      expect(result.current.totalSeconds).toBe(20 * 60)
    })

    it('startBreak confirma e decide descanso_longo para > 30min', () => {
      const result = reachSelectingBreak()
      act(() => result.current.chooseBreakCustom(45))
      act(() => result.current.startBreak())

      expect(result.current.breakType).toBe('descanso_longo')
    })
  })

  describe('durante a pausa', () => {
    function startRunningBreak(onSessionReady = vi.fn()) {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))
      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))
      act(() => result.current.startBreak())
      act(() => result.current.chooseBreakPreset(10))
      act(() => result.current.startBreak())
      return result
    }

    it('pause/resume funcionam igual ao foco', () => {
      const result = startRunningBreak()
      act(() => result.current.pause())
      expect(result.current.phase).toEqual({ kind: 'descanso_pausado' })
      act(() => result.current.resume())
      expect(result.current.phase).toEqual({ kind: 'descanso_rodando' })
    })

    it('backToFocusNow registra a pausa como interrompida e pula direto para selecionando_foco', () => {
      const onSessionReady = vi.fn<(r: FlexibleSessionRegistration) => void>()
      const result = startRunningBreak(onSessionReady)
      onSessionReady.mockClear()

      act(() => vi.advanceTimersByTime(3000))
      act(() => result.current.backToFocusNow())

      expect(onSessionReady).toHaveBeenCalledTimes(1)
      const registration = onSessionReady.mock.calls[0][0]
      expect(registration.status).toBe('interrompido')
      expect(registration.type).toBe('descanso_curto')
      expect(registration.durationSeconds).toBeCloseTo(3, 0)

      expect(result.current.phase).toEqual({ kind: 'selecionando_foco' })
    })

    it('a conclusão natural da pausa vai para descanso_concluido e expõe as 2 opções', () => {
      const onSessionReady = vi.fn<(r: FlexibleSessionRegistration) => void>()
      const result = startRunningBreak(onSessionReady)
      onSessionReady.mockClear()

      act(() => vi.advanceTimersByTime(10 * 60 * 1000 + 500))

      expect(onSessionReady).toHaveBeenCalledTimes(1)
      expect(onSessionReady.mock.calls[0][0].status).toBe('concluido')
      expect(result.current.phase).toEqual({ kind: 'descanso_concluido' })
    })
  })

  describe('as 2 opções pós-pausa', () => {
    function reachBreakCompleted(onSessionReady = vi.fn()) {
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))
      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))
      act(() => result.current.startBreak())
      act(() => result.current.chooseBreakPreset(10))
      act(() => result.current.startBreak())
      act(() => vi.advanceTimersByTime(10 * 60 * 1000 + 500))
      return result
    }

    it('backToFocus volta para selecionando_foco', () => {
      const result = reachBreakCompleted()
      act(() => result.current.backToFocus())
      expect(result.current.phase).toEqual({ kind: 'selecionando_foco' })
    })

    it('endSession encerra a sessão', () => {
      const result = reachBreakCompleted()
      act(() => result.current.endSession())
      expect(result.current.phase).toEqual({ kind: 'encerrado' })
    })
  })

  describe('encerramento antecipado', () => {
    it('endCurrentBlockNow durante o foco registra interrompido e vai para encerrado', () => {
      const onSessionReady = vi.fn<(r: FlexibleSessionRegistration) => void>()
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))

      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(10_000))
      act(() => result.current.endCurrentBlockNow())

      expect(onSessionReady).toHaveBeenCalledTimes(1)
      const registration = onSessionReady.mock.calls[0][0]
      expect(registration.status).toBe('interrompido')
      expect(registration.durationSeconds).toBeCloseTo(10, 0)
      expect(result.current.phase).toEqual({ kind: 'encerrado' })
    })

    it('startNewSession a partir de encerrado volta para selecionando_foco e zera os contadores', () => {
      const onSessionReady = vi.fn<(r: FlexibleSessionRegistration) => void>()
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))

      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))
      expect(result.current.focusBlocksCompleted).toBe(1)

      act(() => result.current.endSession())
      act(() => result.current.startNewSession())

      expect(result.current.phase).toEqual({ kind: 'selecionando_foco' })
      expect(result.current.focusBlocksCompleted).toBe(0)
      expect(result.current.totalFocusSecondsCompleted).toBe(0)
    })
  })

  describe('sequência arbitrária (foco → pausa → foco → foco → encerrar)', () => {
    it('percorre a sequência sem estado contraditório em nenhum ponto', () => {
      const onSessionReady = vi.fn<(r: FlexibleSessionRegistration) => void>()
      const { result } = renderHook(() => useFlexibleTimer({ onSessionReady }))

      // foco 25
      act(() => result.current.chooseFocusPreset(25))
      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(25 * 60 * 1000 + 500))
      expect(result.current.phase).toEqual({ kind: 'foco_concluido' })

      // pausa 5
      act(() => result.current.startBreak())
      act(() => result.current.chooseBreakPreset(5))
      act(() => result.current.startBreak())
      expect(result.current.phase).toEqual({ kind: 'descanso_rodando' })
      act(() => vi.advanceTimersByTime(5 * 60 * 1000 + 500))
      expect(result.current.phase).toEqual({ kind: 'descanso_concluido' })

      // foco 45
      act(() => result.current.backToFocus())
      act(() => result.current.chooseFocusPreset(45))
      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(45 * 60 * 1000 + 500))
      expect(result.current.phase).toEqual({ kind: 'foco_concluido' })

      // foco 15 sem pausa
      act(() => result.current.startAnotherFocus())
      act(() => result.current.chooseFocusPreset(15))
      act(() => result.current.startFocus())
      act(() => vi.advanceTimersByTime(60_000))

      // encerrar no meio do foco de 15
      act(() => result.current.endCurrentBlockNow())
      expect(result.current.phase).toEqual({ kind: 'encerrado' })

      // só os blocos concluídos naturalmente entram em focusBlocksCompleted (25 e 45), o de 15 foi interrompido
      expect(result.current.focusBlocksCompleted).toBe(2)
      expect(onSessionReady).toHaveBeenCalledTimes(4)
      expect(onSessionReady.mock.calls.map((call) => call[0].status)).toEqual([
        'concluido',
        'concluido',
        'concluido',
        'interrompido',
      ])
    })
  })

  it('o estado nunca é simultâneo/contraditório: a qualquer momento, só um `phase.kind` está ativo', () => {
    const { result } = renderHook(() => useFlexibleTimer({ onSessionReady: vi.fn() }))

    act(() => result.current.startFocus())
    expect(Object.keys(result.current.phase)).toEqual(['kind'])

    act(() => result.current.pause())
    expect(result.current.phase.kind).toBe('foco_pausado')
    // ações de outras fases (ex.: startBreak de "foco_concluido") não têm efeito aqui
    act(() => result.current.startBreak())
    expect(result.current.phase.kind).toBe('foco_pausado')
  })
})
