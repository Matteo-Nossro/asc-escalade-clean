# Table `profiles`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Profil étendu lié à `auth.users`. Table principale pour les adhérents.

> **Migration 20260409** : `email` rendu nullable (profils enfants sans compte Auth) + contrainte FK `profiles_id_fkey` (id → auth.users) supprimée pour permettre des profils enfants avec UUID autonome.
>
> **Migrations 20261029 et 20261030 (auth-profils)** : colonne `profile_completed_at`, défaut de `status` = `'En attente'`, `handle_new_user` et trigger `profiles_block_status`. Détail ci-dessous.

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,                         -- UUID autonome (plus de FK auth.users depuis migration 20260409)
  email text,                               -- nullable : profils enfants sans compte Auth
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
  status text NOT NULL DEFAULT 'En attente' -- 'Actif' | 'Inactif' | 'En attente' (défaut 'Actif' jusqu'à 20261029)
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
  profile_completed_at timestamp with time zone NULL, -- NULL = profil à compléter (20261029)
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
  -- profiles_id_fkey supprimée (migration 20260409)
);
```

- `profile_completed_at` : renseigné par `/api/register` et `/api/profile/complete` (réservation atomique, voir `server/utils/completeProfile.ts`), par `create-member`, et par le rattrapage de 20261029 (`= created_at`, uniquement à la création de la colonne).
- Triggers (20261029, durci par 20261030) :
  - `on_auth_user_created` → `handle_new_user()` (`SECURITY DEFINER`, `search_path = public`) : crée le profil en `'En attente'`, `profile_completed_at` vide. La branche `ON CONFLICT` ne touche ni `status` ni `profile_completed_at`.
  - `profiles_block_status` (BEFORE UPDATE) → `profiles_block_status_change()` : refuse toute modification de `status` ou de `profile_completed_at`, sauf si la connexion n'a aucune claim JWT (`auth.role() IS NULL` : postgres, seed, GoTrue, `on_profile_enrich`), si `auth.role() = 'service_role'`, ou si `is_admin_or_secretary()` (admin et secretary ; `initiateur` et `parent` non). Un jeton `anon` ou `authenticated` sans `sub` n'est plus exempté (20261030 remplace l'exemption `auth.uid() IS NULL`). Couvre aussi les profils enfants, que `profiles_update_family` laisse modifier.
- Aucune policy RLS modifiée par ces migrations.
