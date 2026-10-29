<template>
  <SectionShell
    v-editable="blok"
    :fond="blok.fond"
    :anchor-id="blok.anchor_id"
    :surtitre="blok.surtitre"
    :titre="blok.titre || 'Documents à télécharger'"
    :intro="blok.intro"
    largeur="large"
  >
    <!-- Groupes de documents -->
    <div v-if="groupes.length" class="grid gap-6" :class="groupes.length > 1 ? 'lg:grid-cols-2' : ''">
      <div
        v-for="(groupe, gi) in groupes"
        :key="groupe._uid || gi"
        data-reveal
        class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
      >
        <div v-if="groupe.titre" class="flex items-center gap-3 mb-5">
          <div class="w-11 h-11 rounded-2xl bg-vp-green/15 flex items-center justify-center flex-shrink-0">
            <UIcon :name="groupe.icon || 'i-heroicons-folder'" class="w-6 h-6 text-vp-dark" />
          </div>
          <h3 class="text-lg font-bold text-vp-dark">{{ groupe.titre }}</h3>
        </div>
        <ul class="space-y-3">
          <li v-for="(doc, di) in groupe.documents || []" :key="doc._uid || di">
            <DocLien :doc="doc" />
          </li>
        </ul>
      </div>
    </div>

    <!-- Liste simple -->
    <ul v-else-if="documents.length" class="grid gap-3 sm:grid-cols-2" data-reveal>
      <li v-for="(doc, di) in documents" :key="doc._uid || di">
        <DocLien :doc="doc" />
      </li>
    </ul>
  </SectionShell>
</template>

<script setup>
import { computed } from 'vue'
import SectionShell from './_SectionShell.vue'
import DocLien from './_DocLien.vue'

const props = defineProps({ blok: { type: Object, required: true } })

const groupes = computed(() => props.blok.groupes || [])
const documents = computed(() => props.blok.documents || [])
</script>
