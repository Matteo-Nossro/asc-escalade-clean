import { ref } from 'vue'

interface SupabaseEvent {
  id: string
  storyblok_uuid: string
  storyblok_slug: string
  title: string | null
  event_date: string | null
  max_participants: number
  current_participants: number
  price: number
  location: string | null
  created_at: string
}

interface RegisterParams {
  eventId: string
  name: string
  email: string
  price: number
  eventTitle: string
  eventDate?: string
}

export function useRegistration() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function getEventBySlug(slug: string): Promise<SupabaseEvent> {
    const data = await $fetch<SupabaseEvent>(`/api/event-by-slug?slug=${encodeURIComponent(slug)}`)
    return data
  }

  async function register(params: RegisterParams): Promise<void> {
    const { eventId, name, email, price, eventTitle, eventDate } = params
    loading.value = true
    error.value = null

    try {
      // 1. Inscription en base (atomique)
      const { registrationId } = await $fetch<{ registrationId: string }>('/api/register', {
        method: 'POST',
        body: { eventId, name, email },
      })

      // 2. Email de confirmation (toujours, gratuit ou payant)
      await $fetch('/api/send-registration-email', {
        method: 'POST',
        body: { registrationId, email, name, eventTitle, eventDate, price },
      }).catch((err) => {
        // L'email est non-bloquant : on log mais on continue
        console.warn('[useRegistration] Email non envoyé:', err)
      })

      // 3. Paiement HelloAsso si prix > 0
      if (price > 0) {
        const { checkoutUrl } = await $fetch<{ checkoutUrl: string }>('/api/create-helloasso-payment', {
          method: 'POST',
          body: { registrationId, amount: price, name, email, eventTitle },
        })
        await navigateTo(checkoutUrl, { external: true })
        return
      }

      // 4. Sortie gratuite → page de confirmation directe
      await navigateTo(`/inscription/confirmee?reg=${registrationId}`)
    } catch (err: any) {
      if (err?.statusCode === 409) {
        error.value = 'Désolé, cette sortie est complète.'
      } else if (err?.statusCode === 404) {
        error.value = 'Événement introuvable. Veuillez réessayer.'
      } else {
        error.value = err?.statusMessage ?? 'Une erreur est survenue. Veuillez réessayer.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, getEventBySlug, register }
}
