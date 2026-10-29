import { randomUUID } from 'node:crypto'
import { test, expect, type Page } from '@playwright/test'
import {
  adminClient, assertDevProject, confirmAccount, deleteAccountByEmail,
  disposableEmail, findAuthUserByEmail, testAccount,
} from './support/dev-db'

// Feature auth-profils — parcours de spec.md § Parcours utilisateur.
// Comptes de test : TEST_USERS_EMAIL (+admin, +adherent) / TEST_USERS_PASSWORD (projet Supabase DEV).
// Seul le parcours « inscription réelle » écrit en base (compte jetable, supprimé à la fin) :
//   E2E_ALLOW_WRITES=1 E2E_SEND_EMAIL=1 E2E_SKIP_BUILD=1 npx playwright test e2e/auth-profils.spec.ts --grep "@email"

// Le bouton du menu utilisateur n'a pas de data-testid : on s'appuie sur la classe BEM du Header.
const userMenuButton = (page: Page) => page.locator('button.header__btn-user')

async function login(page: Page, email: string, password: string, redirect = '/') {
  await page.goto(`/login?redirect=${redirect}`)
  await expect(page.getByTestId('btn-login-submit')).toBeVisible()
  // Marqueur : disparaît si la page est rechargée (preuve d'une navigation sans rechargement).
  await page.evaluate(() => { (window as unknown as Record<string, boolean>).__e2eNoReload = true })
  await page.getByTestId('input-login-email').fill(email)
  await page.getByTestId('input-login-password').fill(password)
  await page.getByTestId('btn-login-submit').click()
}

// ── Aides pour /register ─────────────────────────────────────────────────────
interface ParentData { first: string, last: string, birth: string, phone: string, email: string, password: string }

