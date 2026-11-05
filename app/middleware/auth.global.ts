import { MANAGEMENT_ROLES } from '~/utils/authPages'

// Pages connectées et décision de redirection : app/utils/authPages.ts (source unique).
// Les pages publiques (/, /login, /register, /callback, pages Storyblok) ne sont jamais touchées.

// Retour PKCE (`?code=<uuid>`) tombé sur une autre page que /callback (Supabase retombe sur la Site URL)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  if (!isAuthPage(to.path)) return

  const user = useSupabaseUser()
  let uid: string | undefined = user.value?.id ?? (user.value as any)?.sub

  // Premier chargement côté client (page `ssr: false`, accès direct ou rechargement) : `useSupabaseUser()`
  // peut être vide alors que la session existe déjà. On l'attend, sur les seules pages protégées.
  // La session ne sert qu'à décider de la navigation ; le serveur reste seul juge des droits.
  let idFromSession = false
  if (!uid) {
    try {
      const { data } = await useSupabaseClient().auth.getSession()
      uid = data?.session?.user?.id ?? (data?.session?.user as any)?.sub
      idFromSession = !!uid
    } catch {
      uid = undefined
    }
  }

  if (!uid) {
    return navigateTo('/login', { query: { redirect: to.fullPath } })
  }

  const { ensureProfile, fetchProfile, hasFailedFor, authStatus, isProfileComplete, hasRole } = useAuth()
  // `ensureProfile` s'appuie sur `useSupabaseUser()` : s'il est encore vide, on lit avec l'id de la session.
  const userReady = !!(user.value?.id ?? (user.value as any)?.sub)
  if (idFromSession && hasFailedFor(uid)) {
    // L'utilisateur est apparu pendant l'attente de la session : auth-sync a déjà fait la première lecture,
    // elle a échoué. Elle compte comme lecture initiale, il ne reste que le réessai (2 lectures au total).
  } else if (userReady) {
    await ensureProfile()
  } else {
    await fetchProfile(uid)
  }

  // Réessai unique : 2 lectures au plus par navigation. Un échec persistant ne redirige pas,
  // la porte AuthPageGate affiche le blocage et le bouton « Réessayer ».
  if (authStatus.value === 'error') await fetchProfile(uid)

  const redirect = authRedirectFor(to.path, {
    status: authStatus.value,
    isProfileComplete: isProfileComplete.value,
    canManage: MANAGEMENT_ROLES.some((r) => hasRole(r)),
  })
  if (redirect) return navigateTo(redirect)
})
