// Client HelloAsso unique (serveur). Seul module autorisé à parler à HelloAsso : URL, jeton OAuth2,
// verrou de renouvellement, gestion des erreurs. Les routes passent par `useHelloAsso(event)`.
//
// Jeton : une ligne par environnement dans `helloasso_tokens` (table sans accès client, service role
// uniquement). Le renouvellement passe par la RPC `helloasso_acquire_token_lock` : au plus un appel
// d'auth par renouvellement, toutes instances confondues.
// Journaux : code et statut seulement, jamais de jeton ni de secret.
import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseServiceRole } from '#supabase/server'

// --- Types ---------------------------------------------------------------------------------------

export type HelloAssoEnvironment = 'sandbox' | 'production'

export interface HelloAssoConfig {
  clientId: string
  clientSecret: string
  orgSlug: string
  environment: HelloAssoEnvironment
  apiUrl: string
  tokenUrl: string
  webhookSecret: string
}

export type HelloAssoErrorCode =
  | 'config_missing'
  | 'auth_failed'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'lock_timeout'
  | 'http_error'
  | 'network'

export type HelloAssoQuery = Record<string, string | number | boolean | null | undefined>

export interface HelloAssoClient {
  config: HelloAssoConfig
  getAccessToken: () => Promise<string>
  get: <T = any>(path: string, query?: HelloAssoQuery) => Promise<T>
  post: <T = any>(path: string, body?: unknown) => Promise<T>
}

type SupabaseLike = Pick<SupabaseClient<any, any, any>, 'from' | 'rpc'>

export interface HelloAssoClientOptions {
  config: HelloAssoConfig
  supabase: SupabaseLike
  /** Horloge injectable (millisecondes ou Date). Défaut : l'horloge système. */
  now?: () => number | Date
  /** Attente injectable (relecture du jeton quand le verrou est pris). */
  sleep?: (ms: number) => Promise<void>
}

// --- Constantes ----------------------------------------------------------------------------------

const DEFAULT_URLS: Record<HelloAssoEnvironment, { apiUrl: string, tokenUrl: string }> = {
  production: {
    apiUrl: 'https://api.helloasso.com/v5',
    tokenUrl: 'https://api.helloasso.com/oauth2/token',
  },
  sandbox: {
    apiUrl: 'https://api.helloasso-sandbox.com/v5',
    tokenUrl: 'https://api.helloasso-sandbox.com/oauth2/token',
  },
}

const ENVIRONMENTS = Object.keys(DEFAULT_URLS) as HelloAssoEnvironment[]
const REQUIRED_KEYS = ['clientId', 'clientSecret', 'orgSlug', 'environment'] as const

const RENEW_MARGIN_MS = 5 * 60_000 // renouveler si l'expiration tombe dans les 5 min
const REFRESH_LIFETIME_MS = 29 * 24 * 3600_000 // le refresh_token vit 30 jours (doc) : marge d'un jour
const DEFAULT_EXPIRES_IN_S = 1799
const LOCK_TTL_SECONDS = 20
const LOCK_WAIT_ATTEMPTS = 20
const LOCK_WAIT_MS = 500
const LOCK_TIMEOUT_RETRY_AFTER_S = 5
const REQUEST_TIMEOUT_MS = 15_000

// --- Erreurs -------------------------------------------------------------------------------------

export class HelloAssoError extends Error {
  code: HelloAssoErrorCode
  status?: number
  retryAfter?: number

  constructor(code: HelloAssoErrorCode, message: string, extra: { status?: number, retryAfter?: number } = {}) {
    super(message)
    this.name = 'HelloAssoError'
    this.code = code
    this.status = extra.status
    this.retryAfter = extra.retryAfter
  }
}

/** Crée l'erreur et journalise son code et son statut (jamais de jeton ni de secret). */
function fail(code: HelloAssoErrorCode, message: string, extra: { status?: number, retryAfter?: number } = {}) {
  console.warn(`[helloasso] ${code}${extra.status ? ` status=${extra.status}` : ''}`)
  return new HelloAssoError(code, message, extra)
}

