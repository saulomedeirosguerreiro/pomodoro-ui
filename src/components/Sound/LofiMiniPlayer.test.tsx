import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LofiPlayerProvider } from '../../context/LofiPlayerContext'
import { SettingsProvider } from '../../context/SettingsContext'
import { LOFI_TRACKS } from '../../lib/soundCatalog'
import { LofiMiniPlayer } from './LofiMiniPlayer'
import { LofiPlayer } from './LofiPlayer'

function renderMiniPlayer() {
  return render(
    <SettingsProvider>
      <LofiPlayerProvider>
        <LofiMiniPlayer />
      </LofiPlayerProvider>
    </SettingsProvider>,
  )
}

function renderBoth() {
  return render(
    <SettingsProvider>
      <LofiPlayerProvider>
        <LofiMiniPlayer />
        <LofiPlayer />
      </LofiPlayerProvider>
    </SettingsProvider>,
  )
}

describe('LofiMiniPlayer', () => {
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
    renderMiniPlayer()

    await user.click(screen.getByRole('button', { name: 'Tocar música de fundo' }))

    expect(playSpy).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: 'Pausar música de fundo' })).toBeInTheDocument()
  })

  it('pausar chama audio.pause() e volta o ícone para tocar', async () => {
    const user = userEvent.setup()
    renderMiniPlayer()

    await user.click(screen.getByRole('button', { name: 'Tocar música de fundo' }))
    await user.click(await screen.findByRole('button', { name: 'Pausar música de fundo' }))

    expect(pauseSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Tocar música de fundo' })).toBeInTheDocument()
  })

  it('mover o volume atualiza a preferência e o volume do elemento de áudio', () => {
    renderMiniPlayer()

    const slider = screen.getByRole('slider', { name: 'Volume da música de fundo' })
    fireEvent.change(slider, { target: { value: '0.8' } })

    const audio = document.querySelector('audio') as HTMLAudioElement
    expect(slider).toHaveValue('0.8')
    expect(audio.volume).toBeCloseTo(0.8, 2)
  })

  describe('sincronização com o LofiPlayer do Checklist', () => {
    it('tocar no header deixa o checklist com o botão de pausar (mesmo isPlaying)', async () => {
      const user = userEvent.setup()
      renderBoth()

      await user.click(screen.getByRole('button', { name: 'Tocar música de fundo' }))

      expect(await screen.findByRole('button', { name: 'Pausar lo-fi' })).toBeInTheDocument()
    })

    it('trocar de faixa no checklist atualiza o título refletido no header (title attribute)', async () => {
      const user = userEvent.setup()
      const { container } = renderBoth()

      await user.click(screen.getByRole('button', { name: 'Próxima faixa' }))

      expect(screen.getByText(LOFI_TRACKS[1].title)).toBeInTheDocument()
      expect(container.querySelector('[title]')?.getAttribute('title')).toBe(LOFI_TRACKS[1].title)
    })
  })
})
