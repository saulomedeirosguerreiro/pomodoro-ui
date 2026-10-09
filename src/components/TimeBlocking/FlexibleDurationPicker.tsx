import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '../common/Button'
import { SegmentedControl, type SegmentedOption } from '../common/SegmentedControl'

export type FlexibleDurationContext = 'foco' | 'pausa'

interface FlexibleDurationPickerProps {
  context: FlexibleDurationContext
  presets: readonly number[]
  minMinutes: number
  maxMinutes: number
  draftMinutes: number
  onChoosePreset: (minutes: number) => void
  onChooseCustom: (minutes: number) => void
  onConfirm: () => void
}

const RADIUS = 100
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const STEP_MINUTES = 5
const ICON_BUTTON_CLASSES =
  'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-surface text-[20px] text-text-h transition-[background-color,transform] duration-150 ease-out hover:bg-bg-subtle active:scale-95'

const BADGE_LABELS: Record<FlexibleDurationContext, string> = {
  foco: 'Novo foco',
  pausa: 'Nova pausa',
}

const TITLES: Record<FlexibleDurationContext, string> = {
  foco: 'Quanto tempo você quer plantar?',
  pausa: 'Quanto tempo de pausa combina com você agora?',
}

const CONFIRM_VERBS: Record<FlexibleDurationContext, string> = {
  foco: 'Começar foco de',
  pausa: 'Começar pausa de',
}

