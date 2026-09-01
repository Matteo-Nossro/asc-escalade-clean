/**
 * Table + logique des redirections 301 depuis l'ancien site
 * www.escalade-chevigny.fr (ancien CMS, URLs en .html).
 *
 * Contexte : le domaine ne change pas. L'ancien DNS pointera vers ce site Netlify,
 * donc toutes les anciennes URLs encore indexées par Google arrivent ici. Sans
 * redirection elles renverraient un 404 et le référencement acquis serait perdu.
 *
 * Ordre de résolution (cf. resolveLegacyRedirect) :
 *   1. ARTICLE_OVERRIDES — anciennes actualités recréées à l'identique dans Storyblok.
 *   2. EXACT — pages « vitrine » de l'ancien CMS (le-club, tarifs, contact…).
 *   3. Motif listing — listing des actualités + pagination + filtres par catégorie.
 *   4. Filet de sécurité — toute autre page héritée en .html part sur /actualites
 *      (l'écrasante majorité sont d'anciennes fiches « …-n123.html » supprimées).
 *
 * Aucune route du nouveau site ne se termine par .html : cette logique est donc
 * totalement inerte pour le trafic normal.
 */

// 2. Pages figées de l'ancien CMS → nouvelle page équivalente
export const EXACT: Record<string, string> = {
  '/nous-contacter-p1.html': '/contact',
  '/plan-d-acces-p2.html': '/contact',
  '/liens-p4.html': '/',
  '/mentions-legales-p5.html': '/',
  '/le-club-p21.html': '/club',
  '/le-mur-p24.html': '/club',
  '/sorties-falaise-pour-les-adultes-asc-escalade-p26.html': '/sorties',
  '/l-asc-escalade-est-labellise-ffme-sport-sante-p27.html': '/club',
  '/tarifs-inscription-p29.html': '/inscriptions',
  '/lebureau-p31.html': '/club',
  '/horaires-des-entrainements-p32.html': '/tarifs',
  '/le-staff-p33.html': '/club',
  '/presentation-p35.html': '/club',
  '/evolutiondumur-p36.html': '/club',
  '/anneespassees-p37.html': '/club',
  '/reglement-p38.html': '/club',
  '/violences-p40.html': '/club',
}

// 1. Anciennes fiches d'actualité recréées dans Storyblok.
//    Renseigner ici uniquement les articles réellement migrés, ex. :
//      '/nouveau-topo-de-geligny-n179.html': '/posts/nouveau-topo-de-geligny',
//    Tout ce qui n'est pas listé retombe sur /actualites (filet de sécurité).
export const ARTICLE_OVERRIDES: Record<string, string> = {}

// Filtres de catégorie de l'ancien listing (/actualites-p6-sor.html, …-com-14.html…)
const CATEGORY_TARGET: Record<string, string> = {
  sor: '/sorties', // sorties falaise
}

const LISTING_RE = /^\/actualites-p6(?:-([a-z]{3}))?(?:-\d+)?\.html$/

function resolveListing(pathname: string): string | null {
  const match = pathname.match(LISTING_RE)
  if (!match) return null
  const category = match[1]
  return (category && CATEGORY_TARGET[category]) || '/actualites'
}

/**
 * Renvoie la cible de redirection pour un chemin de l'ancien site, ou `null`
 * si le chemin ne concerne pas la migration (pas un .html, ou déjà correct).
 */
export function resolveLegacyRedirect(pathname: string): string | null {
  if (!pathname.endsWith('.html')) return null

  const target =
    ARTICLE_OVERRIDES[pathname] ??
    EXACT[pathname] ??
    resolveListing(pathname) ??
    '/actualites' // filet de sécurité : ancienne fiche article ou .html inconnu

  return target === pathname ? null : target
}

// Anciens chemins internes /actualites/<slug> et /sorties/<slug> → /posts/<slug>.
// IMPORTANT : ne matche PAS /actualites ni /sorties (les pages liste).
const SECTION_RE = /^\/(?:actualites|sorties)\/(.+)$/

export function resolveSectionRedirect(pathname: string): string | null {
  const match = pathname.match(SECTION_RE)
  if (!match) return null
  const slug = match[1].replace(/\/$/, '')
  return slug ? `/posts/${slug}` : null
}
