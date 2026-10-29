<script setup>
// ─────────────────────────────────────────────────────────────────────────────
// Référence visuelle des blocs réutilisables (`bloc-*`).
// Accessible uniquement au staff (préfixe /admin → middleware auth.global.ts).
// Un exemple + les variantes utiles pour chaque bloc, avec des données factices.
// ─────────────────────────────────────────────────────────────────────────────
import BlocHero from '~/storyblok/blocs/BlocHero.vue'
import BlocAlerte from '~/storyblok/blocs/BlocAlerte.vue'
import BlocTexte from '~/storyblok/blocs/BlocTexte.vue'
import BlocTexteMedia from '~/storyblok/blocs/BlocTexteMedia.vue'
import BlocGrilleCartes from '~/storyblok/blocs/BlocGrilleCartes.vue'
import BlocInfosCles from '~/storyblok/blocs/BlocInfosCles.vue'
import BlocProgramme from '~/storyblok/blocs/BlocProgramme.vue'
import BlocColonnes from '~/storyblok/blocs/BlocColonnes.vue'
import BlocGalerie from '~/storyblok/blocs/BlocGalerie.vue'
import BlocLogos from '~/storyblok/blocs/BlocLogos.vue'
import BlocCarteAcces from '~/storyblok/blocs/BlocCarteAcces.vue'
import BlocFaq from '~/storyblok/blocs/BlocFaq.vue'
import BlocTableau from '~/storyblok/blocs/BlocTableau.vue'
import BlocDocuments from '~/storyblok/blocs/BlocDocuments.vue'
import BlocAgenda from '~/storyblok/blocs/BlocAgenda.vue'
import BlocCta from '~/storyblok/blocs/BlocCta.vue'
import BlocEncadre from '~/storyblok/blocs/BlocEncadre.vue'
import BlocSeparateur from '~/storyblok/blocs/BlocSeparateur.vue'
import BlocEspacement from '~/storyblok/blocs/BlocEspacement.vue'
import BlocPopup from '~/storyblok/blocs/BlocPopup.vue'

useHead({ title: 'Blocs réutilisables', meta: [{ name: 'robots', content: 'noindex' }] })

const A = 'https://a.storyblok.com/f/290950796503167'
const img = {
  mur: { filename: `${A}/512x384/e59bb4d193/mur-d-escalade.jpg`, alt: "Mur d'escalade" },
  murLarge: { filename: `${A}/2403x1602/5e39bf68bc/mur-escalade.png`, alt: 'Salle du club' },
  portrait: { filename: `${A}/682x1024/40be3ebef3/patrick-violet.jpg`, alt: 'Grimpeur' },
  ville: { filename: `${A}/349x108/6b531a0664/chevigny-saint-sauveur.jpg`, alt: 'Chevigny' },
}
const rt = (...p) => ({ type: 'doc', content: p.map((t) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] })) })
const lienUrl = (u) => ({ linktype: 'url', url: u, cached_url: u })
const bouton = (label, url, style = 'vert', icon) => ({ component: 'bloc-bouton', label, lien: lienUrl(url), fichier: null, style, icon })
const dans = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }

const tableauTarifs = {
  component: 'bloc-tableau', titre: 'Grille des cotisations 2026 / 2027',
  colonne_mise_en_avant: '6', premiere_colonne_figee: true, note: 'Licence FFME incluse.',
  tableau: {
    thead: [{ value: 'Catégorie' }, { value: 'Licence FFME' }, { value: 'CT21' }, { value: 'Ligue' }, { value: 'Cotisation club' }, { value: 'Total adhérent' }],
    tbody: [
      { body: [{ value: 'Baby (4-6 ans)' }, { value: '47,50 €' }, { value: '10 €' }, { value: '3 €' }, { value: '94,50 €' }, { value: '155 €' }] },
      { body: [{ value: 'Jeunes' }, { value: '47,50 €' }, { value: '10 €' }, { value: '3 €' }, { value: '164,50 €' }, { value: '225 €' }] },
      { body: [{ value: 'Adultes' }, { value: '60 €' }, { value: '10 €' }, { value: '3 €' }, { value: '167 €' }, { value: '240 €' }] },
    ],
  },
}

