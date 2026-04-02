<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 py-12 page-content">
    <div class="w-full max-w-3xl mx-auto">

      <!-- Titre -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Mes inscriptions</h1>
        <p class="text-gray-600">Vos groupes et événements</p>
      </div>

      <!-- Loader -->
      <div v-if="!ready" class="flex justify-center py-20">
        <div class="w-8 h-8 border-3 border-gray-200 border-t-[#7FD857] rounded-full animate-spin" />
      </div>

      <div v-else class="space-y-8">

        <!-- ═══ SECTION GROUPES ═══ -->
        <div>
          <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-users" class="w-5 h-5 text-[#7FD857]" />
            Mes groupes
          </h2>

          <!-- Aucune inscription -->
          <div
            v-if="myGroupEnrollments.length === 0"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
          >
            <UIcon name="i-lucide-user-plus" class="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p class="text-gray-500">Vous n'êtes inscrit à aucun groupe.</p>
            <UButton
              class="mt-4 bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
              @click="showGroupPicker = true"
            >
              Rejoindre un groupe
            </UButton>
          </div>

          <!-- Liste des groupes -->
          <div v-else class="space-y-3">
            <div
              v-for="enrollment in myGroupEnrollments"
              :key="enrollment.id"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-gray-900">{{ enrollment.group?.name }}</h3>
                  <UBadge v-if="enrollment.group?.level" color="info" variant="soft" size="xs">
                    {{ enrollment.group.level }}
                  </UBadge>
                  <UBadge
                    :color="enrollment.status === 'confirmed' ? 'success' : 'warning'"
                    variant="soft"
                    size="xs"
                  >
                    {{ enrollment.status === 'confirmed' ? 'Confirmé' : 'En attente de validation' }}
                  </UBadge>
                  <UBadge
                    v-if="enrollment.user_id !== ownUid"
                    color="warning"
                    variant="soft"
                    size="xs"
                  >
                    {{ enrollment.profile?.full_name }}
                  </UBadge>
                </div>
                <!-- Créneaux -->
                <div class="flex flex-wrap gap-2 mt-2">
                  <span
                    v-for="sched in getGroupSchedules(enrollment.group_id)"
                    :key="sched.id"
                    class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg"
                  >
                    {{ formatSchedule(sched) }}
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-2">
                  Inscrit le {{ formatDate(enrollment.enrolled_at) }}
                </p>
              </div>

              <div class="flex items-start">
                <UButton
                  color="error"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-log-out"
                  @click="handleUnenrollGroup(enrollment.id)"
                  :loading="unenrolling === enrollment.id"
                >
                  Quitter
                </UButton>
              </div>
            </div>

            <UButton
              variant="soft"
              class="w-full"
              icon="i-lucide-plus"
              @click="showGroupPicker = true"
            >
              Rejoindre un autre groupe
            </UButton>
          </div>
        </div>

        <!-- ═══ SECTION ÉVÉNEMENTS ═══ -->
        <div>
          <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="w-5 h-5 text-[#7FD857]" />
            Mes événements
          </h2>

          <div
            v-if="myEventRegistrations.length === 0"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center"
          >
            <UIcon name="i-lucide-calendar-x" class="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p class="text-gray-500">Aucune inscription à un événement.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="reg in myEventRegistrations"
              :key="reg.id"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-gray-900">{{ reg.event?.title }}</h3>
                  <UBadge :color="getStatusColor(reg.status)" variant="soft" size="xs">
                    {{ getStatusLabel(reg.status) }}
                  </UBadge>
                </div>
                <p v-if="reg.event?.starts_at" class="text-sm text-gray-500">
                  {{ formatDateTime(reg.event.starts_at) }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  Inscrit le {{ formatDate(reg.registered_at) }}
                </p>
              </div>

              <div v-if="reg.status !== 'cancelled'" class="flex items-start">
                <UButton
                  color="error"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-x"
                  @click="handleCancelEvent(reg.id, reg.event_id)"
                  :loading="cancellingEvent === reg.id"
                >
                  Annuler
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ SECTION ENFANTS (si parent) ═══ -->
        <div v-if="childrenEnrollments.length > 0">
          <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UIcon name="i-lucide-baby" class="w-5 h-5 text-[#7FD857]" />
            Inscriptions de mes enfants
          </h2>

          <div class="space-y-3">
            <div
              v-for="enrollment in childrenEnrollments"
              :key="enrollment.id"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <UBadge color="warning" variant="soft" size="sm">
                    {{ enrollment.profile?.full_name }}
                  </UBadge>
                  <span class="text-gray-400">→</span>
                  <h3 class="font-bold text-gray-900">{{ enrollment.group?.name }}</h3>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <span
                    v-for="sched in getGroupSchedules(enrollment.group_id)"
                    :key="sched.id"
                    class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg"
                  >
                    {{ formatSchedule(sched) }}
                  </span>
                </div>
              </div>

              <div class="flex items-start">
                <UButton
                  color="error"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-log-out"
                  @click="handleUnenrollGroup(enrollment.id)"
                  :loading="unenrolling === enrollment.id"
                >
                  Retirer
                </UButton>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══ MODAL CHOIX DE GROUPE ═══ -->
    <UModal v-model:open="showGroupPicker" title="Rejoindre un groupe">
      <template #body>
        <!-- Sélecteur : pour qui ? -->
        <div v-if="familyProfiles.length > 0" class="mb-6">
          <p class="text-sm text-gray-500 mb-2">Inscrire :</p>
          <div class="flex flex-wrap gap-2">
            <UButton
              :variant="enrollForUserId === ownUid ? 'solid' : 'soft'"
              :class="enrollForUserId === ownUid ? 'bg-[#7FD857] text-[#0F1729]' : ''"
              size="sm"
              @click="enrollForUserId = ownUid"
            >
              Moi
            </UButton>
            <UButton
              v-for="child in familyProfiles"
              :key="child.child_id"
              :variant="enrollForUserId === child.child_id ? 'solid' : 'soft'"
              :class="enrollForUserId === child.child_id ? 'bg-[#7FD857] text-[#0F1729]' : ''"
              size="sm"
              @click="enrollForUserId = child.child_id"
            >
              {{ child.child?.full_name || 'Enfant' }}
            </UButton>
          </div>
        </div>

        <!-- Liste des groupes disponibles -->
        <div class="space-y-3">
          <div
            v-for="group in availableGroups"
            :key="group.id"
            class="border border-gray-200 rounded-xl p-4 hover:border-[#7FD857] transition-colors"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <h4 class="font-bold text-gray-900">{{ group.name }}</h4>
                <p v-if="group.description" class="text-sm text-gray-500">{{ group.description }}</p>
              </div>
              <div class="text-right">
                <UBadge v-if="group.level" color="info" variant="soft" size="xs">
                  {{ group.level }}
                </UBadge>
                <p class="text-xs text-gray-400 mt-1">
                  {{ group._members_count || 0 }} / {{ group.max_members }}
                </p>
              </div>
            </div>

            <!-- Créneaux -->
            <div class="flex flex-wrap gap-1 mb-3">
              <span
                v-for="sched in group.schedules"
                :key="sched.id"
                class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {{ formatSchedule(sched) }}
              </span>
            </div>

            <UButton
              size="sm"
              :disabled="(group._members_count || 0) >= group.max_members || enrollingGroup === group.id"
              :loading="enrollingGroup === group.id"
              class="bg-[#7FD857] hover:bg-[#6bc546] text-[#0F1729] font-bold"
              @click="handleEnrollGroup(group.id)"
            >
              {{ (group._members_count || 0) >= group.max_members ? 'Complet' : 'Rejoindre' }}
            </UButton>
          </div>

          <p v-if="availableGroups.length === 0" class="text-center text-gray-500 py-4">
            Vous êtes déjà inscrit à tous les groupes disponibles.
          </p>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Group, GroupSchedule, GroupMember, Registration, ParentAccessLink } from '~/types/auth'

definePageMeta({ layout: false, ssr: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const getUserId = () => user.value?.id ?? (user.value as any)?.sub

const {
  groups, myEnrollments, loading,
  formatSchedule, fetchGroups, fetchMyEnrollments,
  enroll, unenroll,
} = useGroups()
const { registrations, fetchMine: fetchMyEventRegistrations, cancel: cancelEventReg } = useEventRegistrations()

const ready = ref(false)
const showGroupPicker = ref(false)
const enrollForUserId = ref<string>('')
const enrollingGroup = ref<string | null>(null)
const unenrolling = ref<string | null>(null)
const cancellingEvent = ref<string | null>(null)

// Famille
const familyProfiles = ref<ParentAccessLink[]>([])

const ownUid = computed(() => getUserId() || '')

// Mes inscriptions groupes (pas celles des enfants)
const myGroupEnrollments = computed(() =>
  myEnrollments.value.filter(e => e.user_id === ownUid.value)
)

// Inscriptions des enfants
const childrenEnrollments = computed(() =>
  myEnrollments.value.filter(e =>
    e.user_id !== ownUid.value && e.enrolled_by === ownUid.value
  )
)

// Événements
const myEventRegistrations = computed(() => registrations.value)

// Groupes disponibles (pas déjà inscrit)
const availableGroups = computed(() => {
  const enrolledGroupIds = myEnrollments.value
    .filter(e => e.user_id === enrollForUserId.value)
    .map(e => e.group_id)

  return groups.value.filter(g => !enrolledGroupIds.includes(g.id))
})

// Récupérer les créneaux d'un groupe
function getGroupSchedules(groupId: string): GroupSchedule[] {
  const group = groups.value.find(g => g.id === groupId)
  return group?.schedules || []
}

// ─── Chargement ──────────────────────────────────────────────────────────────

onMounted(async () => {
  let attempts = 0
  while (!user.value && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }

  const uid = getUserId()
  if (!uid) {
    await navigateTo('/login', { query: { redirect: '/mes-inscriptions' } })
    return
  }

  enrollForUserId.value = uid

  await Promise.all([
    fetchGroups(),
    fetchMyEnrollments(),
    fetchMyEventRegistrations(),
  ])

  // Charger les enfants si parent
  const { data: childData } = await supabase
    .from('parent_access')
    .select(`
      id, parent_id, child_id, access_type,
      child:profiles!child_id(id, full_name)
    `)
    .eq('parent_id', uid)
    .in('access_type', ['register', 'full'])

  if (childData) {
    familyProfiles.value = childData as ParentAccessLink[]
  }

  ready.value = true
})

// ─── Actions ─────────────────────────────────────────────────────────────────

async function handleEnrollGroup(groupId: string) {
  enrollingGroup.value = groupId
  try {
    const targetUser = enrollForUserId.value || ownUid.value
    await enroll(groupId, targetUser !== ownUid.value ? targetUser : undefined)
    await Promise.all([fetchGroups(), fetchMyEnrollments()])
    showGroupPicker.value = false
  } catch (e: any) {
    console.error('Erreur inscription groupe:', e.message)
  } finally {
    enrollingGroup.value = null
  }
}

async function handleUnenrollGroup(memberId: string) {
  unenrolling.value = memberId
  try {
    await unenroll(memberId)
    await Promise.all([fetchGroups(), fetchMyEnrollments()])
  } catch (e: any) {
    console.error('Erreur désinscription:', e.message)
  } finally {
    unenrolling.value = null
  }
}

async function handleCancelEvent(regId: string, eventId: string) {
  cancellingEvent.value = regId
  try {
    await cancelEventReg(regId, eventId)
    await fetchMyEventRegistrations()
  } catch (e: any) {
    console.error('Erreur annulation événement:', e.message)
  } finally {
    cancellingEvent.value = null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  return { pending: 'warning', confirmed: 'success', cancelled: 'error' }[status] || 'neutral'
}

function getStatusLabel(status: string): string {
  return { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé' }[status] || status
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return dateStr }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}
</script>