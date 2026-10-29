// Champs et validations partagés entre l'inscription (register.vue) et la complétion de profil (completer-profil.vue).

export interface ParentFields {
  first_name: string
  last_name: string
  birth_date: string
  gender: string
  phone: string
  address: string
  postal_code: string
  city: string
}

export interface ParentErrors {
  first_name: string
  last_name: string
  birth_date: string
  gender: string
  phone: string
  postal_code: string
}

export interface ChildData {
  first_name: string
  last_name: string
  birth_date: string
  gender: string
  address: string
  postal_code: string
  city: string
  sameAddress: boolean
}

export interface ChildErrors {
  first_name: string
  last_name: string
  birth_date: string
  gender: string
}

export const emptyParentFields = (): ParentFields => ({
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: '',
  phone: '',
  address: '',
  postal_code: '',
  city: '',
})

export const emptyParentErrors = (): ParentErrors => ({
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: '',
  phone: '',
  postal_code: '',
})

export const emptyChild = (): ChildData => ({
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: '',
  address: '',
  postal_code: '',
  city: '',
  sameAddress: false,
})

export const emptyChildErrors = (): ChildErrors => ({
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: '',
})

export const hasErrors = (errors: object): boolean => Object.values(errors).some(v => !!v)

/** Date du jour au format AAAA-MM-JJ. */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0] as string
}

/** Date de naissance maximale pour avoir 18 ans révolus aujourd'hui. */
export function adultMaxBirthDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0] as string
}

/** true si la date de naissance correspond à 18 ans révolus ou plus aujourd'hui. */
export function isAdultBirthDate(dateStr: string): boolean {
  if (!dateStr) return false
  const birth = new Date(dateStr)
  if (Number.isNaN(birth.getTime())) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return birth <= cutoff
}

/** Validation des champs du parent (hors email et mot de passe, propres à l'inscription). */
export function validateParent(form: ParentFields): ParentErrors {
  const e = emptyParentErrors()

  if (!form.first_name.trim()) e.first_name = 'Le prénom est requis'
  if (!form.last_name.trim()) e.last_name = 'Le nom est requis'

  if (!form.birth_date) {
    e.birth_date = 'La date de naissance est requise'
  }
  else if (!isAdultBirthDate(form.birth_date)) {
    e.birth_date = 'Vous devez avoir au moins 18 ans'
  }

  if (!form.gender) e.gender = 'Le sexe est requis'

  if (form.phone) {
    const digits = form.phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 11) e.phone = 'Numéro de téléphone invalide'
  }

  if (form.postal_code && !/^\d{5}$/.test(form.postal_code)) {
    e.postal_code = 'Code postal invalide (5 chiffres)'
  }

  return e
}

export function validateChild(child: ChildData): ChildErrors {
  const e = emptyChildErrors()
  if (!child.first_name.trim()) e.first_name = 'Le prénom est requis'
  if (!child.last_name.trim()) e.last_name = 'Le nom est requis'
  if (!child.birth_date) {
    e.birth_date = 'La date de naissance est requise'
  }
  else if (new Date(child.birth_date) > new Date()) {
    e.birth_date = 'La date de naissance ne peut pas être dans le futur'
  }
  else if (isAdultBirthDate(child.birth_date)) {
    e.birth_date = 'Ce parcours est réservé aux enfants mineurs'
  }
  if (!child.gender) e.gender = 'Le sexe est requis'
  return e
}

export function getChildInitials(child: Pick<ChildData, 'first_name' | 'last_name'>): string {
  return [child.first_name, child.last_name].filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function formatDate(d: string): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

/** Champs du parent tels qu'attendus par /api/register et /api/profile/complete (vide → null). */
export function buildParentPayload(form: ParentFields) {
  return {
    first_name: form.first_name,
    last_name: form.last_name,
    birth_date: form.birth_date || null,
    gender: form.gender || null,
    phone: form.phone || null,
    address: form.address || null,
    postal_code: form.postal_code || null,
    city: form.city || null,
  }
}

export function buildChildrenPayload(children: ChildData[]) {
  return children.map(c => ({
    first_name: c.first_name,
    last_name: c.last_name,
    birth_date: c.birth_date || null,
    address: c.address || null,
    postal_code: c.postal_code || null,
    city: c.city || null,
  }))
}
