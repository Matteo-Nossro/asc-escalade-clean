// auth-erreur-profil (après implémentation) — config réelle de nuxt.config.ts, pas une copie.
// Critère : `/admin/**` est en `ssr: false` (la porte AuthPageGate bloque dès le premier rendu, onMounted des pages
// admin jamais exécuté sur échec) et garde `sitemap: false`. Les autres pages connectées gardent leur ssr: false.
// nuxt.config.ts est évalué tel quel : seul `defineNuxtConfig` (identité) et le plugin mkcert (dev) sont remplacés.
import { describe, it, expect, vi } from 'vitest'

vi.mock('vite-plugin-mkcert', () => ({ default: () => ({ name: 'mkcert-stub' }) }))
vi.stubGlobal('defineNuxtConfig', (config: unknown) => config)

const { default: config } = (await import('../../nuxt.config')) as { default: any }
const rules = config.routeRules as Record<string, any>

describe('nuxt.config.ts — routeRules des pages admin', () => {
  it('/admin/** est rendu côté client uniquement (ssr: false)', () => {
    expect(rules['/admin/**']).toBeDefined()
    expect(rules['/admin/**'].ssr).toBe(false)
  })

  it('/admin/** reste hors sitemap (sitemap: false)', () => {
    expect(rules['/admin/**'].sitemap).toBe(false)
  })

  it('/admin/** reste aussi exclu par la config du module sitemap', () => {
    expect(config.sitemap.exclude).toContain('/admin/**')
  })

  it('/admin/** n\'est ni pré-rendu ni en ISR (une page connectée ne doit jamais être figée)', () => {
    expect(rules['/admin/**'].prerender).toBeUndefined()
    expect(rules['/admin/**'].isr).toBeUndefined()
  })

  // Décision 10 : le `ssr: false` du definePageMeta n'est pas appliqué ; il doit venir de routeRules.
  it.each(['/profil', '/mes-inscriptions', '/completer-profil'])('%s est rendu côté client uniquement (ssr: false) via routeRules', (path) => {
    expect(rules[path]).toBeDefined()
    expect(rules[path].ssr).toBe(false)
  })

  it.each(['/profil', '/mes-inscriptions', '/completer-profil'])('%s n\'est ni pré-rendu ni en ISR', (path) => {
    expect(rules[path]?.prerender).toBeUndefined()
    expect(rules[path]?.isr).toBeUndefined()
  })

  it('le rendu serveur reste activé globalement : seules les routes listées passent en client', () => {
    expect(config.ssr).toBe(true)
  })

  it('les pages publiques ne sont pas passées en ssr: false par erreur', () => {
    for (const path of ['/', '/club', '/tarifs', '/contact', '/sorties', '/actualites', '/inscriptions', '/posts/**']) {
      expect(rules[path]?.ssr).not.toBe(false)
    }
  })
})
