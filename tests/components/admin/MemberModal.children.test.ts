// enfants-fiabilite T0 — Q10 (admin) : MemberModal affiche la section « Enfants liés » dès qu'il existe des liens
// parent_access (form.linkedChildren non vide), indépendamment de la case « parent » ; elle reste visible quand le rôle
// parent est coché (même sans enfant) ; elle est absente sans rôle ni lien.
// UModal est remplacé par un stub qui rend ses slots (le contenu est sinon téléporté hors du wrapper).
// Rouge attendu : la section est masquée sans rôle `parent`, même avec des enfants liés.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MemberModal from '~/components/admin/modals/MemberModal.vue'

const UModalStub = defineComponent({
  name: 'UModal',
  props: ['open'],
  setup(_props, { slots }) {
    return () => h('div', { 'data-stub': 'umodal' }, [slots.header?.(), slots.body?.(), slots.default?.(), slots.footer?.()])
  },
})

const linked = [
  { id: 'c1', name: 'Noé Martin', linkId: 'l1', birth_date: '2015-02-02' },
  { id: 'c2', name: 'Eli Martin', linkId: 'l2', birth_date: '2017-04-04' },
]

function formOf(over: Record<string, any> = {}) {
  return {
    id: 'm1', first_name: 'Alex', last_name: 'Martin', gender: 'F', name: 'Alex Martin', licence: '', email: 'alex@test.fr',
    phone: '', mobile: '', formule: '', creneau: '', status: 'Actif' as const, roles: [] as string[], groupIds: [] as string[],
    linkedChildren: [] as typeof linked, birth_date: '1988-05-05', payment_done: false, medical_certificate: null,
    registration_form: false, ffme_insurance: null, category: '', tshirt: '', notes: '',
    ...over,
  }
}

let wrapper: any
async function mountModal(form: ReturnType<typeof formOf>) {
  wrapper = await mountSuspended(MemberModal, {
    props: {
      open: true,
      editMode: false, // pas de chargement des inscriptions de l'an passé
      form,
      saving: false,
      licenceTypeOptions: [],
      groupSelectOptions: [],
      availableRoles: [{ code: 'parent', label: 'Parent' }, { code: 'admin', label: 'Admin' }],
      linkableChildren: [],
      childToLink: null,
      linkChildrenIncludeAdults: false,
      linkedParents: [],
    },
    global: { stubs: { UModal: UModalStub } },
  })
  await flushPromises()
  return wrapper.text() as string
}

beforeEach(() => { vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(async () => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
  await flushPromises()
})

describe('Q10 — MemberModal : section « Enfants liés » selon les liens parent_access', () => {
  it('avec des enfants liés et SANS rôle parent : la section et les enfants sont affichés', async () => {
    const text = await mountModal(formOf({ roles: [], linkedChildren: linked }))
    expect(text).toContain('Enfants liés')
    expect(text).toContain('Noé Martin')
    expect(text).toContain('Eli Martin')
  })

  it('avec des enfants liés et un autre rôle que parent (admin) : section affichée', async () => {
    const text = await mountModal(formOf({ roles: ['admin'], linkedChildren: linked }))
    expect(text).toContain('Enfants liés')
    expect(text).toContain('Noé Martin')
  })

  it('avec le rôle parent seul (aucun lien) : section affichée avec « Aucun enfant lié »', async () => {
    const text = await mountModal(formOf({ roles: ['parent'], linkedChildren: [] }))
    expect(text).toContain('Enfants liés')
    expect(text).toContain('Aucun enfant lié')
  })

  it('avec le rôle parent ET des enfants liés : section affichée (inchangé)', async () => {
    const text = await mountModal(formOf({ roles: ['parent'], linkedChildren: linked }))
    expect(text).toContain('Enfants liés')
    expect(text).toContain('Noé Martin')
  })

  it('sans rôle parent ni lien : aucune section « Enfants liés »', async () => {
    const text = await mountModal(formOf({ roles: [], linkedChildren: [] }))
    expect(text).not.toContain('Enfants liés')
    expect(text).not.toContain('Aucun enfant lié')
  })
})
