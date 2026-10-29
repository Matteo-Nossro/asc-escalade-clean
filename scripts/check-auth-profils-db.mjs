#!/usr/bin/env node
/**
 * T1b — vérifie, sur le projet Supabase de DEV et avec les VRAIS comptes de test
 * (connexion par mot de passe, clé anon : JWT réels), la migration
 * `supabase/migrations/20261029_auth_profils.sql` :
 *   · trigger `profiles_block_status` : status / profile_completed_at refusés à
 *     l'adhérent (son profil, celui de son enfant, un tiers), à l'initiateur et à
 *     l'anonyme ; autorisés à la secrétaire ET à l'admin (bureau) ;
 *   · un champ libre (mobile) reste modifiable par l'adhérent sur son profil ;
 *   · `handle_new_user` : compte jetable créé par l'API admin → profil « En attente »,
 *     profile_completed_at NULL, aucun rôle ; mise à jour par la service role acceptée ;
 *   · défaut de `profiles.status` : « En attente » ;
 *   · rattrapage : les 4 comptes de test ont profile_completed_at renseigné.
 *
 * Variables (lues dans l'environnement, sinon dans `.env` ; une variable déjà
 * définie n'est jamais écrasée) :
 *   SUPABASE_URL           URL du projet (doit être celui de DEV)
 *   SUPABASE_KEY           clé publique (anon) (repli : SUPABASE_ANON_KEY)
 *   SUPABASE_SECRET_KEY    clé service role (replis : SUPABASE_SERVICE_ROLE_KEY,
 *                          SUPABASE_SERVICE_KEY)
 *   TEST_USERS_EMAIL       adresse de base `local@domaine` ; comptes `local+admin@domaine`,
 *                          `+secretaire`, `+initiateur`, `+adherent`
 *   TEST_USERS_PASSWORD    mot de passe commun aux 4 comptes
 *
 * Une écriture « refusée » est constatée sur l'état réel : relecture par la service
 * role (valeur inchangée), erreur ou 0 ligne touchée selon le cas.
 *
 * Données : les lignes réelles lues (profil adhérent, enfant, profil fictif `hugo`)
 * sont photographiées au départ et remises en l'état dans un `finally`
 * (hors `updated_at`, que le trigger on_profiles_updated réécrit à toute mise à jour
 * autorisée). Les comptes / profils jetables portent `+t1b-` (adresse) ; les restes
 * éventuels sont supprimés au démarrage, puis un contrôle final vérifie qu'il n'en reste aucun.
 * Aucun e-mail n'est envoyé (création par l'API admin, e-mail confirmé).
 *
 * Sécurité : refus avant tout appel réseau si l'URL ou une clé JWT ne désigne pas
 * le projet de DEV. Clés et mot de passe ne sont jamais affichés.
 *
 * Usage : node scripts/check-auth-profils-db.mjs
 * Code de sortie : 0 si tout est OK, 1 s'il y a au moins un ÉCHEC.
 */
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const DEV_REF = 'ybtnnogxukfldurozqwa'
const MARQUE = '+t1b-'
const HUGO_ID = 'f5eed000-0000-4000-8000-000000000002' // profil fictif sans lien (seed)
const DATE_TEST = '2000-01-01T00:00:00+00:00'

function fail(message) {
  console.error(`Erreur : ${message}`)
  process.exit(1)
}

// ── Environnement ───────────────────────────────────────────────────────────
try {
  process.loadEnvFile('.env') // ne surcharge pas les variables déjà définies
} catch {
  // pas de .env : on se contente de l'environnement
}

const url = process.env.SUPABASE_URL
const cleAnon = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY
const cleService =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY
const motDePasse = process.env.TEST_USERS_PASSWORD
const emailBase = process.env.TEST_USERS_EMAIL

