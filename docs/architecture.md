# Architecture

## Routing

| Pattern | Fichier | Usage |
|---|---|---|
| `/` | `pages/[...slug].vue` → slug `accueil` | Accueil |
| `/club`, `/tarifs`, etc. | `pages/[...slug].vue` | Pages Storyblok |
| `/posts/:slug` | `pages/posts/[slug].vue` | Article/sortie individuel |
| `/login`, `/callback` | pages dédiées | Auth |
| `/register` | `pages/register.vue` | Inscription publique (3 étapes : type → profil parent → enfants) |
| `/profil` | `pages/profil.vue` | Profil utilisateur + enfants (famille) |
| `/mes-inscriptions` | `pages/mes-inscriptions.vue` | Inscriptions groupes & événements |
| `/admin/dashboard` | `pages/admin/dashboard.vue` | Admin (admin/secrétaire uniquement) |

Le catch-all `[...slug].vue` résout le slug Storyblok et délègue le rendu à `StoryblokComponent`.

### Middleware

`middleware/auth.global.ts` s'exécute côté client sur chaque navigation :
- Redirige vers `/login` si la route commence par `/admin`, `/profil` ou `/mes-inscriptions` et que l'utilisateur n'est pas connecté.
- Redirige vers `/` si la route commence par `/admin` et que l'utilisateur n'a pas le rôle `admin` ou `secretary`.

### Flux mot de passe oublié / réinitialisation

1. Sur `/login`, le lien "Mot de passe oublié" bascule en `forgotMode`
2. `supabase.auth.resetPasswordForEmail()` envoie un lien par email
3. Le lien redirige vers `/callback?type=recovery`
4. `callback.vue` détecte `type=recovery` → navigue vers `/profil?resetPassword=true`
5. Sur `/profil`, le formulaire de réinitialisation s'affiche (champs nouveau mot de passe + confirmation)
6. `supabase.auth.updateUser({ password })` applique le nouveau mot de passe

---

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

---

## API serveur (`server/api/`)

### Contact public

| Route | Méthode | Description |
|---|---|---|
| `/api/contact` | POST | Formulaire de contact → email via Resend. Protections : honeypot, délai min 3s, rate-limit 3/h/IP |

### Inscription publique

| Route | Méthode | Description |
|---|---|---|
| `/api/register` | POST | Inscription publique : crée profil parent + rôle + profils enfants. Idempotente (upsert si profil existant). Utilise le service role pour bypasser les RLS. Le compte Auth est créé côté client via `supabase.auth.signUp()` avant l'appel. |
| `/api/add-child` | POST | Ajoute un profil enfant (sans compte Auth) et le lie au parent connecté via `parent_access`. Assigne automatiquement le rôle `parent` si absent. Utilise le service role. |

### Admin (service role Supabase)

| Route | Méthode | Description |
|---|---|---|
| `/api/admin/members` | GET | Tous les profils + rôles + inscriptions groupes. Param `?exportAll=true` lève la limite PostgREST pour l'export CSV complet. |
| `/api/admin/create-member` | POST | Crée compte Auth + profil + rôles + inscriptions groupes |
| `/api/admin/send-email` | POST | Email notification approbation/refus inscription via Resend |

`requireAdmin(event, { requiredRole?, allowedRoles? })` (`server/utils/requireAdmin.ts`) : sans option, admin, secretary et initiateur passent. `requiredRole` est prioritaire sur `allowedRoles`.

### HelloAsso

Un seul module serveur, `server/utils/helloasso.ts`, parle à HelloAsso (URL, jeton OAuth, erreurs). Aucune route n'appelle directement l'API ni l'endpoint d'auth.

- Configuration : `runtimeConfig.helloasso` (serveur uniquement, rien dans `public`), environnement `sandbox` ou `production` sans valeur par défaut.
- Jeton : une ligne par environnement dans `helloasso_tokens`. Le renouvellement passe par la RPC `helloasso_acquire_token_lock` : au plus un appel d'auth par renouvellement.
- Exports : `resolveHelloAssoConfig`, `createHelloAssoClient` (fabrique testable), `useHelloAsso(event)` (branché sur `runtimeConfig` et le service role), `HelloAssoError`, `toH3Error` (500 config, 503 `rate_limited` / `lock_timeout`, 502 pour le reste).

