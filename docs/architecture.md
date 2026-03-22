# Architecture

## Routing

| Pattern | Fichier | Usage |
|---|---|---|
| `/` | `pages/[...slug].vue` → slug `accueil` | Accueil |
| `/club`, `/tarifs`, etc. | `pages/[...slug].vue` | Pages Storyblok |
| `/posts/:slug` | `pages/posts/[slug].vue` | Article/sortie individuel |
| `/login`, `/callback` | pages dédiées | Auth |
| `/admin/dashboard` | page dédiée | Admin |

Le catch-all `[...slug].vue` résout le slug Storyblok et délègue le rendu à `StoryblokComponent`.

## Flux de données Storyblok

```
[...slug].vue
  └─ useAsyncStoryblok(slug)
       └─ story.content.component → StoryblokComponent
            └─ vueApp.component('nom-tirets') dans storyblok.ts
                 └─ composant storyblok/xxx/Yyy.vue
```

### Données globales (header/footer)
```
app.vue → LayoutHeader / LayoutFooter (components/layout/)
  └─ useSiteConfig()
       └─ storyblokApi.get('cdn/stories/global/site-config')
            └─ story content type : site-config
```

### Posts et événements
```
usePosts()
  ├─ getPosts(type?)   → cdn/stories (starts_with: 'posts/')
  └─ getPostBySlug(s)  → cdn/stories/posts/:slug

useEvents()
  └─ getEvents()       → posts/ filtrés sur content.eventDate non vide
                         eventDate : "YYYY-MM-DD HH:MM" → split(' ')[0] → "YYYY-MM-DD"
```

## Structure des dossiers clés

```
app/
├── app.vue                  # UApp + LayoutHeader + NuxtPage + LayoutFooter
├── plugins/storyblok.ts     # Enregistrement de tous les composants Storyblok
├── composables/
│   ├── useSiteConfig.ts     # Config globale (logo, nav, footer)
│   ├── usePosts.ts          # Articles + sorties
│   ├── useEvents.ts         # Posts avec eventDate (calendrier)
│   └── useBreakpoints.ts    # Responsive (windowWidth, isMobile, isTablet…)
├── components/layout/
│   ├── Header.vue           # Nav responsive, données depuis useSiteConfig()
│   └── Footer.vue           # Footer 5 colonnes, données depuis useSiteConfig()
├── components/ui/Tag.vue    # Badge coloré réutilisable
├── storyblok/               # Composants Storyblok (voir storyblok.md)
├── pages/
│   ├── [...slug].vue        # Catch-all CMS
│   └── posts/[slug].vue     # Détail post (image hero, sidebar, related)
└── types/post.ts            # Interface Post TypeScript
```

## Interface Post

```typescript
interface Post {
  id, slug, type: 'sortie' | 'actualite'
  title, excerpt, content (HTML rendu)
  image (URL Storyblok), category, date
  author: { name, avatar? }
  tags: string[]
  // Sorties uniquement :
  location?, maxParticipants?, currentParticipants?, price?, difficulty?
  featured?, eventDate?   // eventDate → affiché dans le calendrier homepage
}
```

## Content types Storyblok (pages)

| Technical name | Usage |
|---|---|
| `page` | Page générique avec champ `body` |
| `post` | Article ou sortie (champ `type`) |
| `site-config` | Config globale (logo, nav, footer) |
| `tarifs-page` | Page tarifs avec SVG décoratif |
| `contact-page` | Page contact layout 2 colonnes |
| `actualites-page` | Page actualités |
| `sorties-page` | Page sorties |