const manquantes = []
if (!url) manquantes.push('SUPABASE_URL')
if (!cleAnon) manquantes.push('SUPABASE_KEY (ou SUPABASE_ANON_KEY)')
if (!cleService) manquantes.push('SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY)')
if (!motDePasse) manquantes.push('TEST_USERS_PASSWORD')
if (!emailBase) manquantes.push('TEST_USERS_EMAIL')
if (manquantes.length) fail(`variable(s) manquante(s) : ${manquantes.join(', ')}`)

// ── Garde : uniquement le projet de DEV, avant tout appel réseau ────────────
let hostname
try {
  hostname = new URL(url).hostname
} catch {
  fail('SUPABASE_URL n’est pas une URL valide')
}
if (hostname !== `${DEV_REF}.supabase.co`) {
  fail(`SUPABASE_URL ne désigne pas le projet de DEV (${DEV_REF}.supabase.co attendu) ; arrêt.`)
}

/** Contrôle ref + rôle d'une clé JWT. Une clé `sb_…` n'est pas un JWT (URL seule). */
function controlerCle(cle, roleAttendu, libelle) {
  const segments = cle.split('.')
  if (segments.length !== 3) return
  let payload
  try {
    payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'))
  } catch {
    fail(`la clé ${libelle} (JWT) est illisible ; impossible de vérifier le projet visé`)
  }
  if (payload?.ref !== DEV_REF) {
    fail(`la clé ${libelle} ne correspond pas au projet de DEV (${DEV_REF}) ; arrêt.`)
  }
  if (payload?.role !== roleAttendu) {
    fail(`la clé ${libelle} n’a pas le rôle ${roleAttendu} ; arrêt.`)
  }
}
controlerCle(cleService, 'service_role', 'service role')
controlerCle(cleAnon, 'anon', 'publique (anon)')

// ── Adresses des comptes ────────────────────────────────────────────────────
const arobase = emailBase.lastIndexOf('@')
if (arobase < 1 || arobase === emailBase.length - 1) {
  fail('TEST_USERS_EMAIL doit avoir la forme local@domaine')
}
if (/@example\.com$/i.test(emailBase)) fail('TEST_USERS_EMAIL ne doit pas être en @example.com')
const emailDe = (suffixe) =>
  `${emailBase.slice(0, arobase)}+${suffixe}@${emailBase.slice(arobase + 1)}`

const OPTIONS = { auth: { autoRefreshToken: false, persistSession: false } }
const service = createClient(url, cleService, OPTIONS)

// ── Résultats ───────────────────────────────────────────────────────────────
const resultats = []
function noter(compte, verification, ok, detail = '') {
  resultats.push({ compte, verification, ok: Boolean(ok), detail })
}
function msg(error) {
  if (!error) return ''
  const texte = `${error.code ? `${error.code} · ` : ''}${error.message ?? 'erreur'}`
  return texte.length > 110 ? `${texte.slice(0, 107)}...` : texte
}
const avecErreur = (error) => (error ? `erreur : ${msg(error)}` : 'aucune erreur')
const erreurInattendue = (e) => (e instanceof Error ? e.message : 'erreur inattendue')

// ── Lecture / restauration (service role) ───────────────────────────────────
const COLONNES = 'id, status, profile_completed_at, mobile'
async function lireProfil(id) {
  const { data, error } = await service.from('profiles').select(COLONNES).eq('id', id).maybeSingle()
  if (error) throw new Error(`relecture profiles ${id} : ${msg(error)}`)
  return data
}

/** Photographies initiales, pour la remise en l'état finale. */
const photos = new Map()
async function photographier(id) {
  if (!photos.has(id)) {
    const p = await lireProfil(id)
    if (!p) throw new Error(`profil ${id} introuvable`)
    photos.set(id, p)
  }
  return photos.get(id)
}