| Route | Méthode | Rôles | Description |
|---|---|---|---|
| `/api/admin/helloasso-test` | POST | admin | « Tester la connexion » : données publiques, puis droit `AccessTransactions`. Arrêt au premier échec |
| `/api/admin/sync-helloasso` | POST | admin | Synchronisation manuelle, via le client |
| `/api/admin/helloasso-forms` | GET | admin, secretary | Liste des formulaires |
| `/api/admin/helloasso-forms` | POST | admin | Ajout d'un formulaire (saison `AAAA-AAAA` obligatoire) |
| `/api/admin/helloasso-forms/:id` | PATCH | admin | Activation et saison d'un formulaire |
| `/api/admin/helloasso-stats` | GET | admin, secretary | Statistiques |
| `/api/webhooks/helloasso` | POST | public (secret en query) | Webhook HelloAsso ; secret lu via `runtimeConfig` |

Toutes les routes HelloAsso refusent l'initiateur.

### CMS / Cache

| Route | Méthode | Description |
|---|---|---|
| `/api/revalidate` | POST | Webhook Storyblok → purge cache Netlify CDN ciblée par tag (fallback : purge globale). Vérifie le header `webhook-secret` |

---

## Supabase — Auth & données métier

### Tables

| Table | Usage |
|---|---|
| `profiles` | Profil étendu (nom, prénom, licence FFME, type, coordonnées…). `email` nullable (profils enfants sans compte Auth). `id` n'a plus de FK vers `auth.users` (migration 20260409) |
| `user_roles` | Rôles par utilisateur (`admin`, `secretary`, `parent`) |
| `parent_access` | Lien parent → enfant (access_type : `read`, `register`, `full`) |
| `groups` | Groupes d'escalade (nom, max_members, level, referent_id…) |
| `group_schedules` | Créneaux horaires par groupe (day_of_week, start_time, end_time) |
| `group_instructors` | Initiateurs par groupe |
| `group_members` | Inscriptions aux groupes (status : `pending`, `confirmed`, `cancelled`) |
| `events` | Événements (title, starts_at, slug…) |
| `registrations` | Inscriptions aux événements (status : `pending`, `confirmed`, `cancelled`) |
| `notification_logs` | File d'emails à envoyer (SMTP non encore branché) |

### Workflow d'inscription (groupes & events)

Une inscription créée par un membre passe en `status: 'pending'`. L'admin la voit dans la section "Demandes d'inscription" du dashboard et peut l'accepter (`confirmed`) ou la refuser (`cancelled`). À chaque action, un log est inséré dans `notification_logs`.

Un parent peut inscrire un enfant : `enrolled_by` / `registered_by` contient alors l'id du parent.

### Rôles

| Code | Accès |
|---|---|
| `admin` | Accès total dashboard |
| `secretary` | Accès total dashboard |
| `initiateur` | Dashboard en lecture seule (suivi administratif) |
| `parent` | `/profil` + `/mes-inscriptions`, peut inscrire ses enfants |

---

## Structure des dossiers clés

