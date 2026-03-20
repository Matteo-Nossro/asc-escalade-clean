<template>
  <div v-editable="blok" class="max-w-5xl mx-auto px-4 mt-24 mb-20">
    <h2 v-if="blok.title" class="text-3xl font-bold text-center text-[#0F1729] mb-12">
      {{ blok.title }}
    </h2>

    <!-- Accordéon -->
    <UAccordion
      :items="categories"
      multiple
      variant="soft"
      size="xl"
      :ui="{
        wrapper: 'space-y-4',
        item: {
          base: 'border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden mb-4',
          padding: 'p-0',
          icon: 'text-gray-400 w-5 h-5'
        },
        default: {
          class: 'p-6 w-full text-lg font-bold text-[#0F1729] hover:bg-gray-50 border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden mb-4'
        }
      }"
    >
      <!-- Contenu : Tableau -->
      <template #content="{ item }">
        <div class="bg-gray-50/30 border-t border-gray-100 p-4">
          <UTable
            :data="item.cours_list || []"
            :columns="columns"
            :ui="{
              th: { base: 'uppercase text-xs font-bold text-gray-500 tracking-wider bg-transparent' },
              td: { base: 'text-sm font-medium text-gray-900 py-4' },
              wrapper: 'bg-transparent shadow-none ring-0'
            }"
          >
            <!-- Jour & Heure -->
            <template #jour-data="{ row }">
              <div>
                <div class="font-bold text-[#0F1729]">{{ row.jour }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ row.horaire }}</div>
              </div>
            </template>

            <!-- Niveau (Badge) -->
            <template #niveau-data="{ row }">
              <span
                class="inline-flex px-2.5 py-1 rounded text-xs font-bold uppercase"
                :class="getLevelColor(row.niveau)"
              >
                {{ row.niveau }}
              </span>
            </template>

            <!-- Prix (droite) -->
            <template #prix-data="{ row }">
              <div class="text-right font-black text-[#0F1729] text-base">
                {{ row.prix }}€
              </div>
            </template>
          </UTable>
        </div>
      </template>
    </UAccordion>
  </div>
</template>

<script setup>
const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
})

// Colonnes fixes
const columns = [
  { id: 1, accessorKey: 'jour', label: 'Jour & Heure' },
  { id: 2, accessorKey: 'niveau', label: 'Niveau' },
  { id: 3, accessorKey: 'annee', label: 'Année Réf.' },
  { id: 4, accessorKey: 'effectif', label: 'Effectif', class: 'text-center' },
  { id: 5, accessorKey: 'prix', label: 'Prix', class: 'text-right' }
]

// Normalise les catégories du répéteur
const categories = computed(() => {
  return (props.blok.categories || []).map(cat => ({
    label: cat.label,
    cours_list: (cat.cours_list || []).map(course => ({
      jour: course.jour,
      horaire: course.horaire,
      niveau: course.niveau,
      annee: course.annee,
      effectif: course.effectif,
      prix: course.prix
    }))
  }))
})

// Couleurs des badges
const getLevelColor = (niveau) => {
  switch (niveau) {
    case 'Débutant': return 'bg-green-100 text-green-700'
    case 'Initié': return 'bg-blue-100 text-blue-700'
    case 'Confirmé': return 'bg-purple-100 text-purple-700'
    case 'Autonomie': return 'bg-orange-100 text-orange-700'
    case 'Tous Niveaux': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}
</script>
