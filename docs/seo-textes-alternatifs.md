# SEO — Textes alternatifs (`alt`) & liens partenaires à saisir dans Storyblok

> Objectif audit SEO : chaque image porte un `alt` **unique et descriptif**.
> Aujourd'hui plusieurs images partagent un `alt` générique (`Label`, `Photo`,
> `Hero background`…) parce que le champ correspondant est **vide dans Storyblok**.
> Le code utilise déjà `alt` en priorité — il suffit de remplir les champs.

## Règles pour un bon `alt`

- Décrire **ce que l'image montre**, pas « photo de » / « image de ».
- Unique d'une image à l'autre (pas 5 fois « Label »).
- 5–15 mots, pas de bourrage de mots-clés.
- Inclure le nom propre quand c'est un logo (« logo de la FFME », pas « logo »).
- Image purement décorative → `alt=""` volontaire (pas « déco »).

| ❌ Mauvais | ✅ Bon |
|---|---|
| `Label` | `Logo de la Fédération Française de la Montagne et de l'Escalade` |
| `Photo` | `Camille, initiatrice escalade, assurant un grimpeur` |
| `Hero background` | `Grimpeur sur le mur de difficulté de l'ASC Escalade` |

---

## 1. Labels & certifications — `global/site-config` → champ `labels`

Rendu dans le footer ([Footer.vue](../app/components/layout/Footer.vue#L41)) :
`alt = label.alt || label.title || 'Label'`. Les 5 entrées ont un `alt`/`title` vide.

Pour **chaque** asset de la liste `labels`, renseigne le champ **`alt`** (ou `title`) :

| # | Label (à confirmer par le club) | `alt` proposé |
|---|---|---|
| 1 | FFME | `Logo de la Fédération Française de la Montagne et de l'Escalade (FFME)` |
| 2 | Handisport / Para-escalade | `Label Handisport – club labellisé pour la pratique handi-escalade` |
| 3 | *à compléter* | *ex. `Label École Française d'Escalade`* |
| 4 | *à compléter* | *ex. `Label Club Formateur FFME`* |
| 5 | *à compléter* | *ex. `Agrément Jeunesse et Sports`* |

⚠️ Je ne connais pas la liste exacte des 5 labels affichés — **remplace les lignes
« à compléter »** par les vrais intitulés. Ne garde pas d'`alt` inventé.

---

## 2. Photos des encadrants / initiateurs — blok `club-initiateurs`

Rendu dans [Initiateurs.vue](../app/storyblok/club/Initiateurs.vue#L44) :
`alt = item.Nom || item.image.alt || ''`.

➡️ **Il suffit de renseigner le champ `Nom`** de chaque initiateur dans la liste
`initiateurs`. Le nom sert à la fois de légende visible et de `alt`.

- Format conseillé pour `Nom` : `Prénom N.` (ex. `Camille D.`).
- Pour un `alt` plus riche, renseigne en plus le champ `alt` de l'asset image :
  `Camille D., initiatrice escalade à l'ASC Escalade`.

Même principe pour le blok `club-equipe` (bureau & coachs) : champ `name` par membre
([Equipe.vue](../app/storyblok/club/Equipe.vue#L23)).

---

## 3. Images de bannière (hero) — bloks de page

Ces images utilisent un `alt` de repli générique tant que l'asset n'a pas de `alt`.
Renseigne le champ **`alt`** de l'asset dans Storyblok :

| Blok / champ | `alt` de repli actuel | `alt` proposé |
|---|---|---|
| `home-hero` → `backgroundImage` ([Hero.vue](../app/storyblok/Home/Hero.vue#L21)) | `Hero background` | `Grimpeur sur le mur de difficulté de l'ASC Escalade` |
| `home-cta-rejoindre` → `backgroundImage` ([CtaRejoindre.vue](../app/storyblok/Home/CtaRejoindre.vue#L15)) | `Mur d'escalade sombre` | `Salle d'escalade de l'ASC Escalade en ambiance tamisée` |
| `club-histoire` → `image` / `image_after` | `Histoire du club` / `Avant` / `Après` | `Le mur d'escalade du club en [année]` / `Le gymnase avant rénovation` / `Le gymnase après rénovation` |
| `club-timeline` → `steps[].image` | `step.title` | Décrire la photo de l'étape (ex. `Inauguration du mur de 12 mètres en 2019`) |
| `club-galerie` / `ui-galerie` → `photos[].alt` | `Photo de la galerie` | Décrire chaque photo (ex. `Compétition jeunes 2025, phase de bloc`) |

> Note code : les repli `'Hero background'` etc. peuvent aussi être remplacés par des
> valeurs par défaut plus parlantes directement dans les composants si tu préfères
> ne pas dépendre du CMS — dis-le-moi.

---

## 4. Liens partenaires (footer) — `global/site-config` → champ `partners`

Rendu dans [Footer.vue](../app/components/layout/Footer.vue#L114-L124). Les liens
pointent actuellement vers `/` car le champ `link` de chaque partenaire est vide
ou mal renseigné.

Pour chaque entrée de la liste `partners`, renseigne :
- `label` : texte affiché
- `link` : **type « URL / lien externe »**, cible ci-dessous, ouverture nouvel onglet

| `label` | `link` (URL externe) |
|---|---|
| Au Vieux Campeur | `https://www.auvieuxcampeur.fr/` |
| Ville de Chevigny | `https://www.chevigny-saint-sauveur.fr/` |
| FFH | `https://www.handisport.org/` |

> Vérifie le `linktype` : il doit être `url` (lien externe), pas `story`.
> Le code fait `resolveLink()` → un `story` avec `cached_url` vide renvoie `/`,
> ce qui est exactement le bug observé.

Astuce : ajoute aussi un `title`/`aria-label` explicite si le partenaire est
affiché en logo seul (« Site de la Ville de Chevigny-Saint-Sauveur »).
