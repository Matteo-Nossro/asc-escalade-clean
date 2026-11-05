// Source unique pour les pages qui demandent d'être connecté et pour la décision de redirection
// qui suit la lecture du profil (middleware auth.global, porte AuthPageGate, bouton « Réessayer »).
// Les pages publiques (/, /login, /register, /callback, pages Storyblok) ne sont jamais touchées.
export const COMPLETE_PROFILE_PATH = '/completer-profil'
export const AUTH_PAGES = ['/admin', '/profil', '/mes-inscriptions', COMPLETE_PROFILE_PATH] as const

export const MANAGEMENT_ROLES = ['admin', 'secretary', 'initiateur'] as const

type AuthStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface AuthRedirectContext {
  status: AuthStatus
  isProfileComplete: boolean
  /** Au moins un rôle de gestion (admin, secrétaire, initiateur). */
  canManage: boolean
}

const matches = (path: string, base: string) => path === base || path.startsWith(`${base}/`)

export const isAuthPage = (path: string): boolean => AUTH_PAGES.some((p) => matches(path, p))

/**
 * Chemin de redirection après lecture du profil, ou `null` pour rester sur la page.
 * - `error` : jamais de redirection (la porte affiche le blocage).
 * - `ready` : profil incomplet → /completer-profil ; profil complet sur /completer-profil → /profil.
 * - `/admin` : `ready` sans rôle de gestion, ou état non résolu (idle/loading, échec fermé) → /.
 */
export function authRedirectFor(path: string, { status, isProfileComplete, canManage }: AuthRedirectContext): string | null {
  if (status === 'error') return null

  if (status === 'ready') {
    if (!isProfileComplete) {
      if (!matches(path, COMPLETE_PROFILE_PATH)) return COMPLETE_PROFILE_PATH
    } else if (matches(path, COMPLETE_PROFILE_PATH)) {
      return '/profil'
    }
  }

  if (matches(path, '/admin') && (status !== 'ready' || !canManage)) return '/'

  return null
}
