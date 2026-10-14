import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsProvider } from '../../context/SettingsContext'
import { ModeSwitcher } from './ModeSwitcher'

function renderSwitcher(props: Partial<Parameters<typeof ModeSwitcher>[0]> = {}) {
  const onSelectType = props.onSelectType ?? vi.fn()
  return {
    onSelectType,
    ...render(
      <SettingsProvider>
        <ModeSwitcher
          type="foco"
          phase="parado"
          suggestedNextType="descanso_curto"
          lastAbandonedType={null}
          onSelectType={onSelectType}
          {...props}
        />
      </SettingsProvider>,
    ),
  }
}

describe('ModeSwitcher', () => {
  it('parado troca de tipo direto, sem diálogo', async () => {
    const { onSelectType } = renderSwitcher({ phase: 'parado' })

    await userEvent.click(screen.getByRole('tab', { name: /Pausa Curta/ }))

    expect(onSelectType).toHaveBeenCalledWith('descanso_curto')
    expect(screen.queryByText('Trocar de modo vai encerrar a sessão atual. O tempo já focado será salvo.')).not.toBeInTheDocument()
  })

  it('rodando trava as outras abas e mostra o aviso, sem chamar onSelectType', async () => {
    const { onSelectType } = renderSwitcher({ phase: 'rodando' })

    const pausaCurta = screen.getByRole('tab', { name: /Pausa Curta/ })
    expect(pausaCurta).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Modo bloqueado durante a sessão. Pause ou encerre para trocar.')

    await userEvent.click(pausaCurta)
    expect(onSelectType).not.toHaveBeenCalled()
  })

  it('rodando não desabilita a aba já ativa', () => {
    renderSwitcher({ phase: 'rodando', type: 'foco' })

    expect(screen.getByRole('tab', { name: /^Foco/ })).not.toBeDisabled()
  })

  it('parado trava a aba fora da sequência clássica e mostra o aviso', async () => {
    const { onSelectType } = renderSwitcher({ phase: 'parado', type: 'foco', suggestedNextType: 'descanso_curto' })

    const pausaLonga = screen.getByRole('tab', { name: /Pausa Longa/ })
    expect(pausaLonga).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Siga a sequência do Pomodoro: agora só é possível avançar para Pausa curta.',
    )

    await userEvent.click(pausaLonga)
    expect(onSelectType).not.toHaveBeenCalled()
  })

  it('parado não trava a aba do tipo atual nem a do tipo sugerido pela sequência', () => {
    renderSwitcher({ phase: 'parado', type: 'foco', suggestedNextType: 'descanso_curto' })

    expect(screen.getByRole('tab', { name: /^Foco/ })).not.toBeDisabled()
    expect(screen.getByRole('tab', { name: /Pausa Curta/ })).not.toBeDisabled()
  })

  it('parado trava a volta para o tipo abandonado sem ter iniciado, mesmo sendo o tipo sugerido', async () => {
    const { onSelectType } = renderSwitcher({
      phase: 'parado',
      type: 'foco',
      suggestedNextType: 'descanso_curto',
      lastAbandonedType: 'descanso_curto',
    })

    const pausaCurta = screen.getByRole('tab', { name: /Pausa Curta/ })
    expect(pausaCurta).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Inicie o período atual antes de voltar para Pausa curta.',
    )

    await userEvent.click(pausaCurta)
    expect(onSelectType).not.toHaveBeenCalled()
  })

  it('parado não trava a volta se o tipo abandonado não é nenhuma das abas atuais', () => {
    renderSwitcher({
      phase: 'parado',
      type: 'foco',
      suggestedNextType: 'descanso_curto',
      lastAbandonedType: 'descanso_longo',
    })

    expect(screen.getByRole('tab', { name: /Pausa Curta/ })).not.toBeDisabled()
  })

  it('pausado abre o diálogo de confirmação em vez de trocar direto', async () => {
    const { onSelectType } = renderSwitcher({ phase: 'pausado' })

    await userEvent.click(screen.getByRole('tab', { name: /Pausa Curta/ }))

    expect(screen.getByText('Trocar de modo vai encerrar a sessão atual. O tempo já focado será salvo.')).toBeInTheDocument()
    expect(onSelectType).not.toHaveBeenCalled()
  })

  it('pausado, confirmar a troca chama onSelectType com o novo tipo', async () => {
    const { onSelectType } = renderSwitcher({ phase: 'pausado' })

    await userEvent.click(screen.getByRole('tab', { name: /Pausa Curta/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Trocar e encerrar' }))

    expect(onSelectType).toHaveBeenCalledWith('descanso_curto')
  })

  it('pausado, cancelar a confirmação não troca o tipo', async () => {
    const { onSelectType } = renderSwitcher({ phase: 'pausado' })

    await userEvent.click(screen.getByRole('tab', { name: /Pausa Curta/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Continuar sessão' }))

    expect(screen.queryByText('Trocar de modo vai encerrar a sessão atual. O tempo já focado será salvo.')).not.toBeInTheDocument()
    expect(onSelectType).not.toHaveBeenCalled()
  })
})
