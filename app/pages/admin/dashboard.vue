<template>
  <!-- Loading auth -->
  <div v-if="!authReady" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="flex flex-col items-center gap-6">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-[#7FD857] rounded-2xl shadow-lg">
        <UIcon name="i-lucide-mountain" class="w-8 h-8 text-[#0F1729]" />
      </div>
      <div class="w-8 h-8 border-3 border-gray-200 border-t-[#7FD857] rounded-full animate-spin" />
      <p class="text-gray-500 text-sm font-medium">Chargement de l'espace admin…</p>
    </div>
  </div>

  <div v-else class="min-h-screen bg-gray-50 p-4 md:p-8 page-content">

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Administration</h1>
      <p class="text-gray-500">Gérez les adhérents et les inscriptions du club.</p>
    </div>

    <!-- KPI -->
    <AdminKpiCards :stats="stats" />

    <!-- Demandes en attente -->
    <AdminPendingRequests
      :requests="pendingRequests"
      :processing-request-id="processingReviewId"
      :readonly="isReadOnly"
      @open-review="openReviewModal"
      @refresh="fetchPendingRequests"
    />

    <!-- Table des membres -->
    <AdminMembersTable
      :rows="filteredRows"
      :total-count="filteredTotal"
      :pending="pending"
      :search="search"
      :role-filter="roleFilter"
      :role-filter-options="roleFilterOptions"
      :group-filter="groupFilter"
      :group-filter-options="groupFilterOptions"
      :status-filter="statusFilter"
      :status-filter-options="statusFilterOptions"
      :page="page"
      :page-count="pageCount"
      :readonly="isReadOnly"
      @update:search="search = $event; page = 1"
      @update:role-filter="roleFilter = $event; page = 1"
      @update:group-filter="groupFilter = $event; page = 1"
      @update:status-filter="statusFilter = $event; page = 1"
      @update:page="page = $event"
      @add-member="openMemberModal(null)"
      @open-modal="openMemberModal"
      @toggle-status="toggleStatus"
      @delete="deleteMember"
      @export-csv="exportCSV"
      @refresh="loadMembers"
    />

    <!-- Groupes -->
    <AdminGroupsList
      :groups="adminGroups"
      :loading="groupsLoading"
      :format-schedule="formatScheduleAdmin"
      :readonly="isReadOnly"
      @open-modal="openGroupModal"
      @show-members="showGroupMembersModal"
      @delete="handleDeleteGroup"
      @refresh="loadAdminGroups"
    />

    <!-- Modal membre -->
    <AdminModalsMemberModal
      :open="isModalOpen"
      :edit-mode="editMode"
      :form="memberForm"
      :saving="saving"
      :licence-type-options="licenceTypeOptions"
      :group-select-options="groupSelectOptions"
      :available-roles="availableRoles"
      :linkable-children="linkableChildrenOptions"
      :child-to-link="childToLink"
      @update:open="isModalOpen = $event"
      @save="saveMember"
      @update:child-to-link="childToLink = $event"
      @add-child="addChildLink"
      @remove-child="removeChildLink"
    />

    <!-- Modal groupe -->
    <AdminModalsGroupModal
      :open="isGroupModalOpen"
      :editing-group="editingGroup"
      :group-form="groupForm"
      :saving-group="savingGroup"
      :member-select-options="memberSelectOptions"
      :available-instructor-options="availableInstructorOptions"
      :instructor-to-add="instructorToAdd"
      @update:open="isGroupModalOpen = $event"
      @save="saveGroup"
      @update:instructor-to-add="instructorToAdd = $event"
      @add-instructor="addInstructor"
      @remove-instructor="removeInstructor"
      @add-schedule="addScheduleRow"
      @remove-schedule="groupForm.schedules.splice($event, 1)"
    />

    <!-- Modal membres d'un groupe -->
    <AdminModalsGroupMembersModal
      :open="isGroupMembersModalOpen"
      :title="groupMembersTitle"
      :members="groupMembersList"
      :loading="loadingGroupMembers"
      :removing-member-id="removingMemberId"
      :is-initiateur="isReadOnly"
      @update:open="isGroupMembersModalOpen = $event"
      @remove-member="removeMemberFromGroup"
    />

    <!-- Modal validation demande -->
    <AdminModalsReviewModal
      :open="isReviewModalOpen"
      :request="reviewRequest"
      :action="reviewAction"
      :note="reviewNote"
      :processing="!!processingReviewId"
      :email-preview="emailPreview"
      @update:open="isReviewModalOpen = $event"
      @update:note="reviewNote = $event"
      @confirm="confirmReview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { AdherentWithRoles, Group, GroupMember } from '~/types/auth'
import type { EnrollmentRequest } from '~/composables/useEnrollmentRequests'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()

// ── Auth guard ────────────────────────────────────────────────────────────────
const authReady = ref(false)
const isReadOnly = ref(false)

onMounted(async () => {
  const uid = user.value?.id ?? (user.value as any)?.sub
  if (!uid) {
    await navigateTo('/login', { query: { redirect: useRoute().fullPath } })
    return
  }
  const { data } = await supabase
    .from('user_roles')
    .select('role_code')
    .eq('user_id', uid)
    .in('role_code', ['admin', 'secretary', 'initiateur'])
  if (!data || data.length === 0) {
    await navigateTo('/')
    return
  }
  isReadOnly.value = !data.some((r: { role_code: string }) => r.role_code === 'admin' || r.role_code === 'secretary')
  authReady.value = true
  await Promise.all([loadMembers(), loadAdminGroups(), fetchPendingRequests()])
})

// ── Members ───────────────────────────────────────────────────────────────────
const allRows = ref<AdherentWithRoles[]>([])
const pending = ref(true)

function profileToAdherentWithRoles(p: any): AdherentWithRoles {
  const roles = (p.roles || []).map((r: any) => r.role_code)
  const confirmedMemberships = (p.memberships || []).filter(
    (m: any) => m.status === 'confirmed' && m.group,
  )
  const groupNames = confirmedMemberships.map((m: any) => m.group.name)
  const groupIds = confirmedMemberships.map((m: any) => m.group.id as string)
  const groupId = groupIds[0] || ''
  return {
    id: p.id,
    name: p.first_name && p.last_name
      ? `${p.first_name} ${p.last_name}`
      : p.full_name || 'Sans nom',
    first_name: p.first_name || '',
    last_name: p.last_name || '',
    licence: p.licence_number ? String(p.licence_number) : '-',
    email: p.email || '',
    formule: p.licence_type || '-',
    creneau: groupNames[0] || '-',
    status: p.status || 'Actif',
    roles,
    groupId,
    groupIds,
    groupNames,
    linkedChildren: [],
    payment_done: p.payment_done ?? false,
    registration_form: p.registration_form ?? false,
    _profile: p,
  }
}

async function loadMembers() {
  pending.value = true
  try {
    const res = await fetch('/api/admin/members')
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.statusMessage || body.message || `Erreur ${res.status}`)
    }
    const data = await res.json()
    allRows.value = (data || []).map(profileToAdherentWithRoles)
  } catch (e: any) {
    console.error('Erreur chargement membres:', e.message)
  } finally {
    pending.value = false
  }
}

