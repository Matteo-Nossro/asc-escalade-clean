// Supabase factice en mémoire pour les tests HelloAsso (lot helloasso-socle).
//
// Contrairement à `mockChain` (qui renvoie une réponse figée), ce faux client conserve des tables :
// un `update(...).eq('lock_holder', x)` ne modifie que les lignes qui correspondent, un `in(...)`
// filtre vraiment. Les tests observent donc le COMPORTEMENT (état des tables) et non la forme des
// appels ; le code testé reste libre de choisir `select/update/upsert`, `maybeSingle/single`, etc.
//
// Limite (comme `supabase-mock.ts`) : ni SQL, ni RLS, ni contraintes, ni triggers.
// La RPC `helloasso_acquire_token_lock` est émulée avec la même sémantique que la fonction SQL
// prévue par le plan (INSERT … ON CONFLICT DO UPDATE … WHERE lock_until IS NULL OR lock_until < now()).

import { vi } from 'vitest'

export type Row = Record<string, any>
type Op = 'eq' | 'neq' | 'is' | 'in' | 'lt' | 'lte' | 'gt' | 'gte'
interface Filter { col: string, op: Op, val: any }

export interface FakeOp { table: string, op: string, payload?: any, filters: Filter[] }

const ISO = /^\d{4}-\d{2}-\d{2}T/

function norm(v: any) {
  if (typeof v === 'string' && ISO.test(v)) return Date.parse(v)
  return v
}

function matches(row: Row, f: Filter): boolean {
  const cell = row[f.col]
  switch (f.op) {
    case 'eq': return cell === f.val
    case 'neq': return cell !== f.val
    case 'is': return (cell ?? null) === f.val
    case 'in': return Array.isArray(f.val) && f.val.includes(cell)
    case 'lt': return cell != null && norm(cell) < norm(f.val)
    case 'lte': return cell != null && norm(cell) <= norm(f.val)
    case 'gt': return cell != null && norm(cell) > norm(f.val)
    case 'gte': return cell != null && norm(cell) >= norm(f.val)
  }
}

/** Analyse `a.eq.x,b.is.null` (syntaxe PostgREST `.or()`), sans parenthèses imbriquées. */
function parseOr(expr: string): Filter[] {
  return expr.split(',').map((part) => {
    const [col, op, ...rest] = part.split('.')
    const raw = rest.join('.')
    const val = raw === 'null' ? null : raw === 'true' ? true : raw === 'false' ? false : raw
    return { col: col!, op: op as Op, val }
  })
}

class FakeQuery implements PromiseLike<any> {
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private payload: any
  private upsertOpts: any = {}
  private filters: Filter[] = []
  private orGroups: Filter[][] = []
  private returning = false
  private countMode = false
  private head = false
  private limitN: number | null = null
  private orderBy: { col: string, asc: boolean } | null = null
  private singleMode: null | 'single' | 'maybe' = null

  constructor(private db: FakeDb, private table: string) {}

  select(_cols?: string, opts?: { count?: string, head?: boolean }) {
    if (this.op !== 'select') this.returning = true
    if (opts?.count) this.countMode = true
    if (opts?.head) this.head = true
    return this
  }
  insert(p: any) { this.op = 'insert'; this.payload = p; return this }
  update(p: any) { this.op = 'update'; this.payload = p; return this }
  upsert(p: any, opts?: any) { this.op = 'upsert'; this.payload = p; this.upsertOpts = opts ?? {}; return this }
  delete() { this.op = 'delete'; return this }

  eq(col: string, val: any) { this.filters.push({ col, op: 'eq', val }); return this }
  neq(col: string, val: any) { this.filters.push({ col, op: 'neq', val }); return this }
  is(col: string, val: any) { this.filters.push({ col, op: 'is', val }); return this }
  in(col: string, val: any[]) { this.filters.push({ col, op: 'in', val }); return this }
  lt(col: string, val: any) { this.filters.push({ col, op: 'lt', val }); return this }
  lte(col: string, val: any) { this.filters.push({ col, op: 'lte', val }); return this }
  gt(col: string, val: any) { this.filters.push({ col, op: 'gt', val }); return this }
  gte(col: string, val: any) { this.filters.push({ col, op: 'gte', val }); return this }
  or(expr: string) { this.orGroups.push(parseOr(expr)); return this }
  order(col: string, opts?: { ascending?: boolean }) { this.orderBy = { col, asc: opts?.ascending !== false }; return this }
  limit(n: number) { this.limitN = n; return this }
  range() { return this }
  maybeSingle() { this.singleMode = 'maybe'; return this }
  // `single()` s'utilise aussi bien après `select()` que directement après `insert/update`.
  single() { this.singleMode = 'single'; return this }

  then<A = any, B = never>(ok?: ((v: any) => A | PromiseLike<A>) | null, ko?: ((e: any) => B | PromiseLike<B>) | null) {
    return Promise.resolve().then(() => this.exec()).then(ok, ko)
  }

  private rowsMatching(): Row[] {
    const rows = this.db.tables[this.table]!
    return rows.filter(r =>
      this.filters.every(f => matches(r, f))
      && this.orGroups.every(g => g.some(f => matches(r, f))),
    )
  }

