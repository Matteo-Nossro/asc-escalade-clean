<template>
  <UApp>
    <LayoutHeader />
    <UMain>
      <NuxtPage />
    </UMain>
    <LayoutFooter />
  </UApp>
</template>

<script setup>
const colorMode = useColorMode()
colorMode.preference = 'light'
</script>
