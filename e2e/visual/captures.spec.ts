import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { testAccount } from '../support/dev-db'

// Captures visuelles pleine page (feature harmonisation-couleurs : T0 « avant », T10 « apres »).
// Lecture seule : seules les deux connexions (adhérent, admin) touchent Supabase DEV (jeton de session).
// Comptes : TEST_USERS_EMAIL (+adherent, +admin) / TEST_USERS_PASSWORD, lus par e2e/support/dev-db.ts.
//
// Opt-in : sans CAPTURES_OUT, tout le fichier est ignoré (un `npm run test:e2e` ne touche pas aux captures).
//
//   Référence (T0) :
//     CAPTURES_OUT=avant E2E_SKIP_BUILD=1 npx playwright test e2e/visual/captures.spec.ts
//   Après modification (T10), avec comparaison à `avant` (rebuild avant si le code de l'app a changé) :
//     CAPTURES_OUT=apres CAPTURES_COMPARE=avant E2E_SKIP_BUILD=1 npx playwright test e2e/visual/captures.spec.ts
//
// Variables :
//   CAPTURES_OUT        dossier de sortie sous CAPTURES_BASE (obligatoire)
//   CAPTURES_COMPARE    dossier de référence (nom sous CAPTURES_BASE, ou chemin absolu) : active la comparaison
//   CAPTURES_BASE       racine (défaut docs/features/harmonisation-couleurs/captures)
//   CAPTURES_OVERWRITE  1 pour écraser des PNG existants (refusé sinon : les captures « avant » sont conservées)
//   CAPTURES_THRESHOLD  seuil de couleur par pixel, type pixelmatch (défaut 0.1)
//   CAPTURES_MAX_RATIO  part maximale de pixels différents (défaut 0.001 = 0,1 %)
//   CAPTURES_POST_SLUG  slug du post figé (défaut ci-dessous)
//   CAPTURES_ONLY       liste de pages séparées par des virgules (ex. accueil,club)

const BASE = resolve(process.env.CAPTURES_BASE ?? 'docs/features/harmonisation-couleurs/captures')
const OUT = process.env.CAPTURES_OUT
const COMPARE = process.env.CAPTURES_COMPARE
const OVERWRITE = process.env.CAPTURES_OVERWRITE === '1'
const THRESHOLD = Number(process.env.CAPTURES_THRESHOLD ?? 0.1)
const MAX_RATIO = Number(process.env.CAPTURES_MAX_RATIO ?? 0.001)
const POST_SLUG = process.env.CAPTURES_POST_SLUG ?? 'fete-du-mur-6'
const ONLY = (process.env.CAPTURES_ONLY ?? '').split(',').map(s => s.trim()).filter(Boolean)

type Role = 'adherent' | 'admin'
interface Shot {
  name: string
  path: string
  role?: Role
  /** Sélecteurs masqués (zones dynamiques sans rapport avec les couleurs). */
  mask?: string[]
  /** Sélecteur à attendre avant la capture. */
  ready?: string
}

const SHOTS: Shot[] = [
  { name: 'accueil', path: '/' },
  { name: 'actualites', path: '/actualites' },
  { name: 'post', path: `/posts/${POST_SLUG}` },
  { name: 'club', path: '/club' },
  { name: 'tarifs', path: '/tarifs' },
  // /sorties n'est pas publiée dans Storyblok (page vide en `published`) : on capture le brouillon (?_storyblok=1).
  { name: 'sorties', path: '/sorties?_storyblok=1' },
  { name: 'contact', path: '/contact' },
  { name: 'register', path: '/register' },
  { name: 'login', path: '/login' },
  { name: 'profil', path: '/profil', role: 'adherent' },
  { name: 'admin-dashboard', path: '/admin/dashboard', role: 'admin' },
]
const WIDTHS = [1440, 390] as const
const HEIGHTS: Record<number, number> = { 1440: 900, 390: 844 }

const FREEZE_CSS = `
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
  scroll-behavior: auto !important;
  caret-color: transparent !important;
}`

const outDir = OUT ? join(BASE, OUT) : ''
const refDir = COMPARE ? (isAbsolute(COMPARE) ? COMPARE : join(BASE, COMPARE)) : ''

// ── Session des comptes de test (une connexion par rôle et par exécution) ────
const sessions = new Map<Role, Awaited<ReturnType<BrowserContext['storageState']>>>()

