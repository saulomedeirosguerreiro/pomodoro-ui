import type { GuestProfile } from '../lib/guestProfile'

/**
 * ⚠️ STUB MÍNIMO E PROVISÓRIO — existe só para destravar a Frente 2 (storage local + `DataSourceContext`),
 * que depende da FORMA de `useGuest()` para decidir o modo (`'none' | 'guest' | 'account'`). A
 * implementação completa — hidratação do `localStorage` (`guestProfile.ts`), `startGuest`,
 * `clearGuestData`, `isLoading`, provider de verdade, tela de boas-vindas e guards de rota — é da
 * Frente 3 (fluxo de identidade e rotas) e NÃO foi construída aqui.
 *
 * Sem `GuestProvider` de propósito: `useGuest()` sempre retorna `{ guest: null }`, então qualquer
 * árvore que monte `DataSourceProvider` sem a Frente 3 cai em modo `'account'` (se houver `user`) ou
 * `'none'`, nunca `'guest'`, até a Frente 3 substituir este arquivo pela implementação real.
 */
export interface GuestContextValue {
  guest: GuestProfile | null
}

export function useGuest(): GuestContextValue {
  return { guest: null }
}
