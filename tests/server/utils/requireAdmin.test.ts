// T0 helloasso-socle — requireAdmin(event, { allowedRoles?, requiredRole? }).
// Critères : rôles HelloAsso (admin = actions, admin + secretary = lectures, jamais initiateur) et
// rétrocompatibilité des autres appelants (members.get, create-member.post, send-email.post…).
// Supabase est un faux en mémoire : le résultat de `user_roles` dépend du filtre .in('role_code', …).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockEvent, stubNitroGlobals } from '../../utils/nitro'
import { createFakeSupabase, type Row } from '../../utils/fake-supabase'
import { loadModule, catchErr } from '../../utils/helloasso-kit'

const state = vi.hoisted(() => ({ user: null as any, db: null as any }))
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: async () => state.user,
  serverSupabaseServiceRole: () => state.db,
}))

const MODULE = 'server/utils/requireAdmin.ts'

function loginAs(roles: string[], user: any = { id: 'user-1' }) {
  const rows: Row[] = roles.map(role_code => ({ user_id: 'user-1', role_code }))
  rows.push({ user_id: 'autre-utilisateur', role_code: 'admin' }) // ne doit jamais compter pour user-1
  const sb = createFakeSupabase({ user_roles: rows })
  state.user = user
  state.db = sb.client
  return sb
}

const run = async (options?: Record<string, unknown>) => {
  const { requireAdmin } = await loadModule(MODULE)
  return requireAdmin(createMockEvent(), options)
}
/** Statut HTTP de l'erreur levée, ou 'ok' si l'accès est accordé. */
const outcome = async (options?: Record<string, unknown>) => {
  const err = await catchErr(() => run(options))
  return err ? err.statusCode : 'ok'
}

describe('requireAdmin — rôles autorisés', () => {
  beforeEach(() => {
    stubNitroGlobals()
    state.user = null
    state.db = createFakeSupabase().client
  })
  afterEach(() => vi.unstubAllGlobals())

  describe('sans option (non-régression des autres appelants)', () => {
    it.each(['admin', 'secretary', 'initiateur'])('%s passe', async (role) => {
      loginAs([role])
      expect(await outcome()).toBe('ok')
    })

    it('renvoie userId et les rôles trouvés', async () => {
      loginAs(['secretary'])
      const res = await run()
      expect(res.userId).toBe('user-1')
      expect(res.roles).toEqual(['secretary'])
    })

    it('un utilisateur sans aucun de ces rôles : 403', async () => {
      loginAs(['membre'])
      expect(await outcome()).toBe(403)
    })

    it('utilisateur dont l\'identifiant est dans `sub` (JWT brut) : accepté', async () => {
      loginAs(['admin'], { sub: 'user-1' })
      expect(await outcome()).toBe('ok')
    })

    it('erreur de lecture des rôles : 403', async () => {
      const sb = loginAs(['admin'])
      sb.from.mockImplementation(() => ({
        select: () => ({ eq: () => ({ in: () => ({ limit: async () => ({ data: null, error: { message: 'boom' } }) }) }) }),
      }) as any)
      expect(await outcome()).toBe(403)
    })
  })

  describe('requiredRole: \'admin\'', () => {
    it('l\'admin passe', async () => {
      loginAs(['admin'])
      expect(await outcome({ requiredRole: 'admin' })).toBe('ok')
    })

    it.each(['secretary', 'initiateur'])('%s est refusé (403)', async (role) => {
      loginAs([role])
      expect(await outcome({ requiredRole: 'admin' })).toBe(403)
    })
  })

  describe('allowedRoles: [\'admin\', \'secretary\'] (lectures HelloAsso)', () => {
    const options = { allowedRoles: ['admin', 'secretary'] }

    it.each(['admin', 'secretary'])('%s passe', async (role) => {
      loginAs([role])
      expect(await outcome(options)).toBe('ok')
    })

    it('l\'initiateur est refusé (403)', async () => {
      loginAs(['initiateur'])
      expect(await outcome(options)).toBe(403)
    })

    it('un utilisateur admin + initiateur passe, et seul le rôle autorisé est renvoyé', async () => {
      loginAs(['initiateur', 'admin'])
      const res = await run(options)
      expect(res.roles).toEqual(['admin'])
    })
  })

  describe('allowedRoles restreint à un autre rôle', () => {
    it('allowedRoles: [\'secretary\'] refuse l\'admin (403)', async () => {
      loginAs(['admin'])
      expect(await outcome({ allowedRoles: ['secretary'] })).toBe(403)
    })

    it('allowedRoles: [\'secretary\'] accepte la secrétaire', async () => {
      loginAs(['secretary'])
      expect(await outcome({ allowedRoles: ['secretary'] })).toBe('ok')
    })
  })

  describe('requiredRole prioritaire sur allowedRoles', () => {
    const options = { allowedRoles: ['admin', 'secretary'], requiredRole: 'admin' }

    it('la secrétaire est refusée (403) quand requiredRole: \'admin\' est aussi donné', async () => {
      loginAs(['secretary'])
      expect(await outcome(options)).toBe(403)
    })

    it('l\'admin passe', async () => {
      loginAs(['admin'])
      expect(await outcome(options)).toBe('ok')
    })
  })

  describe('anonyme', () => {
    it.each([
      ['sans option', undefined],
      ['requiredRole: admin', { requiredRole: 'admin' }],
      ['allowedRoles: admin + secretary', { allowedRoles: ['admin', 'secretary'] }],
    ])('401 (%s), sans lecture des rôles', async (_nom, options) => {
      const sb = createFakeSupabase()
      state.user = null
      state.db = sb.client
      expect(await outcome(options)).toBe(401)
      expect(sb.from).not.toHaveBeenCalled()
    })

    it('utilisateur sans identifiant (ni id ni sub) : 401', async () => {
      loginAs(['admin'], {})
      expect(await outcome()).toBe(401)
    })
  })
})