const MESSAGES = {
  network: 'HelloAsso est injoignable (erreur réseau ou délai dépassé).',
  rateLimited: 'Limite d\'appels HelloAsso atteinte : réessayez plus tard.',
  forbidden: 'Accès refusé par HelloAsso (403) : droits insuffisants pour cette ressource.',
  unauthorized: 'HelloAsso refuse le jeton d\'accès, même après renouvellement.',
  authFailed: 'Authentification HelloAsso refusée : vérifiez le client ID et le client secret.',
  refreshFailed: 'HelloAsso a refusé le renouvellement du jeton : il sera redemandé à l\'appel suivant.',
  lockTimeout: 'Le jeton HelloAsso est en cours de renouvellement par une autre instance : réessayez dans un instant.',
  tokenStore: 'Lecture ou verrouillage du jeton HelloAsso impossible en base de données.',
  badBody: 'Réponse HelloAsso inattendue.',
} as const

function httpErrorMessage(status: number) {
  return `HelloAsso a répondu avec une erreur (HTTP ${status}).`
}

/** Traduit une erreur du client en erreur HTTP Nitro. À lancer : `throw toH3Error(err)`. */
export function toH3Error(err: unknown) {
  if (!(err instanceof HelloAssoError)) {
    const known = err as { statusCode?: number } | null
    if (known && typeof known.statusCode === 'number') return err
    return createError({ statusCode: 500, statusMessage: 'Erreur interne lors de l\'appel à HelloAsso' })
  }
  const statusCode = err.code === 'config_missing'
    ? 500
    : err.code === 'rate_limited' || err.code === 'lock_timeout'
      ? 503
      : 502
  const h3 = createError({
    statusCode,
    statusMessage: err.message,
    data: { code: err.code, ...(err.retryAfter !== undefined ? { retryAfter: err.retryAfter } : {}) },
  }) as any
  // Nitro n'applique pas d'en-têtes depuis l'erreur : la durée reste lisible par la route via `headers`.
  if (err.retryAfter !== undefined) h3.headers = { 'Retry-After': String(err.retryAfter) }
  return h3
}

// --- Configuration -------------------------------------------------------------------------------

const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/**
 * Valide `runtimeConfig.helloasso`. Accepte le runtimeConfig entier ou son sous-objet `helloasso`.
 * Lève `config_missing` en citant les NOMS des clés manquantes ou invalides, jamais leurs valeurs.
 */
export function resolveHelloAssoConfig(rc: unknown): HelloAssoConfig {
  const root = (rc ?? {}) as Record<string, unknown>
  const src = (root.helloasso && typeof root.helloasso === 'object' ? root.helloasso : root) as Record<string, unknown>

  const problems: string[] = REQUIRED_KEYS.filter(k => !asText(src[k]))
  const environment = asText(src.environment)
  if (environment && !ENVIRONMENTS.includes(environment as HelloAssoEnvironment)) {
    problems.push(`environment (valeurs acceptées : ${ENVIRONMENTS.join(', ')})`)
  }
  if (problems.length) {
    throw fail('config_missing', `Configuration HelloAsso manquante ou invalide : ${problems.join(', ')}.`)
  }

  const defaults = DEFAULT_URLS[environment as HelloAssoEnvironment]
  return {
    clientId: asText(src.clientId),
    clientSecret: asText(src.clientSecret),
    orgSlug: asText(src.orgSlug),
    environment: environment as HelloAssoEnvironment,
    apiUrl: asText(src.apiUrl) || defaults.apiUrl,
    tokenUrl: asText(src.tokenUrl) || defaults.tokenUrl,
    webhookSecret: asText(src.webhookSecret),
  }
}

// --- Client --------------------------------------------------------------------------------------

interface TokenRow {
  client_id: string | null
  access_token: string | null
  access_expires_at: string | null
  refresh_token: string | null
  refresh_expires_at: string | null
}

interface TokenGrant {
  access_token: string
  refresh_token: string | null
  expires_in: number
}

function parseRetryAfter(header: string | null, nowMs: number): number | undefined {
  if (!header) return undefined
  const value = header.trim()
  if (/^\d+$/.test(value)) return Number(value)
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - nowMs) / 1000))
}