async function sessionFor(browser: Browser, baseURL: string, role: Role) {
  const cached = sessions.get(role)
  if (cached) return cached
  const account = testAccount(role)
  if (!account) return null
  const ctx = await browser.newContext({ baseURL, locale: 'fr-FR', reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/login?redirect=/')
  await page.getByTestId('input-login-email').fill(account.email)
  await page.getByTestId('input-login-password').fill(account.password)
  await page.getByTestId('btn-login-submit').click()
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30_000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  const state = await ctx.storageState()
  await ctx.close()
  sessions.set(role, state)
  return state
}

// ── Stabilisation du rendu ───────────────────────────────────────────────────
async function settle(page: Page) {
  await page.addStyleTag({ content: FREEZE_CSS })
  // Force le chargement des images paresseuses, puis parcourt la page (déclencheurs de scroll).
  await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    document.querySelectorAll('img[loading="lazy"]').forEach(img => img.setAttribute('loading', 'eager'))
    const step = Math.max(300, Math.floor(window.innerHeight * 0.6))
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await sleep(100)
    }
    window.scrollTo(0, document.documentElement.scrollHeight)
    await sleep(250)
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(Array.from(document.images).map(img =>
      img.complete ? null : new Promise(r => { img.onload = img.onerror = () => r(null) }),
    ))
    await Promise.all(Array.from(document.images).map(img => img.decode().catch(() => {})))
  })
  await page.waitForTimeout(600)
}

// ── Comparaison (dans le navigateur : aucune dépendance supplémentaire) ──────
interface DiffResult { sameSize: boolean, sizeA: string, sizeB: string, diffPixels: number, total: number, ratio: number, diffPng: string }

async function comparePngs(browser: Browser, ref: Buffer, actual: Buffer): Promise<DiffResult> {
  const page = await browser.newPage()
  try {
    await page.goto('about:blank')
    return await page.evaluate(async ({ a, b, threshold }) => {
      const load = (b64: string) => new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image()
        img.onload = () => res(img)
        img.onerror = () => rej(new Error('PNG illisible'))
        img.src = `data:image/png;base64,${b64}`
      })
      const [ia, ib] = await Promise.all([load(a), load(b)])
      const w = Math.max(ia.naturalWidth, ib.naturalWidth)
      const h = Math.max(ia.naturalHeight, ib.naturalHeight)
      const read = (img: HTMLImageElement) => {
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(img, 0, 0)
        return ctx.getImageData(0, 0, w, h)
      }
      const da = read(ia).data
      const db = read(ib).data
      const out = document.createElement('canvas')
      out.width = w
      out.height = h
      const octx = out.getContext('2d')!
      const od = octx.createImageData(w, h)
      const maxDelta = 35215 * threshold * threshold
      const blend = (c: number, a: number) => 255 + (c - 255) * a
      let diff = 0
      for (let i = 0; i < da.length; i += 4) {
        const aa = da[i + 3] / 255
        const ab = db[i + 3] / 255
        const r1 = blend(da[i], aa), g1 = blend(da[i + 1], aa), b1 = blend(da[i + 2], aa)
        const r2 = blend(db[i], ab), g2 = blend(db[i + 1], ab), b2 = blend(db[i + 2], ab)
        const y1 = r1 * 0.29889531 + g1 * 0.58662247 + b1 * 0.11448223
        const i1 = r1 * 0.59597799 - g1 * 0.2741761 - b1 * 0.32180189
        const q1 = r1 * 0.21147017 - g1 * 0.52261711 + b1 * 0.31114694
        const y2 = r2 * 0.29889531 + g2 * 0.58662247 + b2 * 0.11448223
        const i2 = r2 * 0.59597799 - g2 * 0.2741761 - b2 * 0.32180189
        const q2 = r2 * 0.21147017 - g2 * 0.52261711 + b2 * 0.31114694
        const dy = y1 - y2, di = i1 - i2, dq = q1 - q2
        const delta = 0.5053 * dy * dy + 0.299 * di * di + 0.1957 * dq * dq
        if (delta > maxDelta || (aa === 0) !== (ab === 0)) {
          diff++
          od.data[i] = 255; od.data[i + 1] = 0; od.data[i + 2] = 0; od.data[i + 3] = 255
        }
        else {
          const gray = 255 + (y1 - 255) * 0.1
          od.data[i] = gray; od.data[i + 1] = gray; od.data[i + 2] = gray; od.data[i + 3] = 255
        }
      }
      octx.putImageData(od, 0, 0)
      const total = w * h
      return {
        sameSize: ia.naturalWidth === ib.naturalWidth && ia.naturalHeight === ib.naturalHeight,
        sizeA: `${ia.naturalWidth}x${ia.naturalHeight}`,
        sizeB: `${ib.naturalWidth}x${ib.naturalHeight}`,
        diffPixels: diff,
        total,
        ratio: diff / total,
        diffPng: diff > 0 ? out.toDataURL('image/png').split(',')[1] : '',
      }
    }, { a: ref.toString('base64'), b: actual.toString('base64'), threshold: THRESHOLD })
  }
  finally {
    await page.close()
  }
}

