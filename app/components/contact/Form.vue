<template>
	<div class="p-4 md:p-8 h-full">

		<h3 class="text-2xl font-bold text-[#0F1729] mb-8">Envoyer un message</h3>

		<form @submit.prevent="onSubmit" class="space-y-6">

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Nom complet</label>
					<UInput v-model="form.name" placeholder="Jean Dupont" class="bg-gray-50" size="lg" :ui="{ color: { gray: { outline: 'bg-gray-50 ring-gray-200 focus:ring-[#7FD857]' } } }" />
				</div>
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Email</label>
					<UInput v-model="form.email" type="email" placeholder="jean@exemple.com" class="bg-gray-50" size="lg" :ui="{ color: { gray: { outline: 'bg-gray-50 ring-gray-200 focus:ring-[#7FD857]' } } }" />
				</div>
			</div>

			<div class="space-y-2">
				<label class="text-sm font-medium text-gray-700">Sujet</label>
				<UInput v-model="form.subject" placeholder="Demande d'adhésion..." class="bg-gray-50" size="lg" :ui="{ color: { gray: { outline: 'bg-gray-50 ring-gray-200 focus:ring-[#7FD857]' } } }" />
			</div>

			<div class="space-y-2">
				<label class="text-sm font-medium text-gray-700">Message</label>
				<UTextarea
						v-model="form.message"
						placeholder="Votre message ici..."
						:rows="6"
						class="bg-gray-50"
						size="lg"
						:ui="{ color: { gray: { outline: 'bg-gray-50 ring-gray-200 focus:ring-[#7FD857]' } } }"
				/>
			</div>

			<div class="pt-4">
				<UButton
						type="submit"
						size="xl"
						:loading="loading"
						:color="success ? 'green' : 'primary'"
						class="px-8 font-bold text-white bg-[#7FD857] hover:bg-[#6nc546] text-[#0F1729]"
						:ui="{ rounded: 'rounded-lg' }"
				>
					<UIcon :name="success ? 'i-heroicons-check' : 'i-heroicons-paper-airplane'" class="mr-2" />
					{{ success ? 'Envoyé !' : 'Envoyer le message' }}
				</UButton>
			</div>

		</form>
	</div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const loading = ref(false)
const success = ref(false)

const form = reactive({ name: '', email: '', subject: '', message: '' })

const onSubmit = () => {
	loading.value = true
	setTimeout(() => {
		loading.value = false
		success.value = true
		setTimeout(() => { success.value = false; form.name=''; form.email=''; form.subject=''; form.message=''; }, 3000)
	}, 1500)
}
</script>
