<template>
	<div v-editable="blok" class="bg-white rounded-3xl shadow-2xl relative p-8 md:p-12 h-full flex flex-col justify-center overflow-hidden">

		<!-- DÉCO (Montagne) -->
		<svg class="absolute bottom-0 right-0 w-full h-auto pointer-events-none opacity-[0.03]" viewBox="0 0 400 300" preserveAspectRatio="none">
			<path d="M200 50 L400 300 H0 Z" fill="#000" />
			<path d="M280 150 L400 300 H160 Z" fill="#000" />
		</svg>

		<h3 class="text-2xl font-bold text-[#0F1729] mb-10 relative z-10">
			{{ blok.form_title || 'Envoyer un message' }}
		</h3>

		<form @submit.prevent="onSubmit" class="space-y-8 relative z-10 w-full">
			<!-- Honeypot anti-bot — caché des humains -->
			<input v-model="form.botField" type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0;" aria-hidden="true" />

			<!-- LIGNE 1 : NOM & EMAIL -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
				<div class="space-y-2 w-full">
					<label class="block text-sm font-semibold text-gray-700 ml-1">Nom complet</label>
					<UInput
							v-model="form.name"
							placeholder="Jean Dupont"
							size="xl"
							class="w-full"
							:ui="{
              wrapper: 'w-full',
              base: 'w-full bg-gray-50 text-gray-900',
              rounded: 'rounded-lg',
              color: { gray: { outline: 'shadow-none bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#7FD857]' } }
            }"
					/>
				</div>

				<div class="space-y-2 w-full">
					<label class="block text-sm font-semibold text-gray-700 ml-1">Email</label>
					<UInput
							v-model="form.email"
							type="email"
							placeholder="jean@exemple.com"
							size="xl"
							class="w-full"
							:ui="{
              wrapper: 'w-full',
              base: 'w-full bg-gray-50 text-gray-900',
              rounded: 'rounded-lg',
              color: { gray: { outline: 'shadow-none bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#7FD857]' } }
            }"
					/>
				</div>
			</div>

			<!-- LIGNE 2 : SUJET -->
			<div class="space-y-2 w-full">
				<label class="block text-sm font-semibold text-gray-700 ml-1">Sujet</label>
				<UInput
						v-model="form.subject"
						placeholder="Demande d'adhésion..."
						size="xl"
						class="w-full"
						:ui="{
            wrapper: 'w-full',
            base: 'w-full bg-gray-50 text-gray-900',
            rounded: 'rounded-lg',
            color: { gray: { outline: 'shadow-none bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#7FD857]' } }
          }"
				/>
			</div>

			<!-- LIGNE 3 : MESSAGE -->
			<div class="space-y-2 w-full">
				<label class="block text-sm font-semibold text-gray-700 ml-1">Message</label>
				<UTextarea
						v-model="form.message"
						placeholder="Votre message ici..."
						:rows="6"
						size="xl"
						resize
						class="w-full"
						:ui="{
            wrapper: 'w-full',
            base: 'w-full bg-gray-50 text-gray-900',
            rounded: 'rounded-lg',
            color: { gray: { outline: 'shadow-none bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#7FD857]' } }
          }"
				/>
			</div>

			<!-- BOUTON -->
			<div class="pt-2">
				<UButton
						type="submit"
						size="xl"
						:loading="loading"
						:color="success ? 'green' : 'primary'"
						class="font-bold transition-all duration-300"
						:class="[
            success ? 'bg-green-500 text-white' : 'bg-[#7FD857] hover:bg-[#6nc546] text-[#0F1729]'
          ]"
						:ui="{ rounded: 'rounded-lg', padding: { xl: 'px-8 py-3' } }"
				>
					<template #leading>
						<UIcon :name="success ? 'i-heroicons-check' : 'i-heroicons-paper-airplane'" class="w-5 h-5" />
					</template>
					{{ success ? 'Envoyé !' : 'Envoyer le message' }}
				</UButton>

				<p v-if="errorMsg" class="mt-3 text-sm text-red-500">{{ errorMsg }}</p>
			</div>

		</form>
	</div>
</template>

<script setup>
defineProps({ blok: { type: Object, required: true } })

const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')
const startTime = ref(Date.now())

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  botField: '', // honeypot — jamais affiché
})

async function onSubmit() {
  if (!form.name || !form.email || !form.message) return
  loading.value = true
  errorMsg.value = ''
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        botField: form.botField,
        timestamp: startTime.value,
      },
    })
    success.value = true
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
    setTimeout(() => { success.value = false }, 4000)
  } catch (e) {
    errorMsg.value = e?.data?.statusMessage ?? 'Une erreur est survenue, veuillez réessayer.'
  } finally {
    loading.value = false
    startTime.value = Date.now()
  }
}
</script>
