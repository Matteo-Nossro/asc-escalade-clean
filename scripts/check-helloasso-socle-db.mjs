#!/usr/bin/env node
/**
 * T1b — vérifie, sur le projet Supabase de DEV et avec les VRAIS comptes de test,
 * la migration `supabase/migrations/20261025_helloasso_socle.sql` :
 * accès (RLS + droits) aux tables `helloasso_tokens`, `helloasso_forms`,
 * `helloasso_sync_runs`, à la RPC `helloasso_acquire_token_lock`, et contraintes
 * de `helloasso_forms` (saison, doublon, event_id, type).
 *
 * Variables (lues dans l'environnement, sinon dans `.env` ; une variable déjà
 * définie n'est jamais écrasée) :
 *   SUPABASE_URL           URL du projet (doit être celui de DEV)
 *   SUPABASE_KEY           clé publique (anon) : sessions des comptes et client anonyme
 *                          (repli : SUPABASE_ANON_KEY)
 *   SUPABASE_SECRET_KEY    clé service role : préparer, relire et nettoyer
 *                          (replis : SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY)
 *   TEST_USERS_EMAIL       adresse de base `local@domaine` ; comptes `local+admin@domaine`,
 *                          `+secretaire`, `+initiateur`, `+adherent`
 *   TEST_USERS_PASSWORD    mot de passe commun aux 4 comptes
 *   SUPABASE_DEV_DB_URL    chaîne Postgres du DEV (nettoyage des tables sans DELETE service_role)
 *
 * Une écriture « refusée » est constatée sur l'état réel : erreur renvoyée OU
 * 0 ligne touchée, dans les deux cas confirmé par une relecture via le service role.
 *
 * Les lignes de test sont repérées par le préfixe `t1b-check-` (slug, scope ou
 * client_id) ; elles sont supprimées au démarrage (restes éventuels) puis dans
 * un `finally`. Aucune ligne réelle n'est modifiée : pour `helloasso_tokens`, on
 * n'utilise qu'un environnement sans ligne, sinon arrêt.
 *
 * Depuis la migration D (20261105), `service_role` n'a plus DELETE sur
 * `helloasso_tokens` ni `helloasso_sync_runs` : leurs lignes de test (préfixe
 * `t1b-check-` uniquement) sont supprimées par une connexion `pg`
 * (SUPABASE_DEV_DB_URL), qui n'est pas soumise à ces droits.
 *
 * Sécurité : refus avant tout appel réseau si l'URL ou une clé JWT ne désigne pas
 * le projet de DEV. Clés, mot de passe et jetons ne sont jamais affichés
 * (seulement code et message d'erreur).
 *
 * Usage : node scripts/check-helloasso-socle-db.mjs
 * Code de sortie : 0 si tout est OK, 1 s'il y a au moins un ÉCHEC.
 */
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const DEV_REF = 'ybtnnogxukfldurozqwa'
const PREFIXE = 't1b-check-'

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
if (arobase < 1 || arobase === emailBase.length - 1) {
  fail('TEST_USERS_EMAIL doit avoir la forme local@domaine')
}
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

// ── Suppression par pg (tables sans DELETE pour service_role) ───────────────
// Lignes de test uniquement : le motif doit commencer par le préfixe.
const CIBLES_PG = { helloasso_sync_runs: 'scope', helloasso_tokens: 'client_id' }
async function supprimerPg(table, motif) {
  const colonne = CIBLES_PG[table]
  if (!colonne || !motif.startsWith(PREFIXE)) throw new Error('suppression pg hors périmètre de test')
  const db = new pg.Client(CONFIG_PG)
  await db.connect()
  try {
    await db.query(`delete from public.${table} where ${colonne} like $1`, [motif])
  } finally {
    await db.end()
  }
}

// ── Nettoyage ───────────────────────────────────────────────────────────────
async function nettoyer() {
  const erreurs = []
  const forms = await service.from('helloasso_forms').delete().like('form_slug', `${PREFIXE}%`)
  if (forms.error) erreurs.push(`helloasso_forms : ${msg(forms.error)}`)
  for (const table of Object.keys(CIBLES_PG)) {
    try {
      await supprimerPg(table, `${PREFIXE}%`)
    } catch (e) {
      erreurs.push(`${table} : ${e instanceof Error ? e.message : 'erreur pg'}`)
    }
  }
  return erreurs
}

