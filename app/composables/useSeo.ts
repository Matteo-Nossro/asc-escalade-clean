/**
 * Composable SEO — applique les balises meta d'une page.
 *
 * Priorité : options explicites > champs seo_* du blok Storyblok > valeurs par défaut du site.
 *
 * Champs Storyblok attendus sur chaque content-type de page :
 *   - seo_title      (Text)     — titre de la page sans le nom du site
 *   - seo_description (Textarea) — description meta / OG
 *   - seo_og_image   (Asset)    — image Open Graph (ratio 1200×630 recommandé)
 */

const SITE_NAME = 'ASC Escalade'
const DEFAULT_DESCRIPTION =
  "Club d'escalade de Chevigny-Saint-Sauveur. Séances en salle et en falaise pour tous les niveaux."

/**
 * Image sociale par défaut (og:image / twitter:image) utilisée quand une page
 * ne définit pas son propre `seo_og_image` dans Storyblok.
 * Logo officiel recadré en 1200×630 (ratio recommandé), fond blanc ajouté pour
 * les zones transparentes. Remplacer par une photo paysage du mur si disponible.
 */
const DEFAULT_OG_IMAGE: string | null =
  'https://a.storyblok.com/f/291351822158044/2481x3508/ea0c2d1e7b/logoasc-escalade-2026-sans-texte.png/m/fit-in/1200x630/filters:fill(ffffff):format(jpeg):quality(85)'

/**
 * Coordonnées officielles du club — source unique pour les données structurées.
 * Fournies par le club (audit SEO). Ne pas inventer : compléter via cette constante
 * quand une information manque (ex. openingHoursSpecification).
 */
const CLUB_INFO = {
  logo: 'https://a.storyblok.com/f/291351822158044/2481x3508/ea0c2d1e7b/logoasc-escalade-2026-sans-texte.png',
  telephone: '+33380464671',
  email: 'contact@escalade-chevigny.fr',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Gymnase Boivin',
    postalCode: '21800',
    addressLocality: 'Chevigny-Saint-Sauveur',
    addressRegion: 'Bourgogne-Franche-Comté',
    addressCountry: 'FR',
  },
  sameAs: [
    'https://www.facebook.com/ascescaladechevigny/',
    'https://www.instagram.com/asc.escalade.chevigny/',
  ],
  /** Créneaux d'ouverture de la salle (Gymnase Boivin). Dimanche fermé → non listé. */
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '17:30', closes: '22:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Tuesday', opens: '16:00', closes: '21:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Wednesday', opens: '11:30', closes: '12:30' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Wednesday', opens: '14:00', closes: '21:45' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Thursday', opens: '17:30', closes: '21:15' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Friday', opens: '17:30', closes: '22:30' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:30', closes: '12:30' },
  ],
} as const

interface SeoOptions {
  /** Titre de la page (sans le nom du site). Prend le dessus sur blok.seo_title. */
  title?: string | null
  /** Description meta. Prend le dessus sur blok.seo_description. */
  description?: string | null
  /** URL absolue de l'image OG. Prend le dessus sur blok.seo_og_image. */
  image?: string | null
  /** Type de contenu OG (default: 'website') */
  type?: 'website' | 'article'
  /** Blok Storyblok — les champs seo_title, seo_description, seo_og_image sont lus automatiquement */
  blok?: Record<string, any> | null
  /** Empêche l'indexation de la page (ajoute <meta name="robots" content="noindex, nofollow">) */
  noindex?: boolean
  /** Type de post pour le JSON-LD : 'actualite' → BlogPosting, 'sortie' → Event */
  postType?: 'actualite' | 'sortie'
  /** Date de début de l'événement (sorties uniquement) */
  eventDate?: string | null
  /** Lieu de l'événement (sorties uniquement) */
  location?: string | null
  /** Auteur de l'article */
  author?: string | null
  /** Date de publication de l'article */
  publishedAt?: string | null
}

/** Retire le nom du site et les séparateurs courants d'un titre Storyblok. */
const stripSiteName = (title: string): string =>
  title
    .replace(new RegExp(`\\s*[-|–]\\s*${SITE_NAME}`, 'gi'), '')
    .replace(new RegExp(`${SITE_NAME}\\s*[-|–]\\s*`, 'gi'), '')
    .trim()

