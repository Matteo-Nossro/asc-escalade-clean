# Table `profiles`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Profil étendu lié à `auth.users`. Table principale pour les adhérents.

> **Migration 20260409** : `email` rendu nullable (profils enfants sans compte Auth) + contrainte FK `profiles_id_fkey` (id → auth.users) supprimée pour permettre des profils enfants avec UUID autonome.

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
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
  -- profiles_id_fkey supprimée (migration 20260409)
);
```