// ── Aides de lecture (service role) ─────────────────────────────────────────
async function lire(table, colonnes, filtre) {
  let requete = service.from(table).select(colonnes)
  requete = filtre(requete)
  const { data, error } = await requete
  if (error) throw new Error(`relecture ${table} : ${msg(error)}`)
  return data ?? []
}

async function insererService(table, ligne) {
  return service.from(table).insert(ligne).select('id').maybeSingle()
}

function formulaire(slug, extra = {}) {
  return {
    form_slug: `${PREFIXE}${slug}`,
    form_type: 'Membership',
    label: 'T1b test',
    season: '2026-2027',
    ...extra,
  }
}

// ── Comptes : un client par compte + un client anonyme ──────────────────────
async function ouvrirSessions() {
  const comptes = [{ nom: 'anonyme', cle: 'anonyme', staff: false, admin: false, client: createClient(url, cleAnon, OPTIONS) }]
  const defs = [
    { nom: 'adhérent', cle: 'adherent', suffixe: 'adherent', staff: false, admin: false },
    { nom: 'initiateur', cle: 'initiateur', suffixe: 'initiateur', staff: false, admin: false },
    { nom: 'secrétaire', cle: 'secretaire', suffixe: 'secretaire', staff: true, admin: false },
    { nom: 'admin', cle: 'admin', suffixe: 'admin', staff: true, admin: true },
  ]
  for (const d of defs) {
    const client = createClient(url, cleAnon, OPTIONS)
    const { error } = await client.auth.signInWithPassword({
      email: emailDe(d.suffixe),
      password: motDePasse,
    })
    if (error) throw new Error(`connexion du compte ${d.nom} : ${msg(error)}`)
    comptes.push({ ...d, client })
  }
  return comptes // ordre : du moins privilégié à l'admin (admin en dernier)
}

