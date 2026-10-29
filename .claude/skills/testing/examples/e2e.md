# Parcours e2e (Playwright) — agent `e2e`

Modèle : `e2e/smoke.spec.ts`. Config : `playwright.config.ts` (build + `nuxt preview` HTTP sur le port 3100 ; `E2E_SKIP_BUILD=1` réutilise `.output/`).

```ts
import { test, expect } from '@playwright/test'

// Parcours tiré de spec.md § Parcours utilisateur : « un parent inscrit son enfant à une sortie »
test.describe('parcours : inscription à une sortie', () => {
  test.skip(!process.env.E2E_USER_EMAIL, 'E2E_USER_EMAIL / E2E_USER_PASSWORD absents : compte de test requis')
  test.skip(process.env.E2E_ALLOW_WRITES !== '1', 'Parcours qui écrit en base : E2E_ALLOW_WRITES=1 requis (environnement de test uniquement)')

  test('le parent voit la sortie confirmée', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('input-login-email').fill(process.env.E2E_USER_EMAIL!)
    await page.getByTestId('input-login-password').fill(process.env.E2E_USER_PASSWORD!)
    await page.getByTestId('btn-login-submit').click()
    await expect(page).toHaveURL(/mes-inscriptions|profil/)
    // …
  })
})
```

## Règles
- **Sélecteurs** : `getByTestId`, puis `getByRole` ou `getByLabel`. Jamais de texte venant de Storyblok, jamais de classes Tailwind. Si un `data-testid` manque, le demander à l'agent de dev ; ne pas modifier l'app soi-même.
- **Lecture seule par défaut.** Un parcours qui écrit (inscription, paiement) est gardé par `E2E_ALLOW_WRITES=1`, et n'est **jamais** lancé contre la base de production.
- **HelloAsso** : **aucun appel, même en sandbox**. Un parcours dont le serveur appellerait HelloAsso (init checkout, synchronisation) n'est pas testé en e2e. On s'arrête **avant** le bouton qui le déclencherait (bouton visible et actif), ou on part d'un état de test déjà payé. Le reste est couvert par Vitest (fixtures) et par un scénario manuel en sandbox dans `docs/test-plan.md`.
- **Un test = un parcours de la spec**, nommé comme dans la spec.
- **Logs et traces** : ils restent dans `test-results/` et `playwright-report/` ; ne pas les recopier.
- **Relancer vite** : `E2E_SKIP_BUILD=1 npx playwright test e2e/<fichier>.spec.ts`. Refaire un build complet seulement si le code de l'app a changé.
