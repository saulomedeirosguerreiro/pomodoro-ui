import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O módulo guarda estado próprio no escopo do módulo (`enabled`/`gtagReady`), que sobreviveria entre
 * testes se só reimportássemos o mesmo módulo em cache — por isso `vi.resetModules()` + reimportar
 * dentro de cada teste, garantindo um `analytics.ts` "zerado" toda vez.
 */
describe('analytics', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    document.head.innerHTML = ''
    delete window.gtag
    delete window.dataLayer
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sem VITE_GA_MEASUREMENT_ID, não injeta o script mesmo com enabled=true', async () => {
    const { setAnalyticsEnabled } = await import('./analytics')
    setAnalyticsEnabled(true)

    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull()
    expect(window.gtag).toBeUndefined()
  })

  it('com enabled=false, trackEvent/trackPageView não chamam gtag mesmo se ele existir', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    const { setAnalyticsEnabled, trackEvent, trackPageView } = await import('./analytics')
    setAnalyticsEnabled(true) // carrega o script/gtag
    setAnalyticsEnabled(false) // desliga de novo

    const gtagSpy = vi.fn()
    window.gtag = gtagSpy

    trackEvent('focus_completed')
    trackPageView('/timer')

    expect(gtagSpy).not.toHaveBeenCalled()
  })

  it('com enabled=true e a variável configurada, injeta o script uma única vez e expõe window.gtag', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    const { setAnalyticsEnabled } = await import('./analytics')

    setAnalyticsEnabled(true)
    setAnalyticsEnabled(true) // chamar de novo não deve duplicar o script

    const scripts = document.querySelectorAll('script[src*="googletagmanager"]')
    expect(scripts).toHaveLength(1)
    expect(scripts[0].getAttribute('src')).toContain('G-TEST123')
    expect(window.gtag).toBeTypeOf('function')
  })

  it('trackEvent chama window.gtag com o nome e os parâmetros do evento', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    const { setAnalyticsEnabled, trackEvent } = await import('./analytics')
    setAnalyticsEnabled(true)

    const gtagSpy = vi.fn()
    window.gtag = gtagSpy

    trackEvent('focus_completed', { duration_seconds: 1500 })

    expect(gtagSpy).toHaveBeenCalledWith('event', 'focus_completed', { duration_seconds: 1500 })
  })

  it('trackPageView chama window.gtag com o evento page_view e o caminho', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    const { setAnalyticsEnabled, trackPageView } = await import('./analytics')
    setAnalyticsEnabled(true)

    const gtagSpy = vi.fn()
    window.gtag = gtagSpy

    trackPageView('/tarefas')

    expect(gtagSpy).toHaveBeenCalledWith('event', 'page_view', { page_path: '/tarefas' })
  })
})
