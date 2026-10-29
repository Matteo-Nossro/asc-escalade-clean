// Outils communs aux tests HelloAsso (lot helloasso-socle) : chargement de modules, fixtures,
// faux `fetch` routé, faux `sleep`, erreur HelloAsso factice. Aucun appel réseau réel.

import { readFileSync } from 'node:fs'
import { expect, vi } from 'vitest'

// --- Chargement de modules (qui peuvent ne pas exister encore) -----------------------------------

const ROOT = process.cwd().replace(/\\/g, '/')
export const abs = (rel: string) => `${ROOT}/${rel}`

/**
 * Charge `rel` (chemin relatif à la racine du dépôt) par import dynamique à chemin VARIABLE :
 * un chemin littéral absent ferait échouer la collecte du fichier de test (analyse des imports de Vite).
 *
 * Échecs convertis en messages explicites :
 * - module (ou import interne du module) introuvable   -> `ABSENT: <chemin>`
 * - alias `#supabase/server` non déclaré dans la config -> `INFRA: …` (voir tests/utils/supabase-server-stub.ts)
 * Toute autre erreur est relancée telle quelle.
 */
export async function loadModule<T = any>(rel: string): Promise<T> {
  try {
    return await import(/* @vite-ignore */ abs(rel))
  }
  catch (e: any) {
    const msg = String(e?.message ?? e)
    const unresolved = /Failed to resolve import "([^"]+)" from "([^"]+)"/.exec(msg)
    if (unresolved && unresolved[1] === '#supabase/server') {
      throw new Error(`INFRA: alias '#supabase/server' absent de vitest.config.ts (cible : tests/utils/supabase-server-stub.ts). Import de ${rel}`)
    }
    const notFound = /Cannot find module '([^']+)'/.exec(msg)
    if (e?.code === 'ERR_MODULE_NOT_FOUND' || notFound || unresolved) {
      const raw = (notFound?.[1] ?? unresolved?.[1] ?? rel).replace(/\\/g, '/').replace(/^\/@id\//, '')
      const missing = raw.startsWith(ROOT) ? raw.slice(ROOT.length + 1) : raw
      throw new Error(`ABSENT: ${missing}${missing === rel ? '' : ` (importé par ${rel})`}`)
    }
    throw e
  }
}

/** Résout avec la valeur OU l'erreur levée, sans jamais rejeter. */
export async function settle<T>(fn: () => T | Promise<T>): Promise<{ value?: T, error?: any }> {
  try { return { value: await fn() } }
  catch (error) { return { error } }
}

/** Renvoie l'erreur levée par `fn` (sync ou async), ou `undefined` si rien n'est levé. */
export async function catchErr(fn: () => unknown): Promise<any> {
  try { await fn() }
  catch (e) { return e }
  return undefined
}

// --- Fixtures ----------------------------------------------------------------------------------

/** Lit `tests/fixtures/helloasso/<name>.json` sans la clé `_source`. Un corps tableau est sous `body`. */
export function fixture(name: string): any {
  const { _source, ...data } = JSON.parse(readFileSync(`${ROOT}/tests/fixtures/helloasso/${name}.json`, 'utf8'))
  return data
}

// --- Erreur HelloAsso factice (pour les tests de routes qui mockent le client) ------------------

class FakeHelloAssoErrorImpl extends Error {
  code: string
  status?: number
  retryAfter?: number
  constructor(code: string, message = `erreur ${code}`, extra: { status?: number, retryAfter?: number } = {}) {
    super(message)
    this.name = 'HelloAssoError'
    this.code = code
    this.status = extra.status
    this.retryAfter = extra.retryAfter
  }
}
// Une seule classe par fichier de test, même après `vi.resetModules()` : sinon la classe exportée par
// la factory de `vi.mock` (réévaluée après le reset) diffère de celle du test, et `instanceof` échoue.
const KEY = '__helloassoKitFakeError'
export const FakeHelloAssoError: typeof FakeHelloAssoErrorImpl
  = ((globalThis as any)[KEY] ??= FakeHelloAssoErrorImpl)

// --- Faux fetch routé ---------------------------------------------------------------------------