async function restaurerPhotos() {
  const erreurs = []
  for (const [id, p] of photos) {
    try {
      const actuel = await lireProfil(id)
      const identique =
        actuel &&
        actuel.status === p.status &&
        actuel.mobile === p.mobile &&
        (actuel.profile_completed_at ? new Date(actuel.profile_completed_at).getTime() : null) ===
          (p.profile_completed_at ? new Date(p.profile_completed_at).getTime() : null)
      if (identique) continue
      const { error } = await service
        .from('profiles')
        .update({ status: p.status, profile_completed_at: p.profile_completed_at, mobile: p.mobile })
        .eq('id', id)
      if (error) erreurs.push(`restauration ${id} : ${msg(error)}`)
    } catch (e) {
      erreurs.push(erreurInattendue(e))
    }
  }
  return erreurs
}

const instant = (v) => (v ? new Date(v).getTime() : null)

/** Valeur de status différente de l'actuelle (respecte le CHECK). */
const autreStatut = (actuel) => ['Actif', 'Inactif', 'En attente'].find((s) => s !== actuel)

// ── Comptes ─────────────────────────────────────────────────────────────────
async function ouvrirSessions() {
  const anonyme = { nom: 'anonyme', cle: 'anonyme', client: createClient(url, cleAnon, OPTIONS) }
  const defs = [
    { nom: 'adhérent', cle: 'adherent', suffixe: 'adherent' },
    { nom: 'initiateur', cle: 'initiateur', suffixe: 'initiateur' },
    { nom: 'secrétaire', cle: 'secretaire', suffixe: 'secretaire' },
    { nom: 'admin', cle: 'admin', suffixe: 'admin' },
  ]
  const comptes = { anonyme }
  for (const d of defs) {
    const client = createClient(url, cleAnon, OPTIONS)
    const { data, error } = await client.auth.signInWithPassword({
      email: emailDe(d.suffixe),
      password: motDePasse,
    })
    if (error || !data?.user) throw new Error(`connexion du compte ${d.nom} : ${msg(error)}`)
    comptes[d.cle] = { ...d, client, id: data.user.id }
  }
  return comptes
}

// ── Tentative de modification par un client (JWT réel ou anonyme) ───────────
/**
 * Tente de poser `champ` sur la ligne `id` ; renvoie le résultat brut et si la
 * valeur a bougé (relecture service role). Restaure si la valeur a bougé.
 */
async function tenter(client, id, champ) {
  const avant = await lireProfil(id)
  const patch =
    champ === 'status'
      ? { status: autreStatut(avant.status) }
      : { profile_completed_at: instant(avant.profile_completed_at) === instant(DATE_TEST) ? new Date().toISOString() : DATE_TEST }
  const res = await client.from('profiles').update(patch).eq('id', id).select('id')
  const apres = await lireProfil(id)
  const bouge = champ === 'status'
    ? apres.status !== avant.status
    : instant(apres.profile_completed_at) !== instant(avant.profile_completed_at)
  if (bouge) {
    await service
      .from('profiles')
      .update({ status: avant.status, profile_completed_at: avant.profile_completed_at })
      .eq('id', id)
  }
  return { res, bouge, lignes: res.data?.length ?? 0 }
}

