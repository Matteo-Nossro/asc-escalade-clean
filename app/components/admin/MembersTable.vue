<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

    <!-- Barre d'outils -->
    <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
      <h2 class="text-lg font-bold text-gray-900">Liste des membres</h2>
      <div class="flex gap-2 w-full sm:w-auto">
        <UInput
          :model-value="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher un membre..."
          class="w-full sm:w-64"
          @update:model-value="emit('update:search', $event)"
        />
        <USelect
          :model-value="roleFilter"
          :items="roleFilterOptions"
          class="w-40"
          size="md"
          @update:model-value="emit('update:roleFilter', $event)"
        />
        <UButton
          color="white"
          variant="solid"
          icon="i-heroicons-arrow-down-tray"
          label="Exporter"
          class="hidden sm:flex"
          @click="emit('export-csv')"
        />
      </div>
    </div>

    <!-- Table -->
    <UTable
      :data="rows"
      :columns="columns"
      :loading="pending"
      class="w-full"
      :ui="{
        th: { base: 'uppercase text-xs font-bold text-gray-500 tracking-wider bg-gray-50/50 py-3' },
        td: { base: 'py-4 text-sm text-gray-700' },
        wrapper: 'bg-white'
      }"
    >
      <template #name-cell="{ row }">
        <div class="font-medium text-gray-900">{{ row.original.name }}</div>
      </template>

      <template #licence-cell="{ row }">
        <span class="font-mono text-xs text-gray-600">{{ row.original.licence }}</span>
      </template>

      <template #formule-cell="{ row }">
        <span class="text-sm font-medium text-gray-700">{{ row.original.formule }}</span>
      </template>

      <template #groups-cell="{ row }">
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="g in row.original.groupNames"
            :key="g"
            color="neutral"
            variant="soft"
            size="xs"
          >
            {{ g }}
          </UBadge>
          <span v-if="!row.original.groupNames?.length" class="text-xs text-gray-400">—</span>
        </div>
      </template>

      <template #roles-cell="{ row }">
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="role in row.original.roles"
            :key="role"
            :color="getRoleBadgeColor(role)"
            variant="soft"
            size="xs"
            class="font-bold"
          >
            {{ getRoleLabel(role) }}
          </UBadge>
          <span v-if="!row.original.roles?.length" class="text-xs text-gray-400">—</span>
        </div>
      </template>

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

      <template #actions-cell="{ row }">
        <div class="flex items-center gap-2 justify-end">
          <UDropdownMenu :items="getDropdownActions(row.original)">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Actions"
            />
          </UDropdownMenu>
        </div>
      </template>
    </UTable>

    <!-- Pagination -->
    <div class="p-4 border-t border-gray-100 flex justify-between items-center">
      <p class="text-sm text-gray-500">
        {{ rows.length }} membre(s) sur {{ totalCount }}
      </p>
      <UPagination
        :model-value="page"
        :page-count="pageCount"
        :total="totalCount"
        @update:model-value="emit('update:page', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '#ui/components/Table.vue'
import type { DropdownMenuItem } from '#ui/components/DropdownMenu.vue'
import type { AdherentWithRoles } from '~/types/auth'

const props = defineProps<{
  rows: AdherentWithRoles[]
  totalCount: number
  pending: boolean
  search: string
  roleFilter: string | null
  roleFilterOptions: { label: string; value: string | null }[]
  page: number
  pageCount: number
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:roleFilter': [value: string | null]
  'update:page': [value: number]
  'open-modal': [adherent: AdherentWithRoles]
  'toggle-status': [adherent: AdherentWithRoles]
  'delete': [id: string]
  'export-csv': []
}>()

const columns: TableColumn<AdherentWithRoles>[] = [
  { accessorKey: 'name', header: 'Nom & Prénom' },
  { accessorKey: 'licence', header: 'Licence FFME' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'formule', header: 'Formule' },
  { id: 'groups', header: 'Groupe(s)' },
  { id: 'roles', header: 'Rôles' },
  { accessorKey: 'status', header: 'Statut' },
  { id: 'actions', header: '' },
]

function getRoleLabel(role: string): string {
  return ({ admin: 'Admin', secretary: 'Secrétaire', parent: 'Parent' } as Record<string, string>)[role] || role
}

function getRoleBadgeColor(role: string): string {
  return ({ admin: 'error', secretary: 'info', parent: 'success' } as Record<string, string>)[role] || 'neutral'
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Actif': return 'success'
    case 'Inactif': return 'error'
    case 'En attente': return 'warning'
    default: return 'neutral'
  }
}

function getDropdownActions(adherent: AdherentWithRoles): DropdownMenuItem[][] {
  return [
    [
      { label: 'Modifier', icon: 'i-lucide-edit', onSelect: () => emit('open-modal', adherent) },
    ],
    [
      {
        label: adherent.status === 'Actif' ? 'Désactiver' : 'Activer',
        icon: adherent.status === 'Actif' ? 'i-lucide-user-x' : 'i-lucide-user-check',
        onSelect: () => emit('toggle-status', adherent),
      },
    ],
    [
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash',
        color: 'error' as const,
        onSelect: () => emit('delete', adherent.id),
      },
    ],
  ]
}
</script>
