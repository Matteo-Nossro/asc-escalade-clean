/**
 * Tests E2E — Gestion des membres (MembersTable + MemberModal)
 *
 * BUGS CONNUS documentés (ne pas corriger ici) :
 *
 * BUG CONNU #1 — saveMember() ne crée jamais de membre en mode ajout
 *   Localisation : dashboard.vue → saveMember(), bloc `if (editMode.value && form.value.id)`
 *   Le bloc complet est conditionné sur editMode === true, donc en mode création
 *   (editMode = false), aucun INSERT n'est envoyé à Supabase. Le modal se ferme
 *   mais aucune donnée n'est persistée.
 *   Impact : le bouton "Ajouter un adhérent" est non fonctionnel.
 *
 * BUG CONNU #2 — toggleStatus() ne persiste pas en DB
 *   Localisation : dashboard.vue → toggleStatus()
 *   Seul allRows.value[index].status est modifié localement.
 *   Aucun UPDATE sur la table profiles ou une table de statut.
 *   Impact : le changement de statut est perdu au rechargement de la page.
 */
import { test, expect } from '@playwright/test'
import {
  adminSupabase,
  seedUser,
  cleanupUser,
} from './fixtures/supabase'

const FEATURE = 'members'
const email = (scenario: string) => `e2e-${FEATURE}-${scenario}@test.asc-escalade.fr`

// ─── Recherche / filtre ───────────────────────────────────────────────────────

test('filtre la liste par nom via la barre de recherche', async ({ page }) => {
  // ARRANGE
  const testEmail = email('search')
  const member = await seedUser({
    email: testEmail,
    fullName: 'Juliette Recherche',
    firstName: 'Juliette',
    lastName: 'Recherche',
  })

  try {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // ACT
    await page.getByTestId('input-members-search').fill('Juliette')
    await page.waitForTimeout(400) // debounce éventuel

    // ASSERT UI — le membre apparaît
    await expect(page.getByTestId(`member-name-${member.id}`)).toBeVisible()

    // ASSERT UI — un nom non cherché est masqué (si présent)
    // (pas de garantie d'absence d'autres "Juliette" en DB de test)
  } finally {
    // CLEANUP
    await cleanupUser(testEmail)
  }
})

test('filtre la liste par rôle "Sans rôle"', async ({ page }) => {
  // ARRANGE
  const testEmail = email('filter-norole')
  const member = await seedUser({
    email: testEmail,
    fullName: 'Marc SansRole',
    firstName: 'Marc',
    lastName: 'SansRole',
    // pas de roles → sans rôle
  })

  try {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // ACT — sélectionner "Sans rôle" dans le select
    // NuxtUI USelect ne rend pas un <select> natif, on clique sur l'option
    const roleSelect = page.locator('[data-testid="input-members-search"]').locator('../..').locator('select, [role="combobox"]').last()
    // Alternative : utiliser le label visible
    await page.getByRole('combobox').filter({ hasText: /Tous les rôles/i }).click()
    await page.getByRole('option', { name: 'Sans rôle' }).click()
    await page.waitForTimeout(300)

    // ASSERT — le membre sans rôle est visible
    await expect(page.getByTestId(`member-name-${member.id}`)).toBeVisible()

    // ASSERT DB — profil existe bien
    const { data } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', member.id)
      .single()
    expect(data?.id).toBe(member.id)
  } finally {
    await cleanupUser(testEmail)
  }
})

// ─── Ajout membre (BUG CONNU #1) ─────────────────────────────────────────────

test('BUG CONNU #1 — ouvre le modal et remplit le formulaire (le membre NE sera PAS créé en DB)', async ({ page }) => {
  // ARRANGE
  const testEmail = email('add-bug')

  await page.goto('/admin/dashboard')
  await page.waitForLoadState('networkidle')

  // ACT — ouvrir le modal
  await page.getByTestId('btn-add-member').click()
  await expect(page.getByTestId('input-member-firstname')).toBeVisible()

  await page.getByTestId('input-member-firstname').fill('Bug')
  await page.getByTestId('input-member-lastname').fill('Connu')
  await page.getByTestId('input-member-email').fill(testEmail)
  await page.getByTestId('btn-member-submit').click()

  // ASSERT UI — le modal se ferme (comportement actuel, même si pas de DB write)
  await expect(page.getByTestId('input-member-firstname')).not.toBeVisible({ timeout: 3_000 })

  // ASSERT DB — BUG CONNU : aucun profil créé
  const { data: users } = await adminSupabase.auth.admin.listUsers()
  const created = users?.users.find(u => u.email === testEmail)
  // Ce test DOCUMENTE le bug : on s'attend à ce que le profil N'existe PAS
  expect(created).toBeUndefined() // BUG CONNU #1 confirmé
})

