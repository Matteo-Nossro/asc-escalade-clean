# Catalogue des bloks Storyblok

## Enregistrement

Tous les composants sont enregistrés dans `app/plugins/storyblok.ts` :
```ts
vueApp.component('technical-name', ImportedComponent)
```
**Technical names = tirets uniquement.** Vue normalise les tirets mais pas les underscores.

---

## Content Types (pages entières)

| Technical name | Composant | Champs |
|---|---|---|
| `page` | `storyblok/Page.vue` | `body` (Blocks) |
| `post` | `storyblok/Post.vue` | voir Interface Post |
| `site-config` | `storyblok/SiteConfig.vue` | logo, nav_links, footer… |
| `tarifs-page` | `storyblok/tarifs/TarifsPage.vue` | `body` (Blocks) + SVG déco fond |
| `contact-page` | `storyblok/contact/ContactPage.vue` | `body` (Blocks) layout 2 colonnes |
| `actualites-page` | `storyblok/actualites/Page.vue` | `body` (Blocks) |
| `sorties-page` | `storyblok/sorties/Page.vue` | `body` (Blocks) |

---

## Bloks par page

### Homepage
| Technical name | Composant | Champs |
|---|---|---|
| `home-hero` | `Home/Hero.vue` | `title`, `subtitle` |
| `home-actualites` | `Home/Actualites.vue` | — (fetch automatique posts) |
| `home-prochains-evenements` | `Home/ProchainsEvenements.vue` | — (fetch automatique events) |
| `home-cta-rejoindre` | `Home/CtaRejoindre.vue` | `title`, `subtitle`, `button_label`, `button_link` |

### Club
| Technical name | Composant | Champs |
|---|---|---|
| `club-hero` | `club/HeroClub.vue` | `title`, `subtitle` |
| `club-histoire` | `club/Histoire.vue` | `title`, `content` (Richtext), `image` (Asset) |
| `club-timeline` | `club/Timeline.vue` | `steps` (Blocks → `club-timeline-step`) — défilement horizontal GSAP. Fallback données statiques si `steps` vide |
| `club-equipe` | `club/Equipe.vue` | `members` (Blocks → `club-membre`) |
| `club-statistiques` | `club/Statistiques.vue` | `stats` (Blocks → `club-stat`) |
| `club-galerie` | `club/Galerie.vue` | `photos` (**Multi-Asset**) — 8 photos affichées, bouton "Voir plus" (+8) |
| `club-partenaires` | `club/Partenaires.vue` | `title`, `subtitle`, `partners` (Blocks → `club-partenaire`) |

**Nestables club :**
- `club-membre` : `name` (Text), `role` (Text), `image` (Asset)
- `club-stat` : `icon` (Text, ex: `i-heroicons-user-group`), `value` (Number), `suffix` (Text), `label` (Text)
- `club-partenaire` : `name` (Text), `logo` (Asset)

### Actualités
| Technical name | Composant | Champs |
|---|---|---|
| `actualites-header` | `actualites/Header.vue` | `title`, `subtitle` |

### Sorties
| Technical name | Composant | Champs |
|---|---|---|
| `sorties-header` | `sorties/Header.vue` | `title`, `subtitle` |
| `sorties-concept` | `sorties/Concept.vue` | `title`, `description`, `tags` (Blocks → `sorties-tag`) |
| `sorties-liste` | `sorties/ListeSorties.vue` | `sorties` (Blocks → `sorties-item`) |

**Nestables sorties :**
- `sorties-tag` : `label` (Text)
- `sorties-item` : `title`, `slug`, `image` (Asset), `category`, `date`, `location`, `difficulty`, `price` (Number), `max_participants` (Number), `current_participants` (Number)

### Tarifs
| Technical name | Composant | Champs |
|---|---|---|
| `tarifs-hero` | `tarifs/Header.vue` | `title`, `subtitle` |
| `tarifs-planning` | `tarifs/Planning.vue` | `title`, `categories` (Blocks) |
| `tarifs-bon-a-savoir` | `tarifs/BonASavoir.vue` | — |
| `tarifs-grille-tarifs` | `tarifs/GrilleTarifs.vue` | — |
| `groupes-accordeon` | `tarifs/Accordeon.vue` | `title` (Text) — accordéon des groupes d'escalade, données chargées depuis Supabase |

### Contact
| Technical name | Composant | Champs |
|---|---|---|
| `contact-header` | `contact/Header.vue` | `title`, `subtitle` |
| `contact-infos` | `contact/Infos.vue` | `title`, `description`, `address_name`, `address_city`, `email`, `phone`, `map_url` |
| `contact-form` | `contact/Form.vue` | `form_title` |

### UI généraux (réutilisables)
| Technical name | Composant | Champs |
|---|---|---|
| `accordions` | `ui/Accordions.vue` | `title`, `items` (Blocks → `accordion-item`) |
| `call-to-action` | `ui/CallToAction.vue` | `title`, `subtitle`, `button_label`, `button_link` |
| `centered-image` | `ui/CenteredImage.vue` | `image` (Asset), `caption` |
| `tabs-section` | `ui/TabsSection.vue` | `tabs` (Blocks → `tab-item`) |
| `text-with-image` | `ui/TextWithImage.vue` | `title`, `content` (Richtext), `image` (Asset), `image_position` |
| `text-with-title` | `ui/TextWithTitle.vue` | `title`, `content` (Richtext) |
| `galerie` | `ui/Galerie.vue` | `photos` (**Multi-Asset**) — 8 photos affichées, bouton "Voir plus" (+8) |
| `before-after` | `ui/BeforeAfter.vue` | `title?`, `subtitle?`, `image_before` (Asset), `image_after` (Asset), `label_before?`, `label_after?`, `aspect_ratio?` (défaut `16/9`) |
| `bouton` | `ui/Bouton.vue` | — |
| `carrousel` | `ui/Carrousel.vue` | — |
| `action-bouton` | `ui/ActionBouton.vue` | `text` (Text), `link` (Link — supporte url, story, asset, email) |

---

## Posts (contenu dynamique)

Stockés dans le dossier `posts/` de Storyblok, content type `post`.

| Champ | Type | Notes |
|---|---|---|
| `type` | Text | `actualite` ou `sortie` |
| `title` | Text | |
| `excerpt` | Textarea | |
| `content` | Richtext | |
| `image` | Asset | |
| `category` | Text | |
| `date` | Text | Format `YYYY-MM-DD` |
| `authorName` | Text | |
| `tags` | Text (multi) | |
| `eventDate` | **Datetime** | Si défini → apparaît dans le calendrier homepage. Format retourné : `"YYYY-MM-DD HH:MM"` → `split(' ')[0]` dans `useEvents.ts` |
| `location` | Text | Sorties uniquement |
| `maxParticipants` | Number | Sorties uniquement |
| `currentParticipants` | Number | Sorties uniquement |
| `price` | Number | Sorties uniquement |
| `difficulty` | Text | Sorties uniquement |
| `featured` | Boolean | |

---

## Ajouter un nouveau composant Storyblok

1. Créer `app/storyblok/xxx/MonComposant.vue` avec `defineProps({ blok: Object })` et `v-editable="blok"`
2. L'importer dans `app/plugins/storyblok.ts`
3. L'enregistrer : `vueApp.component('mon-composant', MonComposant)` (tirets !)
4. Créer le blok dans Storyblok avec le même technical name
