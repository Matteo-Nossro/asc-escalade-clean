# Schéma de la base de données Supabase

> Ce schéma est fourni à titre de référence uniquement — ne pas exécuter tel quel (ordre des tables et contraintes non garanti).

---

## Tables

### `profiles`
Profil étendu lié à `auth.users`. Table principale pour les adhérents.

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,                         -- = auth.users.id
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  licence_number bigint UNIQUE,
  first_name text,
  last_name text,
  birth_date date,
  gender text,
  address text,
  postal_code text,
  city text,
  phone text,
  mobile text,
  licence_type text,
  passport text,
  notes text,
  club_group text,
  avatar_url text,
  emergency_contact text,
  status text NOT NULL DEFAULT 'Actif'      -- 'Actif' | 'Inactif' | 'En attente'
    CHECK (status = ANY (ARRAY['Actif','Inactif','En attente'])),
  payment_done boolean DEFAULT false,
  medical_certificate text                  -- 'fiche_attestation' | 'certificat_medical' | 'non'
    CHECK (medical_certificate IS NULL OR medical_certificate = ANY (
      ARRAY['fiche_attestation','certificat_medical','non'])),
  registration_form boolean DEFAULT false,
  ffme_insurance text                       -- 'certificat_renouvellement' | 'mail_renouvellement' | 'non'
    CHECK (ffme_insurance IS NULL OR ffme_insurance = ANY (
      ARRAY['certificat_renouvellement','mail_renouvellement','non'])),
  category text,
  tshirt text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

---

### `roles`
Table de référence des rôles disponibles.

```sql
CREATE TABLE public.roles (
  code text NOT NULL,   -- 'admin' | 'secretary' | 'parent' | 'initiateur'
  label text NOT NULL,
  CONSTRAINT roles_pkey PRIMARY KEY (code)
);
```

### `user_roles`
Assignation des rôles aux utilisateurs (N:N).

```sql
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_code text NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid,
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_roles_role_code_fkey FOREIGN KEY (role_code) REFERENCES public.roles(code),
  CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);
```

---

### `groups`
Groupes d'escalade.

```sql
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  max_members integer NOT NULL DEFAULT 20,
  min_birth_date date,
  max_birth_date date,
  level text,
  referent_id uuid,
  description text,
  price numeric DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_referent_id_fkey FOREIGN KEY (referent_id) REFERENCES public.profiles(id)
);
```

### `group_schedules`
Créneaux horaires des groupes.

```sql
CREATE TABLE public.group_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),  -- 1=Lundi … 7=Dimanche
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  CONSTRAINT group_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT group_schedules_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
```

### `group_instructors`
Initiateurs (encadrants) rattachés à un groupe.

```sql
CREATE TABLE public.group_instructors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT group_instructors_pkey PRIMARY KEY (id),
  CONSTRAINT group_instructors_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_instructors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

### `group_members`
Inscriptions aux groupes avec workflow de validation.

```sql
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  enrolled_by uuid,                   -- NULL si auto-inscription, sinon id du parent/admin
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  status registration_status NOT NULL DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'cancelled'
  admin_note text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  CONSTRAINT group_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT group_members_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES public.profiles(id),
  CONSTRAINT group_members_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
```

---

### `events`
Événements ponctuels (sorties, compétitions…).

```sql
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  slug text UNIQUE,
  location text,
  category text,
  difficulty text,
  max_participants integer,
  price numeric,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
```

### `registrations`
Inscriptions aux événements avec workflow de validation.

```sql
CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  status registration_status NOT NULL DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'cancelled'
  registered_by uuid,                 -- NULL si auto-inscription, sinon id du parent/admin
  notes text,
  admin_note text,
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT registrations_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES public.profiles(id),
  CONSTRAINT registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
```

---

### `parent_access`
Lien parent → enfant avec niveau d'accès.

```sql
CREATE TABLE public.parent_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  child_id uuid NOT NULL,
  access_type access_type NOT NULL DEFAULT 'read',  -- 'read' | 'register' | 'full'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT parent_access_pkey PRIMARY KEY (id),
  CONSTRAINT parent_access_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id),
  CONSTRAINT parent_access_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.profiles(id)
);
```

---

### `notification_logs`
Historique des notifications envoyées (emails).

```sql
CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  metadata jsonb,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_logs_pkey PRIMARY KEY (id),
  CONSTRAINT notification_logs_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id)
);
```

---

### `temps_user`
Table temporaire d'import des licences FFME (migration initiale).

```sql
CREATE TABLE public.temps_user (
  Numero_Licence_Origine bigint NOT NULL,
  Nom_Final text,
  Prenom_Final text,
  Date_Naissance_Final date,
  Sexe_Final text,
  Adresse_Final text,
  CodePostal_Final bigint,
  Ville_Final text,
  Telephone_Final text,
  Portable_Final text,
  Email_Final text,
  TypeLicence_Final text,
  Passeport_Final text,
  Observation_Final text,
  Groupe_Final text,
  CONSTRAINT temps_user_pkey PRIMARY KEY (Numero_Licence_Origine)
);
```

---

### `User` (legacy)
Table legacy — ne plus utiliser, remplacée par `profiles`.

```sql
CREATE TABLE public.User (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  firstName text,
  lastName text,
  birthDate timestamp without time zone,
  sex text,
  phone text,
  licenseNumber text,
  licenceType text,
  address text,
  cp integer,
  city text,
  role text DEFAULT 'user',
  paid boolean DEFAULT false,
  Observation text,
  Active boolean DEFAULT true,
  createdAt timestamp without time zone DEFAULT now(),
  updatedAt timestamp without time zone DEFAULT now(),
  CONSTRAINT User_pkey PRIMARY KEY (id),
  CONSTRAINT User_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

---

## Types personnalisés (enums)

| Type | Valeurs |
|---|---|
| `registration_status` | `pending`, `confirmed`, `cancelled` |
| `access_type` | `read`, `register`, `full` |

---

## Relations clés

```
auth.users
  ├── profiles (1:1)
  │     ├── user_roles (1:N) → roles
  │     ├── parent_access (parent_id) → profiles (child_id)
  │     ├── group_members (user_id) → groups
  │     ├── group_instructors (user_id) → groups
  │     └── registrations (user_id) → events
  └── User (legacy, 1:1)

groups
  ├── group_schedules (1:N)
  ├── group_instructors (1:N) → profiles
  └── group_members (1:N) → profiles
```
