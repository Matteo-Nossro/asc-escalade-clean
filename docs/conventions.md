# Conventions de code & pièges récurrents

## Structure d'un composant Storyblok

```vue
<template>
  <section v-editable="blok" class="...">
    {{ blok.title || 'Valeur par défaut' }}
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'  // TOUJOURS explicite avec lang="ts"

const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
})
</script>
```

**Ne pas faire :**
```ts
// ❌ TypeScript générique → crash Storyblok
defineProps<{ blok: SomeInterface }>()

// ❌ Sans import explicite avec lang="ts"
const x = ref(null)  // ReferenceError: ref is not defined
```

---

## Pièges récurrents

### 1. Technical names Storyblok
Vue ne normalise pas les underscores → utiliser **uniquement des tirets**.
```ts
vueApp.component('club-histoire', ClubHistoire)  // ✅
vueApp.component('club_histoire', ClubHistoire)  // ❌ introuvable
```

### 2. GSAP et opacité initiale
Problème : `gsap.set(el, { opacity: 0 })` suivi de `gsap.to()` → si la timeline échoue, l'élément reste invisible.

Solution : utiliser `gsap.from()` (anime depuis un état, revient à l'état naturel si échec) :
```ts
// ✅
gsap.from(title.value, { opacity: 0, y: 30, duration: 1, delay: 0.3 })

// ❌
gsap.set(title.value, { opacity: 0, y: 30 })
gsap.to(title.value, { opacity: 1, y: 0, duration: 1 })
```

### 3. Refs dans les templates avec v-for
```html
<!-- ✅ Compatible Vue 3 -->
:ref="el => { if (el) statRefs[index] = el }"

<!-- ❌ TypeScript assertion dans template → erreur de parsing -->
:ref="el => statRefs[index] = el as HTMLElement"
```

### 4. Images Storyblok
```html
<!-- Champ Asset unique → NuxtImg -->
<NuxtImg provider="storyblok" :src="blok.image.filename" format="webp" :quality="80" />

<!-- Champ Multi-Asset (galerie) → URL de transformation directe -->
<img :src="`${photo.filename}/m/800x0/filters:quality(75):format(webp)`" />
<!-- Lightbox : -->
<img :src="`${photo.filename}/m/1600x0/filters:quality(80):format(webp)`" />
```

### 5. Datetime Storyblok
Le champ Datetime retourne `"YYYY-MM-DD HH:MM"`, pas `"YYYY-MM-DD"`.
```ts
// Dans useEvents.ts :
date: story.content.eventDate.split(' ')[0]   // "2026-03-13 00:00" → "2026-03-13"
```

### 6. Marquee avec peu d'éléments
Avec peu d'éléments, le marquee laisse du vide. Solution : répliquer jusqu'à un minimum :
```ts
const filledPartners = computed(() => {
  const p = partners.value
  if (!p.length) return []
  const minCount = 8
  const times = Math.ceil(minCount / p.length)
  return Array.from({ length: times }, () => p).flat()
})
```

### 7. Conflits de noms de composants
Nuxt auto-importe tous les composants dans `app/storyblok/`. Plusieurs fichiers `Header.vue` dans des sous-dossiers différents génèrent un conflit WARN. Ce conflit n'affecte pas les composants enregistrés manuellement dans le plugin (ils ont des technical names différents), mais crée du bruit dans les logs.

---

## Couleurs & design tokens

```
#0F1729   Bleu nuit — fond hero, textes titres
#7FD857   Vert escalade — accents, icônes, CTA, barres déco
```

Tailwind classes custom fréquentes :
- `text-[#0F1729]`, `text-[#7FD857]`
- `bg-[#0F1729]`, `bg-[#7FD857]`
- `border-[#7FD857]`

## Catégories de posts (couleurs)

```ts
const colors: Record<string, string> = {
  'Falaise':       '#7FD857',
  'Bloc':          '#4ECDC4',
  'Stage':         '#9333EA',
  'Climb Up':      '#F97316',
  'Cime Altitude': '#2563EB'
}
```

## Composables disponibles

| Composable | Usage |
|---|---|
| `useSiteConfig()` | Config globale (logo, nav, footer) depuis Storyblok |
| `usePosts()` | `.getPosts(type?)`, `.getPostBySlug(slug)` |
| `useEvents()` | `.getEvents()` → posts avec eventDate |
| `useBreakpoints()` | `isMobile`, `isTablet`, `isDesktop`, `breakpoint` |

## Commandes

```bash
npm run dev      # Dev avec HTTPS (mkcert)
npm run build    # Build production
npm run generate # Static generation
```

Variables d'environnement requises (`.env`) :
```
STORYBLOK_TOKEN=...
STORYBLOK_REGION=eu
```
