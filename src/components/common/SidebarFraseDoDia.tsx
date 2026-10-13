import { obterFraseDoDia } from '../../lib/frases'

/** Card de conteúdo (sem interação) com a frase motivacional do dia, na sidebar. */
export function SidebarFraseDoDia() {
  const frase = obterFraseDoDia()

  return (
    <section aria-label="Frase do dia" className="flex flex-col gap-2 rounded-lg bg-[#2e243d] p-4">
      <p className="text-style-label-sm uppercase tracking-[0.08em] text-white/60">Frase do dia</p>
      <p className="text-[15px] font-bold leading-[1.4] text-white">{frase}</p>
    </section>
  )
}
