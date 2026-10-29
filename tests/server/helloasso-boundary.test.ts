// T0 helloasso-socle — frontière du client unique (lecture de fichiers, aucun import du code testé).
// Critères : « Un seul module serveur porte tous les appels à l'API HelloAsso. Aucune route n'appelle
// directement l'API ou l'endpoint OAuth » et « plus de process.env direct dans le code HelloAsso ».
// Hors server/utils/helloasso.ts, aucun fichier de server/ ne contient helloasso.com, helloasso-sandbox.com,
// oauth2 ni process.env.HELLOASSO. (La migration SQL n'est pas testée ici : voir docs/test-plan.md.)
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SERVER = join(ROOT, 'server')
const CLIENT_MODULE = 'server/utils/helloasso.ts'

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listFiles(full)
    return /\.(ts|js|mjs|vue)$/.test(name) ? [full] : []
  })
}
const rel = (file: string) => relative(ROOT, file).replace(/\\/g, '/')

/** Fichiers de server/ (hors le client) qui contiennent `pattern`. */
function offenders(pattern: RegExp): string[] {
  return listFiles(SERVER)
    .map(rel)
    .filter(f => f !== CLIENT_MODULE)
    .filter(f => pattern.test(readFileSync(join(ROOT, f), 'utf8')))
}

describe('helloasso-socle — critère : le client HelloAsso est le seul à parler à HelloAsso', () => {
  it('le module client server/utils/helloasso.ts existe', () => {
    if (!existsSync(join(ROOT, CLIENT_MODULE))) throw new Error(`ABSENT: ${CLIENT_MODULE}`)
  })

  it('le module client porte les URL par défaut (sandbox et production) et l\'endpoint oauth2', () => {
    if (!existsSync(join(ROOT, CLIENT_MODULE))) throw new Error(`ABSENT: ${CLIENT_MODULE}`)
    const src = readFileSync(join(ROOT, CLIENT_MODULE), 'utf8')
    expect(src).toContain('api.helloasso.com')
    expect(src).toContain('api.helloasso-sandbox.com')
    expect(src).toContain('oauth2/token')
  })

  it('aucun autre fichier de server/ ne contient « helloasso.com »', () => {
    expect(offenders(/helloasso\.com/)).toEqual([])
  })

  it('aucun autre fichier de server/ ne contient « helloasso-sandbox.com »', () => {
    expect(offenders(/helloasso-sandbox\.com/)).toEqual([])
  })

  it('aucun autre fichier de server/ ne contient « oauth2 »', () => {
    expect(offenders(/oauth2/)).toEqual([])
  })

  it('aucun autre fichier de server/ ne lit process.env.HELLOASSO* (la config passe par runtimeConfig)', () => {
    expect(offenders(/process\.env\.HELLOASSO/)).toEqual([])
  })

  it('le client lui-même ne lit pas process.env.HELLOASSO* (runtimeConfig serveur uniquement)', () => {
    if (!existsSync(join(ROOT, CLIENT_MODULE))) throw new Error(`ABSENT: ${CLIENT_MODULE}`)
    expect(readFileSync(join(ROOT, CLIENT_MODULE), 'utf8')).not.toMatch(/process\.env\.HELLOASSO/)
  })
})
