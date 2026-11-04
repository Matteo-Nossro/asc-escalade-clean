#!/usr/bin/env node
/**
 * T0a (feature securite-bdd) — vérifie, sur le projet Supabase de DEV, la sécurité de
 * `public.member_directory` (migration A) et des fonctions SECURITY DEFINER (migration B).
 *
 * Deux voies d'accès :
 *   · API (supabase-js) avec les VRAIS comptes de test (JWT réels, clé anon) et la
 *     service role pour relire l'état réel ;
 *   · SQL direct (paquet `pg`, variable SUPABASE_DEV_DB_URL) pour le catalogue
 *     (droits, search_path, vue) et pour le cas Q24 « jeton authenticated sans sub »,
 *     joué dans des transactions terminées par ROLLBACK, sans secret JWT.
 *
 * Sections du relevé :
 *   [A]              annuaire : lecture limitée à id + full_name des référents / moniteurs,
 *                    écritures refusées, vue non modifiable, droits, schéma `private`.
 *   [B]              search_path fixé (dont profiles_block_status_change et
 *                    helloasso_acquire_token_lock, nominativement), fonctions de trigger hors
 *                    API, is_admin_or_secretary / has_role déplacées dans `private` (absentes
 *                    de `public`, EXECUTE à authenticated seulement, rpc refusé à tous).
 *   [C]              trigger registrations_block_user_status_change : la service role écrit
 *                    `registrations` (exemption en tête de trigger), l'adhérent reste bloqué.
 *   [D]              droits explicites de helloasso_tokens / helloasso_sync_runs (catalogue du dev),
 *                    puis répétition « conditions de la prod » : transaction TOUJOURS annulée
 *                    (REVOKE ALL, corps du fichier D sans BEGIN/COMMIT, relecture des droits,
 *                    verrou helloasso_acquire_token_lock sous service_role).
 *   [non-régression] lectures et écritures staff / adhérent (policies qui appellent
 *                    is_admin_or_secretary / has_role : profiles, user_roles, helloasso_forms,
 *                    profile_payments), triggers, création de compte, Q24 (RLS, trigger
 *                    profiles_block_status), remise en état.
 * Avant les migrations, [A] et [B] doivent être en ÉCHEC (fonctionnalité absente) et
 * [non-régression] en OK. Tout autre motif d'échec est une erreur de test.
 *
 * Variables (environnement, sinon `.env` ; une variable déjà définie n'est pas écrasée) :
 *   SUPABASE_URL, SUPABASE_KEY (anon), SUPABASE_SECRET_KEY (service role),
 *   TEST_USERS_EMAIL (local@domaine ; comptes local+admin@domaine, +secretaire,
 *   +initiateur, +adherent), TEST_USERS_PASSWORD,
 *   SUPABASE_DEV_DB_URL  chaîne Postgres du DEV (Session pooler ou connexion directe).
 *
 * Données : le script n'écrit que sur des lignes jetables marquées `+secu-` (comptes créés
 * par l'API admin, e-mail confirmé : aucun envoi). Elles sont supprimées dans un `finally`,
 * les restes éventuels sont purgés au démarrage et un contrôle final vérifie qu'il n'en reste
 * aucun. Aucune migration n'est appliquée.
 *
 * Sécurité : refus avant toute connexion si l'URL, une clé JWT ou la chaîne Postgres ne
 * désigne pas le projet de DEV. Aucun secret (clé, mot de passe, URL Postgres) n'est affiché.
 *
 * Usage : node scripts/check-securite-bdd.mjs
 * Code de sortie : 0 si tout est OK, 1 s'il y a au moins un ÉCHEC.
 */
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const DEV_REF = 'ybtnnogxukfldurozqwa'
const MARQUE = '+secu-'
const SECTIONS = ['A', 'B', 'C', 'D', 'non-régression']

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
const urlPg = process.env.SUPABASE_DEV_DB_URL

const manquantes = []
if (!url) manquantes.push('SUPABASE_URL')
if (!cleAnon) manquantes.push('SUPABASE_KEY (ou SUPABASE_ANON_KEY)')
if (!cleService) manquantes.push('SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY)')
if (!motDePasse) manquantes.push('TEST_USERS_PASSWORD')
if (!emailBase) manquantes.push('TEST_USERS_EMAIL')
if (!urlPg) manquantes.push('SUPABASE_DEV_DB_URL')
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

function controlerCle(cle, roleAttendu, libelle) {
  const segments = cle.split('.')
  if (segments.length !== 3) return // clé `sb_…` : pas un JWT, l'URL suffit
  let payload
  try {
    payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'))
  } catch {
    fail(`la clé ${libelle} (JWT) est illisible ; impossible de vérifier le projet visé`)
  }
  if (payload?.ref !== DEV_REF) fail(`la clé ${libelle} ne correspond pas au projet de DEV (${DEV_REF}) ; arrêt.`)
  if (payload?.role !== roleAttendu) fail(`la clé ${libelle} n’a pas le rôle ${roleAttendu} ; arrêt.`)
}
controlerCle(cleService, 'service_role', 'service role')
controlerCle(cleAnon, 'anon', 'publique (anon)')

/** Garde de la chaîne Postgres : connexion directe du DEV, ou pooler avec l'utilisateur du DEV. */
function configPg(chaine) {
  let u
  try {
    u = new URL(chaine)
  } catch {
    fail('SUPABASE_DEV_DB_URL n’est pas une URL valide (valeur non affichée)')
  }
  const utilisateur = decodeURIComponent(u.username)
  const directe = u.hostname === `db.${DEV_REF}.supabase.co`
  const pooler = u.hostname.endsWith('.pooler.supabase.com') && utilisateur === `postgres.${DEV_REF}`
  if (!directe && !pooler) {
    fail(`SUPABASE_DEV_DB_URL ne désigne pas le projet de DEV (${DEV_REF}) ; arrêt.`)
  }
  return {
    host: u.hostname,
    port: Number(u.port) || 5432,
    user: utilisateur,
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')) || 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  }
}
const CONFIG_PG = configPg(urlPg)

// ── Adresses des comptes ────────────────────────────────────────────────────
const arobase = emailBase.lastIndexOf('@')
if (arobase < 1 || arobase === emailBase.length - 1) fail('TEST_USERS_EMAIL doit avoir la forme local@domaine')
if (/@example\.com$/i.test(emailBase)) fail('TEST_USERS_EMAIL ne doit pas être en @example.com')
const emailDe = (suffixe) => `${emailBase.slice(0, arobase)}+${suffixe}@${emailBase.slice(arobase + 1)}`

const OPTIONS = { auth: { autoRefreshToken: false, persistSession: false } }
const service = createClient(url, cleService, OPTIONS)

// ── Résultats ───────────────────────────────────────────────────────────────
const resultats = []
function noter(section, compte, verification, ok, detail = '') {
  resultats.push({ section, compte, verification, ok: Boolean(ok), detail })
}
function msg(error) {
  if (!error) return ''
  const texte = `${error.code ? `${error.code} · ` : ''}${error.message ?? 'erreur'}`
  return texte.length > 110 ? `${texte.slice(0, 107)}...` : texte
}
const avecErreur = (error) => (error ? `erreur : ${msg(error)}` : 'aucune erreur')
const erreurInattendue = (e) => (e instanceof Error ? e.message.slice(0, 160) : 'erreur inattendue')

// ── Jetables ────────────────────────────────────────────────────────────────
const jetables = [] // ids à nettoyer en `finally`
let compteur = 0

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

/** Compte jetable `+secu-` créé par l'API admin (e-mail confirmé : aucun envoi). */
async function creerJetable() {
  compteur += 1
  const { data, error } = await service.auth.admin.createUser({
    email: emailDe(`secu-${Date.now()}-${compteur}`),
    password: randomUUID(),
    email_confirm: true,
  })
  if (error || !data?.user) throw new Error(`création du compte jetable : ${msg(error)}`)
  jetables.push(data.user.id)
  return data.user.id
}

async function lireProfil(id) {
  const { data, error } = await service
    .from('profiles')
    .select('id, full_name, status')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`relecture profiles : ${msg(error)}`)
  return data
}

