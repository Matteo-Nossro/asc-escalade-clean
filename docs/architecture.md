# Architecture

## Routing

| Pattern | Fichier | Usage |
|---|---|---|
| `/` | `pages/[...slug].vue` → slug `accueil` | Accueil |
| `/club`, `/tarifs`, etc. | `pages/[...slug].vue` | Pages Storyblok |
| `/posts/:slug` | `pages/posts/[slug].vue` | Article/sortie individuel |
| `/login`, `/callback` | pages dédiées | Auth |
| `/profil` | `pages/profil.vue` | Profil utilisateur + enfants (famille) |
| `/mes-inscriptions` | `pages/mes-inscriptions.vue` | Inscriptions groupes & événements |
| `/admin/dashboard` | `pages/admin/dashboard.vue` | Admin (admin/secrétaire uniquement) |

Le catch-all `[...slug].vue` résout le slug Storyblok et délègue le rendu à `StoryblokComponent`.

### Middleware

`middleware/auth.global.ts` s'exécute côté client sur chaque navigation :
- Redirige vers `/login` si la route commence par `/admin`, `/profil` ou `/mes-inscriptions` et que l'utilisateur n'est pas connecté.
- Redirige vers `/` si la route commence par `/admin` et que l'utilisateur n'a pas le rôle `admin` ou `secretary`.

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

### Admin (service role Supabase)

| Route | Méthode | Description |
|---|---|---|
| `/api/admin/members` | GET | Tous les profils + rôles + inscriptions groupes |
| `/api/admin/create-member` | POST | Crée compte Auth + profil + rôles + inscriptions groupes |
| `/api/admin/send-email` | POST | Email notification approbation/refus inscription via Resend |

### CMS / Cache

| Route | Méthode | Description |
|---|---|---|
| `/api/revalidate` | POST | Webhook Storyblok → purge cache Netlify CDN ciblée par tag (fallback : purge globale). Vérifie le header `webhook-secret` |

---

## Supabase — Auth & données métier

### Tables

| Table | Usage |
|---|---|
| `profiles` | Profil étendu (nom, prénom, licence FFME, type, coordonnées…) |
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
│   ├── useGroups.ts             # Groupes, inscriptions, CRUD admin
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
│   ├── login.vue                # Connexion (email + OAuth)
│   ├── callback.vue             # Callback OAuth
│   ├── profil.vue               # Profil utilisateur + gestion enfants
│   ├── mes-inscriptions.vue     # Inscriptions groupes & événements
│   └── admin/dashboard.vue      # Dashboard admin
├── types/
│   ├── post.ts                  # Interface Post (Storyblok)
│   └── auth.ts                  # Interfaces Supabase (Profile, Group, GroupMember…)
└── storyblok/                   # Composants Storyblok (voir storyblok.md)
server/
├── api/
│   ├── contact.post.ts          # Formulaire contact → Resend (public)
│   ├── revalidate.post.ts       # Webhook Storyblok → purge cache Netlify
│   └── admin/
│       ├── members.get.ts       # Liste profils + rôles + groupes (service role)
│       ├── create-member.post.ts # Crée compte Auth + profil + rôles + groupes
│       └── send-email.post.ts   # Email notification approbation/refus via Resend
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