```
app/
├── app.vue                      # UApp + LayoutHeader + NuxtPage + LayoutFooter
├── plugins/storyblok.ts         # Enregistrement de tous les composants Storyblok
├── middleware/
│   └── auth.global.ts           # Guard auth + guard admin
├── composables/
│   ├── useSiteConfig.ts         # Config globale (logo, nav, footer)
│   ├── usePosts.ts              # Articles + sorties
│   ├── useEvents.ts             # Posts avec eventDate (calendrier)
│   ├── useBreakpoints.ts        # Responsive (windowWidth, isMobile, isTablet…)
│   ├── useSeo.ts                # Balises meta/OG depuis Storyblok ou options explicites
│   ├── useStoryblokCacheTag.ts  # Pose les headers Netlify-Cache-Tag (SSR only)
│   ├── useAuth.ts               # Auth Supabase, profil, rôles
│   ├── useFamily.ts             # Liens parent → enfants (parent_access)
│   ├── useGroups.ts             # Groupes, inscriptions, CRUD admin + fetchPreviousYearEnrollments()
│   ├── useEventRegistrations.ts # Inscriptions aux événements
│   └── useEnrollmentRequests.ts # Workflow approbation admin (groupes + events)
├── components/
│   ├── layout/
│   │   ├── Header.vue           # Nav responsive
│   │   └── Footer.vue           # Footer 5 colonnes
│   ├── ui/Tag.vue               # Badge coloré réutilisable
│   └── admin/
│       ├── KpiCard.vue          # Carte statistique individuelle (label, value, icon)
│       ├── KpiCards.vue         # Grille de 4 KpiCards
│       ├── PendingRequests.vue  # Section demandes en attente
│       ├── MembersTable.vue     # Tableau membres + filtre/pagination
│       ├── GroupsList.vue       # Liste des groupes avec créneaux
│       └── modals/
│           ├── MemberModal.vue       # Ajout/édition d'un adhérent
│           ├── ReviewModal.vue       # Validation/refus demande d'inscription
│           ├── GroupModal.vue        # Création/édition d'un groupe
│           └── GroupMembersModal.vue # Liste des membres d'un groupe
├── pages/
│   ├── [...slug].vue            # Catch-all CMS
│   ├── posts/[slug].vue         # Détail post
│   ├── login.vue                # Connexion (email + OAuth) + flux "mot de passe oublié"
│   ├── callback.vue             # Callback OAuth ; redirige vers /profil?resetPassword=true si type=recovery
│   ├── register.vue             # Inscription publique (stepper 3 étapes)
│   ├── profil.vue               # Profil utilisateur + gestion enfants + réinitialisation mot de passe
│   ├── mes-inscriptions.vue     # Inscriptions groupes & événements
│   └── admin/dashboard.vue      # Dashboard admin
├── types/
│   ├── post.ts                  # Interface Post (Storyblok)
│   └── auth.ts                  # Interfaces Supabase (Profile, Group, GroupMember…)
└── storyblok/                   # Composants Storyblok (voir storyblok.md)
server/
├── api/
│   ├── contact.post.ts          # Formulaire contact → Resend (public)
│   ├── register.post.ts         # Inscription publique → crée profil parent + enfants (service role)
│   ├── add-child.post.ts        # Ajoute un enfant à un parent connecté (service role)
│   ├── revalidate.post.ts       # Webhook Storyblok → purge cache Netlify
│   └── admin/
│       ├── members.get.ts       # Liste profils + rôles + groupes (service role)
│       ├── create-member.post.ts # Crée compte Auth + profil + rôles + groupes
│       └── send-email.post.ts   # Email notification approbation/refus via Resend
supabase/
└── migrations/
    └── 20260409_profiles_children_support.sql  # email nullable + suppression FK id→auth.users
```

---

## Interface Post (Storyblok)

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

## Types Supabase principaux (`types/auth.ts`)

```typescript
Profile          // Profil étendu (licence, coordonnées, avatar…)
RoleCode         // 'parent' | 'admin' | 'secretary'
AdherentWithRoles // Adherent + roles[], groupNames[], linkedChildren[]
Group            // Groupe + schedules?, instructors?, referent?, _members_count?
GroupSchedule    // day_of_week, start_time, end_time
GroupMember      // Inscription groupe + status, admin_note, profile?
Registration     // Inscription event + status, profile?
ParentAccessLink // Lien parent-enfant + access_type
```

---

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
| `inscriptions-page` | Page inscriptions (champ `body`) — story slug `inscriptions`. Voir note ci-dessous |

