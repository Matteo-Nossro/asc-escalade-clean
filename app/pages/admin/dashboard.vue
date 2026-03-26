<template>
	<div class="min-h-screen bg-gray-50 p-4 md:p-8 page-content">

		<!-- TITRE & HEADER -->
		<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Administration</h1>
				<p class="text-gray-500">Gérez les adhérents et les inscriptions du club.</p>
			</div>
			<UButton
					icon="i-heroicons-user-plus"
					size="lg"
					color="primary"
					class="bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546] font-bold"
					@click="openModal()"
			>
				Ajouter un adhérent
			</UButton>
		</div>

		<!-- 1. KPI CARDS -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
				<div>
					<p class="text-gray-500 text-sm font-medium">Total membres</p>
					<h3 class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalMembres }}</h3>
				</div>
				<div class="p-2 bg-green-50 rounded-lg text-green-600">
					<UIcon name="i-heroicons-users" class="w-6 h-6"/>
				</div>
			</div>

			<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
				<div>
					<p class="text-gray-500 text-sm font-medium">Licences actives</p>
					<h3 class="text-3xl font-bold text-gray-900 mt-2">{{ stats.licencesActives }}</h3>
				</div>
				<div class="p-2 bg-blue-50 rounded-lg text-blue-600">
					<UIcon name="i-heroicons-check-badge" class="w-6 h-6"/>
				</div>
			</div>

			<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
				<div>
					<p class="text-gray-500 text-sm font-medium">Places disponibles</p>
					<h3 class="text-3xl font-bold text-gray-900 mt-2">{{ stats.placesDispo }}
						<span class="text-gray-400 text-lg font-normal">/ {{ stats.totalPlaces }}</span>
					</h3>
				</div>
				<div class="p-2 bg-purple-50 rounded-lg text-purple-600">
					<UIcon name="i-heroicons-ticket" class="w-6 h-6"/>
				</div>
			</div>

			<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
				<div>
					<p class="text-gray-500 text-sm font-medium">Inscriptions en attente</p>
					<h3 class="text-3xl font-bold text-gray-900 mt-2">{{ stats.inscriptionsAttente }}</h3>
				</div>
				<div class="p-2 bg-yellow-50 rounded-lg text-yellow-600">
					<UIcon name="i-heroicons-clock" class="w-6 h-6"/>
				</div>
			</div>
		</div>

		<!-- 2. TABLEAU DES MEMBRES -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

			<!-- Barre d'outils -->
			<div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
				<h2 class="text-lg font-bold text-gray-900">Liste des membres</h2>
				<div class="flex gap-2 w-full sm:w-auto">
					<UInput
							v-model="search"
							icon="i-heroicons-magnifying-glass"
							placeholder="Rechercher un membre..."
							class="w-full sm:w-64"
					/>
					<UButton
							color="white"
							variant="solid"
							icon="i-heroicons-arrow-down-tray"
							label="Exporter"
							class="hidden sm:flex"
							@click="exportCSV"
					/>
				</div>
			</div>

			<!-- Table -->
			<UTable
					:data="filteredRows"
					:columns="columns"
					:loading="pending"
					class="w-full"
					:ui="{
          th: { base: 'uppercase text-xs font-bold text-gray-500 tracking-wider bg-gray-50/50 py-3' },
          td: { base: 'py-4 text-sm text-gray-700' },
          wrapper: 'bg-white'
        }"
			>
				<!-- Slot Nom avec Avatar -->
				<template #name-cell="{ row }">
					<div class="flex items-center gap-3">
						<div class="font-medium text-gray-900">{{ row.original.name }}</div>
					</div>
				</template>

				<!-- Slot Licence -->
				<template #licence-cell="{ row }">
					<span class="font-mono text-xs text-gray-600">{{ row.original.licence }}</span>
				</template>

				<!-- Slot Formule -->
				<template #formule-cell="{ row }">
					<span class="text-sm font-medium text-gray-700">{{ row.original.formule }}</span>
				</template>

				<!-- Slot Créneau -->
				<template #creneau-cell="{ row }">
					<span class="text-sm text-gray-600">{{ row.original.creneau }}</span>
				</template>

				<!-- Slot Statut avec Tag -->
				<template #status-cell="{ row }">
					<UBadge
							:color="getStatusColor(row.original.status)"
							size="md"
							variant="soft"
							class="font-bold tracking-wide"
					>
						{{ row.original.status }}
					</UBadge>
				</template>

				<!-- Slot Actions avec Dropdown -->
				<template #actions-cell="{ row }">
					<div class="flex items-center gap-2 justify-end">
						<!-- Option 1: Dropdown Menu (recommandé pour gagner de la place) -->
						<UDropdownMenu :items="getDropdownActions(row.original)">
							<UButton
									icon="i-lucide-ellipsis-vertical"
									color="neutral"
									variant="ghost"
									size="sm"
									aria-label="Actions"
							/>
						</UDropdownMenu>

						<!-- Option 2: Boutons individuels (décommentez si vous préférez) -->
						<!--
						<UButton
							icon="i-lucide-edit"
							color="neutral"
							variant="ghost"
							size="sm"
							@click="openModal(row.original)"
							aria-label="Modifier"
						/>
						<UButton
							icon="i-lucide-trash"
							color="error"
							variant="ghost"
							size="sm"
							@click="deleteMember(row.original.id)"
							aria-label="Supprimer"
						/>
						-->
					</div>
				</template>

			</UTable>

			<!-- Pagination -->
			<div class="p-4 border-t border-gray-100 flex justify-between items-center">
				<p class="text-sm text-gray-500">
					{{ filteredRows.length }} membre(s) sur {{ allRows.length }}
				</p>
				<UPagination
						v-model="page"
						:page-count="pageCount"
						:total="allRows.length"
				/>
			</div>

		</div>

		<!-- 3. MODAL CRUD -->
		<UModal v-model:open="isModalOpen" :title="modalTitle">
			<template #body>
				<form @submit.prevent="saveMember" class="space-y-4">
					<UFormField label="Nom & Prénom" required>
						<UInput
								v-model="form.name"
								placeholder="Ex: Marie Dupont"
								required
						/>
					</UFormField>

					<div class="grid grid-cols-2 gap-4">
						<UFormField label="N° Licence FFME" required>
							<UInput
									v-model="form.licence"
									placeholder="Ex: FFM-2024-12345"
									required
							/>
						</UFormField>
						<UFormField label="Statut" required>
							<USelect
									v-model="form.status"
									:options="['Actif', 'Inactif', 'En attente']"
							/>
						</UFormField>
					</div>

					<UFormField label="Email" required>
						<UInput
								v-model="form.email"
								type="email"
								placeholder="email@exemple.com"
								required
						/>
					</UFormField>

					<div class="grid grid-cols-2 gap-4">
						<UFormField label="Formule" required>
							<USelect
									v-model="form.formule"
									:options="['Licence Sèche', 'Adulte Autonome', 'École Escalade']"
							/>
						</UFormField>
						<UFormField label="Créneau">
							<USelect
									v-model="form.creneau"
									:options="['-', 'Lundi 20h', 'Mardi 18h30', 'Mercredi 14h', 'Jeudi 20h', 'Vendredi 19h', 'Samedi 10h']"
							/>
						</UFormField>
					</div>
				</form>
			</template>

			<template #footer="{ close }">
				<div class="flex justify-end gap-3">
					<UButton
							color="neutral"
							variant="soft"
							@click="close"
					>
						Annuler
					</UButton>
					<UButton
							@click="saveMember"
							color="primary"
							class="bg-[#7FD857] text-[#0F1729] hover:bg-[#6bc546]"
							:loading="saving"
					>
						{{ editMode ? 'Mettre à jour' : 'Enregistrer' }}
					</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { TableColumn } from '#ui/components/Table.vue'
