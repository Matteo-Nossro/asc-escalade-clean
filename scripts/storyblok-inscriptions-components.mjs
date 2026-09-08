#!/usr/bin/env node
/**
 * Génère les définitions de composants Storyblok des bloks « inscriptions »
 * (content type + sections + nestables) au format attendu par la CLI Storyblok v4
 * (`storyblok components push`).
 *
 * Chaque champ porte un nom d'affichage et une description en français, pensés
 * pour un bénévole du club qui édite la page sans connaître le code.
 *
 * Usage :
 *   # 1. écrire un fichier de référence autonome
 *   node scripts/storyblok-inscriptions-components.mjs
 *   → écrit .storyblok/components/inscriptions.components.json
 *
 *   # 2. fusionner (remplacement par `name`) dans un components.json déjà « pull »
 *   node scripts/storyblok-inscriptions-components.mjs --merge .storyblok/components/<SPACE_ID>/components.json
 *
 * Puis :
 *   npx storyblok login
 *   npx storyblok components push --space <SPACE_ID>
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'

// id de champ au format Storyblok (chaîne url-safe de 22 caractères)
const fid = () => randomBytes(16).toString('base64url').slice(0, 22)

const F = {
  text: (display, description) => ({ type: 'text', display_name: display, description }),
  textarea: (display, description) => ({ type: 'textarea', display_name: display, description }),
  richtext: (display, description) => ({ type: 'richtext', display_name: display, description }),
  link: (display, description) => ({ type: 'multilink', display_name: display, description }),
  // champ Asset sans restriction de type → accepte PDF, Word, images, etc.
  asset: (display, description) => ({ type: 'asset', display_name: display, description, filetypes: [] }),
  option: (display, description, values, def) => ({
    type: 'option',
    display_name: display,
    description,
    use_uuid: true,
    exclude_empty_option: true,
    default_value: def,
    options: values.map((v) => (typeof v === 'string' ? { name: v, value: v } : v)),
  }),
  bloks: (display, description, whitelist, maximum) => ({
    type: 'bloks',
    display_name: display,
    description,
    restrict_type: '',
    restrict_components: true,
    component_whitelist: whitelist,
    component_denylist: [],
    ...(maximum ? { maximum } : {}),
  }),
}

/** champ « Couleur de fond » commun à tous les bloks de section */
const FOND = F.option(
  'Couleur de fond de la section',
  "Change la couleur d'arrière-plan du bloc entier. Alternez les couleurs entre deux blocs qui se suivent pour bien les séparer visuellement. « Bleu nuit » : à réserver aux blocs faits de cartes blanches (permanences, documents, santé, cotisations, niveaux).",
  [
    { name: 'Blanc', value: 'blanc' },
    { name: 'Gris clair', value: 'gris' },
    { name: 'Vert clair', value: 'vert' },
    { name: 'Bleu nuit (texte clair)', value: 'bleu-nuit' },
  ],
  'blanc',
)

/** champ « Ancre » commun à tous les bloks de section */
const ANCRE = F.text(
  'Ancre de navigation',
  "Mot-clé sans espace ni accent (ex : permanences). Permet de créer un lien qui saute directement à ce bloc, sous la forme /inscriptions#permanences. Laissez vide si le bloc n'a pas besoin d'être ciblé par un lien.",
)

/** champ « fichier de bouton » : asset optionnel, prioritaire sur le lien du bouton */
const BTN_FICHIER = F.asset(
  'Fichier du bouton (optionnel)',
  "Si renseigné, le bouton télécharge ce document (PDF, Word…) au lieu de suivre « Lien du bouton ».",
)

const ICON = (contexte = '') =>
  F.text(
    'Icône',
    `Nom d'une icône Heroicons, ex : i-heroicons-calendar-days. Catalogue : heroicons.com (cliquez une icône, prenez son nom et ajoutez le préfixe « i-heroicons- »).${contexte ? ' ' + contexte : ''}`,
  )

/**
 * @param {string} name  technical name (tirets)
 * @param {object} opts { root?, nestable?, display, description, schema }
 */
