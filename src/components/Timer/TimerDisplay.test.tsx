import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TimerDisplay } from './TimerDisplay'

describe('TimerDisplay — rótulo "Ciclo N de 4"', () => {
  it('durante o foco, soma 1 ao cycleCount (fazendo o 3º foco → "Ciclo 3 de 4")', () => {
    render(<TimerDisplay type="foco" remainingSeconds={60} totalSeconds={300} cycleCount={2} />)

    expect(screen.getByText('Ciclo 3 de 4')).toBeInTheDocument()
  })

  it('numa pausa curta após o 3º foco, NÃO soma 1 — mostra "Ciclo 3 de 4", não "4 de 4"', () => {
    // Reproduz o caso reportado: pausa curta logo após o 3º foco concluído não pode parecer que já
    // é o 4º/último ciclo (o que sugeriria, erradamente, que a pausa longa deveria ter liberado).
    render(<TimerDisplay type="descanso_curto" remainingSeconds={60} totalSeconds={300} cycleCount={3} />)

    expect(screen.getByText('Ciclo 3 de 4')).toBeInTheDocument()
  })

  it('na pausa longa (logo após o 4º foco, cycleCount girou pra 0), mostra "Ciclo 4 de 4", não "0 de 4"', () => {
    render(<TimerDisplay type="descanso_longo" remainingSeconds={60} totalSeconds={900} cycleCount={0} />)

    expect(screen.getByText('Ciclo 4 de 4')).toBeInTheDocument()
  })

  it('no foco que inicia um novo ciclo (cycleCount 0), mostra "Ciclo 1 de 4"', () => {
    render(<TimerDisplay type="foco" remainingSeconds={60} totalSeconds={300} cycleCount={0} />)

    expect(screen.getByText('Ciclo 1 de 4')).toBeInTheDocument()
  })
})
