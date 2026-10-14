import { describe, expect, it } from 'vitest'
import {
  computeRemainingSeconds,
  cycleFocusCount,
  DEFAULT_SESSION_DURATIONS_SECONDS,
  flexibleBreakSessionType,
  formatMMSS,
  nextSuggestedType,
  predictedNextType,
  sessionDurationsSecondsFrom,
} from './timerLogic'

describe('sessionDurationsSecondsFrom', () => {
  it('converte minutos em segundos por tipo', () => {
    expect(sessionDurationsSecondsFrom(40, 10, 20)).toEqual({
      foco: 2400,
      descanso_curto: 600,
      descanso_longo: 1200,
    })
  })

  it('com os valores de fábrica em minutos, reproduz DEFAULT_SESSION_DURATIONS_SECONDS', () => {
    expect(sessionDurationsSecondsFrom(25, 5, 15)).toEqual(DEFAULT_SESSION_DURATIONS_SECONDS)
  })
})

describe('nextSuggestedType', () => {
  it.each([
    [1, 'descanso_curto'],
    [2, 'descanso_curto'],
    [3, 'descanso_curto'],
    [4, 'descanso_longo'],
    [8, 'descanso_longo'],
  ] as const)('após foco com %i concluídos no total, sugere %s', (total, expected) => {
    expect(nextSuggestedType('foco', total)).toBe(expected)
  })

  it.each(['descanso_curto', 'descanso_longo'] as const)('após %s, sugere foco', (type) => {
    expect(nextSuggestedType(type, 0)).toBe('foco')
  })
})

describe('predictedNextType', () => {
  it('após foco NÃO concluído, sugere pausa curta — nunca pausa longa', () => {
    // Não recebe o total de propósito: diferente de `nextSuggestedType` (que soma +1 antes de
    // perguntar "foi o 4º?"), aqui o foco atual nunca foi concluído, então o total "cru" não pode
    // decidir pausa longa — senão o 1º foco de um ciclo novo (total global já múltiplo de 4 por
    // causa de ciclos anteriores) seria erradamente marcado como merecendo outra pausa longa.
    expect(predictedNextType('foco')).toBe('descanso_curto')
  })

  it.each(['descanso_curto', 'descanso_longo'] as const)('após %s, sugere foco', (type) => {
    expect(predictedNextType(type)).toBe('foco')
  })
})

describe('formatMMSS', () => {
  it('formata minutos e segundos com dois dígitos', () => {
    expect(formatMMSS(DEFAULT_SESSION_DURATIONS_SECONDS.foco)).toBe('25:00')
    expect(formatMMSS(65)).toBe('01:05')
    expect(formatMMSS(5)).toBe('00:05')
  })

  it('nunca retorna negativo', () => {
    expect(formatMMSS(-10)).toBe('00:00')
  })
})

describe('cycleFocusCount', () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 0],
    [5, 1],
    [8, 0],
  ] as const)('com %i focos concluídos no total, posição no ciclo é %i', (total, expected) => {
    expect(cycleFocusCount(total)).toBe(expected)
  })

  it('mesmo contador de nextSuggestedType — a cada 4º foco, ciclo zera junto com a pausa longa sugerida', () => {
    expect(cycleFocusCount(4)).toBe(0)
    expect(nextSuggestedType('foco', 4)).toBe('descanso_longo')
  })
})

describe('computeRemainingSeconds', () => {
  it('sem tempo decorrido, retorna o total cheio', () => {
    expect(computeRemainingSeconds(1500, 1000, 0, 1000)).toBe(1500)
  })

  it('desconta o tempo decorrido desde o início', () => {
    expect(computeRemainingSeconds(1500, 1000, 0, 1000 + 5000)).toBe(1495)
  })

  it('desconta o tempo pausado acumulado do decorrido', () => {
    expect(computeRemainingSeconds(1500, 1000, 3000, 1000 + 5000)).toBe(1498)
  })

  it('nunca retorna negativo mesmo além do total', () => {
    expect(computeRemainingSeconds(10, 1000, 0, 1000 + 20_000)).toBe(0)
  })
})

describe('flexibleBreakSessionType', () => {
  it.each([1, 5, 15, 30])('%i minutos é descanso_curto (fronteira máxima em 30)', (minutes) => {
    expect(flexibleBreakSessionType(minutes)).toBe('descanso_curto')
  })

  it.each([31, 45, 60])('%i minutos é descanso_longo (a partir de 31)', (minutes) => {
    expect(flexibleBreakSessionType(minutes)).toBe('descanso_longo')
  })
})
