<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
    <div class="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
      <h2 class="text-lg font-bold text-gray-900">HelloAsso — Configuration</h2>
      <div v-if="isAdmin" class="flex flex-wrap gap-2 justify-center">
        <UButton
          icon="i-lucide-plug-zap"
          size="sm"
          color="neutral"
          variant="outline"
          :loading="testing"
          @click="testConnection"
        >
          Tester la connexion
        </UButton>
        <UButton
          icon="i-lucide-refresh-cw"
          size="sm"
          class="bg-vp-green text-vp-dark hover:bg-vp-green-hover font-bold"
          :loading="syncing"
          @click="syncNow"
        >
          Synchroniser maintenant
        </UButton>
      </div>
    </div>

    <!-- Résultat du test de connexion (admin) -->
    <div v-if="isAdmin && testResult" class="p-4 border-b border-gray-100" data-testid="test-result">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          v-if="testResult.environment"
          :color="testResult.environment === 'sandbox' ? 'warning' : 'neutral'"
          :variant="testResult.environment === 'sandbox' ? 'solid' : 'soft'"
          size="md"
          data-testid="test-environment"
        >
          {{ testResult.environment === 'sandbox' ? 'SANDBOX (test)' : 'Production' }}
        </UBadge>
        <span v-if="testResult.orgSlug" class="text-sm text-gray-500" data-testid="test-slug">
          {{ testResult.orgSlug }}
        </span>
      </div>

      <ul v-if="testResult.ok || testResult.step" class="mt-3 space-y-1 text-sm">
        <li class="flex items-center gap-2" data-testid="check-publicData">
          <UIcon :name="checkIcon('publicData')" :class="checkClass('publicData')" />
          <span class="text-gray-700">Données publiques (formulaires)</span>
        </li>
        <li class="flex items-center gap-2" data-testid="check-transactions">
          <UIcon :name="checkIcon('transactions')" :class="checkClass('transactions')" />
          <span class="text-gray-700">Transactions (adhésions et paiements)</span>
        </li>
      </ul>

      <p v-if="testResult.ok" class="mt-3 text-sm font-semibold text-emerald-700">
        Connexion HelloAsso opérationnelle.
      </p>

      <div
        v-else-if="isTransactionsForbidden"
        class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3"
        role="alert"
        data-testid="test-forbidden"
      >
        <p class="text-sm font-bold text-red-700">Droits insuffisants pour les transactions</p>
        <p class="mt-1 text-sm text-red-700">{{ testResult.message }}</p>
      </div>

      <p
        v-else
        class="mt-3 text-sm text-red-700"
        role="alert"
        data-testid="test-error"
      >
        {{ testResult.message }}
      </p>
    </div>

    <!-- Résultat de la synchronisation -->
    <div v-if="syncResult" class="p-4 border-b border-gray-100 bg-emerald-50">
      <p class="text-sm font-semibold text-emerald-700">
        {{ syncResult.matched }} adhérent(s) mis à jour
      </p>
      <div v-if="syncResult.unmatched.length" class="mt-2">
        <p class="text-sm font-medium text-yellow-700">
          Non trouvés ({{ syncResult.unmatched.length }}) :
        </p>
        <ul class="mt-1 text-sm text-yellow-600 list-disc list-inside">
          <li v-for="u in syncResult.unmatched" :key="`${u.firstName}-${u.lastName}`">
            {{ u.firstName }} {{ u.lastName }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Liste des formulaires -->
    <div v-if="loading" class="p-8 flex justify-center">
      <div class="w-6 h-6 border-2 border-gray-200 border-t-vp-green rounded-full animate-spin" />
    </div>
    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="form in forms"
        :key="form.id"
        class="p-4 flex items-center justify-between gap-4"
        data-testid="form-row"
      >
        <div>
          <p class="font-medium text-gray-900">{{ form.label }}</p>
          <p class="text-sm text-gray-400">
            {{ form.form_slug }} · {{ form.form_type }} ·
            <span data-testid="form-season">Saison {{ form.season }}</span>
          </p>
        </div>
        <USwitch
          v-if="isAdmin"
          :model-value="form.active"
          @update:model-value="toggleForm(form.id, $event)"
        />
        <UBadge
          v-else
          :color="form.active ? 'success' : 'neutral'"
          variant="soft"
          size="sm"
        >
          {{ form.active ? 'Actif' : 'Inactif' }}
        </UBadge>
      </div>
      <div v-if="!forms.length" class="p-6 text-center text-sm text-gray-400">
        Aucun formulaire configuré.
      </div>
    </div>

    <!-- Ajout d'un formulaire (admin) -->
    <div v-if="isAdmin" class="p-4 border-t border-gray-100 bg-gray-50">
      <p class="text-sm font-bold text-gray-700 mb-3">Ajouter un formulaire</p>
      <div class="flex flex-col sm:flex-row gap-2">
        <UInput
          v-model="newForm.form_slug"
          placeholder="Slug HelloAsso (ex: adhesion-2025)"
          class="flex-1"
        />
        <UInput
          v-model="newForm.label"
          placeholder="Libellé (ex: Adhésion 2025-2026)"
          class="flex-1"
        />
        <select
          v-model="newForm.form_type"
          class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="Membership">Adhésion</option>
          <option value="Event">Événement</option>
        </select>
        <select
          v-model="newForm.season"
          aria-label="Saison"
          data-testid="season-select"
          class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option v-for="s in seasonOptions" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
        <UButton
          icon="i-lucide-plus"
          :loading="adding"
          @click="addForm"
        >
          Ajouter
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { currentSeasonStart, seasonLabel } from '~/utils/season'

interface HelloAssoForm {
  id: string
  form_slug: string
  form_type: string
  label: string
  active: boolean
  season: string
}

// Contrat de POST /api/admin/helloasso-test : on ne lit que ces champs.
interface TestResult {
  ok: boolean
  environment?: string
  orgSlug?: string
  step?: 'config' | 'publicData' | 'transactions'
  code?: string
  message?: string
  checks?: { publicData?: string; transactions?: string }
}

const toast = useToast()
const { isAdmin } = useAuth()

const forms = ref<HelloAssoForm[]>([])
const loading = ref(false)
const syncing = ref(false)
const adding = ref(false)
const testing = ref(false)
const testResult = ref<TestResult | null>(null)
const syncResult = ref<{ matched: number; unmatched: { firstName: string; lastName: string }[] } | null>(null)

const seasonOptions = computed(() => {
  const start = currentSeasonStart()
  return [
    { value: seasonLabel(start), label: `${seasonLabel(start)} (en cours)` },
    { value: seasonLabel(start + 1), label: `${seasonLabel(start + 1)} (suivante)` },
  ]
})

const emptyForm = () => ({
  form_slug: '',
  label: '',
  form_type: 'Membership',
  season: seasonLabel(currentSeasonStart()),
})
const newForm = ref(emptyForm())

const isTransactionsForbidden = computed(() =>
  !!testResult.value
  && !testResult.value.ok
  && testResult.value.step === 'transactions'
  && testResult.value.code === 'forbidden',
)

// État d'une vérification : ok / échec (étape en erreur) / non lancée.
function checkState(step: 'publicData' | 'transactions'): 'ok' | 'fail' | 'skipped' {
  const r = testResult.value
  if (!r) return 'skipped'
  if (r.ok || r.checks?.[step] === 'ok') return 'ok'
  if (r.step === step) return 'fail'
  // publicData est passée si l'échec est survenu à l'étape suivante
  if (step === 'publicData' && r.step === 'transactions') return 'ok'
  return 'skipped'
}
function checkIcon(step: 'publicData' | 'transactions') {
  const s = checkState(step)
  return s === 'ok' ? 'i-lucide-check-circle' : s === 'fail' ? 'i-lucide-x-circle' : 'i-lucide-minus-circle'
}
function checkClass(step: 'publicData' | 'transactions') {
  const s = checkState(step)
  return s === 'ok' ? 'text-emerald-600' : s === 'fail' ? 'text-red-600' : 'text-gray-300'
}

// Message d'une réponse en erreur : statusMessage, sinon message du corps JSON h3 ; repli « Erreur <statut> ».
async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.statusMessage === 'string' && data.statusMessage) return data.statusMessage
    if (typeof data?.message === 'string' && data.message) return data.message
  } catch { /* corps non JSON */ }
  return `Erreur ${res.status}`
}