function appendReport(entry: Record<string, unknown>) {
  const file = join(outDir, 'rapport-comparaison.json')
  const all: Record<string, unknown>[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
  const next = all.filter(e => e.capture !== entry.capture)
  next.push(entry)
  writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`)
}

// ── Tests ────────────────────────────────────────────────────────────────────
test.describe('captures visuelles', () => {
  test.skip(!OUT, 'Opt-in : définir CAPTURES_OUT (avant | apres | …) pour lancer les captures')
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(() => {
    if (!OUT) return
    mkdirSync(outDir, { recursive: true })
    if (refDir && resolve(refDir) === resolve(outDir)) throw new Error('CAPTURES_COMPARE et CAPTURES_OUT désignent le même dossier')
    if (refDir && !existsSync(refDir)) throw new Error(`Dossier de référence introuvable : ${refDir}`)
  })

  for (const shot of SHOTS) {
    for (const width of WIDTHS) {
      const capture = `${shot.name}-${width}`
      test(capture, async ({ browser }, testInfo) => {
        test.skip(ONLY.length > 0 && !ONLY.includes(shot.name), 'Hors CAPTURES_ONLY')
        const file = join(outDir, `${capture}.png`)
        test.skip(existsSync(file) && !OVERWRITE, `${capture}.png existe déjà : CAPTURES_OVERWRITE=1 pour l'écraser (les captures « avant » sont conservées)`)

        const baseURL = String(testInfo.project.use.baseURL)
        let storageState: Awaited<ReturnType<BrowserContext['storageState']>> | undefined
        if (shot.role) {
          const state = await sessionFor(browser, baseURL, shot.role)
          test.skip(!state, `TEST_USERS_EMAIL / TEST_USERS_PASSWORD absents : compte « ${shot.role} » requis`)
          storageState = state!
        }

        const context = await browser.newContext({
          baseURL,
          storageState,
          viewport: { width, height: HEIGHTS[width] },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
          colorScheme: 'light',
          locale: 'fr-FR',
          timezoneId: 'Europe/Paris',
        })
        try {
          const page = await context.newPage()
          const response = await page.goto(shot.path, { waitUntil: 'load' })
          expect(response?.status(), `statut HTTP de ${shot.path}`).toBe(200)
          expect(new URL(page.url()).pathname, `pas de redirection depuis ${shot.path}`).toBe(shot.path.split('?')[0])
          if (shot.ready) await page.locator(shot.ready).first().waitFor({ state: 'visible', timeout: 20_000 })
          await settle(page)

          const buffer = await page.screenshot({
            fullPage: true,
            animations: 'disabled',
            caret: 'hide',
            scale: 'css',
            mask: (shot.mask ?? []).map(s => page.locator(s)),
          })
          writeFileSync(file, buffer)

          if (refDir) {
            const refFile = join(refDir, `${capture}.png`)
            expect(existsSync(refFile), `référence manquante : ${refFile}`).toBe(true)
            const result = await comparePngs(browser, readFileSync(refFile), buffer)
            const over = !result.sameSize || result.ratio > MAX_RATIO
            if (over && result.diffPng) {
              mkdirSync(join(outDir, 'diff'), { recursive: true })
              writeFileSync(join(outDir, 'diff', `${capture}.png`), Buffer.from(result.diffPng, 'base64'))
            }
            appendReport({
              capture,
              reference: result.sizeA,
              actuelle: result.sizeB,
              memeTaille: result.sameSize,
              pixelsDifferents: result.diffPixels,
              ratio: Number(result.ratio.toFixed(6)),
              auDessusDeLaTolerance: over,
            })
            testInfo.annotations.push({ type: 'ecart', description: `${(result.ratio * 100).toFixed(4)} % (${result.diffPixels} px), tailles ${result.sizeA} / ${result.sizeB}` })
            expect(result.sameSize, `taille de page différente : ${result.sizeA} (référence) / ${result.sizeB}`).toBe(true)
            expect(result.ratio, `pixels différents (tolérance ${MAX_RATIO * 100} %, seuil ${THRESHOLD})`).toBeLessThanOrEqual(MAX_RATIO)
          }
        }
        finally {
          await context.close()
        }
      })
    }
  }
})
