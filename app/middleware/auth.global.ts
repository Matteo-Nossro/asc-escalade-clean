// Une seule liste : les pages qui demandent d'être connecté.
// Tout profil incomplet y est renvoyé vers /completer-profil (sauf sur cette page).
// Les pages publiques (/, /login, /register, /callback, pages Storyblok) ne sont jamais touchées.
const COMPLETE_PROFILE_PATH = '/completer-profil'
const AUTH_PAGES = ['/admin', '/profil', '/mes-inscriptions', COMPLETE_PROFILE_PATH]
const MANAGEMENT_ROLES = ['admin', 'secretary', 'initiateur'] as const

// Retour PKCE (`?code=<uuid>`) tombé sur une autre page que /callback (Supabase retombe sur la Site URL)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const matches = (path: string, base: string) => path === base || path.startsWith(`${base}/`)

export default defineNuxtRouteMiddleware(async (to) => {
  // R2c-1 : avant tout le reste, y compris côté serveur (query et hash conservés)
  const code = Array.isArray(to.query.code) ? to.query.code[0] : to.query.code
  if (to.path !== '/callback' && typeof code === 'string' && UUID_RE.test(code)) {
    return navigateTo({ path: '/callback', query: to.query, hash: to.hash })
  }

  if (import.meta.server) return

  // Lien d'e-mail déjà utilisé ou expiré retombé sur une autre page : /callback affiche l'explication
  if (to.path !== '/callback' && (to.query.error_code || (to.hash ?? '').includes('error_code='))) {
    return navigateTo({ path: '/callback', query: to.query, hash: to.hash })
  }

  if (!AUTH_PAGES.some((p) => matches(to.path, p))) return

  const user = useSupabaseUser()
  const uid = user.value?.id ?? (user.value as any)?.sub

  if (!uid) {
    return navigateTo('/login', { query: { redirect: to.fullPath } })
  }

  const { ensureProfile, authStatus, isProfileComplete, hasRole } = useAuth()
  await ensureProfile()

  if (authStatus.value === 'ready') {
    if (!isProfileComplete.value) {
      if (!matches(to.path, COMPLETE_PROFILE_PATH)) return navigateTo(COMPLETE_PROFILE_PATH)
    } else if (matches(to.path, COMPLETE_PROFILE_PATH)) {
      return navigateTo('/profil')
    }
  }

  if (matches(to.path, '/admin')) {
    if (authStatus.value !== 'ready' || !MANAGEMENT_ROLES.some((r) => hasRole(r))) {
      return navigateTo('/')
    }
  }
})
