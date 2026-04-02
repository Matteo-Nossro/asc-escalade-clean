/**
 * Tests E2E — Gestion des groupes (GroupsList + GroupModal + GroupMembersModal)
 */
import { test, expect } from '@playwright/test'
import {
  adminSupabase,
  seedUser,
  seedGroup,
  seedPendingEnrollment,
  cleanupUser,
  cleanupGroup,
} from './fixtures/supabase'

const FEATURE = 'groups'
const email = (scenario: string) => `e2e-${FEATURE}-${scenario}@test.asc-escalade.fr`
const groupName = (scenario: string) => `[E2E] ${scenario}`

// ─── Création de groupe ───────────────────────────────────────────────────────

test('crée un groupe et vérifie son existence en DB', async ({ page }) => {
  const name = groupName('creation')
  let createdGroupId: string | null = null

  try {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // ACT — ouvrir le modal groupe
    await page.getByRole('button', { name: 'Nouveau groupe' }).click()
    await expect(page.getByTestId('input-group-name')).toBeVisible()

    await page.getByTestId('input-group-name').fill(name)
    await page.getByTestId('btn-group-submit').click()

    // ASSERT UI — modal fermé
    await expect(page.getByTestId('input-group-name')).not.toBeVisible({ timeout: 5_000 })

    // ASSERT DB
    const { data } = await adminSupabase
      .from('groups')
      .select('id, name')
      .eq('name', name)
      .maybeSingle()
    expect(data).not.toBeNull()
    expect(data?.name).toBe(name)
    createdGroupId = data?.id ?? null
  } finally {
    if (createdGroupId) await cleanupGroup(createdGroupId)
    else await adminSupabase.from('groups').delete().eq('name', name)
  }
})

// ─── Modification de groupe ───────────────────────────────────────────────────

test('modifie le nom d\'un groupe existant et vérifie en DB', async ({ page }) => {
  // ARRANGE
  const group = await seedGroup({ name: groupName('edit-before') })

  try {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // ACT
    await page.getByTestId(`btn-group-edit-${group.id}`).click()
    await expect(page.getByTestId('input-group-name')).toBeVisible()

    await page.getByTestId('input-group-name').clear()
    await page.getByTestId('input-group-name').fill(groupName('edit-after'))
    await page.getByTestId('btn-group-submit').click()

    await expect(page.getByTestId('input-group-name')).not.toBeVisible({ timeout: 5_000 })

    // ASSERT DB
    const { data } = await adminSupabase
      .from('groups')
      .select('name')
      .eq('id', group.id)
      .single()
    expect(data?.name).toBe(groupName('edit-after'))
  } finally {
    await cleanupGroup(group.id)
  }
})

// ─── Suppression de groupe ────────────────────────────────────────────────────

test('supprime un groupe et vérifie la suppression en DB', async ({ page }) => {
  // ARRANGE
  const group = await seedGroup({ name: groupName('delete') })

  await page.goto('/admin/dashboard')
  await page.waitForLoadState('networkidle')

  // ACT
  page.on('dialog', dialog => dialog.accept())
  await page.getByTestId(`btn-group-delete-${group.id}`).click()
  await page.waitForTimeout(1_000)

  // ASSERT UI
  await expect(page.getByTestId(`group-row-${group.id}`)).not.toBeVisible()

  // ASSERT DB
  const { data } = await adminSupabase
    .from('groups')
    .select('id')
    .eq('id', group.id)
    .maybeSingle()
  expect(data).toBeNull()
})

// ─── Modal membres du groupe ──────────────────────────────────────────────────

test('affiche la liste des membres d\'un groupe', async ({ page }) => {
  // ARRANGE
  const memberEmail = email('group-member-view')
  const group = await seedGroup({ name: groupName('members-view') })
  const member = await seedUser({ email: memberEmail, fullName: 'Membre Groupe' })
  await seedPendingEnrollment({ groupId: group.id, userId: member.id })

  // Confirmer l'inscription manuellement pour qu'elle apparaisse
  await adminSupabase
    .from('group_members')
    .update({ status: 'confirmed' })
    .eq('group_id', group.id)
    .eq('user_id', member.id)

  try {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // ACT
    await page.getByTestId(`btn-group-members-${group.id}`).click()

    // ASSERT UI — le nom du membre apparaît dans le modal
    await expect(page.getByText('Membre Groupe')).toBeVisible({ timeout: 5_000 })
  } finally {
    await cleanupGroup(group.id)
    await cleanupUser(memberEmail)
  }
})

test('retire un membre d\'un groupe et vérifie en DB', async ({ page }) => {
  // ARRANGE
  const memberEmail = email('remove-from-group')
  const group = await seedGroup({ name: groupName('remove-member') })
  const member = await seedUser({ email: memberEmail, fullName: 'A Retirer Groupe' })
  const enrollmentId = await seedPendingEnrollment({ groupId: group.id, userId: member.id })
  await adminSupabase
    .from('group_members')
    .update({ status: 'confirmed' })
    .eq('id', enrollmentId)

  try {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // ACT — ouvrir modal membres
    await page.getByTestId(`btn-group-members-${group.id}`).click()
    await expect(page.getByText('A Retirer Groupe')).toBeVisible({ timeout: 5_000 })

    // Cliquer sur le bouton retirer (i-lucide-user-minus)
    await page.getByRole('button', { name: /retirer|user-minus/i }).first().click()
    await page.waitForTimeout(1_000)

    // ASSERT UI — le membre a disparu de la liste
    await expect(page.getByText('A Retirer Groupe')).not.toBeVisible()

    // ASSERT DB
    const { data } = await adminSupabase
      .from('group_members')
      .select('id')
      .eq('id', enrollmentId)
      .maybeSingle()
    expect(data).toBeNull()
  } finally {
    await cleanupGroup(group.id)
    await cleanupUser(memberEmail)
  }
})