async function loadForms() {
  loading.value = true
  try {
    const res = await fetch('/api/admin/helloasso-forms')
    if (!res.ok) throw new Error(await readError(res))
    forms.value = await res.json()
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e.message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    loading.value = false
  }
}

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    const res = await fetch('/api/admin/helloasso-test', { method: 'POST' })
    let data: any = null
    try { data = await res.json() } catch { /* corps non JSON */ }
    if (!res.ok && (!data || typeof data.ok !== 'boolean')) {
      testResult.value = {
        ok: false,
        message: typeof data?.statusMessage === 'string' ? data.statusMessage : `Erreur ${res.status}`,
      }
      return
    }
    // Ne conserver que les champs du contrat
    testResult.value = {
      ok: !!data.ok,
      environment: data.environment,
      orgSlug: data.orgSlug,
      step: data.step,
      code: data.code,
      message: data.message,
      checks: data.checks,
    }
  } catch (e: any) {
    testResult.value = { ok: false, message: e?.message || 'Erreur réseau' }
  } finally {
    testing.value = false
  }
}

async function addForm() {
  if (!newForm.value.form_slug.trim() || !newForm.value.label.trim()) return
  adding.value = true
  try {
    const res = await fetch('/api/admin/helloasso-forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm.value),
    })
    if (!res.ok) throw new Error(await readError(res))
    newForm.value = emptyForm()
    await loadForms()
    toast.add({ title: 'Formulaire ajouté', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e.message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    adding.value = false
  }
}

async function toggleForm(id: string, active: boolean) {
  try {
    const res = await fetch(`/api/admin/helloasso-forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    if (!res.ok) throw new Error(await readError(res))
    forms.value = forms.value.map(f => f.id === id ? { ...f, active } : f)
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e.message, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}

async function syncNow() {
  syncing.value = true
  syncResult.value = null
  try {
    const res = await fetch('/api/admin/sync-helloasso', { method: 'POST' })
    if (!res.ok) throw new Error(await readError(res))
    syncResult.value = await res.json()
    toast.add({
      title: 'Synchronisation terminée',
      description: `${syncResult.value!.matched} adhérent(s) mis à jour`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  } catch (e: any) {
    toast.add({ title: 'Erreur de synchronisation', description: e.message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  loadForms()
})
</script>
