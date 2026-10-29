import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Tag from '~/components/ui/Tag.vue'

describe('UiTag', () => {
  it('affiche le label et la couleur par défaut (vert, texte sombre)', async () => {
    const wrapper = await mountSuspended(Tag, { props: { label: 'Adulte' } })
    expect(wrapper.text()).toBe('Adulte')
    const style = wrapper.element.getAttribute('style') ?? ''
    expect(style).toContain('background-color: #7FD857')
    expect(style).toContain('color: #000000')
  })

  it('préfère le slot au label', async () => {
    const wrapper = await mountSuspended(Tag, {
      props: { label: 'Label' },
      slots: { default: 'Slot' },
    })
    expect(wrapper.text()).toBe('Slot')
  })

  it('choisit un texte blanc sur fond sombre', async () => {
    const wrapper = await mountSuspended(Tag, { props: { label: 'Nuit', color: '#0F1729' } })
    expect(wrapper.element.getAttribute('style')).toContain('color: #FFFFFF')
  })

  it('variante outline : fond transparent et bordure', async () => {
    const wrapper = await mountSuspended(Tag, { props: { label: 'x', variant: 'outline' } })
    const style = wrapper.element.getAttribute('style') ?? ''
    expect(style).toContain('background-color: transparent')
    expect(style).toContain('border-style: solid')
  })

  it('applique les classes de taille', async () => {
    const wrapper = await mountSuspended(Tag, { props: { label: 'x', size: 'xs' } })
    expect(wrapper.classes()).toContain('rounded-sm')
  })
})
