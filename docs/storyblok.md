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
| `inscriptions-page` | `storyblok/inscriptions/InscriptionsPage.vue` | `body` (Blocks) — story slug `inscriptions` (le fichier `app/pages/inscriptions.vue` la masque tant qu'il existe) |

---

## Kit de blocs réutilisables (`bloc-*`)

Composants génériques pour composer n'importe quelle page (boutique, événement, page info…),
tous sous le même châssis DA (`app/storyblok/blocs/_SectionShell.vue` + `useSectionFond()`).
Groupe Storyblok **Réutilisable**, tag **ui**.

| Technical name | Composant | Rôle |
|---|---|---|
| `bloc-hero` | `blocs/BlocHero.vue` | bandeau titre (badge, titre, sous-titre, image de fond, boutons) |
| `bloc-texte` | `blocs/BlocTexte.vue` | paragraphe riche, largeur lisible |
| `bloc-texte-media` | `blocs/BlocTexteMedia.vue` | texte + image côte à côte |
| `bloc-grille-cartes` | `blocs/BlocGrilleCartes.vue` | grille (avec `nb_visibles` + « Voir plus ») ou carrousel — nestable `bloc-carte` |
| `bloc-infos-cles` | `blocs/BlocInfosCles.vue` | rangée de chiffres / faits — nestable `bloc-info-cle` |
| `bloc-programme` | `blocs/BlocProgramme.vue` | étapes numérotées + horaire — nestable `bloc-programme-etape` |
| `bloc-colonnes` | `blocs/BlocColonnes.vue` | 2-3 colonnes libres (texte/image/bouton), `alignement` gauche/centre — nestable `bloc-colonne` |
| `bloc-galerie` | `blocs/BlocGalerie.vue` | grille photos + visionneuse (multiasset `photos`) |
| `bloc-logos` | `blocs/BlocLogos.vue` | logos partenaires, grille ou défilement — nestable `bloc-logo` |
| `bloc-carte-acces` | `blocs/BlocCarteAcces.vue` | plan + adresse + accès + itinéraire |
| `bloc-faq` | `blocs/BlocFaq.vue` | accordéon Q/R + JSON-LD FAQPage — nestable `bloc-faq-item` |
| `bloc-tableau` | `blocs/BlocTableau.vue` | tableau (champ `table` natif), colonne surlignable, 1ʳᵉ col figeable ; **< md : chaque ligne devient une carte** (En-tête : valeur), ≥ md : tableau avec dégradé + « faites défiler » si scrollable |
| `bloc-documents` | `blocs/BlocDocuments.vue` | centre de téléchargement — nestables `bloc-document-groupe` / `bloc-document` (asset `fichier` + `url_externe`) |
| `bloc-agenda` | `blocs/BlocAgenda.vue` | événements datés, tri à venir/passés + JSON-LD Event — nestable `bloc-agenda-evenement` |
| `bloc-cta` | `blocs/BlocCta.vue` | encadré coloré + boutons |
| `bloc-encadre` | `blocs/BlocEncadre.vue` | callout info/succès/attention/sombre |
| `bloc-alerte` | `blocs/BlocAlerte.vue` | bandeau d'annonce (fermable, mémorisé localStorage) — **pas de `fond`** |
| `bloc-espacement` | `blocs/BlocEspacement.vue` | blanc réglable S/M/L/XL |
| `bloc-separateur` | `blocs/BlocSeparateur.vue` | trait fin (largeur pleine/courte, épaisseur fine/épaisse) |

Largeur de section (`_SectionShell`, prop `largeur`) : `large` (pleine largeur du conteneur, ~1760px — **défaut**,
comme les pages club/accueil), `normale` (max-w-6xl, pour `texte-media`/`programme`/`encadre`/`agenda`),
`lisible` (max-w-3xl, pour `texte`/`faq`).

Primitives internes (préfixe `_`, non enregistrées) : `_SectionShell`, `_BlocBouton`, `_Carte`, `_DocLien`, `_AgendaLigne`.
Nestable commun : `bloc-bouton` (`label`, `lien`, `fichier` asset, `style`, `icon`), `bloc-item` (`texte`).

**Champs communs** : tous les blocs de section ont `fond` (Option `blanc`/`gris`/`vert`/`bleu-nuit`)
et `anchor_id` (Text). `bloc-alerte`/`bloc-espacement`/`bloc-separateur` n'ont pas d'`anchor_id`.

**Générer / pousser** :
```bash
npm run sb:blocs        # écrit .storyblok/components/blocs-reutilisables.components.json
npx storyblok components pull --space <SPACE_ID>
node scripts/storyblok-blocs-reutilisables.mjs --merge .storyblok/components/<SPACE_ID>/components.json
npx storyblok components push --space <SPACE_ID>
```
Groupe (`Réutilisable`) et tag (`ui`) sont déjà renseignés dans les définitions (space `291351822158044`).

**Page de test** : `/test-blocs` ([app/pages/test-blocs.vue](../app/pages/test-blocs.vue)) rend les 19 blocs
avec des données d'exemple — à supprimer une fois validés.

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
| `club-initiateurs` | `club/Initiateurs.vue` | `title`, `subtitle`, `initiateurs` (Blocks → `club-initiateur`) — défilement marquee 2 lignes |

**Nestables club :**
- `club-membre` : `name` (Text), `role` (Text), `image` (Asset)
- `club-stat` : `icon` (Text, ex: `i-heroicons-user-group`), `value` (Number), `suffix` (Text), `label` (Text)
- `club-partenaire` : `name` (Text), `logo` (Asset)
- `club-initiateur` : `Nom` (Text), `image` (Asset)

### Actualités
| Technical name | Composant | Champs |
|---|---|---|
| `actualites-header` | `actualites/Header.vue` | `title`, `subtitle` |

### Sorties
| Technical name | Composant | Champs |
|---|---|---|
| `sorties-header` | `sorties/Header.vue` | `title`, `subtitle` |
| `sorties-concept` | `sorties/Concept.vue` | `title`, `description` (Richtext), `tags` (Blocks → `sorties-tag`) |
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
| `liste-groupe-accordeon` | `tarifs/ListeGroupeAccordeon.vue` | `title` (Text) — accordéon des groupes d'escalade, données chargées depuis Supabase via `GroupsAccordion` |

### Inscriptions

Story slug `inscriptions`, content type `inscriptions-page` (champ `body`). Ordre des bloks
reproduisant la page actuelle : `inscriptions-hero` → `inscriptions-permanences` →
`inscriptions-niveaux` → `inscriptions-documents` → `inscriptions-sante` → `inscriptions-cartes-info` (Assurance &
règlement) → `inscriptions-cotisations` → `inscriptions-aides` → `inscriptions-cartes-info`
(Créneaux & groupes) → `inscriptions-cta`.

**Tous les bloks `inscriptions-*` acceptent un champ `fond` (Option, technical values : `blanc`
\| `gris` \| `vert` \| `bleu-nuit`, défaut `blanc`)** et un champ `anchor_id` (Text). Cela permet
de réordonner les bloks librement dans `body` et d'alterner les couleurs de section sans toucher
au code. Le mapping couleur → classes est centralisé dans `useInscriptionsFond()`
(`app/composables/useInscriptionsFond.ts`) ; `bleu-nuit` (fond sombre + titres clairs) est à
réserver aux bloks composés de cartes blanches (permanences, documents, santé, cotisations,
aides, niveaux).

| Technical name | Composant | Champs (hors `fond` + `anchor_id`, communs) |
|---|---|---|
| `inscriptions-hero` | `inscriptions/InscriptionsHero.vue` | `badge` (Text), `title` (Text), `subtitle` (Textarea), `liens` (Blocks → `inscriptions-ancre`) |
| `inscriptions-niveaux` | `inscriptions/InscriptionsNiveaux.vue` | `surtitre?`, `title` (Text, défaut « Quel est mon niveau ? »), `intro` (Textarea), `niveaux` (Blocks → `inscriptions-niveau`), `note` (Textarea — bandeau bleu nuit en bas) — grille 2 colonnes des équivalences de niveaux |
| `inscriptions-permanences` | `inscriptions/InscriptionsPermanences.vue` | `surtitre` (Text, ex `Étape 1`), `title` (Text), `permanences` (Blocks → `inscriptions-permanence`), `encadre` (Richtext — bandeau bleu nuit en bas) |
| `inscriptions-documents` | `inscriptions/InscriptionsDocuments.vue` | `surtitre`, `title`, `intro` (Textarea), `colonnes` (Blocks → `inscriptions-doc-groupe`), `document_seul` (Blocks → `inscriptions-doc`, 1 seul — carte pleine largeur) |
| `inscriptions-sante` | `inscriptions/InscriptionsSante.vue` | `surtitre`, `title`, `etapes` (Blocks → `inscriptions-sante-etape`) |
| `inscriptions-cartes-info` | `inscriptions/InscriptionsCartesInfo.vue` | `surtitre?`, `title?`, `cartes` (Blocks → `inscriptions-carte-info`) — grille 2 colonnes réutilisable |
| `inscriptions-cotisations` | `inscriptions/InscriptionsCotisations.vue` | `surtitre`, `title`, `intro` (Textarea), `lignes` (Blocks → `inscriptions-cotisation-ligne`), `note` (Textarea). **En-têtes de colonnes figés** (Catégorie / Licence FFME / CT21 / Ligue / Cotisation club / Total) |
| `inscriptions-aides` | `inscriptions/InscriptionsAides.vue` | `titre_reductions` (Text), `reductions` (Blocks → `inscriptions-item`), `titre_paiement` (Text), `paiement_texte` (Textarea), `paiement_modes` (Blocks → `inscriptions-item`) |
| `inscriptions-cta` | `inscriptions/InscriptionsCta.vue` | `title` (Text), `texte` (Textarea), `bouton_label` (Text), `bouton_lien` (Link), `icon` (Text, défaut `i-heroicons-envelope`) |

**Nestables inscriptions** (schémas Storyblok uniquement — pas de `.vue`, consommés comme données) :
- `inscriptions-ancre` : `label` (Text), `ancre` (Text, ex `#permanences`)
- `inscriptions-niveau` : `numero` (Text, ex `1`), `titre` (Text), `resume` (Textarea — phrase courte en italique), `competences` (Blocks → `inscriptions-item`), `equivalence` (Text — pastille « Équivaut à : … »)
- `inscriptions-permanence` : `icon` (Text, défaut `i-heroicons-calendar-days`), `tag` (Text), `title` (Text), `audience` (Text), `date` (Text), `horaire` (Text), `lieu` (Text)
- `inscriptions-doc-groupe` : `icon` (Text), `titre` (Text), `sous_titre` (Text), `documents` (Blocks → `inscriptions-doc`)
- `inscriptions-doc` : `titre` (Text), `hint` (Text), `icon` (Text), `fichier` (**Asset** — document dans la bibliothèque Storyblok, prioritaire), `url_externe` (Link — repli si pas d'asset)
- `inscriptions-sante-etape` : `numero` (Text, ex `1`), `titre` (Text), `texte` (Richtext), `encadre` (Textarea — encart vert clair optionnel), `cas` (Blocks → `inscriptions-sante-cas`), `bouton_label` (Text), `bouton_fichier` (Asset optionnel), `bouton_lien` (Link)
- `inscriptions-sante-cas` : `numero` (Text, ex `1er cas`), `titre` (Text), `detail` (Text)
- `inscriptions-carte-info` : `icon` (Text), `titre` (Text), `texte` (Richtext), `theme` (Option : `clair` \| `fonce`), `liens` (Blocks → `inscriptions-lien`), `bouton_label` (Text), `bouton_fichier` (Asset optionnel), `bouton_lien` (Link), `bouton_style` (Option : `vert` \| `sombre` \| `outline`)
- `inscriptions-lien` : `label` (Text), `fichier` (**Asset** — prioritaire), `lien` (Link — repli), `icon` (Text, défaut `i-heroicons-arrow-top-right-on-square`)
- `inscriptions-cotisation-ligne` : `categorie` (Text), `hint` (Text), `licence` (Text), `ct21` (Text), `ligue` (Text), `club` (Text), `total` (Text)
- `inscriptions-parcours-etape` : `numero` (Text), `titre` (Text), `texte` (Richtext), `bouton_label` (Text), `bouton_fichier` (Asset optionnel), `bouton_lien` (Link)
- `inscriptions-item` : `texte` (Text)

**Fichiers / documents** : les champs `fichier` / `bouton_fichier` sont des **Assets Storyblok** (PDF, Word…),
résolus en priorité sur le champ Link associé via `useStoryblokLink().resolveFileOrLink(asset, link)`.
Un champ Asset sans `filetypes` accepte tous les types de fichiers.

#### Créer ces bloks sans passer par l'UI

Le script `scripts/storyblok-inscriptions-components.mjs` génère les 23 définitions
(content type + sections + nestables) au format CLI Storyblok v4.

```bash
npm run sb:inscriptions        # écrit .storyblok/components/inscriptions.components.json (référence)

npx storyblok login
npx storyblok components pull --space <SPACE_ID>                       # rafraîchit le miroir local
node scripts/storyblok-inscriptions-components.mjs --merge \
  .storyblok/components/<SPACE_ID>/components.json                     # fusionne (remplace par name)
npx storyblok components push --space <SPACE_ID>                       # crée / met à jour dans Storyblok
```

Le `--merge` ne touche qu'aux composants `inscriptions-*` ; les autres composants du
`components.json` fraîchement « pull » sont conservés tels quels.

**Contenu du parcours en ligne** (`inscriptions-parcours`, onglets adulte / enfant, récupéré de
l'ancienne page `inscriptions.vue`) : `npm run sb:inscriptions:parcours` écrit le bloc pré-rempli.
Pour l'injecter dans la story :

```bash
npx storyblok stories pull --space <SPACE_ID> --starts-with inscriptions
node scripts/storyblok-inscriptions-parcours-content.mjs --into .storyblok/stories/<SPACE_ID>/inscriptions.json
npx storyblok stories push --space <SPACE_ID>
```

Le bloc est inséré juste avant `inscriptions-cta` (ou en fin de `body`), et tout `inscriptions-parcours`
déjà présent est remplacé.

Helpers associés : `useStoryblokLink()` (`resolveLink(link)` → `{ href, external }` ;
`resolveFileOrLink(asset, link)` → asset prioritaire),
`useGsapReveal(rootRef)` (fondu au scroll des `[data-reveal]`) et
`useInscriptionsFond(() => blok.fond)` (couleur de section → `{ section, titre, texte, sombre }`).

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