// ── Vérifications : refus ───────────────────────────────────────────────────
async function verifierRefus(comptes, cibles) {
  const CHAMPS = ['status', 'profile_completed_at']

  // Adhérent : son profil et celui de son enfant (la RLS autorise la ligne : c'est le
  // trigger qui doit refuser, avec son message), un tiers (refusé par la RLS : 0 ligne).
  for (const [libelle, id, viaTrigger] of [
    ['son profil', cibles.adherent, true],
    ['profil de son enfant', cibles.enfant, true],
    ['profil d’un tiers', cibles.tiers, false],
  ]) {
    if (!id) {
      noter('adhérent', `${libelle} : cible absente du seed`, false, 'enfant non trouvé via parent_access')
      continue
    }
    for (const champ of CHAMPS) {
      const { res, bouge, lignes } = await tenter(comptes.adherent.client, id, champ)
      const preuve = viaTrigger
        ? Boolean(res.error) && /bureau|service/i.test(res.error.message ?? '')
        : Boolean(res.error) || lignes === 0
      noter(
        'adhérent',
        `${champ} refusé sur ${libelle}`,
        !bouge && preuve,
        bouge ? 'valeur modifiée' : viaTrigger ? `attendu : refus du trigger ; ${avecErreur(res.error)}` : `${lignes} ligne(s) ; ${avecErreur(res.error)}`,
      )
    }
  }

  // Initiateur : mêmes refus sur son profil et sur un tiers.
  for (const [libelle, id] of [['son profil', cibles.initiateur], ['profil d’un tiers', cibles.tiers]]) {
    for (const champ of CHAMPS) {
      const { res, bouge } = await tenter(comptes.initiateur.client, id, champ)
      noter('initiateur', `${champ} refusé sur ${libelle}`, !bouge, bouge ? 'valeur modifiée' : avecErreur(res.error))
    }
  }

  // Anonyme (clé anon sans session) : rien ne bouge, sur aucune cible.
  for (const [libelle, id] of [['profil adhérent', cibles.adherent], ['profil enfant', cibles.enfant], ['profil tiers', cibles.tiers]]) {
    if (!id) continue
    for (const champ of CHAMPS) {
      const { res, bouge, lignes } = await tenter(comptes.anonyme.client, id, champ)
      noter(
        'anonyme',
        `${champ} refusé sur ${libelle}`,
        !bouge && (Boolean(res.error) || lignes === 0),
        bouge ? 'valeur modifiée' : `${lignes} ligne(s) ; ${avecErreur(res.error)}`,
      )
    }
  }

  // Pas de régression : un champ libre reste modifiable sur son propre profil.
  const avant = await lireProfil(cibles.adherent)
  const valeur = `0600${String(Date.now()).slice(-6)}`
  const maj = await comptes.adherent.client
    .from('profiles')
    .update({ mobile: valeur })
    .eq('id', cibles.adherent)
    .select('id')
  const apres = await lireProfil(cibles.adherent)
  noter('adhérent', 'mobile modifiable sur son profil (pas de régression)', !maj.error && apres.mobile === valeur, avecErreur(maj.error))
  await service.from('profiles').update({ mobile: avant.mobile }).eq('id', cibles.adherent)
}

// ── R1-d : auto-activation d'un adhérent authentifié, refusée par le trigger ─
// Scénario d'escalade : profil « En attente » → l'adhérent tente « Actif » avec
// son JWT. Le trigger doit refuser (exemption réservée à auth.role() IS NULL et
// service_role). Non réalisable ici : un jeton `authenticated` sans `sub`
// (il faudrait signer un JWT avec le secret du projet, volontairement absent).
async function verifierAutoActivation(comptes, cibles) {
  const photo = await photographier(cibles.adherent)
  const prep = await service.from('profiles').update({ status: 'En attente' }).eq('id', cibles.adherent)
  if (prep.error) throw new Error(`préparation auto-activation : ${msg(prep.error)}`)
  try {
    const res = await comptes.adherent.client
      .from('profiles')
      .update({ status: 'Actif' })
      .eq('id', cibles.adherent)
      .select('id')
    const apres = await lireProfil(cibles.adherent)
    noter(
      'adhérent',
      'auto-activation « En attente » → « Actif » refusée par le trigger',
      apres.status === 'En attente' && Boolean(res.error) && /bureau|service/i.test(res.error.message ?? ''),
      apres.status !== 'En attente' ? 'statut modifié' : avecErreur(res.error),
    )
  } finally {
    await service.from('profiles').update({ status: photo.status }).eq('id', cibles.adherent)
  }
}

