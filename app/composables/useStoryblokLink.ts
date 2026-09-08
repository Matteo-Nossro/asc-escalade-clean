/**
 * Résolution d'un champ « Link » Storyblok (url / story / asset / email).
 *
 * Renvoie un objet prêt à brancher sur `<NuxtLink>` / `<a>` / `<UButton>` :
 *   - `href`     : l'URL finale (ou `undefined` si le champ est vide)
 *   - `external` : `true` pour un lien http(s) externe, un asset ou un mailto
 *                  → dans ce cas poser `target="_blank" rel="noopener"`
 *
 * Storyblok renvoie un champ Link sous la for:
 *   { linktype, url, cached_url, email, anchor }
 */
export interface ResolvedLink {
  href: string | undefined
  external: boolean
}

export const useStoryblokLink = () => {
  const resolveLink = (link?: Record<string, any> | null): ResolvedLink => {
    if (!link) return { href: undefined, external: false }

    const { linktype, url, cached_url, email, anchor } = link

    if (linktype === 'email') {
      return { href: email ? `mailto:${email}` : undefined, external: true }
    }

    if (linktype === 'asset' || linktype === 'url') {
      const base = url || cached_url || ''
      if (!base) return { href: undefined, external: false }
      return {
        href: anchor ? `${base}#${anchor}` : base,
        external: linktype === 'asset' || /^https?:\/\//.test(base),
      }
    }

    // linktype === 'story' (ou non renseigné)
    let path = cached_url || url || ''
    if (!path) return { href: undefined, external: false }
    if (!path.startsWith('/') && !/^https?:\/\//.test(path)) path = `/${path}`
    if (anchor) path += `#${anchor}`
    return { href: path, external: /^https?:\/\//.test(path) }
  }

  /**
   * Résout un fichier téléchargeable : un champ Asset Storyblok en priorité
   * (document déposé dans la bibliothèque d'assets), sinon un champ Link
   * (URL externe ou page du site) en repli.
   *
   * @param asset champ `asset` Storyblok — `{ filename, ... }`
   * @param link  champ `multilink` Storyblok — repli si pas d'asset
   */
  const resolveFileOrLink = (
    asset?: Record<string, any> | null,
    link?: Record<string, any> | null,
  ): ResolvedLink => {
    if (asset?.filename) return { href: asset.filename, external: true }
    return resolveLink(link)
  }

  return { resolveLink, resolveFileOrLink }
}
