<template>
  <section v-editable="blok" class="py-12">
    <GroupsAccordion :title="blok.title" />
  </section>
</template>

<script setup>
defineProps({ blok: Object })
</script>