const RING_CLASSES: Record<FlexibleDurationContext, { badge: string; stroke: string; handle: string }> = {
  foco: { badge: 'bg-primary-bg text-primary-dark', stroke: 'var(--color-primary)', handle: 'bg-primary' },
  pausa: { badge: 'bg-calm-bg text-calm-dark', stroke: 'var(--color-calm)', handle: 'bg-calm' },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Ângulo (radianos, 0 = topo, sentido horário) do ponteiro em relação ao centro de `rect`. */
function angleFromPointer(clientX: number, clientY: number, rect: DOMRect): number {
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const dx = clientX - centerX
  const dy = clientY - centerY
  const angle = Math.atan2(dx, -dy)
  return angle < 0 ? angle + 2 * Math.PI : angle
}

function formatEndsAt(minutesFromNow: number): string {
  const endsAt = new Date(Date.now() + minutesFromNow * 60_000)
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(endsAt)
}

/**
 * Tela de escolha de duração do modo flexível (Parte 5 do plano, redesenhada a pedido do usuário
 * para um anel arrastável — mesma técnica de anel SVG de `TimerDisplay`/`FlexibleFocusView`, agora
 * também interativo). Arrastar o anel ou usar as setas do teclado escolhe qualquer minuto entre
 * `minMinutes` e `maxMinutes`; os botões −/+ andam de 5 em 5; os atalhos (`presets`) ficam numa
 * única barra segmentada (reaproveita `SegmentedControl`). Props inalteradas em relação à versão
 * anterior — `FlexibleTimerView`/`useFlexibleTimer` não precisam mudar.
 */
export function FlexibleDurationPicker({
  context,
  presets,
  minMinutes,
  maxMinutes,
  draftMinutes,
  onChoosePreset,
  onChooseCustom,
  onConfirm,
}: FlexibleDurationPickerProps) {
  const ringContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const customInputId = useId()
  const colors = RING_CLASSES[context]

  const range = maxMinutes - minMinutes
  const fraction = range > 0 ? clamp((draftMinutes - minMinutes) / range, 0, 1) : 0
  const dashOffset = CIRCUMFERENCE * (1 - fraction)

  const angleRad = fraction * 2 * Math.PI
  const handleLeftPercent = 50 + 50 * Math.sin(angleRad)
  const handleTopPercent = 50 - 50 * Math.cos(angleRad)

  const applyPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = ringContainerRef.current?.getBoundingClientRect()
      if (!rect) return
      const pointerFraction = angleFromPointer(clientX, clientY, rect) / (2 * Math.PI)
      const minutes = Math.round(minMinutes + pointerFraction * range)
      onChooseCustom(clamp(minutes, minMinutes, maxMinutes))
    },
    [minMinutes, maxMinutes, range, onChooseCustom],
  )

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // `setPointerCapture` pode não existir em todo ambiente (ex.: jsdom em testes) — captura é só
    // uma melhoria de robustez do arrasto (continuar recebendo eventos fora do elemento), então o
    // essencial (começar a arrastar e já aplicar a posição) não pode depender dela.
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setIsDragging(true)
    applyPointer(event.clientX, event.clientY)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    applyPointer(event.clientX, event.clientY)
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setIsDragging(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: 10,
      PageDown: -10,
    }
    if (event.key === 'Home') {
      event.preventDefault()
      onChooseCustom(minMinutes)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      onChooseCustom(maxMinutes)
      return
    }
    const step = steps[event.key]
    if (step === undefined) return
    event.preventDefault()
    onChooseCustom(clamp(draftMinutes + step, minMinutes, maxMinutes))
  }

  const segmentedOptions: SegmentedOption<string>[] = presets.map((minutes) => ({
    value: String(minutes),
    label: `${minutes}min`,
  }))
  const activePresetValue = presets.includes(draftMinutes) ? String(draftMinutes) : ''

  return (
    <section className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
      <p className={`rounded-full px-3.5 py-1 text-style-label-md uppercase tracking-[0.04em] ${colors.badge}`}>
        {BADGE_LABELS[context]}
      </p>
      <h2 className="text-center text-style-headline-sm text-text-h">{TITLES[context]}</h2>

      <div className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border p-4">
        <button
          type="button"
          className={ICON_BUTTON_CLASSES}
          aria-label={`Diminuir ${STEP_MINUTES} minutos`}
          onClick={() => onChooseCustom(clamp(draftMinutes - STEP_MINUTES, minMinutes, maxMinutes))}
        >
          −
        </button>

        <div
          ref={ringContainerRef}
          data-testid="flexible-duration-ring"
          className="relative h-[min(220px,60vw)] w-[min(220px,60vw)] shrink-0 cursor-pointer touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <svg className="h-full w-full -rotate-90" viewBox="0 0 260 260" aria-hidden="true">
            <circle cx="130" cy="130" r={RADIUS} fill="none" stroke="var(--color-bg-subtle)" strokeWidth="14" />
            <line x1="130" y1="12" x2="130" y2="24" stroke="var(--color-border)" strokeWidth="3" />
            <line x1="248" y1="130" x2="236" y2="130" stroke="var(--color-border)" strokeWidth="3" />
            <line x1="130" y1="248" x2="130" y2="236" stroke="var(--color-border)" strokeWidth="3" />
            <line x1="12" y1="130" x2="24" y2="130" stroke="var(--color-border)" strokeWidth="3" />
            <circle
              cx="130"
              cy="130"
              r={RADIUS}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>

          <div
            id={customInputId}
            role="slider"
            tabIndex={0}
            aria-label={context === 'foco' ? 'Duração do foco' : 'Duração da pausa'}
            aria-valuemin={minMinutes}
            aria-valuemax={maxMinutes}
            aria-valuenow={draftMinutes}
            aria-valuetext={`${draftMinutes} minutos`}
            onKeyDown={handleKeyDown}
            className={`absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-surface shadow-popover focus:outline-none focus:ring-4 focus:ring-primary-bg active:cursor-grabbing ${colors.handle}`}
            style={{ left: `${handleLeftPercent}%`, top: `${handleTopPercent}%` }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[28px]" aria-hidden="true">
              🌱
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-style-display-timer-mobile text-text-h">{draftMinutes}</span>
              <span className="text-style-label-md text-text-muted">min</span>
            </span>
            <span className="text-style-label-sm text-text-muted">Termina às {formatEndsAt(draftMinutes)}</span>
          </div>
        </div>

        <button
          type="button"
          className={ICON_BUTTON_CLASSES}
          aria-label={`Aumentar ${STEP_MINUTES} minutos`}
          onClick={() => onChooseCustom(clamp(draftMinutes + STEP_MINUTES, minMinutes, maxMinutes))}
        >
          +
        </button>
      </div>

      <p className="text-center text-style-body-sm text-text-muted">
        Arraste o anel para qualquer tempo entre {minMinutes} e {maxMinutes} min
      </p>

      <SegmentedControl
        options={segmentedOptions}
        value={activePresetValue}
        onChange={(value) => onChoosePreset(Number(value))}
        ariaLabel="Durações sugeridas"
      />

      <Button onClick={onConfirm} fullWidth>
        ▶ {CONFIRM_VERBS[context]} {draftMinutes} min
      </Button>
    </section>
  )
}