// ── KPI ───────────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  totalMembres: allRows.value.length,
  licencesActives: allRows.value.filter(r => r.licence !== '-').length,
  placesDispo: Math.max(0, 180 - allRows.value.length),
  totalPlaces: 180,
  inscriptionsAttente: pendingRequests.value.length,
}))

// ── Search / Filter / Pagination ──────────────────────────────────────────────
const search = ref('')
const roleFilter = ref<string | null>(null)
const groupFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)
const page = ref(1)
const pageCount = 10

const roleFilterOptions = [
  { label: 'Tous les rôles', value: null },
  { label: 'Admin', value: 'admin' },
  { label: 'Secrétaire', value: 'secretary' },
  { label: 'Initiateur', value: 'initiateur' },
  { label: 'Parent', value: 'parent' },
]

const groupFilterOptions = computed(() => [
  { label: 'Tous les groupes', value: null as string | null },
  ...adminGroups.value.map((g: any) => ({ label: g.name, value: g.id as string | null })),
])

const statusFilterOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'Actif', value: 'Actif' },
  { label: 'Inactif', value: 'Inactif' },
  { label: 'En attente', value: 'En attente' },
]

const filteredAndSorted = computed(() => {
  let data = allRows.value
  if (search.value) {
    const q = search.value.toLowerCase()
    data = data.filter(r =>
      `${r.name} ${r.email} ${r.licence}`.toLowerCase().includes(q),
    )
  }
  if (roleFilter.value) {
    data = data.filter(r => r.roles.includes(roleFilter.value as any))
  }
  if (groupFilter.value) {
    data = data.filter(r => r.groupIds.includes(groupFilter.value as string))
  }
  if (statusFilter.value) {
    data = data.filter(r => r.status === statusFilter.value)
  }
  return data
})