const blocs = [
  // ── bloc-popup ───────────────────────────────────────────────────────────
  ['bloc-popup (bouton, contenu = tableau)', BlocPopup, {
    declencheur_label: 'Voir la grille des tarifs', declencheur_style: 'bouton',
    declencheur_icon: 'i-heroicons-banknotes', titre: 'Tarifs des cotisations', taille: 'XL',
    contenu: [tableauTarifs, { component: 'bloc-encadre', type: 'info', texte: rt('Réductions familles : −20 € dès la 2ᵉ inscription.') }],
  }],
  ['bloc-popup (lien, contenu = infos + FAQ)', BlocPopup, {
    declencheur_label: 'Comment connaître mon niveau ?', declencheur_style: 'lien',
    declencheur_icon: 'i-heroicons-question-mark-circle', titre: 'Les 4 niveaux du club', taille: 'L',
    contenu: [
      { component: 'bloc-infos-cles', infos: [
        { icon: 'i-heroicons-academic-cap', valeur: 'Débutant', libelle: 'jamais grimpé' },
        { icon: 'i-heroicons-arrow-trending-up', valeur: 'Moulinette', libelle: 'assure seul' },
        { icon: 'i-heroicons-bolt', valeur: 'Tête', libelle: 'grimpe en tête' },
        { icon: 'i-heroicons-trophy', valeur: 'Compét', libelle: 'niveau avancé' },
      ] },
      { component: 'bloc-faq', titre: '', items: [
        { question: 'Niveau 2 — que sais-je faire ?', reponse: rt('Nœud de huit, grimpe et assurage en moulinette en autonomie.') },
        { question: 'Niveau 3 — que sais-je faire ?', reponse: rt('Tout le niveau 2, plus la grimpe et l’assurage en tête.') },
      ] },
    ],
  }],

  // ── bloc-hero ────────────────────────────────────────────────────────────
  ['bloc-hero', BlocHero, {
    fond: 'blanc', badge: 'Saison 2026 / 2027', badge_icon: 'i-heroicons-calendar-days',
    titre: 'Boutique du club', sous_titre: 'Textile et goodies aux couleurs de l’ASC Escalade.',
    boutons: [bouton('Voir les produits', '#', 'vert', 'i-heroicons-shopping-bag'), bouton('Nous contacter', '/contact', 'outline')],
  }],
  ['bloc-hero (image de fond)', BlocHero, {
    image_fond: img.murLarge, badge: 'Compétition', badge_icon: 'i-heroicons-trophy',
    titre: 'Open de Chevigny', sous_titre: 'Samedi 14 septembre — Gymnase Boivin',
    boutons: [bouton('Je m’inscris', '#', 'vert')],
  }],

  // ── bloc-alerte ──────────────────────────────────────────────────────────
  ['bloc-alerte (annonce)', BlocAlerte, {
    type: 'annonce', titre: 'Inscriptions ouvertes', fermable: true,
    message: 'Permanences les 4 et 5 septembre au gymnase Boivin.', lien_label: 'En savoir plus', lien: lienUrl('/inscriptions'),
  }],
  ['bloc-alerte (info)', BlocAlerte, { type: 'info', message: 'Le club sera fermé pendant les vacances de Noël.' }],
  ['bloc-alerte (urgent)', BlocAlerte, { type: 'urgent', titre: 'Gymnase fermé', message: 'Séances annulées cette semaine (dégât des eaux).' }],

  // ── bloc-texte ───────────────────────────────────────────────────────────
  ['bloc-texte', BlocTexte, {
    fond: 'blanc', surtitre: 'À propos', titre: 'Un club pour tous les niveaux',
    contenu: rt('L’ASC Escalade accueille enfants, ados et adultes sur le mur du gymnase Boivin.', 'Créneaux par groupes de niveau, encadrés par des initiateurs diplômés FFME.'),
    boutons: [bouton('Découvrir les cours', '/tarifs')],
  }],
  ['bloc-texte (fond vert, centré)', BlocTexte, {
    fond: 'vert', titre: 'Notre philosophie', alignement: 'centre',
    contenu: rt('Progresser à son rythme, dans une ambiance conviviale, en sécurité.'),
    boutons: [bouton('Nous rejoindre', '/inscriptions')],
  }],

  // ── bloc-texte-media ─────────────────────────────────────────────────────
  ['bloc-texte-media', BlocTexteMedia, {
    fond: 'gris', image: img.mur, media_surtitre: 'Nouveauté', media_titre: 'Un nouveau pan de bloc',
    texte: rt('40 m² de grimpe supplémentaires avec des dévers réglables.'), boutons: [bouton('Réserver', '/tarifs', 'sombre')],
  }],
  ['bloc-texte-media (image à gauche)', BlocTexteMedia, {
    fond: 'blanc', image: img.portrait, image_a_gauche: true, media_titre: 'Encadrement diplômé',
    texte: rt('Tous nos créneaux enfants sont encadrés par des initiateurs et moniteurs FFME.'),
  }],

  // ── bloc-grille-cartes ───────────────────────────────────────────────────
  ['bloc-grille-cartes (grille + « voir plus »)', BlocGrilleCartes, {
    fond: 'blanc', surtitre: 'Boutique', titre: 'Nos produits', colonnes: '3', affichage: 'grille', nb_visibles: 3,
    cartes: [
      { image: img.murLarge, etiquette: 'Textile', titre: 'T-shirt', prix: '20 €', texte: 'XS au XXL.', bouton: [bouton('Commander', '#')] },
      { image: img.portrait, etiquette: 'Textile', titre: 'Sweat', prix: '35 €', texte: 'Logo brodé.', bouton: [bouton('Commander', '#')] },
      { icon: 'i-heroicons-sparkles', etiquette: 'Goodies', titre: 'Gourde', prix: '12 €', bouton: [bouton('Commander', '#')] },
      { image: img.mur, etiquette: 'Textile', titre: 'Casquette', prix: '15 €', bouton: [bouton('Commander', '#')] },
      { icon: 'i-heroicons-gift', etiquette: 'Goodies', titre: 'Tote bag', prix: '8 €', bouton: [bouton('Commander', '#')] },
    ],
  }],
  ['bloc-grille-cartes (carrousel)', BlocGrilleCartes, {
    fond: 'gris', titre: 'En carrousel', affichage: 'carrousel',
    cartes: [
      { image: img.murLarge, titre: 'T-shirt', prix: '20 €' }, { image: img.portrait, titre: 'Sweat', prix: '35 €' },
      { image: img.mur, titre: 'Casquette', prix: '15 €' }, { icon: 'i-heroicons-gift', titre: 'Tote bag', prix: '8 €' },
      { icon: 'i-heroicons-sparkles', titre: 'Porte-clés', prix: '5 €' },
    ],
  }],
  ['bloc-grille-cartes (avantages, 4 col, sans image)', BlocGrilleCartes, {
    fond: 'blanc', titre: 'Pourquoi nous rejoindre ?', colonnes: '4', affichage: 'grille',
    cartes: [
      { icon: 'i-heroicons-user-group', titre: 'Tous niveaux', points: [{ texte: 'Du baby à la compétition' }] },
      { icon: 'i-heroicons-shield-check', titre: 'Encadrement FFME', points: [{ texte: 'Initiateurs diplômés' }] },
      { icon: 'i-heroicons-map', titre: 'Salles partenaires', points: [{ texte: 'CIME, Vertical Art, Climb Up' }] },
      { icon: 'i-heroicons-heart', titre: 'Ambiance', points: [{ texte: 'Sorties, compétitions, événements' }] },
    ],
  }],

  // ── bloc-infos-cles ──────────────────────────────────────────────────────
  ['bloc-infos-cles (fond bleu nuit)', BlocInfosCles, {
    fond: 'bleu-nuit', titre: 'L’Open de Chevigny en chiffres',
    infos: [
      { icon: 'i-heroicons-users', valeur: '120', libelle: 'grimpeurs' },
      { icon: 'i-heroicons-map', valeur: '45', libelle: 'voies' },
      { icon: 'i-heroicons-trophy', valeur: '9', libelle: 'catégories' },
      { icon: 'i-heroicons-calendar', valeur: '1 jour', libelle: 'de compét' },
    ],
  }],

  // ── bloc-programme ───────────────────────────────────────────────────────
  ['bloc-programme', BlocProgramme, {
    fond: 'blanc', surtitre: 'Déroulé', titre: 'Le jour J',
    etapes: [
      { numero: '1', horaire: '08 h 30', titre: 'Accueil', texte: rt('Retrait des dossards.') },
      { numero: '2', horaire: '09 h 30', titre: 'Qualifications', texte: rt('6 voies par catégorie.') },
      { numero: '3', horaire: '14 h 00', titre: 'Finales', bouton: [bouton('Règlement', '#')] },
    ],
  }],

  // ── bloc-colonnes ────────────────────────────────────────────────────────
  ['bloc-colonnes (2 col, centré)', BlocColonnes, {
    fond: 'gris', titre: 'Adultes ou enfants ?', disposition: '2', alignement: 'centre',
    colonnes: [
      { titre: 'Adultes', contenu: rt('Créneaux le soir, grimpe autonome.'), bouton: [bouton('Créneaux adultes', '/tarifs')] },
      { titre: 'Enfants', contenu: rt('Cours encadrés par groupes de niveau.'), bouton: [bouton('Créneaux jeunes', '/tarifs')] },
    ],
  }],
  ['bloc-colonnes (3 col, à gauche)', BlocColonnes, {
    fond: 'blanc', titre: 'Trois piliers', disposition: '3', alignement: 'gauche',
    colonnes: [
      { titre: 'Sécurité', contenu: rt('Nœud de huit, vérification du partenaire.') },
      { titre: 'Technique', contenu: rt('Placement de pieds, lecture de voie.') },
      { titre: 'Autonomie', contenu: rt('Grimpe en tête, gestion des dégaines.') },
    ],
  }],

  // ── bloc-tableau ─────────────────────────────────────────────────────────
  ['bloc-tableau', BlocTableau, { fond: 'blanc', surtitre: 'Cotisations', ...tableauTarifs, titre: 'Tarifs 2026 / 2027' }],

  // ── bloc-encadre ─────────────────────────────────────────────────────────
  ['bloc-encadre (attention)', BlocEncadre, {
    fond: 'blanc', type: 'attention', titre: 'Certificat médical',
    texte: rt('Certificat de moins de 6 mois exigé pour la première licence et les compétitions.'),
  }],
  ['bloc-encadre (info / succès / sombre)', BlocEncadre, { fond: 'gris', type: 'succes', titre: 'Dossier complet', texte: rt('Votre inscription est validée, rendez-vous au premier cours !') }],

  // ── bloc-carte-acces ─────────────────────────────────────────────────────
  ['bloc-carte-acces', BlocCarteAcces, {
    fond: 'gris', titre: 'Venir au gymnase Boivin', plan: img.murLarge, nom_lieu: 'Gymnase Boivin',
    adresse: 'Rue du Château\n21800 Chevigny-Saint-Sauveur', acces: 'Bus ligne 7, arrêt « Mail ».',
    parking: 'Parking gratuit devant le gymnase.',
    lien_itineraire: lienUrl('https://maps.google.com/?q=Gymnase+Boivin'), lien_itineraire_label: 'Google Maps',
  }],

  // ── bloc-galerie ─────────────────────────────────────────────────────────
  ['bloc-galerie', BlocGalerie, { fond: 'blanc', titre: 'La salle', colonnes: '3', photos: [img.mur, img.murLarge, img.portrait, img.mur, img.murLarge, img.portrait] }],

  // ── bloc-logos ───────────────────────────────────────────────────────────
  ['bloc-logos (grille)', BlocLogos, {
    fond: 'gris', titre: 'Nos partenaires', defilement: false,
    logos: [
      { nom: 'CIME', image: { filename: `${A}/221x228/832a7b7489/cime-altitude.jpg` }, lien: lienUrl('https://www.cime-dijon.com/') },
      { nom: 'Climb Up', image: { filename: `${A}/800x800/e1510e8a17/climb-up.jpg` }, lien: lienUrl('https://dijon.climb-up.fr/') },
      { nom: 'Vertical Art', image: { filename: `${A}/1000x1000/e5cbe8d5ac/vertical-art-dijon.jpg` }, lien: lienUrl('https://dijon.vertical-art.fr/') },
      { nom: 'Chevigny', image: img.ville, lien: {} },
    ],
  }],
  ['bloc-logos (défilement)', BlocLogos, {
    fond: 'blanc', defilement: true,
    logos: [
      { nom: 'CIME', image: { filename: `${A}/221x228/832a7b7489/cime-altitude.jpg` }, lien: {} },
      { nom: 'Climb Up', image: { filename: `${A}/800x800/e1510e8a17/climb-up.jpg` }, lien: {} },
      { nom: 'Vertical Art', image: { filename: `${A}/1000x1000/e5cbe8d5ac/vertical-art-dijon.jpg` }, lien: {} },
    ],
  }],

  // ── bloc-agenda ──────────────────────────────────────────────────────────
  ['bloc-agenda', BlocAgenda, {
    fond: 'blanc', surtitre: 'Vie du club', titre: 'Agenda',
    evenements: [
      { date: dans(14), categorie: 'Compétition', horaire: '08 h 30', titre: 'Open de Chevigny-Saint-Sauveur', lieu: 'Gymnase Boivin', lien_label: 'S’inscrire', lien: lienUrl('#') },
      { date: dans(40), categorie: 'Vie associative', titre: 'Assemblée générale', lieu: 'Salle polyvalente' },
      { date: dans(-20), categorie: 'Sortie', titre: 'Sortie falaise à Hauteroche', lieu: 'Hauteroche (21)' },
    ],
  }],

  // ── bloc-documents ───────────────────────────────────────────────────────
  ['bloc-documents', BlocDocuments, {
    fond: 'gris', titre: 'Documents du club',
    groupes: [
      { icon: 'i-heroicons-identification', titre: 'Adhésion', documents: [{ titre: 'Fiche d’inscription 2026-2027', hint: 'PDF', url_externe: lienUrl('#') }, { titre: 'Questionnaire de santé', url_externe: lienUrl('#') }] },
      { icon: 'i-heroicons-scale', titre: 'Vie associative', documents: [{ titre: 'Statuts', url_externe: lienUrl('#') }, { titre: 'Règlement intérieur', url_externe: lienUrl('#') }] },
    ],
  }],

  // ── bloc-faq ─────────────────────────────────────────────────────────────
  ['bloc-faq', BlocFaq, {
    fond: 'blanc', titre: 'Questions fréquentes',
    items: [
      { question: 'Faut-il apporter son matériel ?', reponse: rt('Non, le club prête chaussons et baudriers pour l’essai.') },
      { question: 'À partir de quel âge ?', reponse: rt('Dès 4 ans pour le groupe Baby.') },
      { question: 'Peut-on faire un essai ?', reponse: rt('Oui, lors des permanences ou sur demande.') },
    ],
  }],

  // ── bloc-cta ─────────────────────────────────────────────────────────────
  ['bloc-cta (bleu nuit)', BlocCta, {
    fond: 'blanc', theme: 'bleu-nuit', titre: 'Envie de grimper avec nous ?', texte: 'Rejoignez l’ASC Escalade.',
    boutons: [bouton('S’inscrire', '/inscriptions', 'vert'), bouton('Nous contacter', '/contact', 'clair')],
  }],
  ['bloc-cta (vert)', BlocCta, {
    fond: 'gris', theme: 'vert', titre: 'Prêt à commencer ?',
    boutons: [bouton('Voir les créneaux', '/tarifs', 'sombre')],
  }],

  // ── bloc-separateur / bloc-espacement ────────────────────────────────────
  ['bloc-separateur (pleine largeur, fin)', BlocSeparateur, { fond: 'blanc', largeur: 'pleine', epaisseur: 'fine' }],
  ['bloc-separateur (court, épais)', BlocSeparateur, { fond: 'blanc', largeur: 'courte', epaisseur: 'epaisse' }],
  ['bloc-espacement (L)', BlocEspacement, { fond: 'gris', taille: 'L' }],
]
</script>

<template>
  <div>
    <div class="bg-vp-dark text-white py-4 px-4 sticky top-0 z-50">
      <div class="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-bold">Blocs réutilisables — {{ blocs.length }} exemples</span>
        <span class="text-xs text-white/50">Page interne (staff) · données factices</span>
      </div>
    </div>

    <template v-for="([nom, comp, blok]) in blocs" :key="nom">
      <div class="border-t-4 border-dashed border-vp-green/40 bg-vp-green/5 px-4 py-1.5 text-xs font-mono font-bold text-vp-dark">
        {{ nom }}
      </div>
      <div :class="nom.startsWith('bloc-popup') ? 'p-8 text-center' : ''">
        <component :is="comp" :blok="blok" />
      </div>
    </template>
  </div>
</template>