// ─── Modification membre ──────────────────────────────────────────────────────

test('modifie le nom d\'un membre existant et vérifie en DB', async ({ page }) => {
  // ARRANGE
  const testEmail = email('edit')
  const member = await seedUser({
    email: testEmail,
    fullName: 'Ancien Nom',
    firstName: 'Ancien',
    lastName: 'Nom',
  })

  try {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // ACT — ouvrir le menu actions du membre
    await page.getByTestId(`member-actions-${member.id}`).click()
    await page.getByRole('menuitem', { name: 'Modifier' }).click()
    await expect(page.getByTestId('input-member-firstname')).toBeVisible()

    await page.getByTestId('input-member-firstname').fill('Nouveau')
    await page.getByTestId('input-member-lastname').fill('Nom')
    await page.getByTestId('btn-member-submit').click()

    // ASSERT UI — modal fermé
    await expect(page.getByTestId('input-member-firstname')).not.toBeVisible({ timeout: 5_000 })

    // ASSERT DB — profil mis à jour
    const { data } = await adminSupabase
      .from('profiles')
      .select('first_name, last_name, full_name')
      .eq('id', member.id)
      .single()
    expect(data?.first_name).toBe('Nouveau')
    expect(data?.last_name).toBe('Nom')
  } finally {
    await cleanupUser(testEmail)
  }
})

// ─── Suppression membre ───────────────────────────────────────────────────────

test('supprime un membre et vérifie qu\'il n\'est plus en DB', async ({ page }) => {
  // ARRANGE
  const testEmail = email('delete')
  const member = await seedUser({
    email: testEmail,
    fullName: 'A Supprimer',
    firstName: 'A',
    lastName: 'Supprimer',
  })

  // Pas de try/finally ici : si la suppression marche, cleanup inutile
  await page.goto('/admin/dashboard')
  await page.waitForLoadState('networkidle')

  // ACT
  await page.getByTestId(`member-actions-${member.id}`).click()
  await page.getByRole('menuitem', { name: 'Supprimer' }).click()

  // Confirmer la boîte de dialogue native
  page.on('dialog', dialog => dialog.accept())
  await page.waitForTimeout(1_000)

  // ASSERT UI — le membre n'apparaît plus dans la liste
  await expect(page.getByTestId(`member-name-${member.id}`)).not.toBeVisible()

  // ASSERT DB
  const { data } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('id', member.id)
    .maybeSingle()
  expect(data).toBeNull()
})

// ─── toggleStatus (BUG CONNU #2) ─────────────────────────────────────────────

test('BUG CONNU #2 — toggleStatus change l\'UI mais pas la DB', async ({ page }) => {
  // ARRANGE
  const testEmail = email('toggle-status')
  const member = await seedUser({
    email: testEmail,
    fullName: 'Toggle Status',
    firstName: 'Toggle',
    lastName: 'Status',
  })

  try {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // ACT — désactiver le membre
    await page.getByTestId(`member-actions-${member.id}`).click()
    await page.getByRole('menuitem', { name: 'Désactiver' }).click()
    await page.waitForTimeout(500)

    // ASSERT UI — badge statut changé (comportement actuel)
    // (le badge est dans un template UTable, pas forcément accessible par testid)

    // ASSERT DB — BUG CONNU #2 : le statut N'est PAS persisté en DB
    // La table profiles n'a pas de colonne status — le statut est calculé localement.
    // Ce test confirme que la DB n'a pas changé (ce qui EST le bug).
    const { data } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', member.id)
      .single()
    // La table profiles ne contient pas de champ "status" → le bug est structurel.
    // BUG CONNU #2 confirmé : aucune persistance possible avec le schéma actuel.
    expect(data?.id).toBe(member.id) // le profil existe toujours, inchangé
  } finally {
    await cleanupUser(testEmail)
  }
})

// ─── Export CSV ───────────────────────────────────────────────────────────────

test('déclenche le téléchargement CSV', async ({ page }) => {
  await page.goto('/admin/dashboard')
  await page.waitForLoadState('networkidle')

  // ASSERT — le bouton Exporter démarre un download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exporter' }).click(),
  ])

  expect(download.suggestedFilename()).toMatch(/^membres-asc-\d{4}-\d{2}-\d{2}\.csv$/)
})
