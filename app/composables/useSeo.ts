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
}

/** Retire le nom du site et les séparateurs courants d'un titre Storyblok. */
const stripSiteName = (title: string): string =>
  title
    .replace(new RegExp(`\\s*[-|–]\\s*${SITE_NAME}`, 'gi'), '')
    .replace(new RegExp(`${SITE_NAME}\\s*[-|–]\\s*`, 'gi'), '')
    .trim()

export const useSeo = (options: SeoOptions = {}) => {
  const { blok, type = 'website' } = options

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

  // Image OG : override > seo_og_image Storyblok (transformée en 1200×630 webp)
  const ogImageFilename = blok?.seo_og_image?.filename as string | undefined
  const pageImage: string | null =
    options.image ??
    (ogImageFilename
      ? `${ogImageFilename}/m/1200x630/filters:quality(80):format(webp)`
      : null)

  useSeoMeta({
    title: pageTitle,
    description: pageDescription,
    ogTitle: pageTitle,
    ogDescription: pageDescription,
    ogType: type,
    ...(pageImage ? { ogImage: pageImage, twitterImage: pageImage } : {}),
    twitterTitle: pageTitle,
    twitterDescription: pageDescription,
  })
}
