#!/usr/bin/env node
/**
 * Contenu prêt à l'emploi du bloc « inscriptions-parcours » (parcours d'inscription
 * en ligne, onglets adulte / enfant). Récupéré de l'ancienne page inscriptions.vue
 * supprimée par erreur.
 *
 * Usage :
 *   # 1. écrire le bloc seul (référence / copier-coller)
 *   node scripts/storyblok-inscriptions-parcours-content.mjs
 *   → .storyblok/inscriptions-parcours.blok.json
 *
 *   # 2. l'injecter dans la story `inscriptions` déjà « pull »
 *   npx storyblok stories pull --space 291351822158044 --path inscriptions
 *   node scripts/storyblok-inscriptions-parcours-content.mjs --into \
 *     .storyblok/stories/291351822158044/inscriptions.json
 *   npx storyblok stories push --space 291351822158044 --path inscriptions
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const uid = () => randomUUID()

/** richtext Storyblok à partir de paragraphes en texte simple */
const rt = (...paras) => ({
  type: 'doc',
  content: paras.map((t) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] })),
})

/** lien interne (chemin absolu du site) */
const url = (path) => ({ id: '', url: path, linktype: 'url', fieldtype: 'multilink', cached_url: path })
const noLink = { id: '', url: '', linktype: 'url', fieldtype: 'multilink', cached_url: '' }

const etape = (numero, titre, texte, bouton_label = '', lien = noLink) => ({
  _uid: uid(),
  component: 'inscriptions-parcours-etape',
  numero,
  titre,
  texte: rt(texte),
  bouton_label,
  bouton_fichier: null,
  bouton_lien: lien,
})

const etapesAdulte = [
  etape(
    '1',
    'Créer son compte',
    "Sur la page Inscription, choisissez « Je m'inscris moi-même » et renseignez vos informations.",
    'Créer mon compte',
    url('/register'),
  ),
  etape(
    '2',
    'Choisir son groupe',
    "Chaque groupe correspond à un créneau et un niveau. Repérez celui qui vous convient sur la page Tarifs & cours.",
    'Voir les groupes',
    url('/tarifs'),
  ),
  etape(
    '3',
    "Envoyer sa demande d'inscription",
    "Depuis « Mes inscriptions », demandez à rejoindre votre groupe. Votre demande apparaît « en attente de validation ».",
    'Mes inscriptions',
    url('/mes-inscriptions'),
  ),
  etape(
    '4',
    'Attendre la validation du club',
    "Une secrétaire examine votre demande. Vous recevez un email vous informant si elle est acceptée ou refusée.",
  ),
  etape(
    '5',
    'Régler sa cotisation',
    "Si votre demande est acceptée, l'email contient un lien de paiement HelloAsso. Vous préférez régler autrement (chèque, espèces, chèques vacances, coupons sport) ? Contactez le club pour convenir d'un autre moyen de paiement.",
    'Nous contacter',
    url('/contact'),
  ),
  etape(
    '6',
    'Compléter son dossier santé',
    "Questionnaire de santé et, selon le cas, attestation ou certificat médical à saisir sur myFFME (voir la section Santé plus bas). Peut se faire à tout moment, sans attendre la validation.",
  ),
]

const etapesEnfant = [
  etape(
    '1',
    'Créer son compte parent',
    "Sur la page Inscription, choisissez « Je souhaite inscrire mon enfant (mineur) ». Un mineur ne peut pas s'inscrire seul : il faut d'abord un compte parent.",
    'Créer mon compte',
    url('/register'),
  ),
  etape(
    '2',
    'Ajouter son ou ses enfants',
    "Pendant la création du compte, ou plus tard depuis « Mon profil ».",
    'Mon profil',
    url('/profil'),
  ),
  etape(
    '3',
    'Choisir le bon groupe pour son enfant',
    "L'âge du groupe est calculé au 1ᵉʳ septembre de la saison. Retrouvez tous les groupes sur la page Tarifs & cours.",
    'Voir les groupes',
    url('/tarifs'),
  ),
  etape(
    '4',
    "Envoyer la demande d'inscription de l'enfant",
    "Depuis « Mes inscriptions », demandez à inscrire votre enfant à son groupe. La demande apparaît « en attente de validation ».",
    'Mes inscriptions',
    url('/mes-inscriptions'),
  ),
  etape(
    '5',
    'Attendre la validation du club',
    "Une secrétaire examine la demande. Vous recevez un email vous informant si elle est acceptée ou refusée.",
  ),
  etape(
    '6',
    'Régler la cotisation',
    "Si la demande est acceptée, l'email contient un lien de paiement HelloAsso. Vous préférez régler autrement — Pass'Sport, CAF, chèques vacances, coupons sport, chèque, espèces ? Contactez le club pour convenir d'un autre moyen de paiement.",
    'Nous contacter',
    url('/contact'),
  ),
  etape(
    '7',
    "Compléter le dossier santé de l'enfant",
    "Fiche mineur, questionnaire de santé et, selon le cas, certificat médical à saisir sur myFFME (voir la section Santé plus bas). Peut se faire à tout moment, sans attendre la validation.",
  ),
]

const parcoursBlok = {
  _uid: uid(),
  component: 'inscriptions-parcours',
  surtitre: 'Le parcours en ligne',
  title: "Comment s'inscrire en ligne ?",
  description:
    "Suivez ces étapes pour envoyer votre demande d'inscription, ou celle de votre enfant.",
  onglet_adulte_label: "Je m'inscris (adulte)",
  onglet_enfant_label: "J'inscris mon enfant",
  etapes_adulte: etapesAdulte,
  etapes_enfant: etapesEnfant,
  fond: 'blanc',
  anchor_id: 'parcours',
}

// ─────────────────────────────────────────────────────────────────────────────
const intoArg = process.argv.indexOf('--into')
if (intoArg !== -1) {
  const target = resolve(process.argv[intoArg + 1])
  if (!existsSync(target)) {
    console.error(`✗ Story introuvable : ${target}\n  Lance d'abord : npx storyblok stories pull --space <SPACE_ID> --path inscriptions`)
    process.exit(1)
  }
  const story = JSON.parse(readFileSync(target, 'utf8'))
  const content = story.content || (story.story && story.story.content)
  if (!content || !Array.isArray(content.body)) {
    console.error("✗ Format inattendu : pas de content.body dans la story.")
    process.exit(1)
  }
  content.body = content.body.filter((b) => b.component !== 'inscriptions-parcours')
  const ctaIdx = content.body.findIndex((b) => b.component === 'inscriptions-cta')
  if (ctaIdx === -1) content.body.push(parcoursBlok)
  else content.body.splice(ctaIdx, 0, parcoursBlok)
  writeFileSync(target, JSON.stringify(story, null, 2))
  console.log(`✓ Bloc « inscriptions-parcours » injecté dans ${target}`)
  console.log(`  body = ${content.body.length} blocs`)
  console.log(`  → npx storyblok stories push --space <SPACE_ID> --path inscriptions`)
} else {
  const out = resolve('.storyblok/inscriptions-parcours.blok.json')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(parcoursBlok, null, 2))
  console.log(`✓ Bloc écrit dans ${out}`)
  console.log(`  ${etapesAdulte.length} étapes adulte + ${etapesEnfant.length} étapes enfant`)
}