export const useSeo = (options: SeoOptions = {}) => {
  const { blok, type = 'website', noindex = false } = options

  const requestUrl = useRequestURL()
  const canonicalUrl = `${requestUrl.origin}${requestUrl.pathname}`
  const siteOrigin = requestUrl.origin

  // Titre : override explicite > seo_title Storyblok > title du blok (nettoyé) > nom du site seul
  // blok.name intentionnellement exclu : c'est le nom technique Storyblok, souvent mal formaté.
  const rawTitle: string | null =
    options.title ??
    blok?.seo_title ??
    blok?.title ??
    null

  const cleanedTitle = rawTitle ? stripSiteName(rawTitle) : null
  const pageTitle = cleanedTitle ? `${SITE_NAME} | ${cleanedTitle}` : SITE_NAME

  // Description : override > seo_description > excerpt > défaut
  const pageDescription: string =
    options.description ??
    blok?.seo_description ??
    blok?.excerpt ??
    DEFAULT_DESCRIPTION

  // Image OG : override > seo_og_image Storyblok (transformée en 1200×630 webp) > image sociale par défaut du site
  const ogImageFilename = blok?.seo_og_image?.filename as string | undefined
  const pageImage: string | null =
    options.image ??
    (ogImageFilename
      ? `${ogImageFilename}/m/1200x630/filters:quality(80):format(webp)`
      : DEFAULT_OG_IMAGE)

  useSeoMeta({
    title: pageTitle,
    description: pageDescription,
    ogTitle: pageTitle,
    ogDescription: pageDescription,
    ogType: type,
    ogUrl: canonicalUrl,
    ...(pageImage ? { ogImage: pageImage, twitterImage: pageImage } : {}),
    twitterTitle: pageTitle,
    twitterDescription: pageDescription,
  })

  // --- Head : canonical, robots, JSON-LD ---

  const headLinks: { rel: string; href: string }[] = [
    { rel: 'canonical', href: canonicalUrl }
  ]

  const headMeta: { name: string; content: string }[] = noindex
    ? [{ name: 'robots', content: 'noindex, nofollow' }]
    : []

  const scripts: { type: string; key: string; innerHTML: string }[] = []

  // SportsClub — entité principale du club, présente sur toutes les pages.
  // (SportsClub est un sous-type de Organization : une seule entité, pas de doublon.)
  scripts.push({
    type: 'application/ld+json',
    key: 'json-ld-sportsclub',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SportsClub',
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: siteOrigin,
      logo: CLUB_INFO.logo,
      telephone: CLUB_INFO.telephone,
      email: CLUB_INFO.email,
      address: CLUB_INFO.address,
      sameAs: CLUB_INFO.sameAs,
      openingHoursSpecification: CLUB_INFO.openingHoursSpecification,
      sport: 'Climbing'
    })
  })

  // BlogPosting — posts de type actualité
  if (options.postType === 'actualite') {
    const blogPosting: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      author: {
        '@type': 'Person',
        name: options.author ?? blok?.authorName ?? SITE_NAME
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: siteOrigin
      }
    }
    if (pageImage) blogPosting.image = pageImage
    const pubDate = options.publishedAt ?? blok?.date
    if (pubDate) blogPosting.datePublished = pubDate

    scripts.push({
      type: 'application/ld+json',
      key: 'json-ld-blogposting',
      innerHTML: JSON.stringify(blogPosting)
    })
  }

  // Event — posts de type sortie
  if (options.postType === 'sortie') {
    const startDate = options.eventDate ?? blok?.eventDate ?? options.publishedAt ?? blok?.date
    const eventLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      organizer: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: siteOrigin
      }
    }
    if (pageImage) eventLd.image = pageImage
    if (startDate) eventLd.startDate = startDate
    if (options.location) {
      eventLd.location = { '@type': 'Place', name: options.location }
    }

    scripts.push({
      type: 'application/ld+json',
      key: 'json-ld-event',
      innerHTML: JSON.stringify(eventLd)
    })
  }

  useHead({
    link: headLinks,
    ...(headMeta.length ? { meta: headMeta } : {}),
    script: scripts
  })
}
