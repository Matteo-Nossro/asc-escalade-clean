/**
 * Setup global Playwright : connexion admin une seule fois, session sauvegardée dans .auth/admin.json.
 * Tous les tests dans le projet 'chromium' réutilisent cette session.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const AUTH_FILE = '.auth/admin.json'

setup('connexion admin de test', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD doivent être définis dans .env.test')
  }

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.getByTestId('input-login-email').fill(email)
  await page.getByTestId('input-login-password').fill(password)
  await page.getByTestId('btn-login-submit').click()

  // Attendre la redirection vers le dashboard
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 })

  // Sauvegarder la session (cookies + localStorage)
  const dir = path.dirname(AUTH_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  await page.context().storageState({ path: AUTH_FILE })
})