// ── helloasso_tokens ────────────────────────────────────────────────────────
async function verifierTokens(comptes) {
  const T = 'helloasso_tokens'
  const existants = await lire(T, 'environment', (q) => q)
  const pris = new Set(existants.map((r) => r.environment))
  const env = ['production', 'sandbox'].find((e) => !pris.has(e))
  if (!env) {
    throw new Error(
      'helloasso_tokens contient déjà les deux environnements : aucune ligne de test possible sans toucher aux vraies données',
    )
  }

  // Insertion par chaque compte, avant que la ligne de test n'existe.
  for (const c of comptes) {
    const marque = `${PREFIXE}ins-${c.cle}`
    const { error } = await c.client.from(T).insert({ environment: env, client_id: marque }).select()
    const lignes = await lire(T, 'environment', (q) => q.eq('client_id', marque))
    noter(c.nom, 'helloasso_tokens : insert refusé', lignes.length === 0, avecErreur(error))
    if (lignes.length) await supprimerPg(T, marque)
  }

  // Ligne de test (service role) pour lecture / update / delete / RPC.
  const ligne = `${PREFIXE}row`
  const { error: errSeed } = await service.from(T).insert({ environment: env, client_id: ligne })
  if (errSeed) throw new Error(`préparation ${T} : ${msg(errSeed)}`)

  for (const c of comptes) {
    // lecture
    const lu = await c.client.from(T).select('environment, client_id').eq('environment', env)
    noter(c.nom, 'helloasso_tokens : lecture refusée', (lu.data ?? []).length === 0, avecErreur(lu.error))

    // update
    const maj = await c.client.from(T).update({ client_id: `${PREFIXE}hack` }).eq('environment', env).select()
    const apresMaj = await lire(T, 'client_id', (q) => q.eq('environment', env))
    noter(
      c.nom,
      'helloasso_tokens : update refusé',
      apresMaj.length === 1 && apresMaj[0].client_id === ligne,
      avecErreur(maj.error),
    )
    if (apresMaj[0]?.client_id !== ligne) {
      await service.from(T).update({ client_id: ligne }).eq('environment', env)
    }

    // delete
    const sup = await c.client.from(T).delete().eq('environment', env).select()
    const apresSup = await lire(T, 'environment', (q) => q.eq('environment', env))
    noter(c.nom, 'helloasso_tokens : delete refusé', apresSup.length === 1, avecErreur(sup.error))
    if (apresSup.length === 0) {
      await service.from(T).insert({ environment: env, client_id: ligne })
    }

    // RPC verrou
    const rpc = await c.client.rpc('helloasso_acquire_token_lock', {
      p_environment: env,
      p_holder: randomUUID(),
      p_ttl_seconds: 5,
    })
    const apresRpc = await lire(T, 'lock_holder', (q) => q.eq('environment', env))
    const verrouIntact = apresRpc.length === 1 && apresRpc[0].lock_holder === null
    noter(
      c.nom,
      'RPC helloasso_acquire_token_lock refusée',
      Boolean(rpc.error) && verrouIntact,
      rpc.error ? `erreur : ${msg(rpc.error)}${verrouIntact ? '' : ' (verrou modifié)'}` : 'appel accepté',
    )
    if (!verrouIntact) {
      await service.from(T).update({ lock_holder: null, lock_until: null }).eq('environment', env)
    }
  }

  // Contrôle positif : le service role accède bien à la table et à la RPC.
  const luService = await lire(T, 'environment', (q) => q.eq('environment', env))
  noter('service_role', 'helloasso_tokens : lecture possible', luService.length === 1)
  const holder = randomUUID()
  const r1 = await service.rpc('helloasso_acquire_token_lock', { p_environment: env, p_holder: holder, p_ttl_seconds: 5 })
  const r2 = await service.rpc('helloasso_acquire_token_lock', { p_environment: env, p_holder: randomUUID(), p_ttl_seconds: 5 })
  noter('service_role', 'RPC verrou : 1er appel obtient le verrou', !r1.error && r1.data === true, avecErreur(r1.error))
  noter('service_role', 'RPC verrou : 2e appel concurrent refusé', !r2.error && r2.data === false, avecErreur(r2.error))
  const verrou = await lire(T, 'lock_holder', (q) => q.eq('environment', env))
  noter('service_role', 'RPC verrou : porteur conservé', verrou[0]?.lock_holder === holder)
}

// ── helloasso_forms ─────────────────────────────────────────────────────────
async function verifierForms(comptes) {
  const T = 'helloasso_forms'
  const { data: a, error: errA } = await insererService(T, formulaire('a', { label: 'T1b A' }))
  const { data: b, error: errB } = await insererService(T, formulaire('b', { label: 'T1b B' }))
  if (errA || errB || !a || !b) throw new Error(`préparation ${T} : ${msg(errA ?? errB)}`)

  // lecture : staff (secrétaire, admin) oui ; les autres rien
  for (const c of comptes) {
    const lu = await c.client.from(T).select('id').like('form_slug', `${PREFIXE}%`)
    const vus = (lu.data ?? []).length
    noter(
      c.nom,
      c.staff ? 'helloasso_forms : lecture autorisée' : 'helloasso_forms : lecture refusée',
      c.staff ? !lu.error && vus >= 2 : vus === 0,
      c.staff ? `${vus} ligne(s) vue(s)` : avecErreur(lu.error),
    )
  }

  // insertion : admin seul
  for (const c of comptes) {
    const slug = `${PREFIXE}ins-${c.cle}`
    const { error } = await c.client
      .from(T)
      .insert({ form_slug: slug, form_type: 'Membership', label: 'T1b ins', season: '2026-2027' })
      .select('id')
    const presentes = await lire(T, 'id', (q) => q.eq('form_slug', slug))
    const existe = presentes.length > 0
    noter(
      c.nom,
      c.admin ? 'helloasso_forms : insert autorisé' : 'helloasso_forms : insert refusé',
      c.admin ? existe && !error : !existe,
      avecErreur(error),
    )
  }

  // modification : admin seul (admin en dernier, donc les refus voient l'état d'origine)
  for (const c of comptes) {
    const nouveau = `T1b modif ${c.cle}`
    const { error } = await c.client.from(T).update({ label: nouveau }).eq('id', a.id).select('id')
    const apres = await lire(T, 'label', (q) => q.eq('id', a.id))
    const label = apres[0]?.label
    noter(
      c.nom,
      c.admin ? 'helloasso_forms : update autorisé' : 'helloasso_forms : update refusé',
      c.admin ? label === nouveau : label === 'T1b A',
      avecErreur(error),
    )
  }

  // suppression : admin seul (la ligne B ne disparaît qu'avec l'admin, en dernier)
  for (const c of comptes) {
    const { error } = await c.client.from(T).delete().eq('id', b.id).select('id')
    const apres = await lire(T, 'id', (q) => q.eq('id', b.id))
    const existe = apres.length > 0
    noter(
      c.nom,
      c.admin ? 'helloasso_forms : delete autorisé' : 'helloasso_forms : delete refusé',
      c.admin ? !existe : existe,
      avecErreur(error),
    )
  }
}

