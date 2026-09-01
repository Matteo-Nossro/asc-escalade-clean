// @vitest-environment happy-dom
// Tests de la logique de transformation de usePosts (indépendants de Storyblok/Nuxt)

import { describe, it, expect } from 'vitest'

// ─── Logique extraite de usePosts ─────────────────────────────────────────────
// @storyblok/nuxt crashe le router Nuxt à l'init des tests.
// On teste la transformation directement sans importer le composable.

function mapStoryToPost(story: any) {
  return {
    id: story.id,
    slug: story.slug,
    type: story.content.type,
    title: story.content.title,
    excerpt: story.content.excerpt,
    content: story.content.content ? '<p>content</p>' : '',
    image: story.content.image?.filename ?? '',
    category: story.content.category,
    date: story.content.date,
    author: {
      name: story.content.authorName,
      avatar: story.content.authorAvatar,
    },
    tags: story.content.tags ?? [],
    location: story.content.location,
    maxParticipants: story.content.maxParticipants,
    currentParticipants: story.content.currentParticipants,
    price: story.content.price,
    difficulty: story.content.difficulty,
    featured: story.content.featured ?? false,
    eventDate: story.content.eventDate,
  }
}

function makeStory(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    slug: 'test-post',
    content: {
      type: 'actualite',
      title: 'Titre test',
      excerpt: 'Extrait test',
      content: { type: 'doc', content: [] },
      image: { filename: 'https://cdn.storyblok.com/img.jpg' },
      category: 'club',
      date: '2026-01-15',
      authorName: 'Jean Dupont',
      authorAvatar: 'https://cdn.storyblok.com/avatar.jpg',
      tags: ['escalade', 'club'],
      location: 'Chevigny',
      maxParticipants: 10,
      currentParticipants: 3,
      price: 15,
      difficulty: 'facile',
      featured: true,
      eventDate: '2026-03-20 18:00',
      ...overrides,
    },
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Mapping des champs
// ═════════════════════════════════════════════════════════════════════════════

describe('usePosts — mapping des champs', () => {
  it('mappe correctement tous les champs principaux', () => {
    const post = mapStoryToPost(makeStory())
    expect(post).toMatchObject({
      id: 1,
      slug: 'test-post',
      type: 'actualite',
      title: 'Titre test',
      excerpt: 'Extrait test',
      image: 'https://cdn.storyblok.com/img.jpg',
      category: 'club',
      date: '2026-01-15',
      author: { name: 'Jean Dupont', avatar: 'https://cdn.storyblok.com/avatar.jpg' },
      tags: ['escalade', 'club'],
      featured: true,
      eventDate: '2026-03-20 18:00',
    })
  })

  it("retourne '' pour image si filename est absent", () => {
    expect(mapStoryToPost(makeStory({ image: null })).image).toBe('')
  })

  it("retourne '' pour image si image est undefined", () => {
    expect(mapStoryToPost(makeStory({ image: undefined })).image).toBe('')
  })

  it('retourne [] pour tags si absent', () => {
    expect(mapStoryToPost(makeStory({ tags: undefined })).tags).toEqual([])
  })

  it('retourne false pour featured si absent', () => {
    expect(mapStoryToPost(makeStory({ featured: undefined })).featured).toBe(false)
  })

  it('retourne false pour featured si explicitement false', () => {
    expect(mapStoryToPost(makeStory({ featured: false })).featured).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Valeurs optionnelles
// ═════════════════════════════════════════════════════════════════════════════

describe('usePosts — champs optionnels', () => {
  it('conserve location, maxParticipants, price, difficulty', () => {
    const post = mapStoryToPost(makeStory())
    expect(post.location).toBe('Chevigny')
    expect(post.maxParticipants).toBe(10)
    expect(post.price).toBe(15)
    expect(post.difficulty).toBe('facile')
  })

  it('passe undefined pour les champs optionnels absents', () => {
    const post = mapStoryToPost(makeStory({
      location: undefined,
      maxParticipants: undefined,
      price: undefined,
    }))
    expect(post.location).toBeUndefined()
    expect(post.maxParticipants).toBeUndefined()
    expect(post.price).toBeUndefined()
  })
})
