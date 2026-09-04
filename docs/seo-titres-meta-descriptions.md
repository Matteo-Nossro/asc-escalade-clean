# SEO — Titres & meta descriptions à saisir dans Storyblok

> Objectif audit SEO : `<title>` de 50–60 caractères incluant **ville + activité**,
> meta description de **150–160 caractères** avec un **appel à l'action**, unique par page.

## Où saisir

Pour chaque page de contenu, dans Storyblok, sur le **blok racine** de la story
(`page`, `tarifs-page`, `actualites-page`, `sorties-page`, `inscriptions-page`…) :

| Champ Storyblok | Rôle |
|---|---|
| `seo_title` | Titre **sans** le nom du site — voir note ci-dessous |
| `seo_description` | Meta description + `og:description` / `twitter:description` |
| `seo_og_image` | (optionnel) image de partage propre à la page, sinon fallback logo 1200×630 |

### ⚠️ Note importante sur `seo_title`

Le code ([app/composables/useSeo.ts](../app/composables/useSeo.ts)) **préfixe automatiquement**
`ASC Escalade | ` (15 caractères) devant la valeur de `seo_title`.

- Ne **pas** remettre « ASC Escalade » dans le champ (il serait retiré puis re-préfixé).
- Viser **35–45 caractères** dans le champ pour un titre final de 50–60.
- Le titre final rendu est indiqué dans la colonne « Titre final » ci-dessous.

Si tu préfères un format différent (marque à la fin, tiret plutôt que pipe…),
c'est un changement de 2 lignes dans `useSeo.ts` — demande-le.

---

## Valeurs recommandées

Les descriptions sont rédigées à partir des informations connues du club
(escalade en salle + falaise, Chevigny-Saint-Sauveur près de Dijon, gymnase Boivin,
club associatif, tous âges et niveaux). **Relis-les** et ajuste les détails
(nombre d'adhérents, années, créneaux) si besoin — je n'ai pas inventé de chiffres.

### Accueil — story `accueil` (`/`)

- **`seo_title`** :
  ```
  Club d'escalade à Chevigny-Saint-Sauveur
  ```
  → Titre final : `ASC Escalade | Club d'escalade à Chevigny-Saint-Sauveur` *(≈ 54 car.)*

- **`seo_description`** *(≈ 156 car.)* :
  ```
  L'ASC Escalade, club d'escalade à Chevigny-Saint-Sauveur près de Dijon : cours encadrés en salle, mur de bloc et de difficulté, sorties en falaise. Venez essayer !
  ```

### Le club — story `club` (`/club`)

- **`seo_title`** :
  ```
  Le club : histoire, équipe et valeurs
  ```
  → `ASC Escalade | Le club : histoire, équipe et valeurs` *(≈ 51 car.)*

- **`seo_description`** *(≈ 158 car.)* :
  ```
  Découvrez l'ASC Escalade : son histoire, son équipe de bénévoles et d'initiateurs passionnés et ses valeurs de partage à Chevigny-Saint-Sauveur. Rejoignez le club !
  ```

### Tarifs — story `tarifs` (`/tarifs`)

- **`seo_title`** :
  ```
  Tarifs, créneaux et groupes du club
  ```
  → `ASC Escalade | Tarifs, créneaux et groupes du club` *(≈ 49 car.)*

- **`seo_description`** *(≈ 157 car.)* :
  ```
  Cotisations, créneaux hebdomadaires et groupes par âge et par niveau de l'ASC Escalade à Chevigny-Saint-Sauveur. Consultez la grille et choisissez votre formule !
  ```

### Contact — story `contact` (`/contact`)

- **`seo_title`** :
  ```
  Contact, accès et horaires du gymnase
  ```
  → `ASC Escalade | Contact, accès et horaires du gymnase` *(≈ 51 car.)*

- **`seo_description`** *(≈ 159 car.)* :
  ```
  Contactez l'ASC Escalade : adresse du gymnase Boivin à Chevigny-Saint-Sauveur, plan d'accès, horaires des créneaux et formulaire en ligne. Écrivez-nous pour un essai !
  ```

### Sorties — story `sorties` (`/sorties`)

- **`seo_title`** :
  ```
  Sorties escalade en falaise et blocs
  ```
  → `ASC Escalade | Sorties escalade en falaise et blocs` *(≈ 50 car.)*

- **`seo_description`** *(≈ 156 car.)* :
  ```
  Le programme des sorties de l'ASC Escalade : falaises et sites de bloc de la région, week-ends et grandes voies, encadrés par le club. Inscrivez-vous à la prochaine !
  ```

### Actualités — story `actualites` (`/actualites`)

- **`seo_title`** :
  ```
  Actualités et vie du club d'escalade
  ```
  → `ASC Escalade | Actualités et vie du club d'escalade` *(≈ 50 car.)*

- **`seo_description`** *(≈ 155 car.)* :
  ```
  Compétitions, événements, travaux du mur et vie associative : suivez toutes les actualités de l'ASC Escalade à Chevigny-Saint-Sauveur. Abonnez-vous et ne manquez rien !
  ```

### Inscriptions — page codée `/inscriptions`

> Cette page est **codée hors CMS** ([app/pages/inscriptions.vue](../app/pages/inscriptions.vue)).
> Elle appelle **déjà** `useSeo()` (ligne ~143) avec `title: 'Inscriptions'` et une
> description correcte. **Seul le titre est à rallonger** — modification dans le
> fichier `.vue`, pas dans Storyblok.

- `title` actuel → `ASC Escalade | Inscriptions` *(28 car., trop court)*
- `title` proposé : `Inscriptions saison ${SEASON}` → `ASC Escalade | Inscriptions saison 2026-2027` *(≈ 43 car.)*
- Description actuelle : déjà ~200 car. avec les infos clés — OK, on peut juste
  ajouter une accroche finale : `… Inscrivez-vous dès l'ouverture des permanences !`

Dis-moi si tu veux que j'applique ce changement de `title` (1 ligne).

### Articles — stories `posts/*` (`/posts/:slug`)

Gérés dynamiquement ([app/pages/posts/[slug].vue](../app/pages/posts/%5Bslug%5D.vue)) :
le `seo_title` / `seo_description` de chaque article est repris s'il existe, sinon
`title` et `excerpt`. **Recommandations rédactionnelles** :

- Titre article : 40–55 car., commencer par le sujet, éviter « Article : … ».
- Excerpt / `seo_description` : 150–160 car., résumer + inciter à lire (« Lire le compte-rendu », « Découvrir les résultats »).

---

## Points ouverts

- **`/inscriptions`** : `title` trop court (`Inscriptions`) — à rallonger dans le
  `.vue` (voir section dédiée). Le reste est OK.
- **Format du titre** : préfixe `ASC Escalade | ` codé en dur. Modifiable si tu veux
  la marque en fin de titre (meilleure pratique pour l'accueil).
