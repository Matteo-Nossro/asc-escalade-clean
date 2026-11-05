<template>
  <UApp>
    <LayoutHeader />
    <UMain>
      <AuthPageGate>
        <NuxtPage />
      </AuthPageGate>
    </UMain>
    <LayoutFooter />
  </UApp>
</template>

<script setup>
const colorMode = useColorMode()
colorMode.preference = 'light'
</script>