// ── Vérifications : bureau (secrétaire ET admin) ────────────────────────────
async function verifierBureau(comptes, cibles) {
  for (const cle of ['secretaire', 'admin']) {
    const c = comptes[cle]
    for (const champ of ['status', 'profile_completed_at']) {
      const avant = await lireProfil(cibles.tiers)
      const patch =
        champ === 'status'
          ? { status: autreStatut(avant.status) }
          : { profile_completed_at: instant(avant.profile_completed_at) === instant(DATE_TEST) ? new Date().toISOString() : DATE_TEST }
      const res = await c.client.from('profiles').update(patch).eq('id', cibles.tiers).select('id')
      const apres = await lireProfil(cibles.tiers)
      const change =
        champ === 'status'
          ? apres.status === patch.status
          : instant(apres.profile_completed_at) === instant(patch.profile_completed_at)
      noter(c.nom, `${champ} modifiable sur le profil d’un tiers (bureau)`, !res.error && change, avecErreur(res.error))
      await service
        .from('profiles')
        .update({ status: avant.status, profile_completed_at: avant.profile_completed_at })
        .eq('id', cibles.tiers)
    }
  }
}

// ── Vérifications : trigger handle_new_user + défaut de statut ──────────────
async function supprimerJetable(id) {
  const erreurs = []
  const roles = await service.from('user_roles').delete().eq('user_id', id)
  if (roles.error) erreurs.push(`user_roles : ${msg(roles.error)}`)
  const prof = await service.from('profiles').delete().eq('id', id)
  if (prof.error) erreurs.push(`profiles : ${msg(prof.error)}`)
  const compte = await service.auth.admin.deleteUser(id)
  if (compte.error && !/not found/i.test(compte.error.message ?? '')) erreurs.push(`auth : ${msg(compte.error)}`)
  return erreurs
}

const jetables = [] // ids à nettoyer en `finally`