async function nettoyerRestes() {
  const erreurs = []
  const ids = new Set()
  for (const colonne of ['email', 'full_name']) {
    const { data, error } = await service.from('profiles').select('id').ilike(colonne, `%${MARQUE}%`)
    if (error) return [`profiles : ${msg(error)}`]
    for (const p of data ?? []) ids.add(p.id)
  }
  const liste = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (liste.error) erreurs.push(`auth.listUsers : ${msg(liste.error)}`)
  for (const u of liste.data?.users ?? []) {
    if ((u.email ?? '').includes(MARQUE)) ids.add(u.id)
  }
  for (const id of ids) erreurs.push(...(await supprimerJetable(id)))
  erreurs.push(...(await supprimerFormulairesJetables()))
  erreurs.push(...(await supprimerInscriptionsJetables()))
  return erreurs
}

/** Inscriptions (notes `+secu-…`) puis événements jetables (titre `+secu-…`). */
async function supprimerInscriptionsJetables() {
  const erreurs = []
  const regs = await service.from('registrations').delete().ilike('notes', `%${MARQUE}%`)
  if (regs.error) erreurs.push(`registrations : ${msg(regs.error)}`)
  const evts = await service.from('events').select('id').ilike('title', `%${MARQUE}%`)
  if (evts.error) return [...erreurs, `events : ${msg(evts.error)}`]
  for (const e of evts.data ?? []) {
    const r = await service.from('registrations').delete().eq('event_id', e.id)
    if (r.error) erreurs.push(`registrations (événement jetable) : ${msg(r.error)}`)
    const ev = await service.from('events').delete().eq('id', e.id)
    if (ev.error) erreurs.push(`events : ${msg(ev.error)}`)
  }
  return erreurs
}

/** Formulaires HelloAsso jetables (label `+secu-…`) et leurs paiements (RESTRICT sur form_id). */
async function supprimerFormulairesJetables() {
  const erreurs = []
  const { data, error } = await service.from('helloasso_forms').select('id').ilike('label', `%${MARQUE}%`)
  if (error) return [`helloasso_forms : ${msg(error)}`]
  for (const f of data ?? []) {
    const paiements = await service.from('profile_payments').delete().eq('form_id', f.id)
    if (paiements.error) erreurs.push(`profile_payments : ${msg(paiements.error)}`)
    const form = await service.from('helloasso_forms').delete().eq('id', f.id)
    if (form.error) erreurs.push(`helloasso_forms : ${msg(form.error)}`)
  }
  return erreurs
}

async function resteJetables() {
  const reste = []
  const formsRestants = await service.from('helloasso_forms').select('id').ilike('label', `%${MARQUE}%`)
  reste.push(...(formsRestants.data ?? []).map((f) => f.id))
  const regsRestantes = await service.from('registrations').select('id').ilike('notes', `%${MARQUE}%`)
  reste.push(...(regsRestantes.data ?? []).map((r) => r.id))
  const evtsRestants = await service.from('events').select('id').ilike('title', `%${MARQUE}%`)
  reste.push(...(evtsRestants.data ?? []).map((e) => e.id))
  for (const colonne of ['email', 'full_name']) {
    const { data } = await service.from('profiles').select('id').ilike(colonne, `%${MARQUE}%`)
    reste.push(...(data ?? []).map((p) => p.id))
  }
  const liste = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
  for (const u of liste.data?.users ?? []) if ((u.email ?? '').includes(MARQUE)) reste.push(u.id)
  return reste.length
}

// ── Comptes de test ─────────────────────────────────────────────────────────
async function ouvrirSessions() {
  const comptes = { anonyme: { nom: 'anonyme', client: createClient(url, cleAnon, OPTIONS) } }
  for (const [cle, nom] of [
    ['adherent', 'adhérent'],
    ['initiateur', 'initiateur'],
    ['secretaire', 'secrétaire'],
    ['admin', 'admin'],
  ]) {
    const client = createClient(url, cleAnon, OPTIONS)
    const { data, error } = await client.auth.signInWithPassword({ email: emailDe(cle), password: motDePasse })
    if (error || !data?.user) throw new Error(`connexion du compte ${nom} : ${msg(error)}`)
    comptes[cle] = { nom, client, id: data.user.id }
  }
  return comptes
}

// ── Référence : ensemble attendu des référents et moniteurs (service role) ──
async function ensembleAttendu() {
  const ids = new Set()
  const groupes = await service.from('groups').select('referent_id')
  if (groupes.error) throw new Error(`lecture groups : ${msg(groupes.error)}`)
  for (const g of groupes.data ?? []) if (g.referent_id) ids.add(g.referent_id)
  const moniteurs = await service.from('group_instructors').select('user_id')
  if (moniteurs.error) throw new Error(`lecture group_instructors : ${msg(moniteurs.error)}`)
  for (const m of moniteurs.data ?? []) if (m.user_id) ids.add(m.user_id)
  return ids
}

/** Compare un ensemble d'ids lus à l'ensemble attendu ; détail en comptes (jamais de noms). */
function comparer(lus, attendus) {
  const horsAttendu = [...lus].filter((id) => !attendus.has(id)).length
  const manquants = [...attendus].filter((id) => !lus.has(id)).length
  return { ok: horsAttendu === 0 && manquants === 0, detail: `${lus.size} lu(s) dont ${horsAttendu} hors référents/moniteurs ; ${manquants} manquant(s)` }
}

const REFUS_API = new Set(['42501', 'PGRST202', 'PGRST301'])
/** Refus d'un appel RPC : permission refusée ou fonction non exposée. */
const rpcRefuse = (res) =>
  Boolean(res.error) && (REFUS_API.has(res.error.code) || [401, 403, 404].includes(res.status))

