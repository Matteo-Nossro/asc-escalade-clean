<template>
  <section id="creneaux" v-editable="blok" class="scroll-mt-28 py-12">
    <GroupsAccordion :title="blok.title" />
  </section>
</template>

<script setup>
defineProps({ blok: Object })
</script>