> **`/inscriptions` — migration en cours vers Storyblok.**
> Le fichier `app/pages/inscriptions.vue` (contenu codé en dur, saison 2026/2027) est
> conservé comme secours et **masque toute story Storyblok du même slug**. Pour passer
> la page sous Storyblok : créer la story `inscriptions` (content type `inscriptions-page`),
> la remplir avec les bloks `inscriptions-*` (voir `docs/storyblok.md`), puis supprimer
> `app/pages/inscriptions.vue` pour que le catch-all `[...slug].vue` prenne le relais.


---

## Tests

### Commandes

| Commande | Rôle |
|---|---|
| `npm test` | Vitest, une passe (`tests/**/*.test.ts`) |
| `npm run test:watch` | Vitest en mode watch |
| `npm run test:coverage` | Couverture V8 (`@vitest/coverage-v8`), rapport dans `coverage/` (ignoré par git) |
| `npm run test:e2e` | Playwright : build + `nuxt preview` HTTP sur le port 3100 (~7 min) |
| `E2E_SKIP_BUILD=1 npx playwright test` | Playwright sans rebuild, réutilise `.output/` (~15 s) |
| `npm run test:e2e:ui` / `test:e2e:report` | Interface Playwright / rapport HTML |
| `npm run typecheck` | Typecheck par baseline : échoue sur une erreur nouvelle |
| `npm run typecheck:strict` | `nuxi typecheck`, résultat brut |
| `npm run typecheck:baseline` | Régénère `tests/typecheck-baseline.json` : décision explicite uniquement |

- `typecheck` renvoie le code 2 en cas de problème d'outillage (sortie d'erreurs non analysable, baseline corrompue).
- Baseline au 2026-10-22 : 192 erreurs. La dette se traite dans `docs/features/dette-typecheck/`.
- TypeScript est épinglé en `^5.9.3` : TS 7 est incompatible avec `vue-tsc` 3.3.

### Structure

| Dossier | Contenu |
|---|---|
| `tests/composables/` | Composables (environnement `nuxt`, `mockNuxtImport`) |
| `tests/components/` | Composants montés avec `mountSuspended` |
| `tests/server/` | Handlers `server/api` ; `tests/utils/nitro.ts` (`createMockEvent`, stubs h3) |
| `tests/utils/supabase-mock.ts` | `createSupabaseMock`, `mockChain` (mocks Supabase centralisés) |
| `tests/fixtures/helloasso/` | Fixtures HelloAsso (voir son README) |
| `e2e/` | Specs Playwright, à la racine, exclu de Vitest |

### Stratégie de base de test (DB-2)

- Pas de Supabase local : les appels Supabase sont mockés.
- Les `mockNuxtImport` restent dans chaque fichier de test (hoistés par le plugin Vitest) ; `supabase-mock.ts` fournit les clients factices.
- Limite : les mocks ne détectent ni erreurs SQL, ni RLS, ni contraintes. Une base locale (DB-1) reste à faire si les lots HelloAsso exigent de tester RLS ou migrations.
- `useRuntimeConfig` dans les tests serveur : `mockNuxtImport`, car le global de `stubNitroGlobals` est ignoré sous l'environnement `nuxt`.
- `#supabase/server` : alias Nitro que Vite ne résout pas. `vitest.config.ts` le pointe sur `tests/utils/supabase-server-stub.ts`, que chaque test remplace par `vi.mock`.

### Playwright

- Serveur : build de production + `nuxt preview` en HTTP (pas de `nuxt dev` ni `mkcert`). Le preview charge `.env`, pas `.env.test`.
- Le build écrase `.nuxt/` et `.output/` : ne pas le lancer pendant un `nuxt dev`.
- Premier lancement sur un poste : `npx playwright install chromium`.
- Le smoke test (`/`, `/tarifs`) appelle Storyblok : il échoue hors ligne ou avec un token invalide.

### Variables d'environnement de test

`.env.test` (non versionné) : `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SECRET_KEY`, `STORYBLOK_TOKEN`, `STORYBLOK_REGION`, `STORYBLOK_VERSION`, `STORYBLOK_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NUXT_PUBLIC_SITE_URL`.