const comp = (name, opts) => {
  const schema = {}
  Object.entries(opts.schema).forEach(([key, def], pos) => {
    schema[key] = { ...def, pos, id: fid() }
  })
  return {
    name,
    display_name: opts.display || null,
    description: opts.description || '',
    schema,
    is_root: !!opts.root,
    is_nestable: opts.root ? false : opts.nestable !== false,
    color: null,
    icon: null,
    component_group_uuid: null,
    all_presets: [],
    preset_id: null,
    real_name: opts.display || name,
    internal_tags_list: [],
    internal_tag_ids: [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloks de section (whitelist du content type)
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
  'inscriptions-hero',
  'inscriptions-permanences',
  'inscriptions-niveaux',
  'inscriptions-documents',
  'inscriptions-sante',
  'inscriptions-cartes-info',
  'inscriptions-cotisations',
  'inscriptions-aides',
  'inscriptions-parcours',
  'inscriptions-cta',
]

const components = [
  // ── Content type ──────────────────────────────────────────────────────────
  comp('inscriptions-page', {
    root: true,
    display: 'Page Inscriptions',
    description:
      "Gabarit de la page /inscriptions. Ajoutez, retirez et réordonnez les blocs dans « Sections de la page » : l'ordre à l'écran suit l'ordre de la liste.",
    schema: {
      body: F.bloks(
        'Sections de la page',
        "Les grands blocs empilés verticalement sur la page. Glissez-déposez pour changer l'ordre.",
        SECTIONS,
      ),
    },
  }),

  // ── Sections ──────────────────────────────────────────────────────────────
  comp('inscriptions-hero', {
    display: 'Section — Bandeau titre',
    description: "Grand bandeau en haut de la page : badge, titre, sous-titre et boutons d'accès rapide.",
    schema: {
      badge: F.text(
        'Badge',
        "Petite étiquette verte au-dessus du titre, ex : « Saison 2026 / 2027 ». Laissez vide pour la masquer.",
      ),
      title: F.text('Titre principal', "Le grand titre de la page. Ex : « Inscriptions »."),
      subtitle: F.textarea(
        'Sous-titre',
        "Phrase d'introduction sous le titre (2 lignes maximum conseillé).",
      ),
      liens: F.bloks(
        "Boutons d'accès rapide",
        "Petits boutons ronds sous le titre qui font défiler la page jusqu'à une section. Un bouton = un élément.",
        ['inscriptions-ancre'],
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-permanences', {
    display: 'Section — Permanences (dates)',
    description: 'Les créneaux où venir s\'inscrire en personne, présentés en cartes.',
    schema: {
      surtitre: F.text(
        'Surtitre',
        "Petit texte vert en majuscules au-dessus du titre, ex : « Étape 1 ». Optionnel.",
      ),
      title: F.text('Titre de la section', "Ex : « Les permanences d'inscription »."),
      permanences: F.bloks(
        'Liste des permanences',
        'Une carte par créneau (date + horaire + lieu). Ajoutez autant de cartes que nécessaire.',
        ['inscriptions-permanence'],
      ),
      encadre: F.richtext(
        'Encadré en bas (bleu nuit)',
        "Bandeau bleu nuit sous les cartes, utile pour un rappel important (ex : date de reprise des cours). Laissez vide pour le masquer.",
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-niveaux', {
    display: 'Section — Niveaux (équivalences)',
    description:
      'Grille qui explique les niveaux du club (débutant → compétition) et à quoi ils correspondent.',
    schema: {
      surtitre: F.text('Surtitre', "Petit texte vert en majuscules au-dessus du titre. Optionnel."),
      title: F.text(
        'Titre de la section',
        "Si laissé vide, affiche « Quel est mon niveau ? ».",
      ),
      intro: F.textarea('Texte d\'introduction', 'Une phrase sous le titre pour expliquer la grille. Optionnel.'),
      niveaux: F.bloks(
        'Les niveaux',
        'Une carte par niveau. En général 4 : Grand débutant, Autonome en moulinette, Autonome en tête, Avancé / compétition.',
        ['inscriptions-niveau'],
      ),
      note: F.textarea(
        'Conseil en bas',
        "Bandeau conseil sous la grille, ex : « Dans le doute, choisissez le niveau en dessous ». Laissez vide pour le masquer.",
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-documents', {
    display: 'Section — Documents à télécharger',
    description: 'Les fiches et questionnaires à préparer, rangés en deux colonnes (ex : Adultes / Mineurs).',
    schema: {
      surtitre: F.text('Surtitre', "Petit texte vert en majuscules au-dessus du titre, ex : « Étape 2 ». Optionnel."),
      title: F.text('Titre de la section', "Ex : « Les documents à préparer »."),
      intro: F.textarea('Texte d\'introduction', "Paragraphe sous le titre. Optionnel."),
      colonnes: F.bloks(
        'Colonnes de documents',
        'Chaque colonne regroupe des documents pour un public (ex : « Adultes », « Mineurs »). En général 2 colonnes.',
        ['inscriptions-doc-groupe'],
      ),
      document_seul: F.bloks(
        'Document mis en avant',
        "Un seul document, affiché en grande carte pleine largeur sous les colonnes (ex : certificat médical commun). Optionnel.",
        ['inscriptions-doc'],
        1,
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-sante', {
    display: 'Section — Santé (certificat médical)',
    description: "Explications sur l'attestation de santé, le certificat médical et la saisie sur myFFME.",
    schema: {
      surtitre: F.text('Surtitre', "Petit texte vert en majuscules au-dessus du titre. Optionnel."),
      title: F.text(
        'Titre de la section',
        "Si laissé vide, affiche « Attestation de santé & certificat médical ».",
      ),
      etapes: F.bloks(
        'Étapes',
        'Une carte par étape (en général 2). Chaque carte peut contenir un numéro, du texte, un encadré et des cas particuliers.',
        ['inscriptions-sante-etape'],
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-cartes-info', {
    display: 'Section — 2 cartes libres',
    description:
      "Bloc passe-partout : deux cartes côte à côte. Sert par exemple pour « Assurance / Règlement intérieur » ou « Créneaux / Groupes compétition ». Réutilisable autant de fois que voulu.",
    schema: {
      surtitre: F.text('Surtitre', "Petit texte vert en majuscules au-dessus du titre. Optionnel."),
      title: F.text('Titre de la section', "Optionnel : laissez vide pour n'afficher que les cartes."),
      cartes: F.bloks(
        'Les cartes',
        'Ajoutez 1 à 2 cartes. Chaque carte a un titre, un texte, éventuellement des liens et un bouton.',
        ['inscriptions-carte-info'],
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-cotisations', {
    display: 'Section — Grille des tarifs',
    description:
      "Tableau des cotisations. Les colonnes sont fixes (Catégorie / Licence FFME / CT21 / Ligue / Cotisation club / Total) ; vous ne remplissez que les lignes.",
    schema: {
      surtitre: F.text('Surtitre', "Petit texte vert en majuscules au-dessus du titre, ex : « Cotisations 2026 / 2027 »."),
      title: F.text('Titre de la section', "Ex : « Tarifs des cotisations »."),
      intro: F.textarea('Texte d\'introduction', "Paragraphe sous le titre. Optionnel."),
      lignes: F.bloks(
        'Lignes du tableau',
        'Une ligne par catégorie de tarif. Saisissez chaque montant tel qu\'il doit s\'afficher, avec le « € » (ex : « 240 € »).',
        ['inscriptions-cotisation-ligne'],
      ),
      note: F.textarea(
        'Note sous le tableau',
        "Petit texte gris centré sous le tableau (ex : précisions sur la licence). Optionnel.",
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-aides', {
    display: 'Section — Réductions & paiement',
    description: 'Deux cartes : la liste des réductions à gauche, les moyens de paiement acceptés à droite.',
    schema: {
      titre_reductions: F.text('Titre — carte réductions', "Ex : « Réductions »."),
      reductions: F.bloks(
        'Liste des réductions',
        'Une ligne par réduction, ex : « 2ᵉ inscription d\'une même famille : −20 € ».',
        ['inscriptions-item'],
      ),
      titre_paiement: F.text('Titre — carte paiement', "Ex : « Modalités de paiement »."),
      paiement_texte: F.textarea(
        'Texte — carte paiement',
        "Paragraphe d'explication (ex : paiement en 3 fois possible). Optionnel.",
      ),
      paiement_modes: F.bloks(
        'Moyens de paiement acceptés',
        "Une étiquette par moyen de paiement, ex : « Chèques vacances », « Pass'Sport », « CAF ».",
        ['inscriptions-item'],
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-parcours', {
    display: 'Section — Parcours en ligne (onglets)',
    description:
      "Guide pas-à-pas de l'inscription en ligne, avec deux onglets (adulte / enfant). À afficher seulement quand l'inscription en ligne est ouverte.",
    schema: {
      surtitre: F.text('Surtitre', "Petit texte vert en majuscules au-dessus du titre. Optionnel."),
      title: F.text('Titre de la section', "Si laissé vide, affiche « Comment s'inscrire ? »."),
      description: F.textarea('Texte d\'introduction', "Paragraphe sous le titre. Optionnel."),
      onglet_adulte_label: F.text(
        'Nom de l\'onglet 1 (adulte)',
        "Si laissé vide, affiche « Je m'inscris (adulte) ».",
      ),
      onglet_enfant_label: F.text(
        'Nom de l\'onglet 2 (enfant)',
        "Si laissé vide, affiche « J'inscris mon enfant ».",
      ),
      etapes_adulte: F.bloks(
        'Étapes — onglet adulte',
        'Les étapes numérotées affichées dans le premier onglet.',
        ['inscriptions-parcours-etape'],
      ),
      etapes_enfant: F.bloks(
        'Étapes — onglet enfant',
        'Les étapes numérotées affichées dans le second onglet.',
        ['inscriptions-parcours-etape'],
      ),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('inscriptions-cta', {
    display: 'Section — Appel à contact (bas de page)',
    description: 'Encadré bleu nuit en fin de page avec un bouton (généralement « Nous contacter »).',
    schema: {
      title: F.text('Titre', "Si laissé vide, affiche « Une question sur l'inscription ? »."),
      texte: F.textarea('Texte', "Phrase sous le titre. Optionnel."),
      bouton_label: F.text('Texte du bouton', "Ex : « Nous contacter ». Sans texte, le bouton ne s'affiche pas."),
      bouton_lien: F.link('Lien du bouton', "Choisissez une page du site (ex : Contact) ou saisissez une URL."),
      icon: ICON("Si laissé vide, une enveloppe est utilisée."),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),

  // ── Nestables (données uniquement) ───────────────────────────────────────
  comp('inscriptions-ancre', {
    display: "Bouton d'accès rapide",
    description: "Un bouton rond du bandeau titre qui fait défiler la page jusqu'à une section.",
    schema: {
      label: F.text('Texte du bouton', "Ce qui est écrit sur le bouton, ex : « Dates », « Tarifs »."),
      ancre: F.text(
        'Cible',
        "L'« Ancre de navigation » de la section visée, précédée de # (ex : #permanences, #tarifs).",
      ),
    },
  }),
  comp('inscriptions-niveau', {
    display: 'Niveau',
    description: 'Une carte de la grille des niveaux.',
    schema: {
      numero: F.text('Numéro', "Chiffre affiché dans la pastille, ex : 1, 2, 3, 4."),
      titre: F.text('Nom du niveau', "Ex : « Grand débutant », « Autonome en tête »."),
      resume: F.textarea('Résumé', "Phrase courte affichée en italique sous le titre, ex : « Grimpe et assure seul en moulinette »."),
      competences: F.bloks(
        'Ce que sait faire (ou apprend) le grimpeur',
        "Une puce verte par compétence. Ex : « Fait son nœud de huit », « Assure en moulinette ».",
        ['inscriptions-item'],
      ),
      equivalence: F.text(
        'Équivalence',
        "Affiché dans une pastille « Équivaut à : … ». Ex : « Passeport orange FFME », « 4 mousquetons ». Optionnel.",
      ),
    },
  }),
  comp('inscriptions-permanence', {
    display: 'Permanence',
    description: "Une carte « date d'inscription ».",
    schema: {
      icon: ICON('Petite icône en haut de la carte.'),
      tag: F.text('Étiquette', "Petit texte vert en majuscules, ex : « Nouveaux adhérents »."),
      title: F.text('Titre', "Ex : « Inscriptions + essai sur le mur »."),
      audience: F.text('Public concerné', "Ex : « Enfants et ados déjà licenciés en 2025 / 2026 »."),
      date: F.text('Date', "Écrite en toutes lettres, ex : « Samedi 5 septembre 2026 »."),
      horaire: F.text('Horaire', "Ex : « de 14 h à 18 h »."),
      lieu: F.text('Lieu', "Ex : « Gymnase Boivin »."),
    },
  }),
  comp('inscriptions-doc-groupe', {
    display: 'Colonne de documents',
    description: 'Un groupe de documents destinés au même public.',
    schema: {
      icon: ICON('Icône à côté du titre de la colonne.'),
      titre: F.text('Titre de la colonne', "Ex : « Adultes », « Mineurs »."),
      sous_titre: F.text('Précision', "Affichée en gris à côté du titre, ex : « 18 ans et + ». Optionnel."),
      documents: F.bloks('Documents de cette colonne', 'Un élément par fichier à télécharger.', [
        'inscriptions-doc',
      ]),
    },
  }),
  comp('inscriptions-doc', {
    display: 'Document à télécharger',
    description: 'Une ligne cliquable qui ouvre un fichier.',
    schema: {
      titre: F.text('Nom du document', "Ex : « Fiche d'inscription 2026-2027 »."),
      hint: F.text('Précision', "Ligne grise sous le nom, ex : « Adultes — avec attestation de santé ». Optionnel."),
      icon: ICON('Si laissé vide, une icône de document est utilisée.'),
      fichier: F.asset(
        'Fichier (bibliothèque d’assets)',
        "Téléversez ou choisissez le document (PDF, Word…) dans la bibliothèque d'assets Storyblok. C'est la méthode recommandée.",
      ),
      url_externe: F.link(
        'Lien externe (si pas de fichier)',
        "Utilisé uniquement si aucun fichier n'est choisi ci-dessus : URL vers un document hébergé ailleurs. S'ouvre dans un nouvel onglet.",
      ),
    },
  }),
  comp('inscriptions-sante-etape', {
    display: 'Étape santé',
    description: 'Une carte de la section Santé.',
    schema: {
      numero: F.text('Numéro', "Chiffre dans la pastille, ex : 1. Optionnel."),
      titre: F.text('Titre de l\'étape', "Ex : « Renseigner ses informations sur myFFME »."),
      texte: F.richtext('Contenu', "Texte de l'étape. Vous pouvez mettre des mots en gras."),
      encadre: F.textarea(
        'Encadré vert clair',
        "Phrase importante mise en évidence dans un encart vert. Optionnel.",
      ),
      cas: F.bloks(
        'Cas particuliers',
        "Sous-encadrés « 1er cas / 2e cas » listant des situations spécifiques. Optionnel.",
        ['inscriptions-sante-cas'],
      ),
      bouton_label: F.text('Texte du bouton', "Ex : « Accéder à myFFME ». Sans texte, pas de bouton."),
      bouton_fichier: BTN_FICHIER,
      bouton_lien: F.link('Lien du bouton', "Page du site ou URL externe (ignoré si un fichier est choisi)."),
    },
  }),
  comp('inscriptions-sante-cas', {
    display: 'Cas particulier (santé)',
    description: 'Un petit encadré numéroté à l\'intérieur d\'une étape santé.',
    schema: {
      numero: F.text('Libellé', "Ex : « 1er cas », « 2e cas »."),
      titre: F.text('Titre', "Ex : « Compétiteurs adultes »."),
      detail: F.text('Détail', "Précision en petit texte gris."),
    },
  }),
  comp('inscriptions-carte-info', {
    display: 'Carte libre',
    description: 'Une carte de la section « 2 cartes libres ».',
    schema: {
      icon: ICON('Icône ronde en haut de la carte.'),
      titre: F.text('Titre de la carte', "Ex : « Assurance », « Règlement intérieur »."),
      texte: F.richtext('Contenu', "Texte de la carte. Mots en gras autorisés."),
      theme: F.option(
        'Style de la carte',
        "« Clair » : carte blanche, texte foncé. « Foncé » : carte bleu nuit, texte clair (pour la mettre en avant).",
        [
          { name: 'Clair', value: 'clair' },
          { name: 'Foncé', value: 'fonce' },
        ],
        'clair',
      ),
      liens: F.bloks(
        'Liens dans la carte',
        "Liste de liens texte (ex : documents à télécharger). Optionnel.",
        ['inscriptions-lien'],
      ),
      bouton_label: F.text('Texte du bouton', "Ex : « Lire le règlement ». Sans texte, pas de bouton."),
      bouton_fichier: BTN_FICHIER,
      bouton_lien: F.link('Lien du bouton', "Page du site ou URL externe (ignoré si un fichier est choisi)."),
      bouton_style: F.option(
        'Couleur du bouton',
        'Apparence du bouton de la carte.',
        [
          { name: 'Vert', value: 'vert' },
          { name: 'Bleu nuit', value: 'sombre' },
          { name: 'Contour seulement', value: 'outline' },
        ],
        'vert',
      ),
    },
  }),
  comp('inscriptions-lien', {
    display: 'Lien',
    description: 'Un lien texte affiché dans une carte libre (souvent un document à télécharger).',
    schema: {
      label: F.text('Texte du lien', "Ce qui est écrit et cliquable."),
      fichier: F.asset(
        'Fichier (bibliothèque d’assets)',
        "Document (PDF, Word…) choisi dans la bibliothèque d'assets. Prioritaire sur « Destination » ci-dessous.",
      ),
      lien: F.link('Destination (si pas de fichier)', "Page du site ou URL externe, utilisée si aucun fichier n'est choisi."),
      icon: ICON('Si laissé vide, une flèche « lien externe » est utilisée.'),
    },
  }),
  comp('inscriptions-cotisation-ligne', {
    display: 'Ligne de tarif',
    description: "Une ligne du tableau des cotisations. Saisissez chaque montant tel quel, avec le « € ».",
    schema: {
      categorie: F.text('Catégorie', "1re colonne, ex : « Adultes », « Baby — 4 à 6 ans »."),
      hint: F.text('Précision sous la catégorie', "Petit texte gris, ex : « 1 séance club + 1 séance salle extérieure ». Optionnel."),
      licence: F.text('Licence FFME + assurance', "Montant, ex : « 60 € »."),
      ct21: F.text('CT21 (FFME)', "Montant, ex : « 10 € »."),
      ligue: F.text('Ligue (FFME)', "Montant, ex : « 3 € »."),
      club: F.text('Cotisation club', "Montant, ex : « 167 € »."),
      total: F.text('Total adhérent', "Montant total mis en avant, ex : « 240 € »."),
    },
  }),
  comp('inscriptions-parcours-etape', {
    display: 'Étape du parcours',
    description: 'Une étape numérotée dans un onglet de la section « Parcours en ligne ».',
    schema: {
      numero: F.text('Numéro', "Chiffre dans la pastille. Si vide, la numérotation est automatique."),
      titre: F.text('Titre de l\'étape', "Ex : « Créer son compte »."),
      texte: F.richtext('Contenu', "Explication de l'étape. Mots en gras autorisés."),
      bouton_label: F.text('Texte du bouton', "Ex : « Créer mon compte ». Sans texte, pas de bouton."),
      bouton_fichier: BTN_FICHIER,
      bouton_lien: F.link('Lien du bouton', "Page du site ou URL externe (ignoré si un fichier est choisi)."),
    },
  }),
  comp('inscriptions-item', {
    display: 'Ligne de texte',
    description: 'Un élément de liste simple (une puce, une étiquette).',
    schema: {
      texte: F.text('Texte', "Le contenu de la ligne."),
    },
  }),
]

// ─────────────────────────────────────────────────────────────────────────────
const mergeArg = process.argv.indexOf('--merge')
if (mergeArg !== -1) {
  const target = resolve(process.argv[mergeArg + 1])
  if (!existsSync(target)) {
    console.error(
      `✗ Fichier introuvable : ${target}\n  Lance d'abord : npx storyblok components pull --space <SPACE_ID>`,
    )
    process.exit(1)
  }
  const existing = JSON.parse(readFileSync(target, 'utf8'))
  const byName = new Map(existing.map((c) => [c.name, c]))
  for (const c of components) byName.set(c.name, { ...byName.get(c.name), ...c })
  writeFileSync(target, JSON.stringify([...byName.values()], null, 2))
  console.log(`✓ ${components.length} composants fusionnés dans ${target}`)
  console.log(`  → npx storyblok components push --space <SPACE_ID>`)
} else {
  const out = resolve('.storyblok/components/inscriptions.components.json')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(components, null, 2))
  console.log(`✓ ${components.length} composants écrits dans ${out}`)
  console.log(`  (fichier de référence — pour pousser, relance avec --merge <components.json pull>)`)
}
