// R2b-T0 auth-profils — R2b-5 : une seule source pour l'URL de retour des e-mails de confirmation.
// app/utils/authRedirect.ts exporte signupConfirmationRedirect(origin?) => `${origin ?? window.location.origin}/callback?type=signup`.
// Un test de source vérifie que le littéral `/callback?type=signup` n'apparaît nulle part ailleurs dans app/.
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const APP_DIR = resolve(process.cwd(), 'app')
const SOURCE_OF_TRUTH = ['app', 'utils', 'authRedirect.ts'].join('/')
const MODULE = resolve(process.cwd(), SOURCE_OF_TRUTH)
const MODULE_URL = pathToFileURL(MODULE).href
const LITERAL = '/callback?type=signup'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

describe('R2b-5 — signupConfirmationRedirect', () => {
  it('renvoie <origine donnée>/callback?type=signup', async () => {
    expect(existsSync(MODULE), 'app/utils/authRedirect.ts absent').toBe(true)
    const { signupConfirmationRedirect } = await import(/* @vite-ignore */ MODULE_URL)
    expect(signupConfirmationRedirect('https://escalade-chevigny.fr')).toBe('https://escalade-chevigny.fr/callback?type=signup')
    expect(signupConfirmationRedirect('http://localhost:3000')).toBe('http://localhost:3000/callback?type=signup')
  })

  it('par défaut, utilise window.location.origin', async () => {
    expect(existsSync(MODULE), 'app/utils/authRedirect.ts absent').toBe(true)
    const { signupConfirmationRedirect } = await import(/* @vite-ignore */ MODULE_URL)
    expect(signupConfirmationRedirect()).toBe(`${window.location.origin}/callback?type=signup`)
  })
})

describe('R2b-5 — une seule occurrence du littéral dans app/', () => {
  it(`« ${LITERAL} » n'apparaît que dans ${SOURCE_OF_TRUTH}`, () => {
    const files = walk(APP_DIR).filter(f => /\.(vue|ts|js|mjs|tsx|jsx)$/.test(f))
    const holders = files
      .filter(f => readFileSync(f, 'utf8').includes(LITERAL))
      .map(f => relative(process.cwd(), f).split(sep).join('/'))
    expect(holders).toEqual([SOURCE_OF_TRUTH])
  })
})
