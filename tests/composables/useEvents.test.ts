// @vitest-environment happy-dom
// Tests de la logique de transformation de useEvents (indépendants de Storyblok/Nuxt)

import { describe, it, expect } from 'vitest'

// ─── Logique extraite de useEvents ───────────────────────────────────────────
// On teste la transformation directement : @storyblok/nuxt crashe le router
// Nuxt à l'init des tests, donc on valide la logique sans importer le composable.

function mapStoryToEvent(story: any) {
  return {
    id: story.id,
    slug: story.slug,
    type: story.content.type,
    title: story.content.title,
    date: story.content.eventDate.split(' ')[0],
    category: story.content.category,
  }
}

function getEventsFromStories(stories: any[]) {
  return stories
    .filter((s: any) => !!s.content.eventDate)
    .map(mapStoryToEvent)
}

function makeStory(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    slug: 'test-event',
    content: {
      type: 'sortie',
      title: 'Sortie test',
      category: 'competition',
      eventDate: '2026-03-13 00:00',
      ...overrides,
    },
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Transformation eventDate
// ═════════════════════════════════════════════════════════════════════════════

describe('useEvents — transformation eventDate', () => {
  it("extrait seulement la date sans l'heure", () => {
    const [event] = getEventsFromStories([makeStory()])
    expect(event.date).toBe('2026-03-13')
  })

  it("extrait la date peu importe l'heure", () => {
    const [event] = getEventsFromStories([makeStory({ eventDate: '2026-06-21 14:30' })])
    expect(event.date).toBe('2026-06-21')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Filtrage des stories sans eventDate
// ═════════════════════════════════════════════════════════════════════════════

describe('useEvents — filtrage eventDate', () => {
  it('filtre les stories avec eventDate null, vide ou undefined', () => {
    const stories = [
      makeStory({ eventDate: '2026-03-13 00:00' }),
      makeStory({ eventDate: null }),
      makeStory({ eventDate: '' }),
      makeStory({ eventDate: undefined }),
    ]
    expect(getEventsFromStories(stories)).toHaveLength(1)
  })

  it('retourne une liste vide si aucune story valide', () => {
    expect(getEventsFromStories([makeStory({ eventDate: null })])).toEqual([])
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Mapping des champs
// ═════════════════════════════════════════════════════════════════════════════

describe('useEvents — mapping des champs', () => {
  it('mappe correctement id, slug, type, title, category', () => {
    const [event] = getEventsFromStories([
      makeStory({ title: 'Bloc en foret', category: 'competition' }),
    ])
    expect(event).toMatchObject({
      id: 1,
      slug: 'test-event',
      type: 'sortie',
      title: 'Bloc en foret',
      category: 'competition',
    })
  })
})