// ═════════════════════════════════════════════════════════════════════════════
// [A] / [non-régression] — API : annuaire
// ═════════════════════════════════════════════════════════════════════════════
async function verifierAnnuaireApi(comptes, attendus) {
  noter('non-régression', 'données de test', 'au moins un référent ou moniteur dans le jeu de données', attendus.size > 0, `${attendus.size} attendu(s)`)

  for (const cle of ['anonyme', 'adherent']) {
    const c = comptes[cle]
    const lecture = await c.client.from('member_directory').select('id, full_name').range(0, 4999)
    if (lecture.error) {
      noter('A', c.nom, 'lecture de member_directory (id, full_name)', false, msg(lecture.error))
    } else {
      const lus = new Set((lecture.data ?? []).map((r) => r.id))
      const cmp = comparer(lus, attendus)
      noter('A', c.nom, 'member_directory = référents + moniteurs, rien d’autre', cmp.ok, cmp.detail)
      const colonnes = new Set((lecture.data ?? []).flatMap((r) => Object.keys(r)))
      noter('A', c.nom, 'colonnes lues limitées à id, full_name', [...colonnes].every((k) => k === 'id' || k === 'full_name'), `colonnes : ${[...colonnes].join(', ')}`)
    }
    const avatar = await c.client.from('member_directory').select('avatar_url').limit(1)
    noter('A', c.nom, 'select avatar_url refusé (colonne retirée)', Boolean(avatar.error), 'la colonne avatar_url répond encore')
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// [A] — API : écritures sur la vue refusées, profiles inchangé
// ═════════════════════════════════════════════════════════════════════════════
async function verifierEcrituresVue(comptes) {
  for (const cle of ['anonyme', 'adherent']) {
    const c = comptes[cle]

    // PATCH (UPDATE) sur le profil d'un compte jetable
    const idPatch = await creerJetable()
    const avantPatch = await lireProfil(idPatch)
    const marquePatch = `${MARQUE}patch-${Date.now()}`
    const patch = await c.client.from('member_directory').update({ full_name: marquePatch }).eq('id', idPatch).select('id')
    const apresPatch = await lireProfil(idPatch)
    const modifie = apresPatch?.full_name !== avantPatch?.full_name
    noter('A', c.nom, 'PATCH sur la vue refusé, profiles inchangé', !modifie && (Boolean(patch.error) || (patch.data ?? []).length === 0), modifie ? 'full_name modifié dans profiles' : `${(patch.data ?? []).length} ligne(s) ; ${avecErreur(patch.error)}`)

    // DELETE sur le profil d'un compte jetable
    const idDel = await creerJetable()
    const del = await c.client.from('member_directory').delete().eq('id', idDel).select('id')
    const apresDel = await lireProfil(idDel)
    noter('A', c.nom, 'DELETE sur la vue refusé, profil conservé', Boolean(apresDel), apresDel ? '' : 'profil supprimé via la vue')
    if (!apresDel) noter('A', c.nom, 'DELETE sur la vue : erreur renvoyée', Boolean(del.error), avecErreur(del.error))

    // POST (INSERT) d'un id marqué
    const idPost = randomUUID()
    jetables.push(idPost)
    const post = await c.client.from('member_directory').insert({ id: idPost, full_name: `${MARQUE}post-${Date.now()}` })
    const apresPost = await lireProfil(idPost)
    noter('A', c.nom, 'POST sur la vue refusé, aucun profil créé', !apresPost && Boolean(post.error), apresPost ? 'profil créé via la vue' : avecErreur(post.error))
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// [non-régression] — API : lectures staff / adhérent / initiateur
// ═════════════════════════════════════════════════════════════════════════════
async function compter(table) {
  const { count, error } = await service.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(`comptage ${table} : ${msg(error)}`)
  return count ?? 0
}

async function verifierLecturesStaff(comptes) {
  const totaux = {
    profiles: await compter('profiles'),
    user_roles: await compter('user_roles'),
    helloasso_forms: await compter('helloasso_forms'),
    profile_payments: await compter('profile_payments'),
  }
  for (const cle of ['admin', 'secretaire']) {
    const c = comptes[cle]
    for (const table of ['profiles', 'user_roles', 'helloasso_forms', 'profile_payments']) {
      const { count, error } = await c.client.from(table).select('*', { count: 'exact', head: true })
      noter('non-régression', c.nom, `lit ${table} en entier (policies is_admin_or_secretary / has_role)`, !error && count === totaux[table], error ? msg(error) : `${count} ligne(s) lue(s) sur ${totaux[table]}`)
    }
  }
  // Témoin négatif : un non-staff ne voit pas tout (les policies restent sélectives).
  const ini = comptes.initiateur
  const roles = await ini.client.from('user_roles').select('*', { count: 'exact', head: true })
  noter('non-régression', ini.nom, 'user_roles limité à ses propres lignes (témoin négatif)', !roles.error && (roles.count ?? 0) < totaux.user_roles, roles.error ? msg(roles.error) : `${roles.count} sur ${totaux.user_roles}`)
  if (totaux.helloasso_forms > 0) {
    const forms = await ini.client.from('helloasso_forms').select('*', { count: 'exact', head: true })
    noter('non-régression', ini.nom, 'helloasso_forms invisible pour un non-staff (témoin négatif)', !forms.error && forms.count === 0, forms.error ? msg(forms.error) : `${forms.count} ligne(s)`)
  }
  if (totaux.profile_payments > 0) {
    const paiements = await comptes.adherent.client.from('profile_payments').select('*', { count: 'exact', head: true })
    noter('non-régression', comptes.adherent.nom, 'profile_payments invisible pour un non-staff (témoin négatif)', !paiements.error && paiements.count === 0, paiements.error ? msg(paiements.error) : `${paiements.count} ligne(s)`)
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// [non-régression] — API : écritures protégées par has_role / is_admin_or_secretary
//   · helloasso_forms : écritures admin seul (has_role('admin')), refusées à la secrétaire ;
//   · profile_payments : écritures staff (is_admin_or_secretary), refusées à l'adhérent ;
//   · profiles.status : bureau seulement (policy + trigger profiles_block_status_change).
// Toutes les lignes écrites sont jetables (`+secu-`) et supprimées en fin de parcours.
// ═════════════════════════════════════════════════════════════════════════════
async function lireFormulaire(id) {
  const { data, error } = await service.from('helloasso_forms').select('id, label').eq('id', id).maybeSingle()
  if (error) throw new Error(`relecture helloasso_forms : ${msg(error)}`)
  return data
}

async function verifierEcrituresStaff(comptes) {
  const { admin, secretaire, adherent } = comptes
  const saison = '2026-2027'
  const nouveauFormulaire = (suffixe) => {
    const slug = `secu-${suffixe}-${Date.now()}`
    return { form_slug: slug, form_type: 'Membership', label: `${MARQUE}${slug}`, season: saison }
  }

  // helloasso_forms : INSERT admin accepté
  const insertAdmin = await admin.client.from('helloasso_forms').insert(nouveauFormulaire('admin')).select('id, label')
  const form = insertAdmin.data?.[0]
  noter('non-régression', admin.nom, 'INSERT helloasso_forms accepté (policy has_role(\'admin\'))', !insertAdmin.error && Boolean(form), insertAdmin.error ? msg(insertAdmin.error) : 'aucune ligne créée')
  if (!form) return

  // INSERT refusé à la secrétaire et à l'adhérent (RLS : erreur 42501, aucune ligne créée)
  for (const c of [secretaire, adherent]) {
    const refus = nouveauFormulaire(`refus-${c.nom === 'adhérent' ? 'adh' : 'sec'}`)
    const res = await c.client.from('helloasso_forms').insert(refus).select('id')
    const { data: cree } = await service.from('helloasso_forms').select('id').eq('form_slug', refus.form_slug)
    noter('non-régression', c.nom, 'INSERT helloasso_forms refusé (écritures admin seul)', Boolean(res.error) && (cree ?? []).length === 0, (cree ?? []).length ? 'ligne créée' : `aucune erreur renvoyée ; ${avecErreur(res.error)}`)
  }

  // UPDATE / DELETE refusés à la secrétaire (0 ligne touchée, ligne intacte)
  const marqueSecretaire = `${MARQUE}maj-secretaire-${Date.now()}`
  const majSecretaire = await secretaire.client.from('helloasso_forms').update({ label: marqueSecretaire }).eq('id', form.id).select('id')
  const apresMajSecretaire = await lireFormulaire(form.id)
  noter('non-régression', secretaire.nom, 'UPDATE helloasso_forms refusé (écritures admin seul)', apresMajSecretaire?.label === form.label && (Boolean(majSecretaire.error) || (majSecretaire.data ?? []).length === 0), apresMajSecretaire?.label === form.label ? `${(majSecretaire.data ?? []).length} ligne(s)` : 'label modifié par la secrétaire')
  const supprSecretaire = await secretaire.client.from('helloasso_forms').delete().eq('id', form.id).select('id')
  const apresSupprSecretaire = await lireFormulaire(form.id)
  noter('non-régression', secretaire.nom, 'DELETE helloasso_forms refusé (écritures admin seul)', Boolean(apresSupprSecretaire) && (Boolean(supprSecretaire.error) || (supprSecretaire.data ?? []).length === 0), apresSupprSecretaire ? `${(supprSecretaire.data ?? []).length} ligne(s)` : 'ligne supprimée par la secrétaire')

  // UPDATE accepté à l'admin
  const marqueAdmin = `${MARQUE}maj-admin-${Date.now()}`
  const majAdmin = await admin.client.from('helloasso_forms').update({ label: marqueAdmin }).eq('id', form.id).select('id')
  const apresMajAdmin = await lireFormulaire(form.id)
  noter('non-régression', admin.nom, 'UPDATE helloasso_forms accepté', !majAdmin.error && apresMajAdmin?.label === marqueAdmin, majAdmin.error ? msg(majAdmin.error) : `label = ${apresMajAdmin?.label ?? '(absent)'}`)

  // profile_payments : staff (secrétaire) écrit, adhérent refusé
  const profilId = await creerJetable()
  const paiement = { profile_id: profilId, form_id: form.id, amount: 0 }
  const insertAdherent = await adherent.client.from('profile_payments').insert(paiement).select('id')
  const { data: creeAdherent } = await service.from('profile_payments').select('id').eq('profile_id', profilId)
  noter('non-régression', adherent.nom, 'INSERT profile_payments refusé (staff seulement)', Boolean(insertAdherent.error) && (creeAdherent ?? []).length === 0, (creeAdherent ?? []).length ? 'ligne créée' : `aucune erreur renvoyée ; ${avecErreur(insertAdherent.error)}`)

  const insertSecretaire = await secretaire.client.from('profile_payments').insert(paiement).select('id')
  const idPaiement = insertSecretaire.data?.[0]?.id
  noter('non-régression', secretaire.nom, 'INSERT profile_payments accepté (policy is_admin_or_secretary)', !insertSecretaire.error && Boolean(idPaiement), insertSecretaire.error ? msg(insertSecretaire.error) : 'aucune ligne créée')
  if (idPaiement) {
    const majPaiement = await secretaire.client.from('profile_payments').update({ amount: 1 }).eq('id', idPaiement).select('id')
    noter('non-régression', secretaire.nom, 'UPDATE profile_payments accepté', !majPaiement.error && (majPaiement.data ?? []).length === 1, majPaiement.error ? msg(majPaiement.error) : `${(majPaiement.data ?? []).length} ligne(s)`)
    const supprAdherent = await adherent.client.from('profile_payments').delete().eq('id', idPaiement).select('id')
    const { data: encore } = await service.from('profile_payments').select('id').eq('id', idPaiement)
    noter('non-régression', adherent.nom, 'DELETE profile_payments refusé (staff seulement)', (encore ?? []).length === 1 && (Boolean(supprAdherent.error) || (supprAdherent.data ?? []).length === 0), (encore ?? []).length ? `${(supprAdherent.data ?? []).length} ligne(s)` : 'ligne supprimée par l’adhérent')
    const supprSecretairePaiement = await secretaire.client.from('profile_payments').delete().eq('id', idPaiement).select('id')
    const { data: reste } = await service.from('profile_payments').select('id').eq('id', idPaiement)
    noter('non-régression', secretaire.nom, 'DELETE profile_payments accepté', !supprSecretairePaiement.error && (reste ?? []).length === 0, supprSecretairePaiement.error ? msg(supprSecretairePaiement.error) : `${(reste ?? []).length} ligne(s) restante(s)`)
  }

  // profiles.status : le bureau modifie (policy profiles_update_staff + trigger qui appelle is_admin_or_secretary)
  const autreStatut = (s) => (s === 'Actif' ? 'Inactif' : 'Actif')
  for (const c of [secretaire, admin]) {
    const id = await creerJetable()
    const avant = await lireProfil(id)
    const cible = autreStatut(avant?.status)
    const res = await c.client.from('profiles').update({ status: cible }).eq('id', id).select('id')
    const apres = await lireProfil(id)
    noter('non-régression', c.nom, 'UPDATE profiles.status accepté (policy + trigger profiles_block_status)', !res.error && apres?.status === cible, res.error ? msg(res.error) : `status = ${apres?.status} (attendu ${cible})`)
  }
  const idAdh = await creerJetable()
  const avantAdh = await lireProfil(idAdh)
  const resAdh = await adherent.client.from('profiles').update({ status: autreStatut(avantAdh?.status) }).eq('id', idAdh).select('id')
  const apresAdh = await lireProfil(idAdh)
  noter('non-régression', adherent.nom, 'UPDATE profiles.status d’un tiers refusé', apresAdh?.status === avantAdh?.status && (Boolean(resAdh.error) || (resAdh.data ?? []).length === 0), `${(resAdh.data ?? []).length} ligne(s) ; status = ${apresAdh?.status}`)

  // DELETE helloasso_forms accepté à l'admin (le formulaire n'est plus référencé : paiement supprimé ci-dessus)
  const supprAdmin = await admin.client.from('helloasso_forms').delete().eq('id', form.id).select('id')
  const apresSupprAdmin = await lireFormulaire(form.id)
  noter('non-régression', admin.nom, 'DELETE helloasso_forms accepté', !supprAdmin.error && !apresSupprAdmin, supprAdmin.error ? msg(supprAdmin.error) : apresSupprAdmin ? 'ligne conservée' : '')
}

async function verifierLecturesAdherent(comptes) {
  const c = comptes.adherent
  const liens = await service.from('parent_access').select('child_id').eq('parent_id', c.id)
  if (liens.error) throw new Error(`lecture parent_access : ${msg(liens.error)}`)
  const attendus = new Set([c.id, ...(liens.data ?? []).map((l) => l.child_id)])
  const lecture = await c.client.from('profiles').select('id')
  if (lecture.error) {
    noter('non-régression', c.nom, 'profiles : soi et famille', false, msg(lecture.error))
    return
  }
  const lus = new Set((lecture.data ?? []).map((r) => r.id))
  const cmp = comparer(lus, attendus)
  noter('non-régression', c.nom, 'profiles : exactement soi et sa famille', cmp.ok, cmp.detail)
}

// ═════════════════════════════════════════════════════════════════════════════
// [B] — API : RPC refusés
// ═════════════════════════════════════════════════════════════════════════════
async function verifierRpc(comptes) {
  for (const cle of ['anonyme', 'adherent']) {
    const c = comptes[cle]
    for (const fonction of ['handle_new_user', 'enrich_profile_from_temps_user']) {
      const res = await c.client.rpc(fonction)
      noter('B', c.nom, `rpc/${fonction} refusé`, rpcRefuse(res), `status ${res.status} ; ${avecErreur(res.error)}`)
    }
  }
  // Les fonctions de rôle sont dans `private` (non exposé par l'API) : rpc refusé à tous les comptes,
  // y compris authenticated (les policies les appellent en interne, pas via l'API).
  for (const cle of ['anonyme', 'adherent', 'secretaire', 'admin']) {
    const c = comptes[cle]
    for (const [fonction, args] of [['is_admin_or_secretary', undefined], ['has_role', { _role: 'admin' }]]) {
      const res = await c.client.rpc(fonction, args)
      noter('B', c.nom, `rpc/${fonction} refusé`, rpcRefuse(res), `status ${res.status} ; ${avecErreur(res.error)}`)
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Catalogue (pg)
// ═════════════════════════════════════════════════════════════════════════════
const PRIVILEGES_INTERDITS = ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']

async function verifierCatalogue(db) {
  const q = async (sql, params = []) => (await db.query(sql, params)).rows

  // Schéma private
  const [{ present }] = await q(`select to_regnamespace('private') is not null as present`)
  noter('A', 'catalogue', 'schéma private présent', present, 'schéma private absent')

  // Vue : colonnes, modifiabilité, security_invoker
  const colonnes = (await q(
    `select attname from pg_attribute
       where attrelid = to_regclass('public.member_directory') and attnum > 0 and not attisdropped
       order by attnum`,
  )).map((r) => r.attname)
  noter('A', 'catalogue', 'colonnes de member_directory = id, full_name', colonnes.join(',') === 'id,full_name', `colonnes : ${colonnes.join(', ')}`)

  const [vue] = await q(
    `select is_updatable, is_insertable_into from information_schema.views
       where table_schema = 'public' and table_name = 'member_directory'`,
  )
  noter('A', 'catalogue', 'vue non modifiable (is_updatable = NO)', vue?.is_updatable === 'NO', `is_updatable = ${vue?.is_updatable}`)
  noter('A', 'catalogue', 'vue non insérable (is_insertable_into = NO)', vue?.is_insertable_into === 'NO', `is_insertable_into = ${vue?.is_insertable_into}`)

  const [opts] = await q(`select reloptions from pg_class where oid = to_regclass('public.member_directory')`)
  const invoker = (opts?.reloptions ?? []).some((o) => /^security_invoker=(true|on|1)$/i.test(o))
  noter('A', 'catalogue', 'vue en security_invoker = true', invoker, `reloptions = ${(opts?.reloptions ?? []).join(' ') || '(aucune)'}`)

  // Droits de la vue
  for (const role of ['anon', 'authenticated']) {
    const [{ sel }] = await q(`select has_table_privilege($1, 'public.member_directory', 'SELECT') as sel`, [role])
    noter('A', 'catalogue', `${role} a SELECT sur la vue`, sel, 'SELECT absent')
    const accordes = []
    for (const priv of PRIVILEGES_INTERDITS) {
      const [{ ok }] = await q(`select has_table_privilege($1, 'public.member_directory', $2) as ok`, [role, priv])
      if (ok) accordes.push(priv)
    }
    noter('A', 'catalogue', `${role} sans INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER sur la vue`, accordes.length === 0, `accordés : ${accordes.join(', ')}`)
  }
  const [{ n: publicVue }] = await q(
    `select count(*)::int as n from pg_class c,
       aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
      where c.oid = to_regclass('public.member_directory') and a.grantee = 0`,
  )
  noter('A', 'catalogue', 'aucun droit à PUBLIC sur la vue', publicVue === 0, `${publicVue} droit(s) PUBLIC`)

  // Fonction de l'annuaire (schéma private)
  const [fn] = await q(
    `select p.oid, p.prosecdef, p.provolatile, p.proconfig
       from pg_proc p where p.oid = to_regprocedure('private.member_directory_rows()')`,
  )
  noter('A', 'catalogue', 'fonction private.member_directory_rows() présente', Boolean(fn), 'fonction absente')
  if (fn) {
    noter('A', 'catalogue', 'member_directory_rows : SECURITY DEFINER, STABLE', fn.prosecdef && fn.provolatile === 's', `prosecdef=${fn.prosecdef} volatilité=${fn.provolatile}`)
    noter('A', 'catalogue', 'member_directory_rows : search_path = \'\'', (fn.proconfig ?? []).includes('search_path=""'), `proconfig = ${(fn.proconfig ?? []).join(' ') || '(vide)'}`)
    for (const role of ['anon', 'authenticated']) {
      const [{ ok }] = await q(`select has_function_privilege($1, $2::oid, 'EXECUTE') as ok`, [role, fn.oid])
      noter('A', 'catalogue', `${role} peut exécuter member_directory_rows`, ok, 'EXECUTE absent')
    }
    const [{ svc }] = await q(`select has_function_privilege('service_role', $1::oid, 'EXECUTE') as svc`, [fn.oid])
    noter('A', 'catalogue', 'service_role ne peut pas exécuter member_directory_rows', !svc, 'EXECUTE accordé à service_role')
    const [{ n }] = await q(
      `select count(*)::int as n from pg_proc p,
         aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
        where p.oid = $1::oid and a.grantee = 0`,
      [fn.oid],
    )
    noter('A', 'catalogue', 'member_directory_rows : rien à PUBLIC', n === 0, `${n} droit(s) PUBLIC`)
  }
  if (present) {
    for (const role of ['anon', 'authenticated']) {
      const [{ ok }] = await q(`select has_schema_privilege($1, 'private', 'USAGE') as ok`, [role])
      noter('A', 'catalogue', `${role} a USAGE sur le schéma private`, ok, 'USAGE absent')
    }
    const [{ n }] = await q(
      `select count(*)::int as n from pg_namespace s,
         aclexplode(coalesce(s.nspacl, acldefault('n', s.nspowner))) a
        where s.nspname = 'private' and a.grantee = 0`,
    )
    noter('A', 'catalogue', 'private : rien à PUBLIC', n === 0, `${n} droit(s) PUBLIC`)
  }

  // [B] — search_path de toutes les fonctions SECURITY DEFINER de public et private (lecture dynamique)
  const definer = await q(
    `select n.nspname, p.proname, p.proconfig
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public', 'private') and p.prosecdef
        and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      order by 1, 2`,
  )
  const sansChemin = definer.filter((f) => !(f.proconfig ?? []).includes('search_path=""'))
  noter('B', 'catalogue', `toutes les fonctions SECURITY DEFINER (public, private) ont search_path = '' (${definer.length} lue(s))`, definer.length > 0 && sansChemin.length === 0, `à corriger : ${sansChemin.map((f) => `${f.nspname}.${f.proname}`).join(', ')}`)

  // Fonctions nommées par la spec (signalées par function_search_path_mutable)
  const nommees = ['handle_updated_at', 'registrations_block_user_status_change', 'profiles_block_payment_change']
  const lues = await q(
    `select p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = any($1::text[])`,
    [nommees],
  )
  const nonFixees = nommees.filter((nom) => {
    const f = lues.find((l) => l.proname === nom)
    return !f || !(f.proconfig ?? []).includes('search_path=""')
  })
  noter('B', 'catalogue', 'handle_updated_at, registrations_block_user_status_change, profiles_block_payment_change : search_path = \'\'', nonFixees.length === 0, `à corriger : ${nonFixees.join(', ')}`)

  // Fonctions de trigger hors API
  for (const nom of ['handle_new_user', 'enrich_profile_from_temps_user']) {
    const [f] = await q(`select to_regprocedure($1)::oid as oid`, [`public.${nom}()`])
    if (!f?.oid) {
      noter('B', 'catalogue', `${nom} : EXECUTE retiré à PUBLIC, anon, authenticated`, false, 'fonction introuvable')
      continue
    }
    const accordes = []
    for (const role of ['anon', 'authenticated']) {
      const [{ ok }] = await q(`select has_function_privilege($1, to_regprocedure($2), 'EXECUTE') as ok`, [role, `public.${nom}()`])
      if (ok) accordes.push(role)
    }
    const [{ n }] = await q(
      `select count(*)::int as n from pg_proc p,
         aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
        where p.oid = to_regprocedure($1) and a.grantee = 0`,
      [`public.${nom}()`],
    )
    if (n > 0) accordes.push('PUBLIC')
    noter('B', 'catalogue', `${nom} : EXECUTE retiré à PUBLIC, anon, authenticated`, accordes.length === 0, `exécutable par : ${accordes.join(', ')}`)
  }

  // search_path = '' nominatif : fonctions de trigger / de verrou qui ne sont pas toutes SECURITY DEFINER
  // (la vérification générique ci-dessus ne les couvre pas).
  for (const nom of ['profiles_block_status_change', 'helloasso_acquire_token_lock']) {
    const lues2 = await q(
      `select p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = $1`,
      [nom],
    )
    const ok = lues2.length > 0 && lues2.every((f) => (f.proconfig ?? []).includes('search_path=""'))
    noter('B', 'catalogue', `${nom} : search_path = ''`, ok, lues2.length ? `proconfig = ${(lues2[0].proconfig ?? []).join(' ') || '(vide)'}` : 'fonction introuvable')
  }

  // is_admin_or_secretary / has_role : déplacées dans `private` (migration B)
  const authUsage = present ? (await q(`select has_schema_privilege('authenticated', 'private', 'USAGE') as ok`))[0].ok : false
  noter('B', 'catalogue', 'authenticated a USAGE sur le schéma private (policies)', authUsage, present ? 'USAGE absent' : 'schéma private absent')
  for (const [nom, signature] of [['is_admin_or_secretary', '()'], ['has_role', '(text)']]) {
    const [{ dansPublic, dansPrivate }] = await q(
      `select to_regprocedure($1) is not null as "dansPublic", to_regprocedure($2)::oid is not null as "dansPrivate"`,
      [`public.${nom}${signature}`, `private.${nom}${signature}`],
    )
    noter('B', 'catalogue', `${nom} : présente dans private`, dansPrivate, 'absente de private')
    noter('B', 'catalogue', `${nom} : absente de public`, !dansPublic, 'encore présente dans public (exposée par l’API)')

    const [f] = await q(`select to_regprocedure($1)::oid as oid`, [`private.${nom}${signature}`])
    if (!f?.oid) {
      for (const verif of ['authenticated peut exécuter', 'anon et PUBLIC sans EXECUTE']) {
        noter('B', 'catalogue', `private.${nom} : ${verif}`, false, 'fonction absente de private')
      }
      continue
    }
    const [{ auth, anon }] = await q(
      `select has_function_privilege('authenticated', $1::oid, 'EXECUTE') as auth,
              has_function_privilege('anon', $1::oid, 'EXECUTE') as anon`,
      [f.oid],
    )
    const [{ n }] = await q(
      `select count(*)::int as n from pg_proc p,
         aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
        where p.oid = $1::oid and a.grantee = 0`,
      [f.oid],
    )
    noter('B', 'catalogue', `private.${nom} : authenticated peut exécuter`, auth, 'EXECUTE absent')
    noter('B', 'catalogue', `private.${nom} : anon et PUBLIC sans EXECUTE`, !anon && n === 0, `exécutable par : ${[anon ? 'anon' : null, n > 0 ? 'PUBLIC' : null].filter(Boolean).join(', ')}`)
  }

  // Non-régression : les triggers existent et sont actifs
  const triggers = await q(
    `select tgname, tgenabled from pg_trigger
      where not tgisinternal and tgname in ('on_auth_user_created', 'on_profile_enrich', 'profiles_block_status')`,
  )
  for (const nom of ['on_auth_user_created', 'on_profile_enrich', 'profiles_block_status']) {
    const t = triggers.find((x) => x.tgname === nom)
    noter('non-régression', 'catalogue', `trigger ${nom} présent et actif`, Boolean(t) && t.tgenabled !== 'D', t ? `tgenabled = ${t.tgenabled}` : 'trigger absent')
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Q24 — jeton authenticated sans `sub`, en SQL, transactions ROLLBACK (pg)
// ═════════════════════════════════════════════════════════════════════════════
const CLAIMS_SANS_SUB = '{"role":"authenticated"}'

async function verifierQ24(db, attendus) {
  const cible = await creerJetable()

  // Tx1 : rôle authenticated + claims sans sub
  await db.query('BEGIN')
  try {
    await db.query('SET LOCAL ROLE authenticated')
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [CLAIMS_SANS_SUB])

    const { rows: [id] } = await db.query('select auth.uid() as uid, auth.role() as role')
    noter('non-régression', 'Q24 Tx1', 'auth.uid() NULL et auth.role() = authenticated', id.uid === null && id.role === 'authenticated', `uid=${id.uid} role=${id.role}`)

    // Les policies qui appellent is_admin_or_secretary / has_role évaluent à faux : aucune ligne visible.
    for (const table of ['profiles', 'user_roles']) {
      const { rows: [{ n }] } = await db.query(`select count(*)::int as n from public.${table}`)
      noter('non-régression', 'Q24 Tx1', `${table} : 0 ligne visible (RLS, sans sub)`, n === 0, `${n} ligne(s)`)
    }

    const maj = await db.query(`update public.profiles set status = 'Inactif' where id = $1`, [cible])
    noter('non-régression', 'Q24 Tx1', 'UPDATE profiles.status : 0 ligne touchée (RLS)', maj.rowCount === 0, `${maj.rowCount} ligne(s)`)

    const { rows } = await db.query('select id from public.member_directory')
    const cmp = comparer(new Set(rows.map((r) => r.id)), attendus)
    noter('A', 'Q24 Tx1', 'member_directory (authenticated sans sub) = référents + moniteurs exactement', cmp.ok, cmp.detail)
  } catch (e) {
    noter('non-régression', 'Q24 Tx1', 'exécution', false, erreurInattendue(e))
  } finally {
    await db.query('ROLLBACK')
  }

  // Tx2 : rôle postgres (RLS contournée), mêmes claims sans sub -> le trigger lui-même doit refuser
  await db.query('BEGIN')
  try {
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [CLAIMS_SANS_SUB])
    let refus = null
    let lignes = null
    try {
      const maj = await db.query(`update public.profiles set status = 'Inactif' where id = $1`, [cible])
      lignes = maj.rowCount
    } catch (e) {
      refus = e instanceof Error ? e.message : String(e)
    }
    noter('non-régression', 'Q24 Tx2', 'trigger profiles_block_status refuse le changement de status (authenticated sans sub)', refus !== null && /bureau|service/i.test(refus), refus === null ? `UPDATE accepté (${lignes} ligne)` : `autre erreur : ${refus.slice(0, 100)}`)
  } finally {
    await db.query('ROLLBACK')
  }
  const apres = await lireProfil(cible)
  noter('non-régression', 'Q24', 'aucun effet persistant (ROLLBACK)', apres?.status !== 'Inactif', `status = ${apres?.status}`)
}

// ═════════════════════════════════════════════════════════════════════════════
// [non-régression] — handle_new_user intact : compte jetable -> profil créé
// ═════════════════════════════════════════════════════════════════════════════
async function verifierNouveauCompte() {
  const C = 'handle_new_user'
  const id = await creerJetable()
  const p = await lireProfil(id)
  noter('non-régression', C, 'compte jetable créé par l’API admin -> profil créé par le trigger', Boolean(p))
  const erreurs = await supprimerJetable(id)
  const reste = await lireProfil(id)
  noter('non-régression', C, 'compte jetable supprimé', erreurs.length === 0 && !reste, erreurs.join(' ; '))
  if (!reste) jetables.splice(jetables.indexOf(id), 1)
}

// ═════════════════════════════════════════════════════════════════════════════
// [C] — trigger registrations_block_user_status_change (migration C)
//   La service role doit pouvoir écrire `registrations` (exemption en tête de trigger,
//   avant l'appel à private.is_admin_or_secretary()) ; l'adhérent reste bloqué.
//   Lignes jetables : un événement `+secu-` et des inscriptions dont les notes portent `+secu-`.
// ═════════════════════════════════════════════════════════════════════════════
async function lireInscription(id) {
  const { data, error } = await service.from('registrations').select('id, status, admin_note').eq('id', id).maybeSingle()
  if (error) throw new Error(`relecture registrations : ${msg(error)}`)
  return data
}

async function verifierRegistrations(comptes) {
  const { adherent, secretaire } = comptes
  // Unicité (user_id, event_id) : un événement jetable par inscription.
  const nouvelleInscription = async () => {
    compteur += 1
    const evenement = await service
      .from('events')
      .insert({ title: `${MARQUE}event-${Date.now()}-${compteur}`, starts_at: new Date(Date.now() + 30 * 86400000).toISOString() })
      .select('id')
      .maybeSingle()
    if (evenement.error || !evenement.data) throw new Error(`création de l’événement jetable : ${msg(evenement.error)}`)
    const { data, error } = await service
      .from('registrations')
      .insert({ user_id: adherent.id, event_id: evenement.data.id, notes: `${MARQUE}reg-${Date.now()}-${compteur}` })
      .select('id')
      .maybeSingle()
    if (error || !data) throw new Error(`création de l’inscription jetable : ${msg(error)}`)
    return data.id
  }

  // service_role : changement de statut accepté (rouge tant que le trigger exige private.is_admin_or_secretary())
  const idService = await nouvelleInscription()
  const majService = await service.from('registrations').update({ status: 'confirmed' }).eq('id', idService).select('id')
  const apresService = await lireInscription(idService)
  noter('C', 'service_role', 'UPDATE registrations.status accepté (pending -> confirmed)', !majService.error && apresService?.status === 'confirmed', majService.error ? msg(majService.error) : `status = ${apresService?.status}`)
  const majNote = await service.from('registrations').update({ admin_note: `${MARQUE}note` }).eq('id', idService).select('id')
  const apresNote = await lireInscription(idService)
  noter('C', 'service_role', 'UPDATE registrations.admin_note accepté', !majNote.error && apresNote?.admin_note === `${MARQUE}note`, majNote.error ? msg(majNote.error) : `admin_note = ${apresNote?.admin_note}`)

  // adhérent : changement vers autre chose que cancelled toujours refusé (non-régression)
  const idAdh = await nouvelleInscription()
  const majAdh = await adherent.client.from('registrations').update({ status: 'confirmed' }).eq('id', idAdh).select('id')
  const apresAdh = await lireInscription(idAdh)
  noter('C', adherent.nom, 'UPDATE registrations.status -> confirmed refusé, statut inchangé', Boolean(majAdh.error) && apresAdh?.status === 'pending', `${avecErreur(majAdh.error)} ; status = ${apresAdh?.status}`)
  const noteAdh = await adherent.client.from('registrations').update({ admin_note: `${MARQUE}x` }).eq('id', idAdh).select('id')
  const apresNoteAdh = await lireInscription(idAdh)
  noter('C', adherent.nom, 'UPDATE registrations.admin_note refusé, valeur inchangée', Boolean(noteAdh.error) && apresNoteAdh?.admin_note === null, `${avecErreur(noteAdh.error)} ; admin_note = ${apresNoteAdh?.admin_note}`)
  const annul = await adherent.client.from('registrations').update({ status: 'cancelled' }).eq('id', idAdh).select('id')
  const apresAnnul = await lireInscription(idAdh)
  noter('C', adherent.nom, 'UPDATE registrations.status -> cancelled toujours accepté', !annul.error && apresAnnul?.status === 'cancelled', annul.error ? msg(annul.error) : `status = ${apresAnnul?.status}`)

  // secrétaire : le bureau valide toujours
  const idSec = await nouvelleInscription()
  const majSec = await secretaire.client.from('registrations').update({ status: 'confirmed' }).eq('id', idSec).select('id')
  const apresSec = await lireInscription(idSec)
  noter('C', secretaire.nom, 'UPDATE registrations.status -> confirmed accepté (is_admin_or_secretary)', !majSec.error && apresSec?.status === 'confirmed', majSec.error ? msg(majSec.error) : `status = ${apresSec?.status}`)

  // remise en état : inscriptions puis événement jetables
  const erreurs = await supprimerInscriptionsJetables()
  noter('C', 'service_role', 'inscriptions et événement jetables supprimés', erreurs.length === 0, erreurs.join(' ; '))
}

// ═════════════════════════════════════════════════════════════════════════════
// [D] — droits explicites de helloasso_tokens / helloasso_sync_runs (migration D)
//
// Droits retenus pour service_role : ce que server/ utilise réellement.
//   · helloasso_tokens : SELECT (readRow), UPDATE (writeAsHolder, invalidate) et, via la RPC
//     helloasso_acquire_token_lock (SECURITY INVOKER, donc exécutée AVEC les droits de
//     service_role) : INSERT … ON CONFLICT DO UPDATE ⇒ SELECT + INSERT + UPDATE. Pas de DELETE.
//   · helloasso_sync_runs : aucune écriture dans server/ aujourd'hui ; la synchronisation
//     l'alimentera (ligne `running`, puis fin de passage) ⇒ SELECT + INSERT + UPDATE. Pas de DELETE.
//   · jamais TRUNCATE, REFERENCES, TRIGGER.
// authenticated : SELECT seul sur helloasso_sync_runs (RLS : staff), rien sur helloasso_tokens ;
// anon : rien.
// ═════════════════════════════════════════════════════════════════════════════
const FICHIER_D = 'supabase/migrations/20261105_helloasso_grants_explicites.sql'
const TOUS_DROITS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']
const DROITS_ATTENDUS = {
  helloasso_tokens: { service_role: ['SELECT', 'INSERT', 'UPDATE'], authenticated: [], anon: [] },
  helloasso_sync_runs: { service_role: ['SELECT', 'INSERT', 'UPDATE'], authenticated: ['SELECT'], anon: [] },
}
const libelleDroits = (liste) => (liste.length ? liste.join(', ') : 'aucun')

/** Droits effectifs d'un rôle sur une table (table ou colonne ; PUBLIC et héritage compris). */
async function droitsDe(db, role, table) {
  const { rows } = await db.query(
    `select p as priv,
            has_table_privilege($1, $2, p)
            or case when p in ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
                    then has_any_column_privilege($1, $2, p) else false end as ok
       from unnest($3::text[]) as p`,
    [role, `public.${table}`, TOUS_DROITS],
  )
  return TOUS_DROITS.filter((p) => rows.find((r) => r.priv === p)?.ok)
}

function ecartDroits(obtenus, attendus) {
  const enTrop = obtenus.filter((p) => !attendus.includes(p))
  const manquants = attendus.filter((p) => !obtenus.includes(p))
  return { ok: enTrop.length === 0 && manquants.length === 0, detail: `en trop : ${libelleDroits(enTrop)} ; manquant(s) : ${libelleDroits(manquants)}` }
}

async function verifierGrantsCatalogue(db) {
  for (const [table, parRole] of Object.entries(DROITS_ATTENDUS)) {
    for (const [role, attendus] of Object.entries(parRole)) {
      const obtenus = await droitsDe(db, role, table)
      if (role === 'service_role') {
        const interdits = obtenus.filter((p) => ['TRUNCATE', 'REFERENCES', 'TRIGGER'].includes(p))
        noter('D', 'catalogue', `${table} : service_role sans TRUNCATE, REFERENCES, TRIGGER`, interdits.length === 0, `accordés : ${libelleDroits(interdits)}`)
      }
      const cmp = ecartDroits(obtenus, attendus)
      noter('D', 'catalogue', `${table} : ${role} = ${libelleDroits(attendus)} (strict nécessaire)`, cmp.ok, cmp.detail)
    }
  }
}

/** Exécute une requête dans un SAVEPOINT : un refus n'abandonne pas la transaction. */
async function essayer(db, sql, params = []) {
  await db.query('SAVEPOINT essai')
  try {
    const res = await db.query(sql, params)
    await db.query('RELEASE SAVEPOINT essai')
    return { ok: true, res }
  } catch (e) {
    await db.query('ROLLBACK TO SAVEPOINT essai')
    return { ok: false, code: e?.code, message: erreurInattendue(e) }
  }
}
const refusDroit = (r) => !r.ok && r.code === '42501'

async function verifierRepetitionProd(db) {
  const C = 'répétition prod (ROLLBACK)'
  let corps
  try {
    corps = fs.readFileSync(new URL(`../${FICHIER_D}`, import.meta.url), 'utf8')
  } catch {
    noter('D', C, 'fichier de la migration D présent', false, `${FICHIER_D} absent : la migration D n’est pas encore écrite`)
    return
  }
  // Le script gère sa propre transaction (toujours annulée) : on retire BEGIN / COMMIT du fichier.
  corps = corps.replace(/^[ \t]*(BEGIN|COMMIT)[ \t]*;[ \t]*$/gim, '')

  const avant = {}
  for (const table of Object.keys(DROITS_ATTENDUS)) avant[table] = (await droitsDe(db, 'service_role', table)).join(',')

  await db.query('BEGIN')
  try {
    // Environnement jetable : un environnement sans ligne ; à défaut la ligne est supprimée dans la
    // transaction (annulée ensuite).
    const { rows: pris } = await db.query('select environment from public.helloasso_tokens')
    let env = ['production', 'sandbox'].find((e) => !pris.some((r) => r.environment === e))
    if (!env) {
      env = 'sandbox'
      await db.query('delete from public.helloasso_tokens where environment = $1', [env])
    }

    // Conditions de la prod : aucune table n'a de droit au départ.
    await db.query('REVOKE ALL ON TABLE public.helloasso_tokens, public.helloasso_sync_runs FROM anon, authenticated, service_role')
    for (const table of Object.keys(DROITS_ATTENDUS)) {
      const reste = []
      for (const role of ['anon', 'authenticated', 'service_role']) {
        const d = await droitsDe(db, role, table)
        if (d.length) reste.push(`${role} : ${d.join(', ')}`)
      }
      noter('D', C, `${table} : départ sans aucun droit (conditions de la prod)`, reste.length === 0, reste.join(' ; '))
    }

    try {
      await db.query(corps)
    } catch (e) {
      noter('D', C, 'corps du fichier D exécuté sans erreur', false, erreurInattendue(e))
      return
    }
    noter('D', C, 'corps du fichier D exécuté sans erreur', true)

    for (const [table, parRole] of Object.entries(DROITS_ATTENDUS)) {
      for (const [role, attendus] of Object.entries(parRole)) {
        const cmp = ecartDroits(await droitsDe(db, role, table), attendus)
        noter('D', C, `${table} : ${role} = ${libelleDroits(attendus)} après le fichier D`, cmp.ok, cmp.detail)
      }
    }

    // ── service_role : verrou et écritures de server/ ────────────────────────
    await db.query('SET LOCAL ROLE service_role')
    const holder = randomUUID()
    const lock1 = await essayer(db, 'select public.helloasso_acquire_token_lock($1, $2::uuid, 5) as ok', [env, holder])
    noter('D', C, 'service_role : helloasso_acquire_token_lock obtient le verrou (environnement jetable)', lock1.ok && lock1.res.rows[0].ok === true, lock1.ok ? `retour = ${lock1.res.rows[0].ok}` : lock1.message)
    const lock2 = await essayer(db, 'select public.helloasso_acquire_token_lock($1, $2::uuid, 5) as ok', [env, randomUUID()])
    noter('D', C, 'service_role : second détenteur refusé tant que le verrou est valide (false)', lock2.ok && lock2.res.rows[0].ok === false, lock2.ok ? `retour = ${lock2.res.rows[0].ok}` : lock2.message)
    const lecture = await essayer(db, 'select environment, lock_holder from public.helloasso_tokens where environment = $1', [env])
    noter('D', C, 'service_role : SELECT helloasso_tokens', lecture.ok && lecture.res.rowCount === 1, lecture.ok ? `${lecture.res.rowCount} ligne(s)` : lecture.message)
    const maj = await essayer(db, `update public.helloasso_tokens set lock_holder = null, lock_until = null, updated_at = now() where environment = $1 and lock_holder = $2::uuid`, [env, holder])
    noter('D', C, 'service_role : UPDATE helloasso_tokens conditionné au détenteur (libération)', maj.ok && maj.res.rowCount === 1, maj.ok ? `${maj.res.rowCount} ligne(s)` : maj.message)
    const suppr = await essayer(db, 'delete from public.helloasso_tokens where environment = $1', [env])
    noter('D', C, 'service_role : DELETE helloasso_tokens refusé', refusDroit(suppr), suppr.ok ? 'DELETE accepté' : `${suppr.code} · ${suppr.message}`)
    const tronque = await essayer(db, 'truncate table public.helloasso_tokens')
    noter('D', C, 'service_role : TRUNCATE helloasso_tokens refusé', refusDroit(tronque), tronque.ok ? 'TRUNCATE accepté' : `${tronque.code} · ${tronque.message}`)

    const run = await essayer(db, `insert into public.helloasso_sync_runs (scope, trigger_source, environment) values ('${MARQUE}run', 'manual', $1) returning id`, [env])
    noter('D', C, 'service_role : INSERT helloasso_sync_runs', run.ok, run.ok ? '' : run.message)
    if (run.ok) {
      const id = run.res.rows[0].id
      const fin = await essayer(db, `update public.helloasso_sync_runs set status = 'success', finished_at = now() where id = $1 returning id`, [id])
      noter('D', C, 'service_role : UPDATE helloasso_sync_runs (fin de passage)', fin.ok && fin.res.rowCount === 1, fin.ok ? '' : fin.message)
      const lu = await essayer(db, 'select id from public.helloasso_sync_runs where id = $1', [id])
      noter('D', C, 'service_role : SELECT helloasso_sync_runs', lu.ok && lu.res.rowCount === 1, lu.ok ? '' : lu.message)
    }
    const supprRun = await essayer(db, 'delete from public.helloasso_sync_runs')
    noter('D', C, 'service_role : DELETE helloasso_sync_runs refusé', refusDroit(supprRun), supprRun.ok ? 'DELETE accepté' : `${supprRun.code} · ${supprRun.message}`)

    // ── authenticated et anon ────────────────────────────────────────────────
    await db.query('RESET ROLE')
    await db.query('SET LOCAL ROLE authenticated')
    const authTokens = await essayer(db, 'select 1 from public.helloasso_tokens limit 1')
    noter('D', C, 'authenticated : SELECT helloasso_tokens refusé (42501)', refusDroit(authTokens), authTokens.ok ? 'lecture acceptée' : `${authTokens.code} · ${authTokens.message}`)
    const authRuns = await essayer(db, 'select 1 from public.helloasso_sync_runs limit 1')
    noter('D', C, 'authenticated : SELECT helloasso_sync_runs permis (RLS filtre)', authRuns.ok, authRuns.ok ? '' : authRuns.message)
    const authIns = await essayer(db, `insert into public.helloasso_sync_runs (scope, trigger_source, environment) values ('${MARQUE}run', 'manual', 'sandbox')`)
    noter('D', C, 'authenticated : INSERT helloasso_sync_runs refusé (42501)', refusDroit(authIns), authIns.ok ? 'INSERT accepté' : `${authIns.code} · ${authIns.message}`)
    await db.query('RESET ROLE')
    await db.query('SET LOCAL ROLE anon')
    for (const table of Object.keys(DROITS_ATTENDUS)) {
      const anonLu = await essayer(db, `select 1 from public.${table} limit 1`)
      noter('D', C, `anon : SELECT ${table} refusé (42501)`, refusDroit(anonLu), anonLu.ok ? 'lecture acceptée' : `${anonLu.code} · ${anonLu.message}`)
    }
    await db.query('RESET ROLE')
  } catch (e) {
    noter('D', C, 'exécution de la répétition', false, erreurInattendue(e))
  } finally {
    await db.query('ROLLBACK')
  }

  // Aucun effet persistant : les droits de service_role sont ceux d'avant la répétition.
  const ecarts = []
  for (const table of Object.keys(DROITS_ATTENDUS)) {
    const apres = (await droitsDe(db, 'service_role', table)).join(',')
    if (apres !== avant[table]) ecarts.push(`${table} : ${avant[table]} -> ${apres}`)
  }
  noter('D', C, 'transaction annulée : droits inchangés après la répétition', ecarts.length === 0, ecarts.join(' ; '))
}

// ── Exécution ───────────────────────────────────────────────────────────────
const db = new pg.Client(CONFIG_PG)
let connecte = false
try {
  const restes = await nettoyerRestes()
  if (restes.length) throw new Error(`nettoyage initial : ${restes.join(' ; ')}`)

  try {
    await db.connect()
    connecte = true
  } catch (e) {
    // Message du serveur seulement (erreur SQLSTATE) ; jamais l'URL ni le mot de passe.
    const serveur = e?.code && /^[0-9A-Z]{5}$/.test(e.code) ? ` : ${String(e.message).slice(0, 80)}` : ''
    throw new Error(`connexion Postgres impossible (${e?.code ?? 'erreur'}${serveur})`)
  }

  const comptes = await ouvrirSessions()
  const attendus = await ensembleAttendu()

  const etapes = [
    ['annuaire (API)', () => verifierAnnuaireApi(comptes, attendus)],
    ['écritures sur la vue (API)', () => verifierEcrituresVue(comptes)],
    ['lectures staff (API)', () => verifierLecturesStaff(comptes)],
    ['lectures adhérent (API)', () => verifierLecturesAdherent(comptes)],
    ['écritures staff (API)', () => verifierEcrituresStaff(comptes)],
    ['RPC (API)', () => verifierRpc(comptes)],
    ['registrations (API)', () => verifierRegistrations(comptes)],
    ['catalogue (SQL)', () => verifierCatalogue(db)],
    ['droits HelloAsso (SQL)', () => verifierGrantsCatalogue(db)],
    ['répétition prod HelloAsso (SQL)', () => verifierRepetitionProd(db)],
    ['Q24 (SQL)', () => verifierQ24(db, attendus)],
    ['handle_new_user', () => verifierNouveauCompte()],
  ]
  for (const [nom, executer] of etapes) {
    try {
      await executer()
    } catch (e) {
      noter('non-régression', 'script', `exécution : ${nom}`, false, erreurInattendue(e))
    }
  }
} catch (e) {
  noter('non-régression', 'script', 'préparation', false, erreurInattendue(e))
} finally {
  try {
    if (connecte) await db.end()
  } catch {
    // connexion déjà fermée
  }
  try {
    const erreurs = []
    for (const id of [...jetables]) erreurs.push(...(await supprimerJetable(id)))
    erreurs.push(...(await nettoyerRestes()))
    const reste = await resteJetables()
    noter('non-régression', 'service_role', `données remises en l’état, aucun reste ${MARQUE}`, erreurs.length === 0 && reste === 0, [...erreurs, reste ? `${reste} reste(s)` : ''].filter(Boolean).join(' ; '))
  } catch (e) {
    noter('non-régression', 'service_role', `données remises en l’état, aucun reste ${MARQUE}`, false, erreurInattendue(e))
  }
}

// ── Tableau final, par section ──────────────────────────────────────────────
console.log(`\nsécurité BDD — vérifications base de DEV (${DEV_REF})`)
for (const section of SECTIONS) {
  const lignes = resultats.filter((r) => r.section === section)
  const echecs = lignes.filter((r) => !r.ok).length
  console.log(`\n[${section}] ${lignes.length - echecs} OK · ${echecs} ÉCHEC`)
  for (const r of lignes) {
    console.log(`  ${r.ok ? 'OK    ' : 'ÉCHEC '} | ${r.compte} | ${r.verification}${!r.ok && r.detail ? ` | ${r.detail}` : ''}`)
  }
}
const echecs = resultats.filter((r) => !r.ok).length
console.log(`\nTotal : ${resultats.length - echecs} OK · ${echecs} ÉCHEC`)
process.exit(echecs ? 1 : 0)
