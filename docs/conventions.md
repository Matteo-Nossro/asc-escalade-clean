# Conventions de code & pièges récurrents

> 🤖 Version agents : skills `asc-rules` (règles critiques + `check.mjs`), `gsap-patterns` (§ 2), `storyblok-images` (§ 4) et `blok` (création d'un blok) dans `.claude/skills/`. Ce fichier reste la source de vérité.

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
// ❌ variante : class="opacity-0" dans le template + gsap.to({ opacity: 1 })
```

**Pattern GSAP standard d'un blok** (cf. `Home/Hero.vue`, `*/Header.vue`, bloks `inscriptions-*`) :
```ts
onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ])
  gsap.registerPlugin(ScrollTrigger)
  // …
})
```
- Import **dynamique** dans `onMounted` (jamais `import { gsap } from 'gsap'` au niveau module → GSAP sortirait du lazy-loading du blok).
- Garde `prefers-reduced-motion` en première ligne.
- Le `<h1>` candidat LCP : `gsap.from({ y })` sans `opacity`, jamais masqué.

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

### 6. Marquee — ne pas dupliquer le contenu en JS (SEO)
Ancienne approche (`filledPartners` répliquant les items en JS) : cassait le SEO
en faisant apparaître chaque logo/nom 4 à 6 fois dans le HTML rendu.

Approche actuelle (`Partenaires.vue`, `Initiateurs.vue`) — marquee **CSS pur** :
la liste réelle est rendue **une seule fois**, suivie d'un **unique** clone
`aria-hidden="true"` nécessaire à la boucle sans couture.
```
.marquee        { display:flex; overflow:hidden; }
.marquee__track { flex-shrink:0; min-width:100%; justify-content:space-around;
                  animation: marquee-scroll 30s linear infinite; }
