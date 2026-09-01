import { describe, it, expect } from 'vitest'
import { resolveLegacyRedirect, resolveSectionRedirect, EXACT } from '../../server/utils/legacyRedirects'

// Redirections 301 de l'ancien site www.escalade-chevigny.fr → nouveau site.
// cf. server/middleware/legacy-redirects.ts

describe('resolveLegacyRedirect — pages figées de l\'ancien CMS', () => {
  it('mappe chaque entrée EXACT vers sa cible', () => {
    for (const [from, to] of Object.entries(EXACT)) {
      expect(resolveLegacyRedirect(from)).toBe(to)
    }
  })

  it('redirige les pages "club" de l\'ancien site', () => {
    expect(resolveLegacyRedirect('/le-club-p21.html')).toBe('/club')
    expect(resolveLegacyRedirect('/le-staff-p33.html')).toBe('/club')
    expect(resolveLegacyRedirect('/evolutiondumur-p36.html')).toBe('/club')
  })

  it('redirige contact / tarifs / inscriptions', () => {
    expect(resolveLegacyRedirect('/nous-contacter-p1.html')).toBe('/contact')
    expect(resolveLegacyRedirect('/plan-d-acces-p2.html')).toBe('/contact')
    expect(resolveLegacyRedirect('/tarifs-inscription-p29.html')).toBe('/inscriptions')
    expect(resolveLegacyRedirect('/horaires-des-entrainements-p32.html')).toBe('/tarifs')
  })
})

describe('resolveLegacyRedirect — ancien listing des actualités', () => {
  it('redirige la page listing et sa pagination vers /actualites', () => {
    expect(resolveLegacyRedirect('/actualites-p6.html')).toBe('/actualites')
    expect(resolveLegacyRedirect('/actualites-p6-1.html')).toBe('/actualites')
    expect(resolveLegacyRedirect('/actualites-p6-66.html')).toBe('/actualites')
  })

  it('redirige les filtres de catégorie inconnus vers /actualites', () => {
    expect(resolveLegacyRedirect('/actualites-p6-com.html')).toBe('/actualites')
    expect(resolveLegacyRedirect('/actualites-p6-com-14.html')).toBe('/actualites')
    expect(resolveLegacyRedirect('/actualites-p6-aut.html')).toBe('/actualites')
    expect(resolveLegacyRedirect('/actualites-p6-sta.html')).toBe('/actualites')
    expect(resolveLegacyRedirect('/actualites-p6-reu.html')).toBe('/actualites')
  })

  it('redirige le filtre "sorties" (sor) vers /sorties', () => {
    expect(resolveLegacyRedirect('/actualites-p6-sor.html')).toBe('/sorties')
    expect(resolveLegacyRedirect('/actualites-p6-sor-9.html')).toBe('/sorties')
  })
})

describe('resolveLegacyRedirect — filet de sécurité', () => {
  it('renvoie toute ancienne fiche article "-n123.html" vers /actualites', () => {
    expect(resolveLegacyRedirect('/fete-du-mur-6-n208.html')).toBe('/actualites')
    expect(resolveLegacyRedirect('/telethon-2013-n6.html')).toBe('/actualites')
    expect(resolveLegacyRedirect('/nouveau-topo-de-geligny-n179.html')).toBe('/actualites')
  })

  it('renvoie toute autre page .html inconnue vers /actualites', () => {
    expect(resolveLegacyRedirect('/une-page-quelconque.html')).toBe('/actualites')
  })
})

describe('resolveLegacyRedirect — hors périmètre', () => {
  it('ignore les chemins qui ne finissent pas par .html', () => {
    expect(resolveLegacyRedirect('/')).toBeNull()
    expect(resolveLegacyRedirect('/club')).toBeNull()
    expect(resolveLegacyRedirect('/posts/mon-article')).toBeNull()
    expect(resolveLegacyRedirect('/extranet/documents/files/reglement.pdf')).toBeNull()
  })
})

describe('resolveSectionRedirect — anciens chemins /actualites/:slug et /sorties/:slug', () => {
  it('redirige un article vers /posts/:slug', () => {
    expect(resolveSectionRedirect('/actualites/fete-du-mur')).toBe('/posts/fete-du-mur')
    expect(resolveSectionRedirect('/sorties/falaise-geligny')).toBe('/posts/falaise-geligny')
    expect(resolveSectionRedirect('/actualites/fete-du-mur/')).toBe('/posts/fete-du-mur')
  })

  it('NE touche PAS les pages liste /actualites et /sorties', () => {
    expect(resolveSectionRedirect('/actualites')).toBeNull()
    expect(resolveSectionRedirect('/sorties')).toBeNull()
    expect(resolveSectionRedirect('/actualites/')).toBeNull()
    expect(resolveSectionRedirect('/sorties/')).toBeNull()
  })

  it('ignore les autres chemins', () => {
    expect(resolveSectionRedirect('/')).toBeNull()
    expect(resolveSectionRedirect('/posts/x')).toBeNull()
    expect(resolveSectionRedirect('/club')).toBeNull()
  })
})
