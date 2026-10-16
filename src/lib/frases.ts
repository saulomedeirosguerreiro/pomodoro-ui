import type { TFunction } from 'i18next'

function diaDoAno(data: Date): number {
  const inicioDoAno = new Date(data.getFullYear(), 0, 1)
  return Math.floor((data.getTime() - inicioDoAno.getTime()) / 86_400_000)
}

/** Frase do dia com base na data local — muda uma vez por dia e se repete a cada ciclo do catálogo. */
export function obterFraseDoDia(t: TFunction, data: Date = new Date()): string {
  const frases = t('frasesDoDia:items', { returnObjects: true }) as readonly string[]
  return frases[diaDoAno(data) % frases.length]
}
