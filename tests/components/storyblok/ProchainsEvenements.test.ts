// harmonisation-couleurs : dans ProchainsEvenements, une catégorie inconnue s'affiche en gris neutre
// (NEUTRAL_TAG_COLOR), pas dans le vert par défaut des autres pages. Les événements sont datés du jour
// pour être dans la liste du jour sélectionné par défaut dans le calendrier.
import { describe, it, expect } from 'vitest'
import { today, getLocalTimeZone } from '@internationalized/date'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'

const d = today(getLocalTimeZone())
const todayStr = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`

mockNuxtImport('useEvents', () => () => ({
  getEvents: async () => [
    { id: 1, slug: 'a', type: 'evenement', title: 'Compet', date: todayStr, time: null, category: 'Compétition' },
    { id: 2, slug: 'b', type: 'evenement', title: 'Mystère', date: todayStr, time: null, category: 'Catégorie inconnue' },
  ],
}))

const { default: ProchainsEvenements } = await import('~/storyblok/Home/ProchainsEvenements.vue')

const tagStyle = (wrapper: any, label: string) =>
  wrapper.findAll('span').find((s: any) => s.text() === label)?.attributes('style') ?? ''

describe('ProchainsEvenements — couleurs de catégorie', () => {
  it('catégorie connue : couleur du module', async () => {
    const wrapper = await mountSuspended(ProchainsEvenements, { props: { blok: {} } })
    expect(tagStyle(wrapper, 'Compétition')).toContain('#EF4444')
  })

  it('catégorie inconnue : gris neutre #6B7280, pas le vert par défaut', async () => {
    const wrapper = await mountSuspended(ProchainsEvenements, { props: { blok: {} } })
    const style = tagStyle(wrapper, 'Catégorie inconnue')
    expect(style).toContain('#6B7280')
    expect(style).not.toContain('#7FD857')
  })
})
