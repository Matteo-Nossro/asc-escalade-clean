import { test, expect, type Browser, type BrowserContext } from '@playwright/test'
import { testAccount } from './support/dev-db'

// Feature auth-erreur-profil — l'en-tête sur les pages rendues côté client (`ssr: false`).
// Constat mesuré sur le build : sur /admin/dashboard et /profil en accès direct, `.header__burger` reste visible
// à 1440 px, parce que la règle scopée `display: none` ne s'applique pas à l'élément (pas de `data-v-*` sur le
// bouton NuxtUI créé côté client) ; la page /tarifs, rendue côté serveur, le masque correctement.
// Seuil de la feuille de style : `@media (max-width: 1024px)` => burger visible jusqu'à 1024 px INCLUS, masqué dès 1025 px.
// Lecture seule : une seule connexion du compte admin de test (jeton de session, projet Supabase DEV).
// Comptes : TEST_USERS_EMAIL (+admin) / TEST_USERS_PASSWORD, lus par e2e/support/dev-db.ts.

type State = Awaited<ReturnType<BrowserContext['storageState']>>

let adminState: State | null = null

async function adminSession(browser: Browser, baseURL: string): Promise<State | null> {
  const admin = testAccount('admin')
  if (!admin) return null
  const ctx = await browser.newContext({ baseURL, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto('/login?redirect=/')
  await page.getByTestId('input-login-email').fill(admin.email)
  await page.getByTestId('input-login-password').fill(admin.password)
  await page.getByTestId('btn-login-submit').click()
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30_000 })
  const state = await ctx.storageState()
  await ctx.close()
  return state
}

test.describe('en-tête : burger selon la largeur (admin connecté, accès direct)', () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    adminState = await adminSession(browser, String(testInfo.project.use.baseURL))
  })

  // `/tarifs` : rendu serveur, point de comparaison (doit déjà passer).
  const pages = ['/admin/dashboard', '/profil', '/tarifs']
  // [largeur, burger visible ?] : hors bureau jusqu'à 1024 px inclus (media query `max-width: 1024px`).
  const widths: Array<[number, boolean]> = [[1440, false], [1025, false], [1024, true], [1023, true]]

  for (const path of pages) {
    for (const [width, visible] of widths) {
      test(`${path} à ${width} px : burger ${visible ? 'visible' : 'masqué'}`, async ({ browser }, testInfo) => {
        test.skip(!adminState, 'TEST_USERS_EMAIL / TEST_USERS_PASSWORD absents : compte « admin » requis')
        const context = await browser.newContext({
          baseURL: String(testInfo.project.use.baseURL),
          storageState: adminState!,
          viewport: { width, height: 900 },
          locale: 'fr-FR',
        })
        try {
          const page = await context.newPage()
          await page.goto(path, { waitUntil: 'load' })
          expect(new URL(page.url()).pathname, `pas de redirection depuis ${path}`).toBe(path)
          // L'en-tête est rendu côté client sur les pages `ssr: false` : on l'attend avant de conclure.
          await expect(page.locator('header.header')).toBeVisible()
          // À partir de 1024 px, le menu utilisateur de bureau n'apparaît qu'une fois la largeur connue côté client.
          if (width >= 1024) await expect(page.locator('button.header__btn-user')).toBeVisible()

          const burger = page.locator('.header__burger')
          if (visible) await expect(burger).toBeVisible()
          else await expect(burger, `le burger ne doit pas être affiché à ${width} px sur ${path}`).toBeHidden()
        }
        finally {
          await context.close()
        }
      })
    }
  }
})
