/**
 * Tests E2E — Authentification & guard admin
 */
import { test, expect } from '@playwright/test'

// Ces tests tournent SANS session sauvegardée (pas de storageState)
// pour tester les redirections et le guard admin.
test.use({ storageState: { cookies: [], origins: [] } })

test('redirige vers /login si non connecté sur /admin/dashboard', async ({ page }) => {
  // ACT
  await page.goto('/admin/dashboard')

  // ASSERT
  await expect(page).toHaveURL(/\/login/)
})

test('redirige vers / si connecté sans rôle admin', async ({ page }) => {
  // ARRANGE : connexion avec un compte sans rôle admin
  // Ce compte doit exister dans la DB de test (créé manuellement ou en globalSetup)
  const email = process.env.TEST_ADMIN_EMAIL ?? ''
  // NOTE : pour tester un non-admin, créer un compte dédié dans .env.test
  // TEST_USER_EMAIL / TEST_USER_PASSWORD — skippé si non configuré
  const userEmail = process.env.TEST_USER_EMAIL
  const userPassword = process.env.TEST_USER_PASSWORD

  if (!userEmail || !userPassword) {
    test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD non configurés')
    return
  }

  await page.goto('/login')
  await page.getByTestId('input-login-email').fill(userEmail)
  await page.getByTestId('input-login-password').fill(userPassword)
  await page.getByTestId('btn-login-submit').click()

  // Le middleware doit rejeter et rediriger vers /
  await expect(page).toHaveURL(/^\/$|^\/(?!admin)/, { timeout: 8_000 })
})

test('affiche une erreur si les credentials sont incorrects', async ({ page }) => {
  // ACT
  await page.goto('/login')
  await page.getByTestId('input-login-email').fill('inconnu@example.com')
  await page.getByTestId('input-login-password').fill('mauvais-mot-de-passe')
  await page.getByTestId('btn-login-submit').click()

  // ASSERT — UAlert visible avec texte d'erreur
  await expect(page.getByText('Email ou mot de passe incorrect')).toBeVisible({ timeout: 6_000 })
  await expect(page).toHaveURL(/\/login/)
})