// ── helloasso_sync_runs ─────────────────────────────────────────────────────
async function verifierSyncRuns(comptes) {
  const T = 'helloasso_sync_runs'
  const scope = `${PREFIXE}run`
  const { data: run, error: errSeed } = await insererService(T, {
    scope,
    trigger_source: 'manual',
    environment: 'sandbox',
  })
  if (errSeed || !run) throw new Error(`préparation ${T} : ${msg(errSeed)}`)

  for (const c of comptes) {
    // lecture : staff oui, les autres non
    const lu = await c.client.from(T).select('id').like('scope', `${PREFIXE}%`)
    const vus = (lu.data ?? []).length
    noter(
      c.nom,
      c.staff ? 'helloasso_sync_runs : lecture autorisée' : 'helloasso_sync_runs : lecture refusée',
      c.staff ? !lu.error && vus >= 1 : vus === 0,
      c.staff ? `${vus} ligne(s) vue(s)` : avecErreur(lu.error),
    )

    // insert : refusé pour tous
    const marque = `${PREFIXE}ins-${c.cle}`
    const ins = await c.client
      .from(T)
      .insert({ scope: marque, trigger_source: 'manual', environment: 'sandbox' })
      .select('id')
    const inserees = await lire(T, 'id', (q) => q.eq('scope', marque))
    noter(c.nom, 'helloasso_sync_runs : insert refusé', inserees.length === 0, avecErreur(ins.error))

    // update : refusé pour tous
    const maj = await c.client.from(T).update({ status: 'error' }).eq('id', run.id).select('id')
    const apresMaj = await lire(T, 'status', (q) => q.eq('id', run.id))
    noter(c.nom, 'helloasso_sync_runs : update refusé', apresMaj[0]?.status === 'running', avecErreur(maj.error))

    // delete : refusé pour tous
    const sup = await c.client.from(T).delete().eq('id', run.id).select('id')
    const apresSup = await lire(T, 'id', (q) => q.eq('id', run.id))
    noter(c.nom, 'helloasso_sync_runs : delete refusé', apresSup.length === 1, avecErreur(sup.error))
    if (apresSup.length === 0) {
      await service.from(T).insert({ id: run.id, scope, trigger_source: 'manual', environment: 'sandbox' })
    }
  }
}

