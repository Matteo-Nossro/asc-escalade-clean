#!/usr/bin/env node
/**
 * Génère les définitions Storyblok du kit de blocs réutilisables (`bloc-*`)
 * au format CLI Storyblok v4, avec :
 *   - noms d'affichage + descriptions en français (pour un éditeur non-technicien)
 *   - tag « ui »
 *   - groupe « Réutilisable »
 *
 * Usage :
 *   node scripts/storyblok-blocs-reutilisables.mjs
 *   → .storyblok/components/blocs-reutilisables.components.json (référence)
 *
 *   node scripts/storyblok-blocs-reutilisables.mjs --merge \
 *     .storyblok/components/<SPACE_ID>/components.json
 *   npx storyblok components push --space <SPACE_ID>
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'

// Espace cible : 291351822158044
const GROUPE_REUTILISABLE = '23674a8c-5313-44d3-ab0e-731f51abf79a'
const TAG_UI = { id: 158041155849597, name: 'ui' }

const fid = () => randomBytes(16).toString('base64url').slice(0, 22)

const F = {
  text: (d, desc) => ({ type: 'text', display_name: d, description: desc }),
  textarea: (d, desc) => ({ type: 'textarea', display_name: d, description: desc }),
  richtext: (d, desc) => ({ type: 'richtext', display_name: d, description: desc }),
  markdown: (d, desc) => ({ type: 'markdown', display_name: d, description: desc }),
  bool: (d, desc, def = false) => ({ type: 'boolean', display_name: d, description: desc, default_value: def }),
  number: (d, desc) => ({ type: 'number', display_name: d, description: desc }),
  datetime: (d, desc) => ({ type: 'datetime', display_name: d, description: desc, disable_time: true }),
  asset: (d, desc, filetypes = []) => ({ type: 'asset', display_name: d, description: desc, filetypes }),
  multiasset: (d, desc) => ({ type: 'multiasset', display_name: d, description: desc, filetypes: ['images'] }),
  link: (d, desc) => ({ type: 'multilink', display_name: d, description: desc }),
  table: (d, desc) => ({ type: 'table', display_name: d, description: desc }),
  option: (d, desc, values, def) => ({
    type: 'option',
    display_name: d,
    description: desc,
    use_uuid: true,
    exclude_empty_option: true,
    default_value: def,
    options: values.map((v) => (typeof v === 'string' ? { name: v, value: v } : v)),
  }),
  bloks: (d, desc, whitelist, maximum) => ({
    type: 'bloks',
    display_name: d,
    description: desc,
    restrict_type: '',
    restrict_components: true,
    component_whitelist: whitelist,
    component_denylist: [],
    ...(maximum ? { maximum } : {}),
  }),
}

const FOND = F.option(
  'Couleur de fond',
  "Arrière-plan de tout le bloc. Alternez les couleurs entre deux blocs qui se suivent. « Bleu nuit » : à réserver aux blocs faits de cartes blanches.",
  [
    { name: 'Blanc', value: 'blanc' },
    { name: 'Gris clair', value: 'gris' },
    { name: 'Vert clair', value: 'vert' },
    { name: 'Bleu nuit (texte clair)', value: 'bleu-nuit' },
  ],
  'blanc',
)
const ANCRE = F.text(
  'Ancre de navigation',
  "Mot-clé sans espace ni accent (ex : tarifs). Permet un lien direct vers ce bloc : /ma-page#tarifs. Optionnel.",
)
const SURTITRE = F.text('Surtitre', "Petit texte vert en majuscules au-dessus du titre. Optionnel.")
const TITRE = F.text('Titre de la section', 'Grand titre centré. Optionnel.')
const INTRO = F.textarea('Introduction', 'Phrase sous le titre. Optionnel.')
const ICON = (extra = '') =>
  F.text('Icône', `Nom Heroicons, ex : i-heroicons-calendar-days (catalogue : heroicons.com).${extra ? ' ' + extra : ''}`)
const BOUTONS = F.bloks('Boutons', 'Un ou plusieurs boutons. Laissez vide pour ne pas en afficher.', ['bloc-bouton'])

const comp = (name, opts) => {
  const schema = {}
  Object.entries(opts.schema).forEach(([k, def], pos) => {
    schema[k] = { ...def, pos, id: fid() }
  })
  return {
    name,
    display_name: opts.display || null,
    description: opts.description || '',
    schema,
    is_root: false,
    is_nestable: true,
    color: null,
    icon: opts.icon || null,
    component_group_uuid: GROUPE_REUTILISABLE,
    all_presets: [],
    preset_id: null,
    real_name: opts.display || name,
    internal_tags_list: [TAG_UI],
    internal_tag_ids: [String(TAG_UI.id)],
  }
}

const components = [
  // ── Primitive ────────────────────────────────────────────────────────────
  comp('bloc-bouton', {
    display: 'Bouton',
    description: 'Un bouton unique. Utilisé à l’intérieur des autres blocs.',
    schema: {
      label: F.text('Texte du bouton', 'Ce qui est écrit sur le bouton.'),
      lien: F.link('Lien', 'Page du site ou URL externe.'),
      fichier: F.asset('Fichier (optionnel)', 'Si renseigné, le bouton télécharge ce document au lieu de suivre le lien.'),
      style: F.option(
        'Style',
        'Apparence du bouton.',
        [
          { name: 'Vert', value: 'vert' },
          { name: 'Bleu nuit', value: 'sombre' },
          { name: 'Blanc', value: 'clair' },
          { name: 'Contour seul', value: 'outline' },
        ],
        'vert',
      ),
      icon: ICON('Petite icône avant le texte. Optionnel.'),
    },
  }),
  comp('bloc-item', {
    display: 'Ligne de texte',
    description: 'Un élément de liste simple (une puce).',
    schema: { texte: F.text('Texte', 'Le contenu de la ligne.') },
  }),

  // ── En-tête ──────────────────────────────────────────────────────────────
  comp('bloc-hero', {
    display: 'Bandeau titre (hero)',
    description: 'Grand bandeau en haut de page : badge, titre, sous-titre et boutons.',
    schema: {
      badge: F.text('Badge', 'Étiquette au-dessus du titre, ex : « Saison 2026 / 2027 ». Optionnel.'),
      badge_icon: ICON('Icône dans le badge. Optionnel.'),
      titre: F.text('Titre principal', 'Le grand titre de la page.'),
      sous_titre: F.textarea('Sous-titre', 'Phrase d’introduction sous le titre.'),
      image_fond: F.asset('Image de fond', 'Photo derrière le titre (assombrie automatiquement). Optionnel.'),
      masquer_colline: F.bool('Masquer la vague décorative', "Cache la vague en bas du bandeau (sans effet si une image de fond est choisie)."),
      boutons: F.bloks('Boutons', '1 à 2 boutons sous le titre.', ['bloc-bouton'], 2),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),

  // ── Contenu ──────────────────────────────────────────────────────────────
  comp('bloc-texte', {
    display: 'Texte',
    description: 'Un paragraphe riche, centré sur une largeur lisible.',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      contenu: F.richtext('Contenu', 'Le texte. Gras, listes et liens autorisés.'),
      alignement: F.option('Alignement des boutons', '', [
        { name: 'À gauche', value: 'gauche' },
        { name: 'Centré', value: 'centre' },
      ], 'gauche'),
      boutons: BOUTONS,
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-texte-media', {
    display: 'Texte + image',
    description: 'Un bloc de texte et une image côte à côte.',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      image: F.asset('Image', 'Photo affichée à côté du texte.'),
      image_a_gauche: F.bool('Image à gauche', "Par défaut l'image est à droite. Cochez pour l'inverser."),
      media_surtitre: F.text('Surtitre (colonne texte)', 'Petit texte vert au-dessus du titre de la colonne. Optionnel.'),
      media_titre: F.text('Titre (colonne texte)', 'Titre de la colonne de texte.'),
      texte: F.richtext('Texte', 'Contenu de la colonne de texte.'),
      boutons: BOUTONS,
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-grille-cartes', {
    display: 'Grille de cartes',
    description: 'Une grille de cartes identiques : produits, avantages, articles… Le couteau suisse.',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      intro: INTRO,
      colonnes: F.option('Nombre de colonnes', 'Sur ordinateur (toujours 1 colonne sur mobile).', ['2', '3', '4'], '3'),
      affichage: F.option('Affichage', 'En grille (empilée) ou en carrousel qui défile horizontalement.', [
        { name: 'Grille', value: 'grille' },
        { name: 'Carrousel', value: 'carrousel' },
      ], 'grille'),
      nb_visibles: F.number('Cartes visibles avant « Voir plus »', 'Mode grille uniquement. 0 ou vide = tout afficher. Ex : 6 → affiche 6 cartes + un bouton pour voir le reste.'),
      cartes: F.bloks('Cartes', 'Une carte par élément.', ['bloc-carte']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-carte', {
    display: 'Carte',
    description: 'Une carte de la grille.',
    schema: {
      image: F.asset('Image', 'Photo en haut de la carte. Si absente, l’icône est utilisée.'),
      icon: ICON('Utilisée seulement si aucune image.'),
      etiquette: F.text('Étiquette', 'Petit texte vert en majuscules, ex : « Textile ». Optionnel.'),
      titre: F.text('Titre', 'Titre de la carte.'),
      prix: F.text('Prix', 'Ex : « 20 € ». Optionnel.'),
      texte: F.textarea('Description', 'Court paragraphe. Optionnel.'),
      points: F.bloks('Points forts', 'Liste à puces vertes. Optionnel.', ['bloc-item']),
      bouton: F.bloks('Bouton', 'Un bouton en bas de la carte. Optionnel.', ['bloc-bouton'], 1),
    },
  }),
  comp('bloc-infos-cles', {
    display: 'Chiffres / infos clés',
    description: 'Une rangée de petits chiffres ou faits : date, lieu, prix, places…',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      intro: INTRO,
      infos: F.bloks('Infos', '2 à 4 éléments recommandés.', ['bloc-info-cle']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-info-cle', {
    display: 'Info clé',
    description: 'Un chiffre ou un fait mis en avant.',
    schema: {
      icon: ICON('Petite icône au-dessus du chiffre. Optionnel.'),
      valeur: F.text('Valeur', 'Le chiffre ou le mot mis en avant, ex : « 120 », « 1 jour ».'),
      libelle: F.text('Libellé', 'Ce que représente la valeur, ex : « grimpeurs ».'),
    },
  }),
  comp('bloc-programme', {
    display: 'Programme / étapes',
    description: 'Des étapes numérotées, avec horaire optionnel. Sert pour un déroulé de journée ou une marche à suivre.',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      intro: INTRO,
      etapes: F.bloks('Étapes', 'Dans l’ordre d’affichage.', ['bloc-programme-etape']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-programme-etape', {
    display: 'Étape',
    description: 'Une étape du programme.',
    schema: {
      numero: F.text('Numéro', 'Chiffre dans la pastille. Si vide, numérotation automatique.'),
      horaire: F.text('Horaire', 'Ex : « 09 h 30 ». Optionnel.'),
      titre: F.text('Titre de l’étape', ''),
      texte: F.richtext('Contenu', 'Explication de l’étape. Optionnel.'),
      bouton: F.bloks('Bouton', 'Optionnel.', ['bloc-bouton'], 1),
    },
  }),
  comp('bloc-colonnes', {
    display: 'Colonnes libres',
    description: 'Met du contenu côte à côte (texte, image, bouton par colonne). Passe en 1 colonne sur mobile.',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      intro: INTRO,
      disposition: F.option('Disposition', 'Sur ordinateur.', [
        { name: '2 colonnes égales', value: '2' },
        { name: '3 colonnes égales', value: '3' },
        { name: '60 % / 40 %', value: '60-40' },
        { name: '40 % / 60 %', value: '40-60' },
      ], '2'),
      alignement: F.option('Alignement du contenu', 'Contenu aligné à gauche ou centré dans chaque colonne.', [
        { name: 'À gauche', value: 'gauche' },
        { name: 'Centré', value: 'centre' },
      ], 'gauche'),
      colonnes: F.bloks('Colonnes', 'Une entrée par colonne.', ['bloc-colonne']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-colonne', {
    display: 'Colonne',
    description: 'Le contenu d’une colonne.',
    schema: {
      titre: F.text('Titre', 'Titre de la colonne. Optionnel.'),
      contenu: F.richtext('Contenu', 'Texte de la colonne.'),
      image: F.asset('Image', 'Optionnel.'),
      image_position: F.option('Position de l’image', '', [
        { name: 'Au-dessus du texte', value: 'haut' },
        { name: 'Sous le texte', value: 'bas' },
      ], 'haut'),
      bouton: F.bloks('Bouton', 'Optionnel.', ['bloc-bouton'], 1),
    },
  }),

  // ── Média ────────────────────────────────────────────────────────────────
  comp('bloc-galerie', {
    display: 'Galerie photos',
    description: 'Une grille de photos, agrandissables au clic.',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      intro: INTRO,
      colonnes: F.option('Nombre de colonnes', 'Sur ordinateur.', ['2', '3', '4'], '3'),
      photos: F.multiasset('Photos', 'Sélectionnez plusieurs images dans la bibliothèque.'),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-logos', {
    display: 'Logos partenaires',
    description: 'Un bandeau de logos (partenaires, sponsors), en grille ou en défilement.',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      intro: INTRO,
      defilement: F.bool('Défilement continu', 'Fait défiler les logos horizontalement en boucle.'),
      logos: F.bloks('Logos', '', ['bloc-logo']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-logo', {
    display: 'Logo',
    description: 'Un logo de partenaire.',
    schema: {
      nom: F.text('Nom', 'Sert de texte alternatif (accessibilité).'),
      image: F.asset('Logo', 'Image du logo (fond transparent conseillé).'),
      lien: F.link('Lien', 'Site du partenaire. Optionnel.'),
    },
  }),
  comp('bloc-carte-acces', {
    display: 'Accès / lieu',
    description: '« Nous trouver » : plan, adresse, accès, parking, lien itinéraire.',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      intro: INTRO,
      plan: F.asset('Plan / photo du lieu', 'Capture de carte ou photo. Cliquable si un lien itinéraire est renseigné.'),
      nom_lieu: F.text('Nom du lieu', 'Ex : « Gymnase Boivin ».'),
      adresse: F.textarea('Adresse', 'Une ligne par retour à la ligne.'),
      acces: F.textarea('Accès', 'Transports en commun, indications. Optionnel.'),
      parking: F.textarea('Stationnement', 'Optionnel.'),
      lien_itineraire: F.link('Lien itinéraire', 'URL Google Maps / Plans. Optionnel.'),
      lien_itineraire_label: F.text('Texte du bouton itinéraire', 'Défaut : « Itinéraire ».'),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),

  // ── Listes ───────────────────────────────────────────────────────────────
  comp('bloc-faq', {
    display: 'FAQ (questions / réponses)',
    description: 'Un accordéon de questions fréquentes. Génère aussi les données SEO (FAQ Google).',
    schema: {
      surtitre: SURTITRE,
      titre: F.text('Titre de la section', 'Défaut : « Questions fréquentes ».'),
      intro: INTRO,
      items: F.bloks('Questions', '', ['bloc-faq-item']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-faq-item', {
    display: 'Question / réponse',
    schema: {
      question: F.text('Question', ''),
      reponse: F.richtext('Réponse', ''),
    },
  }),
  comp('bloc-tableau', {
    display: 'Tableau',
    description: 'Un tableau éditable (créneaux, comparatif, tarifs détaillés…).',
    schema: {
      surtitre: SURTITRE,
      titre: TITRE,
      intro: INTRO,
      tableau: F.table('Contenu du tableau', 'Ajoutez colonnes et lignes ; la 1ʳᵉ ligne est l’en-tête.'),
      colonne_mise_en_avant: F.number('Colonne à surligner', 'Numéro de colonne mise en vert (ex : 4 pour « Total »). Laissez vide pour aucune.'),
      premiere_colonne_figee: F.bool('Figer la première colonne', 'Elle reste visible pendant le défilement horizontal sur mobile.'),
      note: F.textarea('Note sous le tableau', 'Optionnel.'),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-documents', {
    display: 'Documents à télécharger',
    description: 'Centre de téléchargement : fichiers rangés par groupes, ou liste simple.',
    schema: {
      surtitre: SURTITRE,
      titre: F.text('Titre de la section', 'Défaut : « Documents à télécharger ».'),
      intro: INTRO,
      groupes: F.bloks('Groupes de documents', 'Chaque groupe a un titre et ses fichiers. Laissez vide pour une simple liste.', ['bloc-document-groupe']),
      documents: F.bloks('Liste simple', 'Utilisé seulement si aucun groupe n’est défini.', ['bloc-document']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-document-groupe', {
    display: 'Groupe de documents',
    schema: {
      icon: ICON('À côté du titre du groupe.'),
      titre: F.text('Titre du groupe', 'Ex : « Adhésion », « Vie associative ».'),
      documents: F.bloks('Documents', '', ['bloc-document']),
    },
  }),
  comp('bloc-document', {
    display: 'Document',
    schema: {
      titre: F.text('Nom du document', ''),
      hint: F.text('Précision', 'Ligne grise sous le nom. Optionnel.'),
      icon: ICON('Défaut : icône de document.'),
      fichier: F.asset('Fichier (bibliothèque d’assets)', 'PDF, Word… déposé dans Storyblok. Méthode recommandée.'),
      url_externe: F.link('Lien externe', 'Utilisé seulement si aucun fichier n’est choisi.'),
    },
  }),
  comp('bloc-agenda', {
    display: 'Agenda / événements',
    description: 'Liste d’événements datés (compétitions, AG, stages), triés « à venir » puis « passés ». Génère les données SEO (événements Google).',
    schema: {
      surtitre: SURTITRE,
      titre: F.text('Titre de la section', 'Défaut : « Agenda ».'),
      intro: INTRO,
      evenements: F.bloks('Événements', 'Le tri par date est automatique.', ['bloc-agenda-evenement']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-agenda-evenement', {
    display: 'Événement',
    schema: {
      date: F.datetime('Date', ''),
      categorie: F.text('Catégorie', 'Ex : « Compétition », « Sortie ». Optionnel.'),
      horaire: F.text('Horaire', 'Ex : « 08 h 30 ». Optionnel.'),
      titre: F.text('Titre', ''),
      lieu: F.text('Lieu', 'Optionnel.'),
      description: F.textarea('Description', 'Optionnel.'),
      lien_label: F.text('Texte du bouton', 'Ex : « S’inscrire ». Optionnel.'),
      lien: F.link('Lien du bouton', 'Optionnel.'),
    },
  }),

  // ── Conversion & utilitaires ─────────────────────────────────────────────
  comp('bloc-cta', {
    display: 'Appel à l’action',
    description: 'Un encadré coloré avec un ou deux boutons.',
    schema: {
      theme: F.option('Couleur de l’encadré', '', [
        { name: 'Bleu nuit', value: 'bleu-nuit' },
        { name: 'Vert', value: 'vert' },
      ], 'bleu-nuit'),
      titre: F.text('Titre', ''),
      texte: F.textarea('Texte', 'Optionnel.'),
      boutons: F.bloks('Boutons', '', ['bloc-bouton']),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-encadre', {
    display: 'Encadré (info / attention)',
    description: 'Un message court mis en évidence.',
    schema: {
      type: F.option('Type', '', [
        { name: 'Information', value: 'info' },
        { name: 'Succès', value: 'succes' },
        { name: 'Attention', value: 'attention' },
        { name: 'Bleu nuit', value: 'sombre' },
      ], 'info'),
      icon: ICON('Remplace l’icône par défaut du type. Optionnel.'),
      titre: F.text('Titre', 'Optionnel.'),
      texte: F.richtext('Texte', ''),
      fond: FOND,
      anchor_id: ANCRE,
    },
  }),
  comp('bloc-alerte', {
    display: 'Bandeau d’annonce',
    description: 'Bandeau fin en haut d’une page pour une info du moment.',
    schema: {
      type: F.option('Type', '', [
        { name: 'Annonce (vert)', value: 'annonce' },
        { name: 'Information (bleu nuit)', value: 'info' },
        { name: 'Urgent (rouge)', value: 'urgent' },
      ], 'annonce'),
      icon: ICON('Remplace l’icône par défaut. Optionnel.'),
      titre: F.text('Titre court', 'Affiché en gras avant le message. Optionnel.'),
      message: F.text('Message', ''),
      lien_label: F.text('Texte du lien', 'Ex : « En savoir plus ». Optionnel.'),
      lien: F.link('Lien', 'Optionnel.'),
      fermable: F.bool('Peut être fermé', 'Le visiteur peut masquer le bandeau (mémorisé sur son navigateur).'),
    },
  }),
  comp('bloc-espacement', {
    display: 'Espace vide',
    description: 'Ajoute un blanc réglable entre deux blocs.',
    schema: {
      taille: F.option('Hauteur', '', ['S', 'M', 'L', 'XL'], 'M'),
      fond: FOND,
    },
  }),
  comp('bloc-separateur', {
    display: 'Séparateur',
    description: 'Un trait fin entre deux sections de même couleur.',
    schema: {
      largeur: F.option('Largeur du trait', '', [
        { name: 'Pleine largeur', value: 'pleine' },
        { name: 'Courte (centrée)', value: 'courte' },
      ], 'pleine'),
      epaisseur: F.option('Épaisseur', '', [
        { name: 'Fine', value: 'fine' },
        { name: 'Épaisse', value: 'epaisse' },
      ], 'fine'),
      fond: FOND,
    },
  }),
]

// ─────────────────────────────────────────────────────────────────────────────
const mergeArg = process.argv.indexOf('--merge')
if (mergeArg !== -1) {
  const target = resolve(process.argv[mergeArg + 1])
  if (!existsSync(target)) {
    console.error(`✗ Fichier introuvable : ${target}\n  Lance d'abord : npx storyblok components pull --space <SPACE_ID>`)
    process.exit(1)
  }
  const existing = JSON.parse(readFileSync(target, 'utf8'))
  const byName = new Map(existing.map((c) => [c.name, c]))
  for (const c of components) byName.set(c.name, { ...byName.get(c.name), ...c })
  writeFileSync(target, JSON.stringify([...byName.values()], null, 2))
  console.log(`✓ ${components.length} blocs fusionnés dans ${target}`)
  console.log(`  → npx storyblok components push --space <SPACE_ID>`)
} else {
  const out = resolve('.storyblok/components/blocs-reutilisables.components.json')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(components, null, 2))
  console.log(`✓ ${components.length} blocs écrits dans ${out}`)
}
