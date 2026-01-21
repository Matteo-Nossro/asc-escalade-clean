<template>
	<div class="min-h-screen bg-gray-50 relative pb-20 overflow-hidden">

		<!-- Déco de fond (Montagne) -->
		<svg class="absolute bottom-0 left-0 w-full h-auto pointer-events-none opacity-[0.03]" viewBox="0 0 1440 320" preserveAspectRatio="none">
			<path fill="#000" fill-opacity="1" d="M0,224L80,197.3C160,171,320,117,480,112C640,107,800,149,960,165.3C1120,181,1280,171,1360,165.3L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
		</svg>

<!--		<UContainer class="relative z-10">-->
		<div class="page-content bg-gray-50">
			<TarifsHeader />
<!--			<TarifsGrilleTarifs />-->
			<TarifsBonASavoir />
			<TarifsPlanning />
<!--		</UContainer>-->
		</div>

	</div>
</template>
<script setup lang="ts">
</script>