import { resolveLegacyRedirect, resolveSectionRedirect } from '../utils/legacyRedirects'

/**
 * Redirections 301 :
 *  - ancien site www.escalade-chevigny.fr (URLs en .html) → resolveLegacyRedirect
 *  - anciens chemins internes /actualites/<slug>, /sorties/<slug> → /posts/<slug>
 * La logique (fonctions pures) vit dans server/utils/legacyRedirects.ts.
 */
export default defineEventHandler((event) => {
  // event.path inclut la query string ; on ne raisonne que sur le chemin.
  const pathname = event.path.replace(/[?#].*$/, '')

  const target =
    (pathname.endsWith('.html') ? resolveLegacyRedirect(pathname) : null) ??
    resolveSectionRedirect(pathname)

  if (target) return sendRedirect(event, target, 301)
})
