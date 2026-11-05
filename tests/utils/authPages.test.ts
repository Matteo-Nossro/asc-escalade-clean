// auth-erreur-profil, T0 — util partagé `app/utils/authPages.ts` (liste des pages connectées + décision de redirection).
// Contrat (plan.md) : AUTH_PAGES, COMPLETE_PROFILE_PATH, isAuthPage(path), authRedirectFor(path, { status, isProfileComplete, canManage }).
// Critères : « l'échec de lecture ne redirige jamais » ; « le renvoi /admin -> / reste pour un rôle manquant, profil chargé » ;
// « profil incomplet -> /completer-profil » ; « une seule source de vérité » pour la liste des pages.
// Rouge attendu avant T1 : le module n'existe pas.
import { describe, it, expect } from 'vitest'
import { AUTH_PAGES, COMPLETE_PROFILE_PATH, isAuthPage, authRedirectFor } from '~/utils/authPages'

type Status = 'idle' | 'loading' | 'ready' | 'error'
const ctx = (status: Status, isProfileComplete = true, canManage = false) => ({ status, isProfileComplete, canManage })

describe('liste des pages connectées', () => {
  it('contient exactement /admin, /profil, /mes-inscriptions et /completer-profil', () => {
    expect([...AUTH_PAGES].sort()).toEqual(['/admin', '/completer-profil', '/mes-inscriptions', '/profil'])
    expect(COMPLETE_PROFILE_PATH).toBe('/completer-profil')
  })

  it.each(['/admin', '/admin/dashboard', '/admin/blocs', '/profil', '/profil/enfants', '/mes-inscriptions', '/completer-profil'])(
    '%s est une page connectée', (path) => {
      expect(isAuthPage(path)).toBe(true)
    })

  it.each(['/', '/login', '/register', '/callback', '/tarifs', '/club/histoire', '/administration', '/profilage', '/mes-inscriptions-2'])(
    '%s est publique (préfixe de chemin, pas de texte)', (path) => {
      expect(isAuthPage(path)).toBe(false)
    })
})

describe('authRedirectFor — échec de lecture (status error) : jamais de redirection', () => {
  it.each(['/profil', '/mes-inscriptions', '/completer-profil', '/admin', '/admin/dashboard', '/admin/blocs'])(
    '%s : null, ni /login, ni /, ni /completer-profil', (path) => {
      expect(authRedirectFor(path, ctx('error', false, false))).toBeNull()
      expect(authRedirectFor(path, ctx('error', true, true))).toBeNull()
    })
})

describe('authRedirectFor — profil chargé (status ready)', () => {
  it.each(['/profil', '/mes-inscriptions', '/admin/dashboard'])('profil incomplet sur %s => /completer-profil', (path) => {
    expect(authRedirectFor(path, ctx('ready', false, true))).toBe('/completer-profil')
  })

  it('profil incomplet sur /completer-profil : on y reste', () => {
    expect(authRedirectFor('/completer-profil', ctx('ready', false))).toBeNull()
  })

  it('profil complet sur /completer-profil => /profil', () => {
    expect(authRedirectFor('/completer-profil', ctx('ready', true))).toBe('/profil')
  })

  it.each(['/profil', '/mes-inscriptions'])('profil complet sur %s : null', (path) => {
    expect(authRedirectFor(path, ctx('ready', true))).toBeNull()
  })

  it('/admin sans rôle de gestion => / (renvoi conservé une fois le profil chargé)', () => {
    expect(authRedirectFor('/admin/dashboard', ctx('ready', true, false))).toBe('/')
    expect(authRedirectFor('/admin', ctx('ready', true, false))).toBe('/')
  })

  it('/admin avec un rôle de gestion : null', () => {
    expect(authRedirectFor('/admin/dashboard', ctx('ready', true, true))).toBeNull()
  })

  it('/admin, profil incomplet et sans rôle : la complétion passe avant (une seule redirection, vers /completer-profil)', () => {
    expect(authRedirectFor('/admin/dashboard', ctx('ready', false, false))).toBe('/completer-profil')
  })
})

describe('authRedirectFor — état non résolu (idle / loading)', () => {
  it.each(['idle', 'loading'] as const)('%s : /admin => / (échec fermé, session disparue pendant la lecture)', (status) => {
    expect(authRedirectFor('/admin/dashboard', ctx(status, true, false))).toBe('/')
  })

  it.each(['idle', 'loading'] as const)('%s : /profil et /mes-inscriptions ne redirigent pas', (status) => {
    expect(authRedirectFor('/profil', ctx(status))).toBeNull()
    expect(authRedirectFor('/mes-inscriptions', ctx(status))).toBeNull()
  })
})
