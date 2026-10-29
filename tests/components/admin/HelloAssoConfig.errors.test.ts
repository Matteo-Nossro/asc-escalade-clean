// C0 helloasso-socle (corrections post-revue) — C3 : HelloAssoConfig affiche le message du serveur.
// Quand le chargement de la liste, l'ajout, l'activation/désactivation ou la synchronisation échouent,
// le toast d'erreur porte le message renvoyé par le serveur (`statusMessage`, sinon `message` du corps
// JSON d'erreur h3), pas seulement « Erreur <statut> ». Repli sur « Erreur <statut> » sans message.
// Le composant utilise le `fetch` natif ; `useToast` est simulé pour lire les toasts émis.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'

const hoisted = await vi.hoisted(async () => {
  const { ref } = await import('vue')
  return { isAdmin: ref(true), toastAdd: vi.fn() }
})
// fetchProfile : chargement des rôles au montage (contournement, 2026-10-28) ; ici sans effet.
mockNuxtImport('useAuth', () => () => ({ isAdmin: hoisted.isAdmin, fetchProfile: async () => {} }))
mockNuxtImport('useToast', () => () => ({ add: hoisted.toastAdd }))

const { default: HelloAssoConfig } = await import('~/components/admin/HelloAssoConfig.vue')

const FORMS = [
  { id: 'f1', form_slug: 'adhesion-2026', form_type: 'Membership', label: 'Adhésion 2026-2027', active: true, season: '2026-2027' },
]

type Reply = { status: number, body?: unknown, raw?: string }
const okJson = (body: unknown) => ({ status: 200, body })

/** Réponses du faux serveur, par route ; une route non listée répond 200 {}. */
let replies: Record<string, Reply>

function installFetch() {
  const fetchMock = vi.fn(async (input: any, init?: any) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`
    const r = replies[key] ?? okJson({})
    const text = r.raw ?? (r.body === undefined ? '' : JSON.stringify(r.body))
    return new Response(text === '' ? null : text, { status: r.status, headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const LIST = 'GET /api/admin/helloasso-forms'
const ADD = 'POST /api/admin/helloasso-forms'
const TOGGLE = 'PATCH /api/admin/helloasso-forms/f1'
const SYNC = 'POST /api/admin/sync-helloasso'

async function mountComponent() {
  const wrapper = await mountSuspended(HelloAssoConfig)
  await flushPromises()
  return wrapper
}
const buttonByText = (wrapper: any, text: string) =>
  wrapper.findAll('button').find((b: any) => b.text().includes(text))

/** Descriptions de tous les toasts d'erreur émis depuis le début du test. */
const errorToasts = () => hoisted.toastAdd.mock.calls
  .map(([t]) => t as { title?: string, description?: string, color?: string })
  .filter(t => t.color === 'error')
const errorTexts = () => errorToasts().map(t => `${t.title ?? ''} | ${t.description ?? ''}`)

// Actions qui échouent : chacune prépare l'état (liste chargée) puis déclenche l'appel en erreur.
const ACTIONS: Array<{ nom: string, route: string, run: (wrapper: any) => Promise<void> }> = [
  {
    nom: 'chargement de la liste',
    route: LIST,
    run: async () => {},
  },
  {
    nom: 'ajout d\'un formulaire',
    route: ADD,
    run: async (wrapper) => {
      const inputs = wrapper.findAll('input')
      await inputs[0]!.setValue('adhesion-2027')
      await inputs[1]!.setValue('Adhésion 2027-2028')
      await buttonByText(wrapper, 'Ajouter')!.trigger('click')
      await flushPromises()
    },
  },
  {
    nom: 'activation / désactivation',
    route: TOGGLE,
    run: async (wrapper) => {
      await wrapper.find('[role="switch"]').trigger('click')
      await flushPromises()
    },
  },
  {
    nom: 'synchronisation',
    route: SYNC,
    run: async (wrapper) => {
      await buttonByText(wrapper, 'Synchroniser maintenant')!.trigger('click')
      await flushPromises()
    },
  },
]

beforeEach(() => {
  hoisted.isAdmin.value = true
  hoisted.toastAdd.mockClear()
  replies = { [LIST]: okJson(FORMS) }
  installFetch()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe.each(ACTIONS)('HelloAssoConfig — C3 : message du serveur affiché ($nom)', ({ route, run }) => {
  it('corps d\'erreur h3 avec statusMessage : le toast affiche ce message', async () => {
    replies[route] = { status: 409, body: { statusCode: 409, statusMessage: 'Message-serveur-statusMessage', message: 'Message-serveur-message' } }
    const wrapper = await mountComponent()
    await run(wrapper)
    const texts = errorTexts()
    expect(texts.length).toBeGreaterThan(0)
    expect(texts.some(t => t.includes('Message-serveur-statusMessage'))).toBe(true)
  })

  it('corps d\'erreur avec `message` seul (pas de statusMessage) : le toast affiche le message', async () => {
    replies[route] = { status: 400, body: { statusCode: 400, message: 'Message-serveur-seul' } }
    const wrapper = await mountComponent()
    await run(wrapper)
    expect(errorTexts().some(t => t.includes('Message-serveur-seul'))).toBe(true)
  })

  it('corps JSON sans message : repli sur « Erreur <statut> »', async () => {
    replies[route] = { status: 502, body: { statusCode: 502 } }
    const wrapper = await mountComponent()
    await run(wrapper)
    expect(errorTexts().some(t => t.includes('Erreur 502'))).toBe(true)
  })

  it('corps non JSON (page HTML) : repli sur « Erreur <statut> »', async () => {
    replies[route] = { status: 500, raw: '<html>Internal Server Error</html>' }
    const wrapper = await mountComponent()
    await run(wrapper)
    expect(errorTexts().some(t => t.includes('Erreur 500'))).toBe(true)
  })
})

describe('HelloAssoConfig — C3 : non-régression', () => {
  it('succès (liste, ajout, bascule, sync) : aucun toast d\'erreur', async () => {
    replies[SYNC] = okJson({ matched: 2, unmatched: [] })
    const wrapper = await mountComponent()
    await wrapper.find('[role="switch"]').trigger('click')
    await flushPromises()
    await buttonByText(wrapper, 'Synchroniser maintenant')!.trigger('click')
    await flushPromises()
    expect(errorToasts()).toHaveLength(0)
  })

  it('le message serveur n\'apparaît pas quand tout va bien', async () => {
    await mountComponent()
    expect(errorToasts()).toHaveLength(0)
  })
})
