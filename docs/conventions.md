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
Nuxt auto-importe tous les composants dans `app/storyblok/`. Plusieurs fichiers `Header.vue` dans des sous-dossiers différents génèrent un conflit WARN. Ce conflit n'affecte pas les composants enregistrés manuellement dans le plugin, mais crée du bruit dans les logs.

### 8. userId Supabase côté SSR
L'id utilisateur peut être dans `.id` (client) ou `.sub` (SSR/JWT). Toujours utiliser :
```ts
const uid = user.value?.id ?? (user.value as any)?.sub
```

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

---

## Composables disponibles

### Storyblok / CMS

| Composable | Usage |
|---|---|
| `useSiteConfig()` | Config globale (logo, nav, footer) depuis Storyblok |
| `usePosts()` | `.getPosts(type?)`, `.getPostBySlug(slug)` |
| `useEvents()` | `.getEvents()` → posts avec eventDate |
| `useBreakpoints()` | `isMobile`, `isTablet`, `isDesktop`, `breakpoint` |
| `useSeo(opts?)` | Pose les balises meta/OG. Priorité : `opts.title/description/image` > `blok.seo_*` > `blok.title` > défaut site. Passe `{ blok }` pour lecture automatique des champs Storyblok |
| `useStoryblokCacheTag(...slugs)` | Pose le header `Netlify-Cache-Tag` côté SSR pour invalidation CDN ciblée. No-op côté client/dev |

### Supabase / Auth & métier

| Composable | Usage |
|---|---|
| `useAuth()` | `profile`, `roles`, `isAdmin`, `isStaff`, `isParent`, `fetchProfile()`, `updateProfile()`, `loginWithEmail()`, `loginWithOAuth()`, `signUp()`, `logout()`, `hasRole()` |
| `useFamily()` | `children`, `fetchChildren()`, `linkChild()`, `updateAccess()`, `unlinkChild()` — liens parent → enfants |
| `useGroups()` | `groups`, `myEnrollments`, `fetchGroups()`, `fetchMyEnrollments()`, `enroll()`, `unenroll()`, `isEnrolled()`, `formatSchedule()` + CRUD admin |
| `useEventRegistrations()` | `registrations`, `fetchByEvent()`, `fetchMine()`, `register()`, `cancel()`, `confirm()`, `isRegistered()`, `countByEvent()` |
| `useEnrollmentRequests()` | `pendingRequests`, `fetchPendingRequests()`, `approveRequest()`, `rejectRequest()` — workflow admin |

---

## Composants admin (`components/admin/`)

Le dashboard admin est découpé en composants autonomes. Tous les composants passent par des props + emit, pas d'état partagé global.

| Composant | Props principales | Emits |
|---|---|---|
| `AdminKpiCard` | `label`, `value`, `subValue?`, `icon`, `iconBg`, `iconColor` | — |
| `AdminKpiCards` | `stats` (object KPIs) | — |
| `AdminPendingRequests` | `requests`, `processingRequestId` | `open-review` |
| `AdminMembersTable` | `rows`, `totalCount`, `pending`, `search`, `roleFilter`, `page`… | `open-modal`, `toggle-status`, `delete`, `export-csv` |
| `AdminGroupsList` | `groups`, `loading`, `formatSchedule` | `open-modal`, `show-members`, `delete` |
| `AdminModalsMemberModal` | `open`, `editMode`, `form`, `saving`, options… | `update:open`, `save`, `add-child`, `remove-child`… |
| `AdminModalsReviewModal` | `open`, `request`, `action`, `note`, `processing`, `emailPreview` | `update:open`, `update:note`, `confirm` |
| `AdminModalsGroupModal` | `open`, `editingGroup`, `groupForm`, `savingGroup`, options… | `update:open`, `save`, `add-instructor`, `add-schedule`… |
| `AdminModalsGroupMembersModal` | `open`, `title`, `members`, `loading`, `removingMemberId` | `update:open`, `remove-member` |

---

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
SUPABASE_URL=...
SUPABASE_KEY=...
RESEND_API_KEY=...              # Emails (contact + notifications admin)
STORYBLOK_WEBHOOK_SECRET=...   # Revalidation ISR via webhook Storyblok
```
