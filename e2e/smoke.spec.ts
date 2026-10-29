import { test, expect } from '@playwright/test'

// Tests de fumée en lecture seule : aucune connexion, aucune écriture.
// `/` et `/tarifs` dépendent de l'API Storyblok (token + STORYBLOK_VERSION du .env).

test('accueil : la page se charge et affiche un titre', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page.locator('h1').first()).toBeVisible()
})

test('tarifs : le contenu est visible', async ({ page }) => {
  const response = await page.goto('/tarifs')
  expect(response?.status()).toBe(200)
  await expect(page.locator('main h1, main h2').first()).toBeVisible()
})

test('login : formulaire de connexion affiché', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByTestId('input-login-email')).toBeVisible()
  await expect(page.getByTestId('input-login-password')).toBeVisible()
  await expect(page.getByTestId('btn-login-submit')).toBeVisible()
})
