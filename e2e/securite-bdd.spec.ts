import { test, expect } from '@playwright/test'
import { assertDevProject } from './support/dev-db'
import { expectedDirectoryNames, type ExpectedDirectory } from './support/dev-directory'

// Parcours tiré de docs/features/securite-bdd/spec.md § Parcours utilisateur :
// « Visiteur anonyme → page publique avec le blok liste-groupe-accordeon → les noms
// du référent et des moniteurs s'affichent (lecture seule, aucune écriture). »
//
// Garde-fou de NON-RÉGRESSION : vert avant comme après les migrations A et B
// (la vue member_directory change de définition, pas son résultat pour useGroups).
// Lecture seule : la clé service role du DEV ne sert qu'à lire les noms attendus.

const PAGE = '/tarifs'

test.describe('parcours : annuaire des groupes lu par un visiteur anonyme (securite-bdd)', () => {
  let expected: ExpectedDirectory

  test.beforeAll(async () => {
    try {
      assertDevProject()
    }
    catch (e) {
      test.skip(true, `Projet DEV non configuré ou non reconnu : ${(e as Error).message}`)
    }
    expected = await expectedDirectoryNames()
  })

  test('le visiteur voit le référent et les moniteurs, sans aucune écriture sur member_directory', async ({ page }) => {
    test.skip(
      !expected.referents.length && !expected.instructors.length,
      'Le DEV ne contient aucun référent ni moniteur de groupe : parcours non exerçable',
    )

    const directoryRequests: { method: string, url: string, status?: number }[] = []
    page.on('request', (req) => {
      if (req.url().includes('/rest/v1/member_directory')) {
        directoryRequests.push({ method: req.method(), url: req.url() })
      }
    })
    page.on('response', (res) => {
      if (res.url().includes('/rest/v1/member_directory')) {
        const entry = directoryRequests.find(r => r.url === res.url() && r.status === undefined)
        if (entry) entry.status = res.status()
      }
    })

    // Visiteur anonyme : contexte Playwright neuf, aucune connexion.
    const response = await page.goto(PAGE)
    expect(response?.status()).toBe(200)

    const blok = page.locator('#creneaux')
    await expect(blok, 'le blok liste-groupe-accordeon (#creneaux) doit être présent sur ' + PAGE).toBeVisible()

    // Les sections (tranches d'âge) apparaissent après le chargement client des groupes.
    const sectionToggles = blok.getByRole('button')
    await expect(sectionToggles.first()).toBeVisible()

    // Déplie toutes les sections : le bouton est replié tant qu'on n'a pas cliqué.
    const count = await sectionToggles.count()
    for (let i = 0; i < count; i++) {
      await sectionToggles.nth(i).click()
    }

    for (const name of [...expected.referents, ...expected.instructors]) {
      await expect(blok, `le nom « ${name} » doit s'afficher`).toContainText(name)
    }

    // Lecture seule : la vue est lue (au moins un GET), jamais écrite.
    expect(directoryRequests.length, 'au moins une lecture de member_directory').toBeGreaterThan(0)
    expect(directoryRequests.filter(r => r.method !== 'GET')).toEqual([])
    for (const r of directoryRequests) {
      expect(r.status, 'member_directory doit répondre 2xx à l\'anonyme').toBeLessThan(300)
    }
  })
})
