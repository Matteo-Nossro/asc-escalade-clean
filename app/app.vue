<template>
	<UApp>
<!--		<UHeader>-->
			<LayoutHeader/>
<!--		</UHeader>-->

		<UMain>
			<NuxtPage/>
		</UMain>

<!--		<UFooter>-->
			<LayoutFooter/>

<!--		</UFooter>-->

	</UApp>
</template>

<script setup>

const colorMode = useColorMode()

// Forcer le mode light
colorMode.preference = 'light'
</script>
