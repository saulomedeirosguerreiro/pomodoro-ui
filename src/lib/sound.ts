/**
 * US-58: ponto único de disparo do som de fim de sessão. Sem arquivo de áudio real ainda
 * (G-Q15) — intencionalmente vazia até o asset chegar (débito documentado no README, US-64).
 * Não finge tocar nada: silêncio honesto em vez de um `Audio` apontando para um arquivo inexistente.
 */
export function playSessionEndSound(): void {}
