import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LofiPlayerProvider } from '../../context/LofiPlayerContext'
import { SettingsProvider } from '../../context/SettingsContext'
import { LOFI_TRACKS } from '../../lib/soundCatalog'
import { LofiPlayerBar } from './LofiPlayerBar'

function renderPlayerBar() {
  return render(
    <SettingsProvider>
      <LofiPlayerProvider>
        <LofiPlayerBar />
      </LofiPlayerProvider>
    </SettingsProvider>,
  )
}

/** Duas instâncias sob o mesmo `LofiPlayerProvider` — o app real só monta uma, isso aqui é um teste
    de robustez do contexto compartilhado (útil se um dia precisar de uma segunda instância). */
function renderTwoInstances() {
  return render(
    <SettingsProvider>
      <LofiPlayerProvider>
        <div data-testid="instance-a">
          <LofiPlayerBar />
        </div>
        <div data-testid="instance-b">
          <LofiPlayerBar />
        </div>
      </LofiPlayerProvider>
    </SettingsProvider>,
  )
}

describe('LofiPlayerBar', () => {
  let playSpy: ReturnType<typeof vi.spyOn>
  let pauseSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('tocar chama audio.play() e muda o ícone para pausar', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    await user.click(screen.getByRole('button', { name: 'Tocar música de fundo' }))

    expect(playSpy).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: 'Pausar música de fundo' })).toBeInTheDocument()
  })

  it('pausar chama audio.pause() e volta o ícone para tocar', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    await user.click(screen.getByRole('button', { name: 'Tocar música de fundo' }))
    await user.click(await screen.findByRole('button', { name: 'Pausar música de fundo' }))

    expect(pauseSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Tocar música de fundo' })).toBeInTheDocument()
  })

  it('renderiza o seletor de faixa com todas as faixas e a primeira já selecionada', () => {
    renderPlayerBar()

    const select = screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })
    expect(select).toHaveValue('0')
    expect(within(select).getAllByRole('option')).toHaveLength(LOFI_TRACKS.length)
  })

  it('escolher uma faixa diretamente no seletor troca a faixa atual', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' }), ['2'])

    expect(screen.getByRole('option', { name: LOFI_TRACKS[2].title, selected: true })).toBeInTheDocument()
  })

  it('"Próxima música de fundo" avança uma faixa; "Faixa anterior" volta', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    await user.click(screen.getByRole('button', { name: 'Próxima música de fundo' }))
    expect(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })).toHaveValue('1')

    await user.click(screen.getByRole('button', { name: 'Faixa anterior' }))
    expect(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })).toHaveValue('0')
  })

  it('"Faixa anterior" na primeira faixa dá a volta pro fim do catálogo', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    await user.click(screen.getByRole('button', { name: 'Faixa anterior' }))

    expect(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })).toHaveValue(String(LOFI_TRACKS.length - 1))
  })

  it('mover o volume atualiza a preferência e o volume do elemento de áudio', () => {
    renderPlayerBar()

    const slider = screen.getByRole('slider', { name: 'Volume da música de fundo' })
    fireEvent.change(slider, { target: { value: '0.8' } })

    const audio = document.querySelector('audio') as HTMLAudioElement
    expect(slider).toHaveValue('0.8')
    expect(audio.volume).toBeCloseTo(0.8, 2)
  })

  it('o ícone de volume reflete o nível atual (mudo, baixo, alto)', () => {
    renderPlayerBar()

    const slider = screen.getByRole('slider', { name: 'Volume da música de fundo' })
    const volumeIcon = screen.getByTitle('Volume')

    fireEvent.change(slider, { target: { value: '0' } })
    expect(volumeIcon).toHaveTextContent('🔇')

    fireEvent.change(slider, { target: { value: '0.3' } })
    expect(volumeIcon).toHaveTextContent('🔈')

    fireEvent.change(slider, { target: { value: '0.8' } })
    expect(volumeIcon).toHaveTextContent('🔊')
  })

  it('mostra o crédito do autor da faixa atual e atualiza ao trocar de faixa', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    expect(screen.getByText(`Crédito: ${LOFI_TRACKS[0].credit}`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima música de fundo' }))

    expect(screen.getByText(`Crédito: ${LOFI_TRACKS[1].credit}`)).toBeInTheDocument()
  })

  it('a barra de progresso reflete o tempo decorrido/total e permite arrastar pra uma nova posição', () => {
    renderPlayerBar()

    const audio = document.querySelector('audio') as HTMLAudioElement
    Object.defineProperty(audio, 'duration', { value: 120, configurable: true })
    fireEvent.loadedMetadata(audio)
    fireEvent.timeUpdate(audio, { target: { currentTime: 30 } })

    const scrubber = screen.getByRole('slider', { name: 'Progresso da faixa' })
    expect(scrubber).toHaveValue('30')
    expect(scrubber).toHaveAttribute('max', '120')
    expect(screen.getByText('00:30')).toBeInTheDocument()
    expect(screen.getByText('02:00')).toBeInTheDocument()

    fireEvent.change(scrubber, { target: { value: '90' } })

    expect(scrubber).toHaveValue('90')
    expect(audio.currentTime).toBe(90)
  })

  it('trocar de faixa zera o progresso exibido', () => {
    renderPlayerBar()

    const audio = document.querySelector('audio') as HTMLAudioElement
    Object.defineProperty(audio, 'duration', { value: 120, configurable: true })
    fireEvent.loadedMetadata(audio)
    fireEvent.timeUpdate(audio, { target: { currentTime: 30 } })

    fireEvent.change(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' }), { target: { value: '1' } })

    expect(screen.getByRole('slider', { name: 'Progresso da faixa' })).toHaveValue('0')
  })

  it('se play() rejeitar (ex.: arquivo ausente), mostra o aviso honesto e não fica marcado como tocando', async () => {
    playSpy.mockRejectedValueOnce(new Error('arquivo não encontrado'))
    const user = userEvent.setup()
    renderPlayerBar()

    await user.click(screen.getByRole('button', { name: 'Tocar música de fundo' }))

    expect(await screen.findByText('Esse áudio ainda não está disponível nesta versão.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tocar música de fundo' })).toBeInTheDocument()
  })

  it('o elemento <audio> disparando "error" mostra o mesmo aviso honesto', () => {
    renderPlayerBar()

    const audio = document.querySelector('audio')
    expect(audio).not.toBeNull()
    act(() => {
      audio?.dispatchEvent(new Event('error'))
    })

    expect(screen.getByText('Esse áudio ainda não está disponível nesta versão.')).toBeInTheDocument()
  })

  it('ao terminar a faixa, avança pra próxima e continua tocando', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    await user.click(screen.getByRole('button', { name: 'Tocar música de fundo' }))
    const audio = document.querySelector('audio') as HTMLAudioElement

    act(() => {
      audio.dispatchEvent(new Event('ended'))
    })

    expect(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })).toHaveValue('1')
    expect(await screen.findByRole('button', { name: 'Pausar música de fundo' })).toBeInTheDocument()
  })

  it('com o loop ativado, ao terminar a faixa ela reinicia em vez de avançar', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    await user.click(screen.getByRole('button', { name: 'Tocar música de fundo' }))
    await user.click(screen.getByRole('button', { name: 'Repetir a faixa atual' }))
    const audio = document.querySelector('audio') as HTMLAudioElement
    audio.currentTime = 42

    act(() => {
      audio.dispatchEvent(new Event('ended'))
    })

    expect(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })).toHaveValue('0')
    expect(audio.currentTime).toBe(0)
    expect(playSpy).toHaveBeenCalledTimes(2)
  })

  it('o botão de loop indica visualmente quando a repetição está ativa', async () => {
    const user = userEvent.setup()
    renderPlayerBar()

    const loopButton = screen.getByRole('button', { name: 'Repetir a faixa atual' })
    expect(loopButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(loopButton)

    expect(screen.getByRole('button', { name: 'Desativar repetição da faixa atual' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('ao terminar a última faixa, dá a volta pro início do catálogo', () => {
    renderPlayerBar()

    const select = screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })
    fireEvent.change(select, { target: { value: String(LOFI_TRACKS.length - 1) } })

    const audio = document.querySelector('audio') as HTMLAudioElement
    act(() => {
      audio.dispatchEvent(new Event('ended'))
    })

    expect(select).toHaveValue('0')
  })

  describe('duas instâncias sob o mesmo contexto nunca dessincronizam', () => {
    it('tocar numa instância reflete o estado de tocando na outra', async () => {
      const user = userEvent.setup()
      const { getByTestId } = renderTwoInstances()

      await user.click(within(getByTestId('instance-a')).getByRole('button', { name: 'Tocar música de fundo' }))

      expect(
        await within(getByTestId('instance-b')).findByRole('button', { name: 'Pausar música de fundo' }),
      ).toBeInTheDocument()
    })

    it('trocar de faixa numa instância atualiza a faixa e o crédito na outra', async () => {
      const user = userEvent.setup()
      const { getByTestId } = renderTwoInstances()

      await user.click(within(getByTestId('instance-b')).getByRole('button', { name: 'Próxima música de fundo' }))

      expect(within(getByTestId('instance-a')).getByRole('combobox', { name: 'Escolher faixa lo-fi' })).toHaveValue(
        '1',
      )
      expect(within(getByTestId('instance-a')).getByText(`Crédito: ${LOFI_TRACKS[1].credit}`)).toBeInTheDocument()
      expect(within(getByTestId('instance-b')).getByText(`Crédito: ${LOFI_TRACKS[1].credit}`)).toBeInTheDocument()
    })
  })
})