// ── Contraintes de helloasso_forms (service role) ───────────────────────────
async function verifierContraintes() {
  const T = 'helloasso_forms'
  const C = 'service_role'
  const existe = async (slug) => (await lire(T, 'id', (q) => q.eq('form_slug', `${PREFIXE}${slug}`))).length > 0

  // Saison : format AAAA-AAAA, années consécutives
  const saisons = [
    ['2026-2028', false],
    ['26-27', false],
    ['abcd-efgh', false],
    ['2027-2026', false],
    ['2026-2027', true],
  ]
  for (const [saison, accepte] of saisons) {
    const slug = `season-${saison}`
    const { error } = await insererService(T, formulaire(slug, { season: saison }))
    const present = await existe(slug)
    const ok = accepte ? !error && present : error?.code === '23514' && !present
    noter(C, `saison '${saison}' ${accepte ? 'accepté' : 'refusé (CHECK)'}`, ok, avecErreur(error))
  }

  // Saison obligatoire
  const sansSaison = await insererService(T, {
    form_slug: `${PREFIXE}sans-saison`,
    form_type: 'Membership',
    label: 'T1b',
  })
  noter(C, 'saison absente refusée (NOT NULL)', sansSaison.error?.code === '23502' && !(await existe('sans-saison')), avecErreur(sansSaison.error))

  // Type de formulaire
  const typeInvalide = await insererService(T, formulaire('type-invalide', { form_type: 'Autre' }))
  noter(C, "form_type 'Autre' refusé (CHECK)", typeInvalide.error?.code === '23514' && !(await existe('type-invalide')), avecErreur(typeInvalide.error))

  // Doublon (form_type, form_slug)
  const d1 = await insererService(T, formulaire('doublon'))
  const d2 = await insererService(T, formulaire('doublon'))
  const nb = (await lire(T, 'id', (q) => q.eq('form_slug', `${PREFIXE}doublon`))).length
  noter(C, 'doublon (form_type, form_slug) : 1er insert accepté', !d1.error, avecErreur(d1.error))
  noter(C, 'doublon (form_type, form_slug) refusé (UNIQUE)', d2.error?.code === '23505' && nb === 1, avecErreur(d2.error))

  // event_id : interdit sur Membership, accepté sur Event
  const evenements = await lire('events', 'id', (q) => q.limit(1))
  const eventId = evenements[0]?.id
  if (!eventId) {
    noter(C, 'event_id : événement existant requis', false, 'aucune ligne dans events (lancer le seed)')
  } else {
    const m = await insererService(T, formulaire('event-membership', { event_id: eventId }))
    noter(C, 'event_id sur Membership refusé (CHECK)', m.error?.code === '23514' && !(await existe('event-membership')), avecErreur(m.error))
    const e = await insererService(T, formulaire('event-event', { form_type: 'Event', event_id: eventId }))
    noter(C, 'event_id sur Event accepté', !e.error && (await existe('event-event')), avecErreur(e.error))
  }
}

// ── Exécution ───────────────────────────────────────────────────────────────
const etapes = []
try {
  const restes = await nettoyer()
  if (restes.length) throw new Error(`nettoyage initial : ${restes.join(' ; ')}`)

  const comptes = await ouvrirSessions()
  etapes.push(
    ['helloasso_tokens', () => verifierTokens(comptes)],
    ['helloasso_forms', () => verifierForms(comptes)],
    ['helloasso_sync_runs', () => verifierSyncRuns(comptes)],
    ['contraintes', () => verifierContraintes()],
  )
  for (const [nom, executer] of etapes) {
    try {
      await executer()
    } catch (e) {
      noter('script', `exécution : ${nom}`, false, e instanceof Error ? e.message : 'erreur inattendue')
    }
  }
} catch (e) {
  noter('script', 'préparation', false, e instanceof Error ? e.message : 'erreur inattendue')
} finally {
  try {
    const erreurs = await nettoyer()
    noter('service_role', 'nettoyage des lignes de test', erreurs.length === 0, erreurs.join(' ; '))
  } catch (e) {
    noter('service_role', 'nettoyage des lignes de test', false, e instanceof Error ? e.message : 'erreur inattendue')
  }
}

// ── Tableau final ───────────────────────────────────────────────────────────
const lignes = resultats.map((r) => [r.ok ? 'OK' : 'ÉCHEC', r.compte, r.verification, r.ok ? '' : r.detail])
const largeurs = [6, 0, 0].map((_, i) => Math.max(...lignes.map((l) => l[i].length)))
largeurs[2] = Math.max(...lignes.map((l) => l[2].length))
console.log(`\nHelloAsso socle — vérifications base de DEV (${DEV_REF})\n`)
for (const [statut, compte, verification, detail] of lignes) {
  console.log(
    `${statut.padEnd(largeurs[0])} | ${compte.padEnd(largeurs[1])} | ${verification.padEnd(largeurs[2])}${detail ? ` | ${detail}` : ''}`,
  )
}
const echecs = resultats.filter((r) => !r.ok).length
console.log(`\n${resultats.length - echecs} OK · ${echecs} ÉCHEC`)
process.exit(echecs ? 1 : 0)
