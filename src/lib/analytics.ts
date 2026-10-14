declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let enabled = false
let gtagReady = false

/**
 * ⚠️ PENDÊNCIA DE CONFIGURAÇÃO: defina `VITE_GA_MEASUREMENT_ID` em `frontend/.env` (gitignorado, não
 * commitado) com o ID de medição real do GA4 — formato `G-XXXXXXXXXX`, encontrado em
 * Admin → Fluxos de dados → fluxo Web, dentro da propriedade GA4 (diferente do ID da propriedade).
 * Sem essa variável, tudo aqui vira no-op de propósito (nenhum script carrega, nenhum evento sai) —
 * o app funciona normalmente, só não manda nada pro GA4 até a variável existir.
 */
function getMeasurementId(): string | undefined {
  return import.meta.env.VITE_GA_MEASUREMENT_ID
}

function loadGtagScript(measurementId: string): void {
  if (gtagReady) return
  gtagReady = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(..._args: unknown[]) {
  // gtag.js só reconhece comandos enviados como objeto Arguments (não Array)
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer!.push(arguments)
  }
  window.gtag = gtag

  gtag('js', new Date())
  // `send_page_view: false`: SPA — o page_view automático do gtag.js só dispara no carregamento
  // inicial, nunca nas trocas de rota do React Router. `trackPageView` cobre isso manualmente.
  gtag('config', measurementId, { send_page_view: false })
}

/**
 * Liga/desliga o envio de eventos (US: opt-out em Configurações, ligado por padrão). Ao ligar pela
 * 1ª vez com `VITE_GA_MEASUREMENT_ID` configurada, carrega o `gtag.js` sob demanda — sem isso, o
 * script nunca é injetado, mesmo com `enabled=true` (nada pra carregar sem o ID de medição).
 */
export function setAnalyticsEnabled(nextEnabled: boolean): void {
  enabled = nextEnabled
  const measurementId = getMeasurementId()
  if (enabled && measurementId) {
    loadGtagScript(measurementId)
  }
}

export function trackPageView(path: string): void {
  if (!enabled || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_location: window.location.origin + path,
    page_title: document.title,
  })
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!enabled || !window.gtag) return
  window.gtag('event', name, params)
}