@keyframes marquee-scroll { to { transform: translateX(-100%); } }
```
`min-width:100%` + `translateX(-100%)` → seamless quel que soit le nombre d'items ;
`justify-content:space-around` gère le cas « peu d'éléments » sans réplication.
Sens inverse : `animation-direction: reverse`. Respecter `prefers-reduced-motion`
(désactiver l'animation + masquer le clone).

### 7. Conflits de noms de composants
Nuxt auto-importe tous les composants dans `app/storyblok/`. Plusieurs fichiers `Header.vue` dans des sous-dossiers différents génèrent un conflit WARN. Ce conflit n'affecte pas les composants enregistrés manuellement dans le plugin, mais crée du bruit dans les logs.

### 8. userId Supabase côté SSR
L'id utilisateur peut être dans `.id` (client) ou `.sub` (SSR/JWT). Toujours utiliser :
```ts
const uid = user.value?.id ?? (user.value as any)?.sub
```

---

## Couleurs & design tokens

Aucun hex dans un `.vue` ou un `.ts` (règle `couleur-hors-theme`, ERREUR). Source unique : `app/assets/css/main.css` (`@theme static`), couleurs de la charte et de composant :
- Classes `bg-vp-green`, `text-vp-dark`, `hover:bg-vp-green-hover` pour les tokens `vp-dark`, `vp-green`, `vp-green-hover`, `vp-dark-hover`, `vp-gray`, `vp-green-check`, `vp-placeholder`, `vp-quote-mark` (ils remplacent les `[#…]`).
- Dans les `<style>` : `var(--vp-…)`.
- Couleur présente dans la palette Tailwind (`gray-200`, `gray-500`…) : sa classe ou `var(--color-gray-500)`. Seules les couleurs absentes de la palette deviennent des tokens `--vp-*` dans `@theme`.
- SVG : classes `fill-…` / `stroke-…`, pas d'attribut de couleur.
- E-mails HTML : `server/utils/email-theme.ts`.

## Catégories de posts (couleurs)

Couleurs des catégories de posts et des difficultés : `app/utils/categoryColors.ts`, avec `getCategoryColor` et `getDifficultyColor`, importés explicitement via `~/utils/categoryColors`. Ajouter une catégorie revient à ajouter une ligne dans ce module.

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
| `useAuth()` | État partagé (`useState`) : `profile`, `roles`, `authStatus`, `isProfileComplete`, `isAdmin`, `isStaff`, `isParent`, `ensureProfile()`, `fetchProfile()`, `resetAuth()`, `updateProfile()`, `loginWithEmail()`, `loginWithOAuth()`, `signUp()`, `resendSignupConfirmation()`, `logout()`, `hasRole()`. Ne pas charger le profil dans un composant : le plugin `auth-sync.client.ts` s'en charge |
| `useFamily()` | `children`, `fetchChildren()`, `linkChild()`, `updateAccess()`, `unlinkChild()` — liens parent → enfants |
| `useGroups()` | `groups`, `myEnrollments`, `fetchGroups()`, `fetchMyEnrollments()`, `enroll()`, `unenroll()`, `isEnrolled()`, `formatSchedule()` + CRUD admin + `fetchPreviousYearEnrollments(profileId)` (inscriptions N-1) |
| `useEventRegistrations()` | `registrations`, `fetchByEvent()`, `fetchMine()`, `register()`, `cancel()`, `confirm()`, `isRegistered()`, `countByEvent()` |
| `useEnrollmentRequests()` | `pendingRequests`, `fetchPendingRequests()`, `approveRequest()`, `rejectRequest()` — workflow admin |

`app/utils/authRedirect.ts` exporte `signupConfirmationRedirect(origin?)`, l'URL de retour des e-mails de confirmation (`/callback?type=signup`). C'est la seule source de cette URL : ne pas l'écrire en dur dans une page ou un composable.

---

## Composants d'inscription partagés (`components/auth/`)

Utilisés par `register.vue` et `completer-profil.vue`. Les champs, les types et les validations viennent de `app/utils/profileForm.ts` : ne pas les redéfinir dans une page.

| Composant | Props / modèles | Rôle |
|---|---|---|
| `AuthProfileFieldsForm` | `errors` ; `v-model` : `ParentFields` | Champs du responsable |
| `AuthChildrenForm` | `v-model` : `ChildData[]`, `draft`, `draftErrors` | Saisie des enfants, brouillon remonté à la page |

---

## Composants admin (`components/admin/`)

Le dashboard admin est découpé en composants autonomes. Tous les composants passent par des props + emit, pas d'état partagé global.

| Composant | Props principales | Emits |
|---|---|---|
| `AdminKpiCard` | `label`, `value`, `subValue?`, `icon`, `iconBg`, `iconColor` | — |
| `AdminKpiCards` | `stats` (object KPIs) | — |
| `AdminPendingRequests` | `requests`, `processingRequestId`, `loading?`, `readonly?` | `open-review`, `refresh` — filtre groupes **multi-select** |
| `AdminMembersTable` | `rows`, `totalCount`, `pending`, `search`, `roleFilter`, `groupFilter`, `statusFilter`, `page`… | `open-modal`, `toggle-status`, `delete`, `export-csv` |
| `AdminGroupsList` | `groups`, `loading`, `formatSchedule` | `open-modal`, `show-members`, `delete` |
| `AdminModalsMemberModal` | `open`, `editMode`, `form`, `saving`, options… | `update:open`, `save`, `add-child`, `remove-child`… — email optionnel |
| `AdminModalsReviewModal` | `open`, `request`, `action`, `note`, `processing`, `emailPreview` | `update:open`, `update:note`, `confirm` |
| `AdminModalsGroupModal` | `open`, `editingGroup`, `groupForm`, `savingGroup`, options… | `update:open`, `save`, `add-instructor`, `add-schedule`… |
| `AdminModalsGroupMembersModal` | `open`, `title`, `members`, `loading`, `removingMemberId` | `update:open`, `remove-member` |

---

## Mise en page desktop (pages à cartes)

Référence : `app/pages/profil.vue`. Le mobile reste la pile verticale d'origine (`max-w-xl`) ; tout le desktop passe par des classes `lg:` / `xl:`.
- Conteneur : `max-w-xl lg:max-w-5xl`.
- Cartes en **deux colonnes indépendantes** (`lg:flex lg:gap-6 lg:items-start`, une `div` `lg:flex-1 lg:min-w-0` par colonne) plutôt qu'une `grid` alignée : pas de trou quand les cartes conditionnelles (`v-if`) ou les hauteurs diffèrent. Couper l'ordre DOM en deux blocs consécutifs ; pas de `order-*`, pour que la tabulation suive le même ordre qu'en mobile.
- Barre d'actions collante (bouton d'enregistrement + messages) : `lg:sticky lg:bottom-0 lg:z-20 lg:bg-gray-100 lg:border-t`, fond opaque, uniquement à partir de `lg`. Ajouter `lg:pb-28` au conteneur pour que la dernière carte ne soit pas masquée.
- Bouton pleine largeur en mobile (`block`), `lg:w-auto` + `lg:justify-end` sur le wrapper à `lg`.

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
