# ASC Escalade — Site Web

Site officiel de l'ASC Escalade, association de grimpe basée à Chevigny-Saint-Sauveur (21).

## Stack technique

| Technologie | Rôle |
|---|---|
| **Nuxt 4** | Framework SSR Vue.js |
| **Storyblok** | CMS headless (contenu + édition visuelle) |
| **Nuxt UI** | Composants UI (boutons, modals, calendrier…) |
| **Nuxt Image** | Optimisation images (provider Storyblok) |
| **GSAP** | Animations et transitions |
| **Tailwind CSS** | Styles utilitaires |
| **SCSS** | Styles personnalisés (header) |

---

## Prérequis

- Node.js ≥ 18
- Un espace Storyblok configuré (voir section [Configuration Storyblok](#configuration-storyblok))

## Installation

```bash
npm install
```

## Variables d'environnement

Copie `.env.example` en `.env` et remplis les valeurs :

```env
STORYBLOK_TOKEN=ton_preview_token
STORYBLOK_REGION=eu
```

> Le serveur de dev tourne en **HTTPS** (certificat auto-signé via `mkcert`). Storyblok requiert HTTPS pour le Visual Editor.

## Développement

```bash
npm run dev
```

Le serveur démarre sur `https://localhost:3000`.

## Build & Preview

```bash
npm run build
npm run preview
```

---

## Architecture du projet

```
app/
├── components/
│   └── layout/
│       ├── Header.vue          # Navigation principale (données depuis Storyblok SiteConfig)
│       └── Footer.vue          # Pied de page (données depuis Storyblok SiteConfig)
│
├── composables/
│   ├── useBreakpoints.ts       # Détection responsive (isMobile, isDesktop…)
│   ├── useEvents.ts            # Fetch événements calendrier (posts avec eventDate)
│   ├── usePosts.ts             # Fetch articles / sorties
│   └── useSiteConfig.ts        # Fetch config globale (logo, nav, footer)
│
├── pages/
│   ├── [...slug].vue           # Route principale → rendu via Storyblok
│   ├── posts/[slug].vue        # Page détail d'un article/sortie
│   ├── mentions-legales.vue    # Page statique
│   ├── login.vue               # Authentification
│   └── callback.vue            # Callback OAuth
│
├── plugins/
│   └── storyblok.ts            # Enregistrement de tous les composants Storyblok
│
├── storyblok/                  # Composants Storyblok (un par blok CMS)
│   ├── Home/                   # Bloks page d'accueil
│   ├── club/                   # Bloks page Le Club
│   ├── contact/                # Bloks page Contact
│   ├── sorties/                # Bloks page Sorties
│   ├── tarifs/                 # Bloks page Tarifs
│   ├── actualites/             # Bloks page Actualités
│   ├── ui/                     # Bloks UI réutilisables
│   ├── Page.vue                # Wrapper page générique
│   ├── Post.vue                # Wrapper article/sortie
│   └── SiteConfig.vue          # Content type config globale
│
└── types/
    └── post.ts                 # Type TypeScript Post (article + sortie)
```

---

## Configuration Storyblok

### Structure des stories

| Chemin Storyblok | Content type | Description |
|---|---|---|
| `accueil` | `page` | Page d'accueil |
| `club` | `page` | Page Le Club |
| `tarifs` | `tarifs-page` | Page Tarifs (wrapper avec fond décoratif) |
| `sorties` | `page` | Page Sorties |
| `actualites` | `actualites-page` | Page Actualités |
| `contact` | `contact-page` | Page Contact (layout 2 colonnes) |
| `global/site-config` | `site-config` | Config globale (logo, nav, footer) |
| `posts/*` | `post` | Articles et sorties individuels |

### Composants disponibles (bloks)

#### Page d'accueil
| Technical name | Description |
|---|---|
| `home-hero` | Section hero avec animation |
| `home-actualites` | Grille des dernières actualités |
| `home-prochains-evenements` | Calendrier interactif des événements |
| `home-cta-rejoindre` | Bloc appel à l'action |

#### Le Club
| Technical name | Description |
|---|---|
| `club-hero` | Hero de la page club |
| `club-histoire` | Histoire du club (richtext + image) |
| `club-equipe` | Grille des membres |
| `club-statistiques` | Compteurs animés (bloks nestables `club-stat`) |
| `club-galerie` | Galerie masonry (champ Multi-Asset) |
| `club-partenaires` | Marquee de logos partenaires |

#### Tarifs
| Technical name | Description |
|---|---|
| `tarifs-hero` | Hero page tarifs |
| `tarifs-grille-tarifs` | Tableau des tarifs |
| `tarifs-planning` | Planning des cours |
| `tarifs-bon-a-savoir` | Section infos pratiques |

#### Sorties
| Technical name | Description |
|---|---|
| `sorties-header` | Hero page sorties |
| `sorties-concept` | Bloc concept + tags |
| `sorties-liste` | Liste des sorties (bloks nestables `sorties-item`) |

#### Contact
| Technical name | Description |
|---|---|
| `contact-header` | Hero page contact |
| `contact-infos` | Informations de contact + carte |
| `contact-form` | Formulaire de contact |

#### Actualités
| Technical name | Description |
|---|---|
| `actualites-header` | Hero page actualités |

#### UI réutilisables (utilisables sur toutes les pages)
| Technical name | Description |
|---|---|
| `text-with-title` | Bloc titre + richtext |
| `text-with-image` | Texte et image côte à côte |
| `centered-image` | Image centrée avec légende |
| `accordions` | FAQ / accordéons |
| `call-to-action` | Bouton d'appel à l'action |
| `tabs-section` | Contenu à onglets |
| `galerie` | Galerie photos (Multi-Asset) |
| `bouton` | Bouton simple |
| `carrousel` | Carrousel d'images |

### Champ `eventDate` sur les posts

Pour qu'un article ou une sortie apparaisse dans le calendrier de la page d'accueil, remplir le champ **`eventDate`** (type Datetime) avec la date de l'événement. Laisser vide si ce n'est pas un événement.

### Config globale (`site-config`)

La story `global/site-config` alimente le header et le footer. Champs principaux :

| Champ | Type | Utilisation |
|---|---|---|
| `logo_image` | Asset | Logo (priorité sur le texte) |
| `logo_text_top` | Text | Ligne 1 du logo texte |
| `logo_text_bottom` | Text | Ligne 2 du logo texte |
| `nav_links` | Blocks → `nav_link` | Liens de navigation header |
| `footer_description` | Textarea | Description dans le footer |
| `address` / `phone` / `email` | Text | Coordonnées footer |
| `footer_nav_links` | Blocks → `nav_link` | Liens de navigation footer |
| `social_links` | Blocks → `social_link` | Réseaux sociaux |

---

## Ajouter un nouveau composant Storyblok

1. Créer le fichier Vue dans `app/storyblok/<section>/MonComposant.vue`
2. Utiliser le pattern standard :
```vue
<template>
  <section v-editable="blok">
    {{ blok.title || 'Valeur par défaut' }}
  </section>
</template>

<script setup>
const props = defineProps({ blok: { type: Object, required: true } })
</script>
```
3. Enregistrer dans `app/plugins/storyblok.ts` :
```ts
import MonComposant from '../storyblok/<section>/MonComposant.vue'
// ...
vueApp.component('mon-composant', MonComposant)
```
4. Créer le blok correspondant dans l'interface Storyblok avec le même technical name

---

## Déploiement

Le site est hébergé sur **Vercel**. Le déploiement est automatique sur push vers `main`.

Les variables d'environnement Storyblok sont à configurer dans le dashboard Vercel.
