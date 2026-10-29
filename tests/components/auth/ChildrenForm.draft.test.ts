// AP05 — la saisie d'enfant en cours survit au démontage de ChildrenForm (retour à l'étape 2 de register.vue, puis étape 3).
// L'état (brouillon + erreurs) est porté par la page et passé en v-model:draft / v-model:draftErrors.
import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import ChildrenForm from '~/components/auth/ChildrenForm.vue'
import { emptyChild, emptyChildErrors } from '~/utils/profileForm'
import type { ChildData } from '~/utils/profileForm'

const visible = ref(true)
const Host = defineComponent({
  setup() {
    const children = ref<ChildData[]>([])
    const draft = ref<ChildData>(emptyChild())
    const draftErrors = ref(emptyChildErrors())
    return () => h('div', visible.value
      ? [h(ChildrenForm, {
          'modelValue': children.value,
          'onUpdate:modelValue': (v: ChildData[]) => { children.value = v },
          'draft': draft.value,
          'onUpdate:draft': (v: ChildData) => { draft.value = v },
          'draftErrors': draftErrors.value,
          'onUpdate:draftErrors': (v: any) => { draftErrors.value = v },
          'parentAddress': { address: '', postal_code: '', city: '' },
        })]
      : [h('p', 'étape 2')])
  },
})

let wrapper: any
afterEach(() => { wrapper?.unmount(); wrapper = undefined; visible.value = true })

describe('AP05 — brouillon enfant conservé entre deux étapes', () => {
  it('garde la saisie en cours et les erreurs après démontage puis remontage', async () => {
    wrapper = await mountSuspended(Host)
    await wrapper.find('[data-testid="input-child-first-name"]').setValue('Marie')
    await wrapper.find('[data-testid="input-child-last-name"]').setValue('Dupont')
    // Date de naissance manquante : « Ajouter » produit une erreur qui doit aussi survivre
    await wrapper.find('[data-testid="btn-add-child"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('La date de naissance est requise')

    visible.value = false
    await flushPromises()
    expect(wrapper.find('[data-testid="input-child-first-name"]').exists()).toBe(false)

    visible.value = true
    await flushPromises()
    expect((wrapper.find('[data-testid="input-child-first-name"]').element as HTMLInputElement).value).toBe('Marie')
    expect((wrapper.find('[data-testid="input-child-last-name"]').element as HTMLInputElement).value).toBe('Dupont')
    expect(wrapper.text()).toContain('La date de naissance est requise')
  })

  it('vide le brouillon une fois l\'enfant ajouté', async () => {
    wrapper = await mountSuspended(Host)
    await wrapper.find('[data-testid="input-child-first-name"]').setValue('Marie')
    await wrapper.find('[data-testid="input-child-last-name"]').setValue('Dupont')
    await wrapper.find('[data-testid="input-child-birth-date"]').setValue('2016-03-04')
    await wrapper.find('[data-testid="select-child-gender"]').setValue('Femme')
    await wrapper.find('[data-testid="btn-add-child"]').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[data-testid="child-card"]')).toHaveLength(1)
    expect((wrapper.find('[data-testid="input-child-first-name"]').element as HTMLInputElement).value).toBe('')
  })
})