const filteredRows = computed(() => {
  const start = (page.value - 1) * pageCount
  return filteredAndSorted.value.slice(start, start + pageCount)
})

const filteredTotal = computed(() => filteredAndSorted.value.length)

// ── Groups ────────────────────────────────────────────────────────────────────
const {
  groups: adminGroups,
  loading: groupsLoading,
  fetchGroups: loadAdminGroups,
  formatSchedule: formatScheduleAdmin,
  createGroup,
  updateGroup,
  deleteGroup,
  replaceSchedules,
  setInstructors,
  fetchGroupMembers,
} = useGroups()

// ── Pending Requests ──────────────────────────────────────────────────────────
const { pendingRequests, fetchPendingRequests, approveRequest, rejectRequest } = useEnrollmentRequests()

// ── Member Modal ──────────────────────────────────────────────────────────────
const isModalOpen = ref(false)
const editMode = ref(false)
const saving = ref(false)
const childToLink = ref<string | null>(null)

const memberForm = ref({
  id: '',
  first_name: '',
  last_name: '',
  name: '',
  licence: '',
  email: '',
  formule: 'Aucune licence',
  creneau: '-',
  status: 'Actif' as 'Actif' | 'Inactif' | 'En attente',
  roles: [] as string[],
  groupIds: [] as string[],
  linkedChildren: [] as { id: string; name: string; linkId: string }[],
  birth_date: null as string | null,
  payment_done: false,
  medical_certificate: null as string | null,
  registration_form: false,
  ffme_insurance: null as string | null,
  category: '',
  tshirt: '',
  notes: '',
})

const licenceTypeOptions = [
  { label: 'Aucune licence', value: 'Aucune licence' },
  { label: 'Licence loisir', value: 'Licence loisir' },
  { label: 'Licence compétition', value: 'Licence compétition' },
]

const groupSelectOptions = computed(() => [
  { label: '— Aucun groupe —', value: null as string | null },
  ...adminGroups.value.map((g: any) => ({ label: g.name, value: g.id as string | null })),
])

const availableRoles = [
  { code: 'admin', label: 'Admin' },
  { code: 'secretary', label: 'Secrétaire' },
  { code: 'initiateur', label: 'Initiateur' },
  { code: 'parent', label: 'Parent' },
]

const linkableChildrenOptions = computed(() =>
  allRows.value
    .filter(r => !memberForm.value.linkedChildren.some(c => c.id === r.id) && r.id !== memberForm.value.id)
    .map(r => ({ label: r.name, value: r.id })),
)

async function openMemberModal(member: AdherentWithRoles | null = null) {
  if (member) {
    editMode.value = true
    const p = member._profile
    memberForm.value = {
      id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
      name: member.name,
      licence: member.licence !== '-' ? member.licence : '',
      email: member.email,
      formule: member.formule !== '-' ? member.formule : 'Aucune licence',
      creneau: member.creneau,
      status: member.status,
      roles: [...member.roles],
      groupIds: [...(member.groupIds || [])],
      linkedChildren: [],
      birth_date: p?.birth_date ?? null,
      payment_done: p?.payment_done ?? false,
      medical_certificate: p?.medical_certificate ?? null,
      registration_form: p?.registration_form ?? false,
      ffme_insurance: p?.ffme_insurance ?? null,
      category: p?.category ?? '',
      tshirt: p?.tshirt ?? '',
      notes: p?.notes ?? '',
    }
    const { data: links } = await supabase
      .from('parent_access')
      .select('id, child_id, child:profiles!child_id(id, first_name, last_name, full_name)')
      .eq('parent_id', member.id)
    if (links) {
      memberForm.value.linkedChildren = links.map((l: any) => ({
        id: l.child?.id ?? l.child_id,
        name: l.child
          ? `${l.child.first_name ?? ''} ${l.child.last_name ?? ''}`.trim() || l.child.full_name || 'Sans nom'
          : 'Sans nom',
        linkId: l.id,
      }))
    }
  } else {
    editMode.value = false
    memberForm.value = {
      id: '', first_name: '', last_name: '', name: '',
      licence: '', email: '',
      formule: 'Aucune licence', creneau: '-',
      status: 'Actif', roles: [], groupIds: [], linkedChildren: [],
      birth_date: null,
      payment_done: false,
      medical_certificate: null,
      registration_form: false,
      ffme_insurance: null,
      category: '',
      tshirt: '',
      notes: '',
    }
  }
  childToLink.value = null
  isModalOpen.value = true
}