  private exec() {
    this.db.guard()
    this.db.ops.push({ table: this.table, op: this.op, payload: this.payload, filters: [...this.filters] })
    const rows = this.db.tables[this.table]!
    let out: Row[] = []

    if (this.op === 'select') {
      out = this.rowsMatching()
    }
    else if (this.op === 'insert') {
      const items: Row[] = Array.isArray(this.payload) ? this.payload : [this.payload]
      for (const it of items) {
        const row = { ...it }
        if (row.id === undefined && this.table !== 'helloasso_tokens') row.id = `id-${++this.db.seq}`
        rows.push(row)
        out.push(row)
      }
    }
    else if (this.op === 'update') {
      out = this.rowsMatching()
      for (const r of out) Object.assign(r, this.payload)
    }
    else if (this.op === 'upsert') {
      const keys: string[] = String(this.upsertOpts.onConflict ?? (this.table === 'helloasso_tokens' ? 'environment' : 'id')).split(',').map(s => s.trim())
      const items: Row[] = Array.isArray(this.payload) ? this.payload : [this.payload]
      for (const it of items) {
        const existing = rows.find(r => keys.every(k => r[k] === it[k]))
        if (existing) { Object.assign(existing, it); out.push(existing) }
        else { const row = { ...it }; rows.push(row); out.push(row) }
      }
    }
    else if (this.op === 'delete') {
      out = this.rowsMatching()
      this.db.tables[this.table] = rows.filter(r => !out.includes(r))
    }

    const count = this.countMode ? out.length : undefined
    if (this.orderBy) {
      const { col, asc } = this.orderBy
      out = [...out].sort((a, b) => (norm(a[col]) > norm(b[col]) ? 1 : -1) * (asc ? 1 : -1))
    }
    if (this.limitN != null) out = out.slice(0, this.limitN)
    const data = out.map(r => ({ ...r }))

    if (this.head) return { data: null, error: null, count }
    if (this.op !== 'select' && !this.returning) return { data: null, error: null, count }
    if (this.singleMode === 'maybe') {
      if (data.length > 1) return { data: null, error: { message: 'plusieurs lignes' }, count }
      return { data: data[0] ?? null, error: null, count }
    }
    if (this.singleMode === 'single') {
      if (data.length !== 1) return { data: null, error: { code: 'PGRST116', message: 'attendu 1 ligne' }, count }
      return { data: data[0], error: null, count }
    }
    return { data, error: null, count }
  }
}

export class FakeDb {
  tables: Record<string, Row[]> = {}
  ops: FakeOp[] = []
  seq = 0
  private n = 0
  constructor(initial: Record<string, Row[]>, private maxOps: number) {
    for (const [name, rows] of Object.entries(initial)) this.tables[name] = rows.map(r => ({ ...r }))
  }
  guard() {
    if (++this.n > this.maxOps) throw new Error(`fake-supabase : plus de ${this.maxOps} opérations (boucle non bornée ?)`)
  }
}

export interface FakeSupabase {
  client: { from: (t: string) => FakeQuery, rpc: ReturnType<typeof vi.fn> }
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
  tables: Record<string, Row[]>
  ops: FakeOp[]
  db: FakeDb
}

const iso = (ms: number) => new Date(ms).toISOString()

/**
 * @param initial  lignes de départ par table (copiées)
 * @param opts.maxOps  garde-fou contre les boucles (défaut 400 opérations)
 */
export function createFakeSupabase(initial: Record<string, Row[]> = {}, opts: { maxOps?: number } = {}): FakeSupabase {
  const db = new FakeDb(initial, opts.maxOps ?? 400)

  const from = vi.fn((table: string) => {
    db.tables[table] ??= []
    return new FakeQuery(db, table)
  })

  // Émulation de helloasso_acquire_token_lock(p_environment, p_holder, p_ttl_seconds)
  const acquire = (args: any): boolean => {
    db.guard()
    db.tables.helloasso_tokens ??= []
    const now = Date.now()
    const ttl = Number(args?.p_ttl_seconds ?? 20)
    const row = db.tables.helloasso_tokens.find(r => r.environment === args?.p_environment)
    if (!row) {
      db.tables.helloasso_tokens.push({ environment: args.p_environment, lock_holder: args.p_holder, lock_until: iso(now + ttl * 1000) })
      return true
    }
    if (row.lock_until == null || Date.parse(row.lock_until) < now) {
      row.lock_holder = args.p_holder
      row.lock_until = iso(now + ttl * 1000)
      return true
    }
    return false
  }

  const rpc = vi.fn((fn: string, args?: any) => {
    const result = fn === 'helloasso_acquire_token_lock'
      ? { data: acquire(args), error: null }
      : { data: null, error: { message: `rpc inconnue dans le faux client : ${fn}` } }
    const p: any = Promise.resolve(result)
    p.single = () => p
    p.maybeSingle = () => p
    return p
  })

  const client = { from, rpc } as unknown as FakeSupabase['client']
  return {
    client,
    from,
    rpc,
    get tables() { return db.tables },
    get ops() { return db.ops },
    db,
  }
}

/** Le verrou est libre : plus de détenteur, ou échéance dépassée. */
export function isLockFree(row: Row | undefined, now = Date.now()): boolean {
  if (!row) return true
  return row.lock_holder == null || row.lock_until == null || Date.parse(row.lock_until) <= now
}
