import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'

// État de rôle piloté par les tests (hoisté avec mockNuxtImport)
// (vrai ref : le composant le déstructure et le template doit le déballer)
const auth = await vi.hoisted(async () => {
  const { ref } = await import('vue')
  return { isAdmin: ref(true) }
})
// fetchProfile : chargement des rôles au montage (contournement, 2026-10-28) ; ici sans effet.
// Le vrai useAuth est testé dans HelloAssoConfig.roles.test.ts.
mockNuxtImport('useAuth', () => () => ({ isAdmin: auth.isAdmin, fetchProfile: async () => {} }))

const { default: HelloAssoConfig } = await import('~/components/admin/HelloAssoConfig.vue')

type Call = { url: string; method: string; body: any }

const FORMS = [
  { id: 'f1', form_slug: 'adhesion-2026', form_type: 'Membership', label: 'Adhésion 2026-2027', active: true, season: '2026-2027' },
  { id: 'f2', form_slug: 'stage-ete', form_type: 'Event', label: 'Stage été', active: false, season: '2025-2026' },
]

const OK_RESULT = {
  ok: true,
  environment: 'sandbox',
  orgSlug: 'asc-escalade-test',
  checks: { publicData: 'ok', transactions: 'ok' },
}

let calls: Call[]
let testResponse: { status: number; body: any }

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function installFetch() {
  calls = []
  const fetchMock = vi.fn(async (input: any, init?: any) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    const body = init?.body ? JSON.parse(init.body) : undefined
    calls.push({ url, method, body })
    if (url === '/api/admin/helloasso-forms' && method === 'GET') return json(FORMS)
    if (url === '/api/admin/helloasso-forms' && method === 'POST') return json({ id: 'new' })
    if (url === '/api/admin/helloasso-test') return json(testResponse.body, testResponse.status)
    if (url === '/api/admin/sync-helloasso') return json({ matched: 0, unmatched: [] })
    return json({}, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function mountComponent() {
  const wrapper = await mountSuspended(HelloAssoConfig)
  await flushPromises()
  return wrapper
}

const buttonByText = (wrapper: any, text: string) =>
  wrapper.findAll('button').find((b: any) => b.text().includes(text))

beforeEach(() => {
  auth.isAdmin.value = true
  testResponse = { status: 200, body: OK_RESULT }
  installFetch()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('HelloAssoConfig — test de connexion (admin)', () => {
  it('affiche le bouton « Tester la connexion » et appelle POST /api/admin/helloasso-test', async () => {
    const wrapper = await mountComponent()
    const btn = buttonByText(wrapper, 'Tester la connexion')
    expect(btn).toBeTruthy()

    await btn!.trigger('click')
    await flushPromises()

    expect(calls.some(c => c.url === '/api/admin/helloasso-test' && c.method === 'POST')).toBe(true)
  })

  it('succès : affiche l\'environnement (sandbox en évidence), le slug et les 2 vérifications', async () => {
    const wrapper = await mountComponent()
    expect(wrapper.find('[data-testid="test-result"]').exists()).toBe(false)

    await buttonByText(wrapper, 'Tester la connexion')!.trigger('click')
    await flushPromises()

    const result = wrapper.find('[data-testid="test-result"]')
    expect(result.exists()).toBe(true)
    expect(wrapper.find('[data-testid="test-environment"]').text()).toMatch(/sandbox/i)
    expect(wrapper.find('[data-testid="test-slug"]').text()).toBe('asc-escalade-test')
    expect(wrapper.find('[data-testid="check-publicData"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="check-transactions"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="test-forbidden"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="test-error"]').exists()).toBe(false)
  })

  it('succès en production : badge « Production » et pas de mention sandbox', async () => {
    testResponse = { status: 200, body: { ...OK_RESULT, environment: 'production', orgSlug: 'asc-escalade' } }
    const wrapper = await mountComponent()

    await buttonByText(wrapper, 'Tester la connexion')!.trigger('click')
    await flushPromises()

    const badge = wrapper.find('[data-testid="test-environment"]').text()
    expect(badge).toMatch(/production/i)
    expect(badge).not.toMatch(/sandbox/i)
  })

  it('403 à l\'étape transactions : bloc dédié avec le message reçu', async () => {
    const message = 'privilège AccessTransactions manquant : vérifiez les droits du client API dans le back-office HelloAsso'
    testResponse = {
      status: 200,
      body: {
        ok: false,
        environment: 'sandbox',
        orgSlug: 'asc-escalade-test',
        step: 'transactions',
        code: 'forbidden',
        message,
      },
    }
    const wrapper = await mountComponent()

    await buttonByText(wrapper, 'Tester la connexion')!.trigger('click')
    await flushPromises()

    const forbidden = wrapper.find('[data-testid="test-forbidden"]')
    expect(forbidden.exists()).toBe(true)
    expect(forbidden.text()).toContain('privilège AccessTransactions manquant')
    expect(forbidden.text()).toContain(message)
    expect(wrapper.find('[data-testid="test-error"]').exists()).toBe(false)
  })

  it('forbidden à l\'étape publicData : message générique, pas le bloc dédié aux transactions', async () => {
    testResponse = {
      status: 200,
      body: { ok: false, environment: 'sandbox', orgSlug: 'x', step: 'publicData', code: 'forbidden', message: 'Accès refusé par HelloAsso.' },
    }
    const wrapper = await mountComponent()

    await buttonByText(wrapper, 'Tester la connexion')!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="test-forbidden"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="test-error"]').text()).toContain('Accès refusé par HelloAsso.')
  })

  it('autre échec (config manquante) : affiche le message reçu', async () => {
    testResponse = {
      status: 200,
      body: { ok: false, step: 'config', code: 'config_missing', message: 'Configuration HelloAsso incomplète : clientId, clientSecret' },
    }
    const wrapper = await mountComponent()

    await buttonByText(wrapper, 'Tester la connexion')!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="test-error"]').text()).toContain('Configuration HelloAsso incomplète')
    expect(wrapper.find('[data-testid="test-forbidden"]').exists()).toBe(false)
  })

  it('autre échec (auth refusée) : affiche le message reçu', async () => {
    testResponse = {
      status: 200,
      body: { ok: false, environment: 'sandbox', orgSlug: 'x', step: 'publicData', code: 'auth_failed', message: 'Authentification HelloAsso refusée.' },
    }
    const wrapper = await mountComponent()

    await buttonByText(wrapper, 'Tester la connexion')!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="test-error"]').text()).toContain('Authentification HelloAsso refusée.')
  })

  it('réponse HTTP en erreur sans contrat (ex. 500) : message d\'erreur affiché', async () => {
    testResponse = { status: 500, body: { statusMessage: 'Erreur interne' } }
    const wrapper = await mountComponent()

    await buttonByText(wrapper, 'Tester la connexion')!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="test-error"]').text()).toContain('Erreur interne')
  })
})

describe('HelloAssoConfig — rôles', () => {
  it('admin : test, synchronisation, ajout et switch d\'activation visibles', async () => {
    auth.isAdmin.value = true
    const wrapper = await mountComponent()

    expect(buttonByText(wrapper, 'Tester la connexion')).toBeTruthy()
    expect(buttonByText(wrapper, 'Synchroniser maintenant')).toBeTruthy()
    expect(wrapper.text()).toContain('Ajouter un formulaire')
    expect(buttonByText(wrapper, 'Ajouter')).toBeTruthy()
    expect(wrapper.find('[data-testid="season-select"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="switch"]')).toHaveLength(FORMS.length)
  })

  it('secrétaire : test, synchronisation, ajout et switch masqués', async () => {
    auth.isAdmin.value = false
    const wrapper = await mountComponent()

    expect(buttonByText(wrapper, 'Tester la connexion')).toBeFalsy()
    expect(buttonByText(wrapper, 'Synchroniser maintenant')).toBeFalsy()
    expect(buttonByText(wrapper, 'Ajouter')).toBeFalsy()
    expect(wrapper.text()).not.toContain('Ajouter un formulaire')
    expect(wrapper.find('[data-testid="season-select"]').exists()).toBe(false)
    expect(wrapper.findAll('[role="switch"]')).toHaveLength(0)
  })

  it('secrétaire : la liste des formulaires reste visible, en lecture seule (état Actif / Inactif)', async () => {
    auth.isAdmin.value = false
    const wrapper = await mountComponent()

    const rows = wrapper.findAll('[data-testid="form-row"]')
    expect(rows).toHaveLength(FORMS.length)
    expect(rows[0]!.text()).toContain('Adhésion 2026-2027')
    expect(rows[0]!.text()).toContain('Actif')
    expect(rows[1]!.text()).toContain('Inactif')
  })

  it('secrétaire : le résultat d\'un test éventuel n\'est jamais affiché', async () => {
    auth.isAdmin.value = false
    const wrapper = await mountComponent()
    expect(wrapper.find('[data-testid="test-result"]').exists()).toBe(false)
    expect(calls.some(c => c.url === '/api/admin/helloasso-test')).toBe(false)
  })
})

describe('HelloAssoConfig — saison', () => {
  // Seule la Date est figée : les promesses et le rendu continuent de fonctionner
  const freeze = (iso: string) => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(iso))
  }

  const optionValues = (wrapper: any) =>
    wrapper.findAll('[data-testid="season-select"] option').map((o: any) => o.element.value)

  it('le 31 août 2026 : propose 2025-2026 (en cours) et 2026-2027 (suivante)', async () => {
    freeze('2026-08-31T12:00:00')
    const wrapper = await mountComponent()

    expect(optionValues(wrapper)).toEqual(['2025-2026', '2026-2027'])
    expect((wrapper.find('[data-testid="season-select"]').element as HTMLSelectElement).value).toBe('2025-2026')
  })

  it('le 1er septembre 2026 : propose 2026-2027 (en cours) et 2027-2028 (suivante)', async () => {
    freeze('2026-09-01T12:00:00')
    const wrapper = await mountComponent()

    expect(optionValues(wrapper)).toEqual(['2026-2027', '2027-2028'])
    expect((wrapper.find('[data-testid="season-select"]').element as HTMLSelectElement).value).toBe('2026-2027')
  })

  it('la saison choisie est envoyée dans le POST sous `season`', async () => {
    freeze('2026-09-01T12:00:00')
    const wrapper = await mountComponent()

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('adhesion-2027')
    await inputs[1]!.setValue('Adhésion 2027-2028')
    await wrapper.find('[data-testid="season-select"]').setValue('2027-2028')

    await buttonByText(wrapper, 'Ajouter')!.trigger('click')
    await flushPromises()

    const post = calls.find(c => c.url === '/api/admin/helloasso-forms' && c.method === 'POST')
    expect(post).toBeTruthy()
    expect(post!.body.season).toBe('2027-2028')
    expect(post!.body.form_slug).toBe('adhesion-2027')
    expect(post!.body.label).toBe('Adhésion 2027-2028')
  })

  it('sans changement de sélection, la saison en cours est envoyée par défaut', async () => {
    freeze('2026-08-31T12:00:00')
    const wrapper = await mountComponent()

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('adhesion-2025')
    await inputs[1]!.setValue('Adhésion 2025-2026')

    await buttonByText(wrapper, 'Ajouter')!.trigger('click')
    await flushPromises()

    const post = calls.find(c => c.url === '/api/admin/helloasso-forms' && c.method === 'POST')
    expect(post!.body.season).toBe('2025-2026')
  })

  it('la saison de chaque formulaire est affichée dans la liste', async () => {
    const wrapper = await mountComponent()

    const seasons = wrapper.findAll('[data-testid="form-season"]').map((s: any) => s.text())
    expect(seasons).toEqual(['Saison 2026-2027', 'Saison 2025-2026'])
  })

  it('la saison est aussi affichée pour la secrétaire (lecture seule)', async () => {
    auth.isAdmin.value = false
    const wrapper = await mountComponent()

    const seasons = wrapper.findAll('[data-testid="form-season"]').map((s: any) => s.text())
    expect(seasons).toEqual(['Saison 2026-2027', 'Saison 2025-2026'])
  })
})
