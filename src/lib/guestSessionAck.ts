/**
 * Flag de "esta aba já resolveu a identidade do convidado nesta sessão de navegador" — em
 * `sessionStorage`, não `localStorage`: sobrevive a um F5 mas é apagada ao fechar a aba/janela, que é
 * exatamente a diferença que o `GuestIdentityConfirmModal` precisa (não perguntar de novo a cada
 * refresh, perguntar de novo se o navegador foi fechado e reaberto).
 */

const GUEST_SESSION_ACK_STORAGE_KEY = 'pomogarden:guest-session-ack:v1'

export function hasAckedGuestSession(): boolean {
  try {
    return sessionStorage.getItem(GUEST_SESSION_ACK_STORAGE_KEY) === '1'
  } catch {
    // sessionStorage indisponível (ex.: modo privado restrito) — assume resolvido pra não entrar num
    // modal que nunca consegue "lembrar" que já foi visto.
    return true
  }
}

export function ackGuestSession(): void {
  try {
    sessionStorage.setItem(GUEST_SESSION_ACK_STORAGE_KEY, '1')
  } catch {
    /* sessionStorage indisponível — a confirmação reaparece a cada render; degradação aceitável */
  }
}