export interface Reply {
  status?: number
  json?: unknown
  headers?: Record<string, string>
  /** Fait rejeter `fetch` (erreur réseau). */
  networkError?: boolean
  delayMs?: number
}
export type ReplySpec = Reply | ((call: FetchCall) => Reply | Promise<Reply>)

export interface FetchCall {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
}

const TOKEN_PATH = '/oauth2/token'

/**
 * Faux `fetch` à deux files de réponses : celles de l'endpoint OAuth (`/oauth2/token`) et celles de
 * l'API. Une réponse non prévue fait échouer l'appel (erreur claire), jamais un appel réel.
 */
export function createFetchRouter(init: { token?: ReplySpec[], api?: ReplySpec[] } = {}) {
  const tokenQueue = [...(init.token ?? [])]
  const apiQueue = [...(init.api ?? [])]
  const calls: FetchCall[] = []

  const fetchMock = vi.fn(async (input: any, opts: any = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : String(input.url)
    const headers = Object.fromEntries(new Headers(opts.headers ?? {}).entries())
    const body = opts.body == null ? undefined : String(opts.body)
    const call: FetchCall = { url, method: String(opts.method ?? 'GET').toUpperCase(), headers, body }
    calls.push(call)

    const isToken = new URL(url).pathname.endsWith(TOKEN_PATH)
    const spec = (isToken ? tokenQueue : apiQueue).shift()
    if (!spec) throw new Error(`Réponse non prévue par le test pour ${call.method} ${url}`)
    const reply = typeof spec === 'function' ? await spec(call) : spec
    if (reply.delayMs) await new Promise(r => setTimeout(r, reply.delayMs))
    if (reply.networkError) throw new TypeError('fetch failed')
    const hasBody = reply.json !== undefined
    return new Response(hasBody ? JSON.stringify(reply.json) : null, {
      status: reply.status ?? 200,
      headers: { ...(hasBody ? { 'content-type': 'application/json' } : {}), ...(reply.headers ?? {}) },
    })
  })

  return {
    fetch: fetchMock,
    calls,
    tokenCalls: () => calls.filter(c => new URL(c.url).pathname.endsWith(TOKEN_PATH)),
    apiCalls: () => calls.filter(c => !new URL(c.url).pathname.endsWith(TOKEN_PATH)),
  }
}

export type FetchRouter = ReturnType<typeof createFetchRouter>

/** Paramètres form-urlencoded d'un appel à l'endpoint OAuth. */
export const formOf = (call: FetchCall) => new URLSearchParams(call.body ?? '')
export const grantOf = (call: FetchCall) => formOf(call).get('grant_type')
export const bearerOf = (call: FetchCall) => call.headers.authorization

/** Filet de sécurité : `fetch` et `$fetch` lèvent tant qu'un test n'a pas installé son routeur. */
export function forbidNetwork() {
  const interdit = vi.fn(() => { throw new Error('Appel réseau interdit dans les tests') })
  vi.stubGlobal('fetch', interdit)
  vi.stubGlobal('$fetch', interdit)
  return interdit
}

/** Faux `sleep` injectable : compte les appels et lève au-delà de `max` pour couper toute boucle non bornée. */
export function createSleep(opts: { max?: number, onCall?: (n: number) => void | Promise<void> } = {}) {
  let n = 0
  const max = opts.max ?? 100
  return vi.fn(async (_ms?: number) => {
    n++
    if (n > max) throw new Error(`sleep appelé plus de ${max} fois : relecture non bornée`)
    await opts.onCall?.(n)
  })
}

// --- Dates --------------------------------------------------------------------------------------

/** ISO d'un instant à `ms` millisecondes de maintenant (négatif = passé). */
export const inMs = (ms: number) => new Date(Date.now() + ms).toISOString()
export const MIN = 60_000
export const DAY = 24 * 60 * MIN

// --- Contenu sensible ---------------------------------------------------------------------------

/** Aucune des chaînes interdites n'apparaît dans la valeur (sérialisée). */
export function expectNoLeak(value: unknown, forbidden: string[]) {
  const text = value instanceof Error
    ? `${value.name} ${value.message} ${JSON.stringify(value, Object.getOwnPropertyNames(value))}`
    : JSON.stringify(value)
  for (const f of forbidden) expect(text, `fuite de « ${f} »`).not.toContain(f)
}
