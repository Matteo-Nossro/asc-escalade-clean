// app/types/auth.ts

export interface Profile {
  id: string
  email: string
  full_name: string
  licence_number: number | null
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  gender: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  phone: string | null
  mobile: string | null
  licence_type: string | null
  passport: string | null
  notes: string | null
  club_group: string | null
  avatar_url: string | null
  emergency_contact: string | null
  status: 'Actif' | 'Inactif' | 'En attente' | null
  created_at: string
  updated_at: string
}

export type RoleCode = 'parent' | 'admin' | 'secretary'

export interface UserRole {
  id: string
  user_id: string
  role_code: RoleCode
  assigned_at: string
}

export interface ParentAccessLink {
  id: string
  parent_id: string
  child_id: string
  access_type: 'read' | 'register' | 'full'
  created_at: string
  child?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'birth_date'>
}

export interface EventRecord {
  id: string
  title: string
  starts_at: string
  slug: string | null
  location: string | null
  category: string | null
  difficulty: string | null
  max_participants: number | null
  price: number | null
  description: string | null
}

export interface Registration {
  id: string
  user_id: string
  event_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  registered_by: string | null
  notes: string | null
  registered_at: string
  event?: Pick<EventRecord, 'title' | 'starts_at' | 'slug'>
  profile?: Pick<Profile, 'full_name'>
}

// Format pour le tableau admin du dashboard
export interface Adherent {
  id: string
  name: string
  licence: string
  email: string
  formule: string
  creneau: string
  status: 'Actif' | 'Inactif' | 'En attente'
  _profile?: Profile
}

export interface AdherentWithRoles extends Adherent {
  roles: RoleCode[]
  first_name: string
  last_name: string
  groupId: string
  groupNames: string[]
  linkedChildren: { id: string; name: string; linkId: string }[]
}


// ─── Groupes ─────────────────────────────────────────────────────────────────

export interface Group {
  id: string
  name: string
  max_members: number
  min_birth_date: string | null
  max_birth_date: string | null
  level: string | null
  referent_id: string | null
  description: string | null
  created_at: string
  updated_at: string
  // Relations chargées
  schedules?: GroupSchedule[]
  instructors?: GroupInstructor[]
  referent?: Pick<Profile, 'id' | 'full_name'>
  _members_count?: number
}

export interface GroupSchedule {
  id: string
  group_id: string
  day_of_week: number       // 1=Lundi … 7=Dimanche
  start_time: string        // "20:00:00"
  end_time: string          // "22:00:00"
}

export interface GroupInstructor {
  id: string
  group_id: string
  user_id: string
  profile?: Pick<Profile, 'id' | 'full_name'>
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  enrolled_by: string | null
  enrolled_at: string
  status: 'pending' | 'confirmed' | 'cancelled'    // ← AJOUTER
  admin_note: string | null                          // ← AJOUTER
  reviewed_at: string | null                         // ← AJOUTER
  group?: Pick<Group, 'id' | 'name' | 'level'>
  profile?: Pick<Profile, 'id' | 'full_name'>
}