import type { MascotState } from './mascotState'

export const MASCOT_LABELS: Record<MascotState, string> = {
  ocioso: 'Tomatinho: Ocioso',
  focado: 'Tomatinho: Focado',
  quase_la: 'Tomatinho: Quase lá!',
  descansando: 'Tomatinho: Descansando',
  pausado: 'Tomatinho: Pausado',
  comemorando: 'Tomatinho: Comemorando!',
  acolhendo: 'Tomatinho: Com você',
}

/** US-39 RN-01: catálogo estático PT-BR, ≥ 3 falas por estado. Interrupção segue o tom empático (US-35). */
export const MASCOT_PHRASES: Record<MascotState, readonly string[]> = {
  ocioso: [
    'Pronto quando você estiver! 🍅',
    'Que tal plantarmos um foco?',
    'Estou aqui, sem pressa nenhuma.',
  ],
  focado: [
    'Você está indo muito bem!',
    'Respira fundo e segue firme.',
    'Um passo de cada vez, estou na torcida.',
  ],
  quase_la: [
    'Quase lá, não desiste agora!',
    'A reta final é a melhor parte.',
    'Mais um pouquinho — você consegue!',
  ],
  descansando: [
    'Aproveita pra esticar as pernas.',
    'Descanso também é parte do trabalho.',
    'Beba uma água, eu espero aqui.',
  ],
  pausado: [
    'Tudo bem, eu seguro as pontas.',
    'Volte quando se sentir pronto.',
    'Sem pressa — o tempo pausou com você.',
  ],
  comemorando: [
    'Mandou muito bem! 🎉',
    'Mais uma sementinha no jardim!',
    'Isso aí, comemora comigo!',
  ],
  acolhendo: [
    'Tudo bem, nem toda sessão precisa terminar perfeita.',
    'O que importa é que você tentou. Vamos de novo?',
    'Sem culpa por aqui — o jardim continua crescendo no seu ritmo.',
  ],
}

/** Rotaciona sem repetir a fala anterior (US-39 RN-01). */
export function pickPhrase(state: MascotState, previousPhrase: string | null): string {
  const options = MASCOT_PHRASES[state]
  const candidates = options.length > 1 ? options.filter((phrase) => phrase !== previousPhrase) : options
  return candidates[Math.floor(Math.random() * candidates.length)]
}
