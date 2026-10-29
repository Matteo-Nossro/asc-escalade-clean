#!/usr/bin/env node
/**
 * Crée (ou vérifie) les 4 comptes de test du projet Supabase de DEV :
 * admin, secrétaire, initiateur, adhérent (rôle `parent`).
 *
 * Le trigger `on_auth_user_created` crée le profil. Les rôles (`user_roles`)
 * et les données fictives sont posés ensuite par `supabase/seed.sql`, qui
 * retrouve chaque compte via `auth.users.raw_app_meta_data->>'test_role'`.
 *
 * Variables (lues dans l'environnement, sinon dans `.env` ; une variable déjà
 * définie n'est jamais écrasée) :
 *   SUPABASE_URL           URL du projet (doit être celui de DEV)
 *   SUPABASE_SECRET_KEY    clé service role (replis : SUPABASE_SERVICE_ROLE_KEY,
 *                          puis SUPABASE_SERVICE_KEY)
 *   TEST_USERS_PASSWORD    mot de passe commun aux 4 comptes
 *   TEST_USERS_EMAIL       adresse de base `local@domaine` ; les comptes sont
 *                          `local+admin@domaine`, `local+secretaire@domaine`,
 *                          `local+initiateur@domaine`, `local+adherent@domaine`
 *
 * Sécurité : refus avant tout appel réseau si l'URL ou la clé ne désigne pas
 * le projet de DEV. La clé et le mot de passe ne sont jamais affichés.
 *
 * Usage :
 *   node scripts/seed-test-users.mjs           création idempotente
 *   node scripts/seed-test-users.mjs --check   lecture seule : id, profil, rôles
 *                                              (code de sortie 1 si incomplet)
 */
import { createClient } from '@supabase/supabase-js'

const DEV_REF = 'ybtnnogxukfldurozqwa'

// suffixe d'e-mail · nom fictif · test_role (= code du rôle attendu dans user_roles)
const COMPTES = [
  { suffixe: 'admin', fullName: 'Alice Admin-Test', testRole: 'admin' },
  { suffixe: 'secretaire', fullName: 'Sacha Secrétaire-Test', testRole: 'secretary' },
  { suffixe: 'initiateur', fullName: 'Ivan Initiateur-Test', testRole: 'initiateur' },
  { suffixe: 'adherent', fullName: 'Paula Adhérent-Test', testRole: 'parent' },
]

function fail(message) {
  console.error(`Erreur : ${message}`)
  process.exit(1)
}

// ── Arguments ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const inconnus = args.filter((a) => a !== '--check')
if (inconnus.length) fail(`argument inconnu : ${inconnus.join(' ')} (seul --check est accepté)`)
const modeCheck = args.includes('--check')

// ── Environnement ───────────────────────────────────────────────────────────
try {
  process.loadEnvFile('.env') // ne surcharge pas les variables déjà définies
} catch {
  // pas de .env : on se contente de l'environnement
}

const url = process.env.SUPABASE_URL
const cle =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY
const motDePasse = process.env.TEST_USERS_PASSWORD
const emailBase = process.env.TEST_USERS_EMAIL

const manquantes = []
if (!url) manquantes.push('SUPABASE_URL')
if (!cle) manquantes.push('SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY)')
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

const segments = cle.split('.')
if (segments.length === 3) {
  // Clé JWT : on contrôle ref + role. Une clé `sb_secret_…` n'en a pas (URL seule).
  let payload
  try {
    payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'))
  } catch {
    fail('la clé service role (JWT) est illisible ; impossible de vérifier le projet visé')
  }
  if (payload?.ref !== DEV_REF) {
    fail(`la clé service role ne correspond pas au projet de DEV (${DEV_REF}) ; arrêt.`)
  }
  if (payload?.role !== 'service_role') {
    fail('la clé fournie n’a pas le rôle service_role ; arrêt.')
  }
}

// ── Adresses des 4 comptes ──────────────────────────────────────────────────
const arobase = emailBase.lastIndexOf('@')
if (arobase < 1 || arobase === emailBase.length - 1) {
  fail('TEST_USERS_EMAIL doit avoir la forme local@domaine')
}
const local = emailBase.slice(0, arobase)
const domaine = emailBase.slice(arobase + 1)
const comptes = COMPTES.map((c) => ({ ...c, email: `${local}+${c.suffixe}@${domaine}` }))

const supabase = createClient(url, cle, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Tous les utilisateurs Auth, indexés par e-mail en minuscules (pagination complète). */
async function chargerUtilisateurs() {
  const parEmail = new Map()
  const perPage = 1000
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) fail(`listUsers : ${error.message}`)
    for (const u of data.users) {
      if (u.email) parEmail.set(u.email.toLowerCase(), u)
    }
    if (data.users.length < perPage) break
  }
  return parEmail
}

async function creer() {
  const existants = await chargerUtilisateurs()
  let enErreur = false

  for (const c of comptes) {
    const deja = existants.get(c.email.toLowerCase())
    if (deja) {
      console.log(`${c.email} · déjà existant · ${deja.id}`)
      continue
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email: c.email,
      password: motDePasse,
      email_confirm: true,
      user_metadata: { full_name: c.fullName },
      app_metadata: { test_role: c.testRole },
    })
    if (error) {
      console.error(`${c.email} · erreur de création : ${error.message}`)
      enErreur = true
      continue
    }
    console.log(`${c.email} · créé · ${data.user.id}`)
  }
  if (enErreur) process.exit(1)
}

async function verifier() {
  const existants = await chargerUtilisateurs()
  let incomplet = false

  for (const c of comptes) {
    const user = existants.get(c.email.toLowerCase())
    if (!user) {
      console.log(`${c.email} · introuvable`)
      incomplet = true
      continue
    }

    const { data: profil, error: errProfil } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (errProfil) fail(`lecture de profiles : ${errProfil.message}`)

    const { data: roles, error: errRoles } = await supabase
      .from('user_roles')
      .select('role_code')
      .eq('user_id', user.id)
    if (errRoles) fail(`lecture de user_roles : ${errRoles.message}`)

    const codes = (roles ?? []).map((r) => r.role_code)
    console.log(
      `${c.email} · ${user.id} · profil: ${profil ? 'oui' : 'non'} · rôles: ${codes.length ? codes.join(', ') : '(aucun)'}`,
    )
    if (!profil || !codes.includes(c.testRole)) incomplet = true
  }
  if (incomplet) process.exit(1)
}

try {
  await (modeCheck ? verifier() : creer())
} catch (e) {
  // Uniquement le message : jamais l'objet d'erreur ni la configuration.
  fail(e instanceof Error ? e.message : 'erreur inattendue')
}