async function chooseType(page: Page, type: 'adult' | 'minor') {
  await page.goto('/register')
  await page.getByRole('button', { name: type === 'adult' ? /Je suis majeur/ : /inscrire mon enfant/ }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
}

async function fillParent(page: Page, d: ParentData) {
  await page.getByPlaceholder('Jean').fill(d.first)
  await page.getByPlaceholder('Dupont').fill(d.last)
  await page.locator('input[type="date"]').fill(d.birth)
  await page.locator('select').selectOption('Homme')
  await page.getByPlaceholder('06 00 00 00 00').fill(d.phone)
  await page.getByPlaceholder('votre@email.com').fill(d.email)
  await page.getByPlaceholder('••••••••').nth(0).fill(d.password)
  await page.getByPlaceholder('••••••••').nth(1).fill(d.password)
  await page.getByPlaceholder('21000').fill('21000')
  await page.getByPlaceholder('Dijon').fill('Dijon')
}

async function fillChild(page: Page, first: string, last: string, birth: string) {
  await page.getByPlaceholder('Marie').fill(first)
  await page.getByPlaceholder('Dupont').fill(last)
  await page.locator('input[type="date"]').fill(birth)
  await page.locator('select').selectOption('Femme')
}

const rateLimitMessage = (page: Page) => page.getByText(/Trop de tentatives|rate limit/i)

// ── 1. Inscription réelle (écrit en base, envoie un vrai e-mail) ─────────────
test.describe('inscription publique avec un enfant @email', () => {
  test.describe.configure({ mode: 'serial' })

  const email = disposableEmail()

  test.skip(
    process.env.E2E_ALLOW_WRITES !== '1' || process.env.E2E_SEND_EMAIL !== '1',
    'Parcours qui écrit en base et envoie un vrai e-mail : E2E_ALLOW_WRITES=1 et E2E_SEND_EMAIL=1 requis (DEV uniquement, à lancer rarement)',
  )
  test.skip(!email, 'TEST_USERS_EMAIL absent (ou en @example.com, interdit) : adresse jetable impossible')

  // Garde : refuse de tourner hors du projet DEV, avant tout appel.
  test.beforeAll(() => { assertDevProject() })

  // Supprime le compte jetable même en cas d'échec ou de saut.
  test.afterEach(async () => {
    if (!email) return
    await deleteAccountByEmail(email)
  })

  test('le visiteur voit le succès, le profil est « En attente » et complet, puis /profil est accessible', async ({ page }) => {
    const password = `E2e!${randomUUID().slice(0, 8)}Aa1`
    await chooseType(page, 'minor')
    await fillParent(page, {
      first: 'Jetable', last: 'E2eParent', birth: '1985-04-12', phone: '0600000000', email: email!, password,
    })
    await page.locator('form').getByRole('button', { name: /Continuer/ }).click()
    await fillChild(page, 'Enfant', 'E2eParent', '2015-06-01')
    await page.getByRole('button', { name: "Terminer l'inscription" }).click()

    const success = page.getByRole('heading', { name: 'Inscription envoyée !' })
    const rateLimited = rateLimitMessage(page)
    const failed = page.getByText(/déjà utilisée|Erreur \d+|Impossible|Profil déjà initialisé/)
    const outcome = await Promise.race([
      success.waitFor({ timeout: 30_000 }).then(() => 'success'),
      rateLimited.first().waitFor({ timeout: 30_000 }).then(() => 'rate-limit'),
      failed.first().waitFor({ timeout: 30_000 }).then(() => 'erreur affichée'),
    ]).catch(() => 'délai dépassé')

    test.skip(outcome === 'rate-limit', 'Limite d\'envoi d\'e-mails de Supabase atteinte (rate limit) : parcours sauté')
    // B1 : message de succès, pas d'erreur (aujourd'hui : fausse erreur 409).
    expect(outcome, 'résultat de l\'envoi du formulaire').toBe('success')
    await expect(success).toBeVisible()

    // Confirmation du compte par l'API admin (DEV uniquement).
    const admin = adminClient()
    const authUser = await findAuthUserByEmail(admin, email!)
    expect(authUser, 'le compte auth a été créé par le signUp').not.toBeNull()
    await confirmAccount(admin, authUser!.id)

    // B2 : profil complété, « En attente », avec les champs saisis.
    const { data: profile } = await admin.from('profiles').select('*').eq('id', authUser!.id).single()
    expect(profile?.status).toBe('En attente')
    expect(profile?.first_name).toBe('Jetable')
    expect(profile?.last_name).toBe('E2eParent')
    expect(profile?.gender).toBe('Homme')
    expect(profile?.birth_date).toBe('1985-04-12')
    expect(profile?.city).toBe('Dijon')
    expect(profile?.profile_completed_at, 'profile_completed_at renseigné').toBeTruthy()

    const { data: roles } = await admin.from('user_roles').select('role_code').eq('user_id', authUser!.id)
    expect((roles ?? []).map(r => r.role_code)).toContain('parent')

    const { data: links } = await admin.from('parent_access').select('child_id').eq('parent_id', authUser!.id)
    expect(links, 'un lien parent_access').toHaveLength(1)
    const { data: child } = await admin.from('profiles').select('first_name,status').eq('id', links![0].child_id).single()
    expect(child?.first_name).toBe('Enfant')
    expect(child?.status).toBe('En attente')

    // Connexion avec le compte jetable : /profil accessible, pas de complétion forcée, pas d'« Administration ».
    await page.context().clearCookies()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await login(page, email!, password, '/profil')
    await expect(page).toHaveURL(/\/profil/)
    await expect(page).not.toHaveURL(/completer-profil/)
    await userMenuButton(page).click()
    await expect(page.getByRole('menuitem', { name: 'Mon profil' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Administration' })).toHaveCount(0)
  })
})

// ── 2. Inscription avec l'email d'un compte existant (aucune écriture) ───────
test('inscription avec l\'email d\'un compte de test existant : message « déjà utilisée », pas de succès', async ({ page }) => {
  const existing = testAccount('adherent')
  test.skip(!existing, 'TEST_USERS_EMAIL / TEST_USERS_PASSWORD absents : compte de test requis')

  await chooseType(page, 'adult')
  await fillParent(page, {
    first: 'Doublon', last: 'E2e', birth: '1985-04-12', phone: '0600000000',
    email: existing!.email, password: `E2e!${randomUUID().slice(0, 8)}Aa1`,
  })
  await page.locator('form').getByRole('button', { name: "M'inscrire" }).click()

  const already = page.getByText(/déjà (utilisée|inscrite)/i)
  const rateLimited = rateLimitMessage(page)
  const outcome = await Promise.race([
    already.first().waitFor({ timeout: 30_000 }).then(() => 'doublon'),
    rateLimited.first().waitFor({ timeout: 30_000 }).then(() => 'rate-limit'),
    page.getByRole('heading', { name: 'Inscription envoyée !' }).waitFor({ timeout: 30_000 }).then(() => 'succès'),
  ]).catch(() => 'délai dépassé')

  test.skip(outcome === 'rate-limit', 'Limite d\'envoi d\'e-mails de Supabase atteinte : parcours sauté')
  expect(outcome).toBe('doublon')
  await expect(page.getByRole('heading', { name: 'Inscription envoyée !' })).toHaveCount(0)
})

// ── 3. Le formulaire avec enfant se remplit jusqu'au bouton final (aucun envoi) ──
test('inscription avec enfant : les étapes se remplissent jusqu\'au bouton final, sans envoi', async ({ page }) => {
  await chooseType(page, 'minor')
  await fillParent(page, {
    first: 'Jetable', last: 'E2eParent', birth: '1985-04-12', phone: '0600000000',
    email: 'personne+aucun-envoi@invalide.test', password: `E2e!${randomUUID().slice(0, 8)}Aa1`,
  })
  await page.locator('form').getByRole('button', { name: /Continuer/ }).click()
  await fillChild(page, 'Enfant', 'E2eParent', '2015-06-01')
  await expect(page.getByRole('button', { name: "Terminer l'inscription" })).toBeEnabled()
})

// ── 4. Admin : l'entrée « Administration » apparaît sans rechargement ────────
test('admin : après connexion sans rechargement, le menu affiche « Administration »', async ({ page }) => {
  const admin = testAccount('admin')
  test.skip(!admin, 'TEST_USERS_EMAIL / TEST_USERS_PASSWORD absents : compte de test requis')

  await login(page, admin!.email, admin!.password)
  await expect(page).toHaveURL(/\/$/)
  await expect(userMenuButton(page)).toBeVisible()
  await userMenuButton(page).click()
  await expect(page.getByRole('menuitem', { name: 'Mon profil' })).toBeVisible()
  // A3 / A4 : l'entrée apparaît dès que les rôles sont chargés, sans recharger la page.
  await expect(page.getByRole('menuitem', { name: 'Administration' })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as Record<string, boolean>).__e2eNoReload), 'la page ne doit pas avoir été rechargée').toBe(true)
})

// ── 5. Adhérent sans rôle bureau : pas d'entrée « Administration » ───────────
test('adhérent : le menu n\'affiche pas « Administration »', async ({ page }) => {
  const member = testAccount('adherent')
  test.skip(!member, 'TEST_USERS_EMAIL / TEST_USERS_PASSWORD absents : compte de test requis')

  await login(page, member!.email, member!.password)
  await expect(page).toHaveURL(/\/$/)
  await expect(userMenuButton(page)).toBeVisible()
  await userMenuButton(page).click()
  await expect(page.getByRole('menuitem', { name: 'Mon profil' })).toBeVisible()
  // Laisse le temps au chargement des rôles avant de constater l'absence.
  await page.waitForTimeout(2_000)
  await expect(page.getByRole('menuitem', { name: 'Administration' })).toHaveCount(0)
  // Le profil des comptes de test est complet : pas de renvoi vers la complétion.
  await expect(page).not.toHaveURL(/completer-profil/)
})
