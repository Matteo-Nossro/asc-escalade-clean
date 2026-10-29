import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'

// Feature auth-profils, R2 (c, e) — retour d'un lien d'e-mail invalide ou expiré.
// Lecture seule : aucune écriture, AUCUN e-mail envoyé, aucun compte requis.
// Le bouton de renvoi (btn-resend-confirmation) est seulement vérifié visible :
// NE JAMAIS cliquer dessus (il enverrait un e-mail réel et consommerait le quota du dev).

const ERROR_PARAMS = 'error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
// Apostrophe droite ou typographique.
const LINK_INVALID = /n.est plus valide/i

test.describe('retour d\'un lien d\'e-mail invalide (R2-c, R2-e)', () => {
  test('lien déjà envoyé : / avec erreur en query est renvoyé vers /callback avec le message', async ({ page }) => {
    await page.goto(`/?${ERROR_PARAMS}`)

    await expect(page).toHaveURL(/\/callback/)
    const message = page.getByTestId('callback-link-error')
    await expect(message).toBeVisible()
    await expect(message).toContainText(LINK_INVALID)
    // Aucune redirection : on reste sur /callback (l'attente de la page est de 500 ms).
    await page.waitForTimeout(1_500)
    await expect(page).toHaveURL(/\/callback/)
    await expect(message).toBeVisible()
  })

  test('/callback avec l\'erreur dans le hash : même message, sans redirection', async ({ page }) => {
    await page.goto(`/callback#${ERROR_PARAMS}`)

    const message = page.getByTestId('callback-link-error')
    await expect(message).toBeVisible()
    await expect(message).toContainText(LINK_INVALID)
    await page.waitForTimeout(1_500)
    await expect(page).toHaveURL(/\/callback/)
    await expect(message).toBeVisible()
  })

  test('« Se connecter » mène à /login', async ({ page }) => {
    await page.goto(`/callback#${ERROR_PARAMS}`)

    const login = page.getByTestId('btn-callback-login')
    await expect(login).toBeVisible()
    await login.click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('le formulaire de renvoi est présent (visible seulement, jamais cliqué)', async ({ page }) => {
    await page.goto(`/callback#${ERROR_PARAMS}`)

    await expect(page.getByTestId('callback-link-error')).toBeVisible()
    await expect(page.getByTestId('input-resend-email')).toBeVisible()
    // Contrôle de visibilité uniquement : un clic enverrait un vrai e-mail.
    await expect(page.getByTestId('btn-resend-confirmation')).toBeVisible()
  })
})

// Feature auth-profils, R2c — retour `?code=` (flux PKCE) sur une autre page que /callback
// (Supabase retombe sur la Site URL). Lecture seule, sans e-mail : le code est un UUID
// aléatoire que Supabase refuse (aucun vérificateur PKCE, aucun compte touché).
test.describe('retour ?code= hors /callback (R2c)', () => {
  test('/?code=<UUID> passe par /callback puis arrive sur /login en moins de 5 s', async ({ page }) => {
    const seen: { url: string, at: number }[] = []
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) seen.push({ url: frame.url(), at: Date.now() })
    })

    // Aucun `type` dans la query : un code sans type n'est pas une inscription confirmée.
    await page.goto(`/?code=${randomUUID()}`)

    // R2c-1 : la route est renvoyée vers /callback (query conservée).
    await expect(page).toHaveURL(/\/callback/)

    // R2c-2 : l'échange est refusé, sans message d'erreur, et on finit sur /login.
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })

    const callback = seen.find(n => /\/callback/.test(n.url))
    const login = seen.find(n => /\/login/.test(n.url))
    expect(callback, 'la navigation doit passer par /callback').toBeTruthy()
    expect(login, 'la navigation doit arriver sur /login').toBeTruthy()
    expect(login!.at - callback!.at).toBeLessThan(5_000)
    await expect(page.getByTestId('callback-link-error')).toHaveCount(0)
  })

  test('/?code=abc (pas un UUID) reste sur / sans redirection vers /callback', async ({ page }) => {
    const visited: string[] = []
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) visited.push(frame.url())
    })

    await page.goto('/?code=abc')
    // Laisse le temps à une redirection serveur ou cliente (hydratation) d'avoir lieu.
    await page.waitForTimeout(2_000)

    const url = new URL(page.url())
    expect(url.pathname).toBe('/')
    expect(url.searchParams.get('code')).toBe('abc')
    expect(visited.some(u => /\/callback/.test(u))).toBe(false)
  })
})