async function verifierNouveauCompte() {
  const C = 'handle_new_user'
  const email = emailDe(`t1b-${Date.now()}`)
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true, // pas d'envoi d'e-mail
  })
  if (error || !data?.user) {
    noter(C, 'création du compte jetable', false, msg(error))
    return
  }
  const id = data.user.id
  jetables.push(id)

  const p = await lireProfil(id)
  noter(C, 'profil créé par le trigger', Boolean(p))
  noter(C, 'status = « En attente »', p?.status === 'En attente', `status = ${p?.status}`)
  noter(C, 'profile_completed_at vide', p?.profile_completed_at === null, `valeur = ${p?.profile_completed_at}`)

  const roles = await service.from('user_roles').select('role_code').eq('user_id', id)
  noter(C, 'aucun rôle attribué', !roles.error && (roles.data ?? []).length === 0, avecErreur(roles.error))

  // Même chemin que create-member : mise à jour par la service role.
  const maj = await service
    .from('profiles')
    .update({ status: 'Actif', profile_completed_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
  const apres = await lireProfil(id)
  noter(
    'service_role',
    'status et profile_completed_at modifiables (exemption service role)',
    !maj.error && apres?.status === 'Actif' && apres?.profile_completed_at !== null,
    avecErreur(maj.error),
  )

  const erreurs = await supprimerJetable(id)
  const reste = await lireProfil(id)
  const compte = await service.auth.admin.getUserById(id)
  const compteSupprime = Boolean(compte.error) || !compte.data?.user
  noter(C, 'compte jetable supprimé', erreurs.length === 0 && !reste && compteSupprime, erreurs.join(' ; '))
  if (!reste && compteSupprime) jetables.splice(jetables.indexOf(id), 1)
}

async function verifierDefautStatut() {
  const id = randomUUID()
  jetables.push(id)
  const ins = await service.from('profiles').insert({ id }).select('status, profile_completed_at').maybeSingle()
  noter(
    'service_role',
    'défaut de profiles.status = « En attente » (insert sans status)',
    !ins.error && ins.data?.status === 'En attente' && ins.data?.profile_completed_at === null,
    ins.error ? msg(ins.error) : `status = ${ins.data?.status}`,
  )
  const sup = await service.from('profiles').delete().eq('id', id)
  const reste = await lireProfil(id)
  noter('service_role', 'profil de test du défaut supprimé', !sup.error && !reste, avecErreur(sup.error))
  if (!reste) jetables.splice(jetables.indexOf(id), 1)
}

async function verifierRattrapage(comptes) {
  for (const cle of ['admin', 'secretaire', 'initiateur', 'adherent']) {
    const p = await lireProfil(comptes[cle].id)
    noter(comptes[cle].nom, 'profile_completed_at renseigné (rattrapage)', Boolean(p?.profile_completed_at))
  }
}

// ── Nettoyage des restes éventuels (comptes jetables précédents) ────────────
async function nettoyerRestes() {
  const erreurs = []
  const { data: profils, error } = await service.from('profiles').select('id').ilike('email', `%${MARQUE}%`)
  if (error) return [`profiles : ${msg(error)}`]
  const ids = new Set((profils ?? []).map((p) => p.id))
  const liste = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (liste.error) erreurs.push(`auth.listUsers : ${msg(liste.error)}`)
  for (const u of liste.data?.users ?? []) {
    if ((u.email ?? '').includes(MARQUE)) ids.add(u.id)
  }
  for (const id of ids) erreurs.push(...(await supprimerJetable(id)))
  return erreurs
}

// ── Exécution ───────────────────────────────────────────────────────────────
try {
  const restes = await nettoyerRestes()
  if (restes.length) throw new Error(`nettoyage initial : ${restes.join(' ; ')}`)

  const comptes = await ouvrirSessions()

  // Cibles : profil adhérent, son enfant (parent_access, créé par le seed), un tiers sans lien.
  const liens = await service.from('parent_access').select('child_id').eq('parent_id', comptes.adherent.id)
  if (liens.error) throw new Error(`lecture parent_access : ${msg(liens.error)}`)
  const cibles = {
    adherent: comptes.adherent.id,
    initiateur: comptes.initiateur.id,
    enfant: liens.data?.[0]?.child_id ?? null,
    tiers: HUGO_ID,
  }
  for (const id of [cibles.adherent, cibles.initiateur, cibles.enfant, cibles.tiers]) {
    if (id) await photographier(id)
  }

  const etapes = [
    ['refus (adhérent, initiateur, anonyme)', () => verifierRefus(comptes, cibles)],
    ['auto-activation (R1-d)', () => verifierAutoActivation(comptes, cibles)],
    ['bureau (secrétaire, admin)', () => verifierBureau(comptes, cibles)],
    ['handle_new_user', () => verifierNouveauCompte()],
    ['défaut du statut', () => verifierDefautStatut()],
    ['rattrapage', () => verifierRattrapage(comptes)],
  ]
  for (const [nom, executer] of etapes) {
    try {
      await executer()
    } catch (e) {
      noter('script', `exécution : ${nom}`, false, erreurInattendue(e))
    }
  }
} catch (e) {
  noter('script', 'préparation', false, erreurInattendue(e))
} finally {
  try {
    const erreurs = [...(await restaurerPhotos())]
    for (const id of [...jetables]) erreurs.push(...(await supprimerJetable(id)))
    erreurs.push(...(await nettoyerRestes()))
    noter('service_role', 'données remises en l’état, aucun reste +t1b-', erreurs.length === 0, erreurs.join(' ; '))
  } catch (e) {
    noter('service_role', 'données remises en l’état, aucun reste +t1b-', false, erreurInattendue(e))
  }
}

// ── Tableau final ───────────────────────────────────────────────────────────
const lignes = resultats.map((r) => [r.ok ? 'OK' : 'ÉCHEC', r.compte, r.verification, r.ok ? '' : r.detail])
const largeurs = [0, 1, 2].map((i) => Math.max(...lignes.map((l) => l[i].length)))
console.log(`\nauth-profils — vérifications base de DEV (${DEV_REF})\n`)
for (const [statut, compte, verification, detail] of lignes) {
  console.log(
    `${statut.padEnd(largeurs[0])} | ${compte.padEnd(largeurs[1])} | ${verification.padEnd(largeurs[2])}${detail ? ` | ${detail}` : ''}`,
  )
}
const echecs = resultats.filter((r) => !r.ok).length
console.log(`\n${resultats.length - echecs} OK · ${echecs} ÉCHEC`)
process.exit(echecs ? 1 : 0)
