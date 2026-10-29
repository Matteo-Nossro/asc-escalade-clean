#!/usr/bin/env node
/**
 * P0 helloasso-socle : vérifie l'association de test HelloAsso **sandbox**.
 *
 * Étapes, chacune une seule fois :
 *   1. token client_credentials sur /oauth2/token (puis /oauth2 seulement si 404) ;
 *   2. refresh (grant_type=refresh_token) avec le refresh_token obtenu ;
 *   3. GET /v5/organizations/<slug>/formTypes (AccessPublicData) ;
 *   4. GET /v5/organizations/<slug>/items?pageSize=1 (AccessTransactions).
 *
 * Affiche uniquement : URL appelées (sans query secrète), codes HTTP, noms des
 * en-têtes de réponse et STRUCTURE des corps (clés + types, jamais de valeur).
 * Seule exception : les éléments de formTypes, affichés s'ils font partie de
 * l'enum documenté (CrowdFunding, Membership…), sinon masqués.
 *
 * Variables (environnement, sinon `.env`) : NUXT_HELLOASSO_ENVIRONMENT (doit
 * valoir `sandbox`), NUXT_HELLOASSO_CLIENT_ID, NUXT_HELLOASSO_CLIENT_SECRET,
 * NUXT_HELLOASSO_ORG_SLUG ; repli sur les mêmes noms sans `NUXT_`.
 *
 * Usage : node scripts/helloasso-sandbox-check.mjs
 */

const SANDBOX = 'https://api.helloasso-sandbox.com'
const FORM_TYPES = new Set(['CrowdFunding', 'Membership', 'Event', 'Donation', 'PaymentForm', 'Checkout', 'Shop'])

function fail(message) {
  console.error(`Erreur : ${message}`)
  process.exit(1)
}

try {
  process.loadEnvFile('.env')
} catch {
  // pas de .env : on se contente de l'environnement
}

/** Valeur de NUXT_HELLOASSO_<nom>, sinon HELLOASSO_<nom> ; renvoie aussi le nom lu. */
function lire(nom) {
  for (const cle of [`NUXT_HELLOASSO_${nom}`, `HELLOASSO_${nom}`]) {
    if (process.env[cle]) return { cle, valeur: process.env[cle] }
  }
  return { cle: null, valeur: '' }
}

const env = { environment: lire('ENVIRONMENT'), clientId: lire('CLIENT_ID'), clientSecret: lire('CLIENT_SECRET'), orgSlug: lire('ORG_SLUG') }
const manquantes = Object.entries(env).filter(([, v]) => !v.valeur).map(([k]) => k)
if (manquantes.length) fail(`variable(s) manquante(s) : ${manquantes.join(', ')} (NUXT_HELLOASSO_* ou HELLOASSO_*)`)
console.log(`Variables lues : ${Object.values(env).map((v) => v.cle).join(', ')}`)
if (env.environment.valeur !== 'sandbox') fail('l’environnement doit valoir « sandbox » ; arrêt avant tout appel.')

const slug = encodeURIComponent(env.orgSlug.valeur)

/** Structure d'une valeur JSON : clés et types, jamais de valeur. */
function structure(v, profondeur = 0) {
  if (v === null) return 'null'
  if (Array.isArray(v)) {
    if (!v.length) return 'array (vide)'
    return { [`array[${v.length}] de`]: structure(v[0], profondeur + 1) }
  }
  if (typeof v === 'object') {
    if (profondeur > 6) return 'object (…)'
    const out = {}
    for (const [k, val] of Object.entries(v)) {
      // une clé qui ne ressemble pas à un identifiant pourrait être une donnée
      const nom = /^[A-Za-z_][A-Za-z0-9_]{0,40}$/.test(k) ? k : '<clé masquée>'
      out[nom] = structure(val, profondeur + 1)
    }
    return out
  }
  return typeof v
}

async function appeler(etape, url, init = {}) {
  let res
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) })
  } catch (e) {
    console.log(`\n[${etape}] ${init.method || 'GET'} ${url} → erreur réseau (${e?.name || 'inconnue'})`)
    return { status: 0, body: null }
  }
  const texte = await res.text()
  let body = null
  try {
    body = texte ? JSON.parse(texte) : null
  } catch {
    body = undefined
  }
  console.log(`\n[${etape}] ${init.method || 'GET'} ${url} → HTTP ${res.status}`)
  console.log(`  en-têtes : ${[...res.headers.keys()].sort().join(', ')}`)
  if (body === undefined) console.log(`  corps : non JSON (${texte.length} caractères)`)
  else console.log(`  corps : ${JSON.stringify(structure(body), null, 2).replace(/\n/g, '\n  ')}`)
  return { status: res.status, body }
}

function formulaire(params) {
  return { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params).toString() }
}

// 1. client_credentials
const credentials = { grant_type: 'client_credentials', client_id: env.clientId.valeur, client_secret: env.clientSecret.valeur }
let tokenUrl = `${SANDBOX}/oauth2/token`
let auth = await appeler('1 token', tokenUrl, formulaire(credentials))
if (auth.status === 404) {
  tokenUrl = `${SANDBOX}/oauth2`
  auth = await appeler('1 token (repli)', tokenUrl, formulaire(credentials))
}
if (auth.status !== 200 || !auth.body?.access_token) fail('pas de jeton : arrêt (aucun autre appel).')
console.log(`  → URL du token validée : ${tokenUrl}`)

// 2. refresh
let accessToken = auth.body.access_token
if (auth.body.refresh_token) {
  const refresh = await appeler('2 refresh', tokenUrl, formulaire({ grant_type: 'refresh_token', refresh_token: auth.body.refresh_token }))
  if (refresh.status === 200 && refresh.body?.access_token) accessToken = refresh.body.access_token
  else console.log('  → refresh refusé : la suite utilise le jeton client_credentials')
} else {
  console.log('\n[2 refresh] ignoré : pas de refresh_token dans la réponse')
}

const bearer = { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }

// 3. formTypes
const ft = await appeler('3 formTypes', `${SANDBOX}/v5/organizations/${slug}/formTypes`, bearer)
if (Array.isArray(ft.body)) {
  const vus = ft.body.map((t) => (FORM_TYPES.has(t) ? t : '<hors enum, masqué>'))
  console.log(`  valeurs (enum documenté uniquement) : ${vus.join(', ') || '(aucune)'}`)
}

// 4. items?pageSize=1
const items = await appeler('4 items', `${SANDBOX}/v5/organizations/${slug}/items?pageSize=1`, bearer)
console.log(`  → AccessTransactions : ${items.status === 200 ? 'présent' : items.status === 403 ? 'ABSENT (403)' : `indéterminé (HTTP ${items.status})`}`)