async function saveMember() {
  saving.value = true
  try {
    if (editMode.value && memberForm.value.id) {
      const uid = memberForm.value.id
      const fullName = `${memberForm.value.first_name} ${memberForm.value.last_name}`.trim()

      const { error: profileErr } = await supabase.from('profiles').update({
        first_name: memberForm.value.first_name || null,
        last_name: memberForm.value.last_name || null,
        full_name: fullName || null,
        email: memberForm.value.email,
        licence_number: memberForm.value.licence && memberForm.value.licence !== '-'
          ? parseInt(memberForm.value.licence) : null,
        licence_type: memberForm.value.formule !== '-' ? memberForm.value.formule : null,
        payment_done: memberForm.value.payment_done,
        medical_certificate: memberForm.value.medical_certificate || null,
        registration_form: memberForm.value.registration_form,
        ffme_insurance: memberForm.value.ffme_insurance || null,
        category: memberForm.value.category || null,
        tshirt: memberForm.value.tshirt || null,
        notes: memberForm.value.notes || null,
      }).eq('id', uid)
      if (profileErr) throw profileErr

      await supabase.from('user_roles').delete().eq('user_id', uid)
      if (memberForm.value.roles.length) {
        await supabase.from('user_roles').insert(
          memberForm.value.roles.map(r => ({ user_id: uid, role_code: r })),
        )
      }

      await supabase.from('group_members').delete().eq('user_id', uid)
      if (memberForm.value.groupIds.length) {
        await supabase.from('group_members').insert(
          memberForm.value.groupIds.map(gid => ({
            group_id: gid,
            user_id: uid,
            status: 'confirmed',
          })),
        )
      }
    } else {
      const res = await fetch('/api/admin/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: memberForm.value.email,
          first_name: memberForm.value.first_name,
          last_name: memberForm.value.last_name,
          licence: memberForm.value.licence || null,
          formule: memberForm.value.formule || null,
          roles: memberForm.value.roles,
          groupIds: memberForm.value.groupIds,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.statusMessage || `Erreur ${res.status}`)
      }
      const { id: newUserId } = await res.json()
      if (newUserId && memberForm.value.linkedChildren.length) {
        await supabase.from('parent_access').insert(
          memberForm.value.linkedChildren.map(c => ({
            parent_id: newUserId,
            child_id: c.id,
            access_type: 'full',
          })),
        )
      }
    }
    isModalOpen.value = false
    await loadMembers()
    toast.add({
      title: editMode.value ? 'Adhérent mis à jour' : 'Adhérent créé',
      description: `${memberForm.value.first_name} ${memberForm.value.last_name}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  } catch (e: any) {
    toast.add({
      title: editMode.value ? 'Erreur lors de la modification' : 'Erreur lors de la création',
      description: e.message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    saving.value = false
  }
}

async function addChildLink() {
  if (!childToLink.value) return
  const child = allRows.value.find(r => r.id === childToLink.value)
  if (!child) return

  if (!memberForm.value.id) {
    // Mode création : stockage local, insertion après sauvegarde
    memberForm.value.linkedChildren.push({ id: child.id, name: child.name, linkId: '' })
    childToLink.value = null
    return
  }

  const { data, error } = await supabase.from('parent_access').insert({
    parent_id: memberForm.value.id,
    child_id: childToLink.value,
    access_type: 'full',
  }).select().single()
  if (error) { console.error(error.message); return }
  memberForm.value.linkedChildren.push({ id: child.id, name: child.name, linkId: data.id })
  childToLink.value = null
}

async function removeChildLink(childId: string) {
  const link = memberForm.value.linkedChildren.find(c => c.id === childId)
  if (!link) return
  if (link.linkId) {
    await supabase.from('parent_access').delete().eq('id', link.linkId)
  }
  memberForm.value.linkedChildren = memberForm.value.linkedChildren.filter(c => c.id !== childId)
}

async function toggleStatus(adherent: AdherentWithRoles) {
  const newStatus = adherent.status === 'Actif' ? 'Inactif' : 'Actif'
  const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', adherent.id)
  if (error) {
    toast.add({ title: 'Erreur', description: error.message, color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  allRows.value = allRows.value.map(r =>
    r.id === adherent.id ? { ...r, status: newStatus as AdherentWithRoles['status'] } : r,
  )
  toast.add({
    title: newStatus === 'Actif' ? 'Adhérent activé' : 'Adhérent désactivé',
    description: adherent.name,
    color: newStatus === 'Actif' ? 'success' : 'warning',
    icon: newStatus === 'Actif' ? 'i-lucide-user-check' : 'i-lucide-user-x',
  })
}

async function deleteMember(id: string) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return
  const member = allRows.value.find(r => r.id === id)
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) {
    toast.add({ title: 'Erreur lors de la suppression', description: error.message, color: 'error', icon: 'i-lucide-alert-circle' })
    return
  }
  await loadMembers()
  toast.add({
    title: 'Adhérent supprimé',
    description: member?.name,
    color: 'warning',
    icon: 'i-lucide-trash',
  })
}

function exportCSV() {
  const headers = ['Nom', 'Licence', 'Email', 'Formule', 'Groupe(s)', 'Rôles', 'Statut']
  const csvRows = [
    headers.join(';'),
    ...allRows.value.map(r =>
      [r.name, r.licence, r.email, r.formule, r.groupNames.join('/'), r.roles.join('/'), r.status].join(';'),
    ),
  ]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `membres-asc-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// ── Group Modal ───────────────────────────────────────────────────────────────
const isGroupModalOpen = ref(false)
const editingGroup = ref<Group | null>(null)
const savingGroup = ref(false)
const instructorToAdd = ref<string | null>(null)

const groupForm = ref({
  name: '',
  max_members: 20,
  level: null as string | null,
  description: '',
  price: null as number | null,
  referent_id: null as string | null,
  instructor_ids: [] as string[],
  schedules: [] as { day_of_week: number; start_time: string; end_time: string }[],
})

const memberSelectOptions = computed(() => [
  { label: '— Aucun —', value: null as string | null },
  ...allRows.value.map(r => ({ label: r.name, value: r.id as string | null })),
])

const availableInstructorOptions = computed(() =>
  allRows.value
    .filter(r => !groupForm.value.instructor_ids.includes(r.id))
    .map(r => ({ label: r.name, value: r.id as string | null })),
)

function openGroupModal(group: Group | null = null) {
  if (group) {
    editingGroup.value = group
    groupForm.value = {
      name: group.name,
      max_members: group.max_members,
      level: group.level || null,
      description: group.description || '',
      price: group.price ?? null,
      referent_id: group.referent_id || null,
      instructor_ids: (group.instructors || []).map((i: any) => i.user_id),
      schedules: (group.schedules || []).map(s => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time.slice(0, 5),
        end_time: s.end_time.slice(0, 5),
      })),
    }
  } else {
    editingGroup.value = null
    groupForm.value = {
      name: '', max_members: 20, level: null, description: '',
      price: null, referent_id: null, instructor_ids: [], schedules: [],
    }
  }
  instructorToAdd.value = null
  isGroupModalOpen.value = true
}

function addScheduleRow() {
  groupForm.value.schedules.push({ day_of_week: 1, start_time: '18:00', end_time: '20:00' })
}

function addInstructor() {
  if (!instructorToAdd.value) return
  if (!groupForm.value.instructor_ids.includes(instructorToAdd.value)) {
    groupForm.value.instructor_ids.push(instructorToAdd.value)
  }
  instructorToAdd.value = null
}

function removeInstructor(uid: string) {
  groupForm.value.instructor_ids = groupForm.value.instructor_ids.filter(id => id !== uid)
}

async function saveGroup() {
  savingGroup.value = true
  try {
    if (editingGroup.value) {
      await updateGroup(editingGroup.value.id, {
        name: groupForm.value.name,
        max_members: groupForm.value.max_members,
        level: groupForm.value.level,
        description: groupForm.value.description || null,
        price: groupForm.value.price,
        referent_id: groupForm.value.referent_id,
      } as any)
      await replaceSchedules(editingGroup.value.id, groupForm.value.schedules)
      await setInstructors(editingGroup.value.id, groupForm.value.instructor_ids)
    } else {
      const newGroup = await createGroup(
        {
          name: groupForm.value.name,
          max_members: groupForm.value.max_members,
          level: groupForm.value.level,
          description: groupForm.value.description || null,
          price: groupForm.value.price,
          referent_id: groupForm.value.referent_id,
        } as any,
        groupForm.value.schedules,
      )
      if (newGroup && groupForm.value.instructor_ids.length) {
        await setInstructors(newGroup.id, groupForm.value.instructor_ids)
      }
    }
    isGroupModalOpen.value = false
    await loadAdminGroups()
    toast.add({
      title: editingGroup.value ? 'Groupe mis à jour' : 'Groupe créé',
      description: groupForm.value.name,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  } catch (e: any) {
    toast.add({
      title: editingGroup.value ? 'Erreur lors de la modification' : 'Erreur lors de la création',
      description: e.message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    savingGroup.value = false
  }
}

async function handleDeleteGroup(groupId: string) {
  if (!confirm('Supprimer ce groupe et toutes ses inscriptions ?')) return
  const group = adminGroups.value.find((g: any) => g.id === groupId)
  try {
    await deleteGroup(groupId)
    await loadAdminGroups()
    toast.add({
      title: 'Groupe supprimé',
      description: group?.name,
      color: 'warning',
      icon: 'i-lucide-trash',
    })
  } catch (e: any) {
    toast.add({ title: 'Erreur lors de la suppression', description: e.message, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}

// ── Group Members Modal ────────────────────────────────────────────────────────
const isGroupMembersModalOpen = ref(false)
const groupMembersTitle = ref('')
const groupMembersList = ref<GroupMember[]>([])
const loadingGroupMembers = ref(false)
const removingMemberId = ref<string | null>(null)

async function showGroupMembersModal(group: Group) {
  groupMembersTitle.value = group.name
  loadingGroupMembers.value = true
  isGroupMembersModalOpen.value = true
  try {
    groupMembersList.value = await fetchGroupMembers(group.id)
  } finally {
    loadingGroupMembers.value = false
  }
}

async function removeMemberFromGroup(memberId: string) {
  removingMemberId.value = memberId
  try {
    const { error } = await supabase.from('group_members').delete().eq('id', memberId)
    if (error) throw error
    groupMembersList.value = groupMembersList.value.filter(m => m.id !== memberId)
    await loadAdminGroups()
    toast.add({ title: 'Membre retiré du groupe', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e.message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    removingMemberId.value = null
  }
}

// ── Review Modal ──────────────────────────────────────────────────────────────
const isReviewModalOpen = ref(false)
const reviewRequest = ref<EnrollmentRequest | null>(null)
const reviewAction = ref<'approve' | 'reject'>('approve')
const reviewNote = ref('')
const processingReviewId = ref<string | null>(null)

const emailPreview = computed(() => {
  if (!reviewRequest.value) return ''
  const req = reviewRequest.value
  const typeLabel = req.type === 'group' ? 'au groupe' : "à l'événement"
  if (reviewAction.value === 'approve') {
    let msg = `Bonjour ${req.user_name},\n\nVotre demande d'inscription ${typeLabel} "${req.target_name}" a été acceptée.`
    if (req.target_detail) msg += `\nDétails : ${req.target_detail}`
    if (reviewNote.value) msg += `\n\nMessage : ${reviewNote.value}`
    msg += '\n\nÀ bientôt au club !\nASC Escalade'
    return msg
  } else {
    let msg = `Bonjour ${req.user_name},\n\nVotre demande d'inscription ${typeLabel} "${req.target_name}" n'a pas pu être acceptée.`
    if (reviewNote.value) msg += `\n\nMotif : ${reviewNote.value}`
    msg += "\n\nN'hésitez pas à nous contacter.\nASC Escalade"
    return msg
  }
})

function openReviewModal(request: EnrollmentRequest, action: 'approve' | 'reject') {
  reviewRequest.value = request
  reviewAction.value = action
  reviewNote.value = ''
  isReviewModalOpen.value = true
}

async function confirmReview() {
  if (!reviewRequest.value) return
  const uid = user.value?.id ?? (user.value as any)?.sub
  if (!uid) return
  processingReviewId.value = reviewRequest.value.id
  try {
    if (reviewAction.value === 'approve') {
      await approveRequest(reviewRequest.value, reviewNote.value, uid)
    } else {
      await rejectRequest(reviewRequest.value, reviewNote.value, uid)
    }
    isReviewModalOpen.value = false
    toast.add({
      title: reviewAction.value === 'approve' ? 'Demande acceptée' : 'Demande refusée',
      description: reviewRequest.value?.user_name,
      color: reviewAction.value === 'approve' ? 'success' : 'warning',
      icon: reviewAction.value === 'approve' ? 'i-lucide-check-circle' : 'i-lucide-x-circle',
    })
  } catch (e: any) {
    toast.add({ title: 'Erreur lors du traitement', description: e.message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    processingReviewId.value = null
  }
}
</script>