import type { DropdownMenuItem } from '#ui/components/DropdownMenu.vue'
import type { Profile, Adherent } from '~/types/auth'

const supabase = useSupabaseClient()
const pending = ref(true)
const saving = ref(false)

// ---- Données ----
const allRows = ref<Adherent[]>([])

function profileToAdherent(p: Profile): Adherent {
  return {
    id: p.id,
    name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sans nom',
    licence: p.licence_number ? String(p.licence_number) : '-',
    email: p.email,
    formule: p.licence_type || '-',
    creneau: p.club_group || '-',
    status: 'Actif',
    _profile: p,
  }
}

async function loadMembers() {
  pending.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    if (error) throw error
    allRows.value = (data as Profile[]).map(profileToAdherent)
  } catch (e: any) {
    console.error('Erreur chargement membres:', e.message)
  } finally {
    pending.value = false
  }
}

onMounted(() => loadMembers())

// ---- KPI ----
const stats = computed(() => ({
  totalMembres: allRows.value.length,
  licencesActives: allRows.value.filter(r => r.licence !== '-').length,
  placesDispo: Math.max(0, 180 - allRows.value.length),
  totalPlaces: 180,
  inscriptionsAttente: allRows.value.filter(r => r.status === 'En attente').length,
}))

// ---- Table ----
const columns: TableColumn<Adherent>[] = [
  { accessorKey: 'name', header: 'Nom & Prénom' },
  { accessorKey: 'licence', header: 'N° Licence FFME' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'formule', header: 'Formule' },
  { accessorKey: 'creneau', header: 'Créneau' },
  { accessorKey: 'status', header: 'Statut' },
  { id: 'actions', header: 'Actions' },
]

