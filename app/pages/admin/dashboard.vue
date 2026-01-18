<template>
	<div class="min-h-screen bg-gray-50 p-4 md:p-8">

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
					{{ filteredRows.length }} membre(s) sur {{ rows.length }}
				</p>
				<UPagination
						v-model="page"
						:page-count="pageCount"
						:total="rows.length"
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
					>
						{{ editMode ? 'Mettre à jour' : 'Enregistrer' }}
					</UButton>
				</div>
			</template>
		</UModal>
	</div>
</template>
<script setup lang="ts">
import {ref, computed} from 'vue'
import type {TableColumn} from "#ui/components/Table.vue";
import type {DropdownMenuItem} from "#ui/components/DropdownMenu.vue";


const pending = ref(false)

// --- DONNÉES STATS ---
const stats = computed(() => ({
	totalMembres: rows.value.length,
	licencesActives: rows.value.filter(r => r.status === 'Actif').length,
	placesDispo: 180 - rows.value.length,
	totalPlaces: 180,
	inscriptionsAttente: rows.value.filter(r => r.status === 'En attente').length
}))

interface Adherent {
	id: number
	name: string
	licence: string
	email: string
	formule: string
	creneau: string
	status: 'Actif' | 'Inactif' | 'En attente'
}

// --- CONFIG TABLE ---
const columns: TableColumn<Adherent>[] = [
	{
		accessorKey: 'name',
		header: 'Nom & Prénom'
	},
	{
		accessorKey: 'licence',
		header: 'N° Licence FFME'
	},
	{
		accessorKey: 'email',
		header: 'Email'
	},
	{
		accessorKey: 'formule',
		header: 'Formule'
	},
	{
		accessorKey: 'creneau',
		header: 'Créneau'
	},
	{
		accessorKey: 'status',
		header: 'Statut'
	},
	{
		id: 'actions',
		header: 'Actions'
	}
]

// --- DONNÉES MOCK ---
const rows = ref<Adherent[]>([
	{
		id: 1,
		name: 'Marie Dupont',
		licence: 'FFM-2024-12345',
		email: 'marie.dupont@email.com',
		formule: 'Adulte Autonome',
		creneau: 'Lundi 20h',
		status: 'Actif'
	},
	{
		id: 2,
		name: 'Pierre Martin',
		licence: 'FFM-2024-12346',
		email: 'p.martin@email.com',
		formule: 'Adulte Autonome',
		creneau: 'Jeudi 20h',
		status: 'Actif'
	},
	{
		id: 3,
		name: 'Lucas Bernard',
		licence: 'FFM-2024-12347',
		email: 'lucas.b@email.com',
		formule: 'École Escalade',
		creneau: 'Mercredi 14h',
		status: 'Inactif'
	},
	{
		id: 4,
		name: 'Julie Petit',
		licence: 'FFM-2024-12350',
		email: 'julie.petit@email.com',
		formule: 'École Escalade',
		creneau: 'Samedi 10h',
		status: 'En attente'
	},
	{
		id: 5,
		name: 'Antoine Roux',
		licence: 'FFM-2024-12351',
		email: 'a.roux@email.com',
		formule: 'Licence Sèche',
		creneau: '-',
		status: 'Actif'
	},
	{
		id: 6,
		name: 'Emma Girard',
		licence: 'FFM-2024-12352',
		email: 'emma.g@email.com',
		formule: 'École Escalade',
		creneau: 'Mercredi 14h',
		status: 'Actif'
	},
	{
		id: 7,
		name: 'Thomas Moreau',
		licence: 'FFM-2024-12353',
		email: 't.moreau@email.com',
		formule: 'Adulte Autonome',
		creneau: 'Mardi 18h30',
		status: 'Actif'
	},
	{
		id: 8,
		name: 'Sophie Laurent',
		licence: 'FFM-2024-12354',
		email: 'sophie.l@email.com',
		formule: 'Adulte Autonome',
		creneau: 'Vendredi 19h',
		status: 'En attente'
	}
])
// --- LOGIQUE FILTRE & PAGINATION ---
const search = ref('')
const page = ref(1)
const pageCount = 5

const filteredRows = computed(() => {
	let data = rows.value

	if (search.value) {
		data = data.filter(row => {
			return Object.values(row).some(value => {
				return String(value).toLowerCase().includes(search.value.toLowerCase())
			})
		})
	}

	// Pagination
	const start = (page.value - 1) * pageCount
	const end = start + pageCount
	return data.slice(start, end)
})


const getStatusColor = (status) => {
	switch (status) {
		case 'Actif':
			return 'success'
		case 'Inactif':
			return 'error'
		case 'En attente':
			return 'warning'
		default:
			return 'neutral'
	}
}

// --- LOGIQUE ACTIONS CRUD ---
// --- MODAL & FORM ---
const isModalOpen = ref(false)
const editMode = ref(false)
const form = ref<Adherent>({
	id: 0,
	name: '',
	licence: '',
	email: '',
	formule: 'Adulte Autonome',
	creneau: '',
	status: 'Actif'
})

// --- ACTIONS DROPDOWN ---
function getDropdownActions(adherent: Adherent): DropdownMenuItem[][] {
	return [
		[
			{
				label: 'Modifier',
				icon: 'i-lucide-edit',
				onSelect: () => openModal(adherent)
			},
			{
				label: 'Voir détails',
				icon: 'i-lucide-eye',
				onSelect: () => openModal(adherent)
			}
		],
		[
			{
				label: adherent.status === 'Actif' ? 'Désactiver' : 'Activer',
				icon: adherent.status === 'Actif' ? 'i-lucide-user-x' : 'i-lucide-user-check',
				onSelect: () => toggleStatus(adherent)
			}
		],
		[
			{
				label: 'Supprimer',
				icon: 'i-lucide-trash',
				color: 'error',
				onSelect: () => deleteMember(adherent.id)
			}
		]
	]
}

// --- CRUD FUNCTIONS ---
const openModal = (member: Adherent | null = null) => {
	if (member) {
		editMode.value = true
		form.value = { ...member }
	} else {
		editMode.value = false
		form.value = {
			id: 0,
			name: '',
			licence: '',
			email: '',
			formule: 'Adulte Autonome',
			creneau: '',
			status: 'Actif'
		}
	}
	isModalOpen.value = true
}

const saveMember = () => {
	if (editMode.value) {
		const index = rows.value.findIndex(r => r.id === form.value.id)
		if (index !== -1) {
			rows.value[index] = { ...form.value }
		}
	} else {
		rows.value.push({ ...form.value, id: Date.now() })
	}
	isModalOpen.value = false  // ✅ Ferme la modal
}

const modalTitle = computed(() =>
		editMode.value ? 'Modifier un adhérent' : 'Ajouter un adhérent'
)


const deleteMember = (id: number) => {
	if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
		rows.value = rows.value.filter(r => r.id !== id)
	}
}

const toggleStatus = (adherent: Adherent) => {
	const index = rows.value.findIndex(r => r.id === adherent.id)
	if (index !== -1) {
		rows.value[index].status = adherent.status === 'Actif' ? 'Inactif' : 'Actif'
	}
}
</script>
