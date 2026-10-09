import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LofiPlayerProvider } from '../../context/LofiPlayerContext'
import { SettingsProvider } from '../../context/SettingsContext'
import { LOFI_TRACKS } from '../../lib/soundCatalog'
import { LofiPlayer } from './LofiPlayer'

function renderPlayer() {
  return render(
    <SettingsProvider>
      <LofiPlayerProvider>
        <LofiPlayer />
      </LofiPlayerProvider>
    </SettingsProvider>,
  )
}

describe('LofiPlayer', () => {
  let playSpy: ReturnType<typeof vi.spyOn>
  let pauseSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza o seletor de faixa (com a primeira já selecionada) e o crédito', () => {
    renderPlayer()

    const select = screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })
    expect(select).toHaveValue('0')
    expect(screen.getByRole('option', { name: LOFI_TRACKS[0].title, selected: true })).toBeInTheDocument()
    expect(screen.getByText(`Crédito: ${LOFI_TRACKS[0].credit}`)).toBeInTheDocument()
  })

  it('lista todas as faixas do catálogo como opções', () => {
    renderPlayer()

    const select = screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })
    expect(within(select).getAllByRole('option')).toHaveLength(LOFI_TRACKS.length)
  })

  it('escolher uma faixa diretamente no seletor troca a faixa atual', async () => {
    const user = userEvent.setup()
    renderPlayer()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' }), [String(3)])

    expect(screen.getByRole('option', { name: LOFI_TRACKS[3].title, selected: true })).toBeInTheDocument()
    expect(screen.getByText(`Crédito: ${LOFI_TRACKS[3].credit}`)).toBeInTheDocument()
  })

  it('tocar chama audio.play() e muda o ícone para pausar', async () => {
    const user = userEvent.setup()
    renderPlayer()

    await user.click(screen.getByRole('button', { name: 'Tocar lo-fi' }))

    expect(playSpy).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: 'Pausar lo-fi' })).toBeInTheDocument()
  })

  it('pausar chama audio.pause() e volta o ícone para tocar', async () => {
    const user = userEvent.setup()
    renderPlayer()

    await user.click(screen.getByRole('button', { name: 'Tocar lo-fi' }))
    await user.click(await screen.findByRole('button', { name: 'Pausar lo-fi' }))

    expect(pauseSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Tocar lo-fi' })).toBeInTheDocument()
  })

  it('se play() rejeitar (ex.: arquivo ausente), mostra o aviso honesto e não fica marcado como tocando', async () => {
    playSpy.mockRejectedValueOnce(new Error('arquivo não encontrado'))
    const user = userEvent.setup()
    renderPlayer()

    await user.click(screen.getByRole('button', { name: 'Tocar lo-fi' }))

    expect(await screen.findByText('Esse áudio ainda não está disponível nesta versão.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tocar lo-fi' })).toBeInTheDocument()
  })

  it('o elemento <audio> disparando "error" mostra o mesmo aviso honesto', () => {
    renderPlayer()

    const audio = document.querySelector('audio')
    expect(audio).not.toBeNull()
    act(() => {
      audio?.dispatchEvent(new Event('error'))
    })

    expect(screen.getByText('Esse áudio ainda não está disponível nesta versão.')).toBeInTheDocument()
  })

  it('próxima faixa troca o título/crédito exibidos e limpa a mensagem', async () => {
    playSpy.mockRejectedValueOnce(new Error('arquivo não encontrado'))
    const user = userEvent.setup()
    renderPlayer()

    await user.click(screen.getByRole('button', { name: 'Tocar lo-fi' }))
    expect(await screen.findByText('Esse áudio ainda não está disponível nesta versão.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima faixa' }))

    expect(screen.getByRole('combobox', { name: 'Escolher faixa lo-fi' })).toHaveValue('1')
    expect(screen.getByText(`Crédito: ${LOFI_TRACKS[1].credit}`)).toBeInTheDocument()
    expect(screen.queryByText('Esse áudio ainda não está disponível nesta versão.')).not.toBeInTheDocument()
  })

  it('trocar de faixa enquanto toca continua tocando a nova faixa automaticamente', async () => {
    const user = userEvent.setup()
    renderPlayer()

    await user.click(screen.getByRole('button', { name: 'Tocar lo-fi' }))
    await screen.findByRole('button', { name: 'Pausar lo-fi' })

    await user.click(screen.getByRole('button', { name: 'Próxima faixa' }))

    expect(await screen.findByRole('button', { name: 'Pausar lo-fi' })).toBeInTheDocument()
    expect(playSpy).toHaveBeenCalledTimes(2)
  })

  it('mover o volume atualiza a preferência e o volume do elemento de áudio', () => {
    renderPlayer()

    const slider = screen.getByRole('slider', { name: 'Volume do lo-fi' })
    fireEvent.change(slider, { target: { value: '0.8' } })

    const audio = document.querySelector('audio') as HTMLAudioElement
    expect(slider).toHaveValue('0.8')
    expect(audio.volume).toBeCloseTo(0.8, 2)
  })

  it('o ícone de volume reflete o nível atual (mudo, baixo, alto)', () => {
    renderPlayer()

    const slider = screen.getByRole('slider', { name: 'Volume do lo-fi' })
    const volumeIcon = screen.getByTitle('Volume')

    fireEvent.change(slider, { target: { value: '0' } })
    expect(volumeIcon).toHaveTextContent('🔇')

    fireEvent.change(slider, { target: { value: '0.3' } })
    expect(volumeIcon).toHaveTextContent('🔈')

    fireEvent.change(slider, { target: { value: '0.8' } })
    expect(volumeIcon).toHaveTextContent('🔊')
  })
})