// ---- Filtre & Pagination ----
const search = ref('')
const page = ref(1)
const pageCount = 5

const filteredRows = computed(() => {
  let data = allRows.value
  if (search.value) {
    const q = search.value.toLowerCase()
    data = data.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(q))
    )
  }
  const start = (page.value - 1) * pageCount
  return data.slice(start, start + pageCount)
})

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Actif': return 'success'
    case 'Inactif': return 'error'
    case 'En attente': return 'warning'
    default: return 'neutral'
  }
}

// ---- Modal CRUD ----
const isModalOpen = ref(false)
const editMode = ref(false)
const form = ref<Adherent>({
  id: '', name: '', licence: '', email: '',
  formule: 'Adulte Autonome', creneau: '', status: 'Actif',
})
const modalTitle = computed(() =>
  editMode.value ? 'Modifier un adhérent' : 'Ajouter un adhérent'
)

const openModal = (member: Adherent | null = null) => {
  if (member) {
    editMode.value = true
    form.value = { ...member }
  } else {
    editMode.value = false
    form.value = {
      id: '', name: '', licence: '', email: '',
      formule: 'Adulte Autonome', creneau: '', status: 'Actif',
    }
  }
  isModalOpen.value = true
}

const saveMember = async () => {
  saving.value = true
  try {
    if (editMode.value && form.value.id) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.value.name,
          email: form.value.email,
          licence_number: form.value.licence && form.value.licence !== '-'
            ? parseInt(form.value.licence) : null,
          licence_type: form.value.formule,
          club_group: form.value.creneau !== '-' ? form.value.creneau : null,
        })
        .eq('id', form.value.id)
      if (error) throw error
    }
    isModalOpen.value = false
    await loadMembers()
  } catch (e: any) {
    console.error('Erreur sauvegarde:', e.message)
  } finally {
    saving.value = false
  }
}

const deleteMember = async (id: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) throw error
    await loadMembers()
  } catch (e: any) {
    console.error('Erreur suppression:', e.message)
  }
}

const toggleStatus = (adherent: Adherent) => {
  const index = allRows.value.findIndex(r => r.id === adherent.id)
  if (index !== -1) {
    allRows.value[index].status = adherent.status === 'Actif' ? 'Inactif' : 'Actif'
  }
}

function getDropdownActions(adherent: Adherent): DropdownMenuItem[][] {
  return [
    [
      { label: 'Modifier', icon: 'i-lucide-edit', onSelect: () => openModal(adherent) },
      { label: 'Voir détails', icon: 'i-lucide-eye', onSelect: () => openModal(adherent) },
    ],
    [
      {
        label: adherent.status === 'Actif' ? 'Désactiver' : 'Activer',
        icon: adherent.status === 'Actif' ? 'i-lucide-user-x' : 'i-lucide-user-check',
        onSelect: () => toggleStatus(adherent),
      },
    ],
    [
      {
        label: 'Supprimer', icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect: () => deleteMember(adherent.id),
      },
    ],
  ]
}

const exportCSV = () => {
  const headers = ['Nom', 'Licence', 'Email', 'Formule', 'Créneau', 'Statut']
  const csvRows = [
    headers.join(';'),
    ...allRows.value.map(r =>
      [r.name, r.licence, r.email, r.formule, r.creneau, r.status].join(';')
    ),
  ]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `membres-asc-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
</script>