export function createHelloAssoClient(options: HelloAssoClientOptions): HelloAssoClient {
  const { config, supabase } = options
  const nowMs = () => {
    const v = (options.now ?? Date.now)()
    return typeof v === 'number' ? v : v.getTime()
  }
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)))
  const env = config.environment

  // --- Base : jeton partagé -----------------------------------------------------------------

  async function readRow(): Promise<TokenRow | null> {
    const { data, error } = await supabase
      .from('helloasso_tokens')
      .select('client_id, access_token, access_expires_at, refresh_token, refresh_expires_at')
      .eq('environment', env)
      .maybeSingle()
    if (error) throw fail('http_error', MESSAGES.tokenStore)
    return (data as TokenRow | null) ?? null
  }

  /** Ligne exploitable : même client_id que la config (une ligne vide ou d'un autre client est ignorée). */
  function ownRow(row: TokenRow | null): TokenRow | null {
    return row && row.client_id && row.client_id === config.clientId ? row : null
  }

  function usableAccess(row: TokenRow | null): string | null {
    const own = ownRow(row)
    if (!own?.access_token || !own.access_expires_at) return null
    const expires = Date.parse(own.access_expires_at)
    return Number.isNaN(expires) || expires - nowMs() <= RENEW_MARGIN_MS ? null : own.access_token
  }

  function usableRefresh(row: TokenRow | null): string | null {
    const own = ownRow(row)
    if (!own?.refresh_token || !own.refresh_expires_at) return null
    const expires = Date.parse(own.refresh_expires_at)
    return Number.isNaN(expires) || expires <= nowMs() ? null : own.refresh_token
  }

  /** Écriture conditionnée à `lock_holder = holder`. Renvoie le nombre de lignes touchées. */
  async function writeAsHolder(holder: string, patch: Record<string, unknown>): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('helloasso_tokens')
        .update({ ...patch, updated_at: new Date(nowMs()).toISOString() })
        .eq('environment', env)
        .eq('lock_holder', holder)
        .select('environment')
      if (error) return 0
      return Array.isArray(data) ? data.length : 0
    }
    catch {
      return 0
    }
  }

  const RELEASE = { lock_holder: null, lock_until: null }

  async function acquireLock(holder: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('helloasso_acquire_token_lock', {
      p_environment: env,
      p_holder: holder,
      p_ttl_seconds: LOCK_TTL_SECONDS,
    })
    if (error) throw fail('http_error', MESSAGES.tokenStore)
    return data === true
  }

  // --- Endpoint d'auth ----------------------------------------------------------------------

  async function requestGrant(params: Record<string, string>, refreshing: boolean): Promise<TokenGrant> {
    let res: Response
    try {
      res = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: new URLSearchParams(params).toString(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    }
    catch {
      throw fail('network', MESSAGES.network)
    }

    if (res.status === 429) {
      throw fail('rate_limited', MESSAGES.rateLimited, {
        status: 429,
        retryAfter: parseRetryAfter(res.headers.get('retry-after'), nowMs()),
      })
    }
    if (res.status === 400 || res.status === 401) {
      throw fail('auth_failed', refreshing ? MESSAGES.refreshFailed : MESSAGES.authFailed, { status: res.status })
    }
    if (!res.ok) throw fail('http_error', httpErrorMessage(res.status), { status: res.status })

    let json: any
    try {
      json = await res.json()
    }
    catch {
      throw fail('http_error', MESSAGES.badBody, { status: res.status })
    }
    if (!json || typeof json.access_token !== 'string' || !json.access_token) {
      throw fail('http_error', MESSAGES.badBody, { status: res.status })
    }
    const expiresIn = Number(json.expires_in)
    return {
      access_token: json.access_token,
      refresh_token: typeof json.refresh_token === 'string' && json.refresh_token ? json.refresh_token : null,
      expires_in: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : DEFAULT_EXPIRES_IN_S,
    }
  }

  // --- Renouvellement sous verrou -----------------------------------------------------------

  /** Le verrou est pris par une autre instance : relecture bornée, jamais d'appel d'auth. */
  async function waitForOtherInstance(): Promise<string> {
    for (let i = 0; i < LOCK_WAIT_ATTEMPTS; i++) {
      await sleep(LOCK_WAIT_MS)
      const token = usableAccess(await readRow())
      if (token) return token
    }
    throw fail('lock_timeout', MESSAGES.lockTimeout, { retryAfter: LOCK_TIMEOUT_RETRY_AFTER_S })
  }

  async function renew(): Promise<string> {
    const holder = randomUUID()
    if (!(await acquireLock(holder))) return waitForOtherInstance()

    let released = false
    try {
      // Relecture sous verrou : un autre appel a pu renouveler entre-temps, et le refresh_token est à jour.
      const row = await readRow()
      const already = usableAccess(row)
      if (already) return already

      const refresh = usableRefresh(row)
      let grant: TokenGrant
      try {
        // Corps du refresh tel que validé en sandbox (P0, 2026-10-28) : ni client_id ni client_secret.
        grant = refresh
          ? await requestGrant({ grant_type: 'refresh_token', refresh_token: refresh }, true)
          : await requestGrant({
              grant_type: 'client_credentials',
              client_id: config.clientId,
              client_secret: config.clientSecret,
            }, false)
      }
      catch (err) {
        // Refresh refusé : on l'efface (pas de second appel d'auth), le prochain appel repasse en client_credentials.
        if (refresh && err instanceof HelloAssoError && err.code === 'auth_failed') {
          const n = await writeAsHolder(holder, { refresh_token: null, refresh_expires_at: null, ...RELEASE })
          released = n > 0
        }
        throw err
      }

      const now = nowMs()
      const written = await writeAsHolder(holder, {
        client_id: config.clientId,
        access_token: grant.access_token,
        access_expires_at: new Date(now + grant.expires_in * 1000).toISOString(),
        refresh_token: grant.refresh_token,
        refresh_expires_at: grant.refresh_token ? new Date(now + REFRESH_LIFETIME_MS).toISOString() : null,
        ...RELEASE,
      })
      released = written > 0
      if (!written) console.warn('[helloasso] token_not_stored (verrou perdu ou écriture refusée)')
      // Jeton obtenu mais non rangé (verrou perdu) : il reste valable pour cet appel.
      return grant.access_token
    }
    finally {
      if (!released) await writeAsHolder(holder, RELEASE)
    }
  }

  // Une seule résolution à la fois dans l'instance : les appels concurrents partagent la promesse.
  let pending: Promise<string> | null = null

  function getAccessToken(): Promise<string> {
    if (!pending) {
      pending = (async () => usableAccess(await readRow()) ?? renew())()
      const current = pending
      const clear = () => { if (pending === current) pending = null }
      current.then(clear, clear)
    }
    return pending
  }

  /** Rend le jeton refusé inutilisable en base (sans toucher à un jeton déjà remplacé par un autre). */
  async function invalidate(token: string) {
    try {
      await supabase
        .from('helloasso_tokens')
        .update({ access_expires_at: new Date(nowMs() - 1000).toISOString() })
        .eq('environment', env)
        .eq('access_token', token)
    }
    catch {
      // sans effet sur la suite : le renouvellement relit la base
    }
  }

  // --- Appels API ---------------------------------------------------------------------------

  function buildUrl(path: string, query?: HelloAssoQuery) {
    const base = config.apiUrl.replace(/\/+$/, '')
    const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`
    if (!query) return url
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) params.set(k, String(v))
    }
    const qs = params.toString()
    return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url
  }

  async function send(method: 'GET' | 'POST', url: string, token: string, body?: unknown): Promise<Response> {
    try {
      return await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    }
    catch {
      throw fail('network', MESSAGES.network)
    }
  }

  async function request<T>(method: 'GET' | 'POST', path: string, query?: HelloAssoQuery, body?: unknown): Promise<T> {
    const url = buildUrl(path, query)
    const token = await getAccessToken()
    let res = await send(method, url, token, body)

    if (res.status === 401) {
      // Une seule ré-authentification, un seul rejeu.
      await invalidate(token)
      let fresh = await getAccessToken()
      if (fresh === token) fresh = await getAccessToken() // résolution déjà en cours avant l'invalidation
      res = await send(method, url, fresh, body)
      if (res.status === 401) throw fail('unauthorized', MESSAGES.unauthorized, { status: 401 })
    }

    if (res.status === 429) {
      throw fail('rate_limited', MESSAGES.rateLimited, {
        status: 429,
        retryAfter: parseRetryAfter(res.headers.get('retry-after'), nowMs()),
      })
    }
    if (res.status === 403) throw fail('forbidden', MESSAGES.forbidden, { status: 403 })
    if (!res.ok) throw fail('http_error', httpErrorMessage(res.status), { status: res.status })

    try {
      const text = await res.text()
      return (text ? JSON.parse(text) : null) as T
    }
    catch {
      throw fail('http_error', MESSAGES.badBody, { status: res.status })
    }
  }

  return {
    config,
    getAccessToken,
    get: (path, query) => request('GET', path, query),
    post: (path, body) => request('POST', path, undefined, body ?? {}),
  }
}

/** Client branché sur `runtimeConfig.helloasso` (serveur) et le service role Supabase. */
export function useHelloAsso(event: H3Event): HelloAssoClient {
  const config = resolveHelloAssoConfig(useRuntimeConfig(event))
  return createHelloAssoClient({ config, supabase: serverSupabaseServiceRole(event) })
}
