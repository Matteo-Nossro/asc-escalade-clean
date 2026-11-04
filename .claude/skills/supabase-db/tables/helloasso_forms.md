# Table `helloasso_forms`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Formulaires HelloAsso déclarés sur le site (adhésions, événements). Créée par `20260520`, complétée par `20261025_helloasso_socle` (`season`, `event_id`, contraintes, écritures admin seul).

```sql
CREATE TABLE public.helloasso_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_slug text NOT NULL,
  form_type text NOT NULL DEFAULT 'Membership',  -- 'Membership' | 'Event'
  label text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  season text NOT NULL,                          -- 'AAAA-AAAA', années consécutives
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,  -- seulement si form_type = 'Event'
  CONSTRAINT helloasso_forms_pkey PRIMARY KEY (id),
  CONSTRAINT helloasso_forms_type_slug_key UNIQUE (form_type, form_slug),
  CONSTRAINT helloasso_forms_form_type_check CHECK (form_type IN ('Membership', 'Event')),
  CONSTRAINT helloasso_forms_season_format CHECK (...),   -- voir la migration (CASE protégeant le cast)
  CONSTRAINT helloasso_forms_event_type_check CHECK (event_id IS NULL OR form_type = 'Event')
);
```

- RLS : lecture pour `private.is_admin_or_secretary()` ; insertion, modification et suppression pour `private.has_role('admin')` uniquement (décision du 2026-10-28). Fonctions déplacées dans `private` par 20261103.
- La migration refuse un doublon `(form_type, form_slug)` ou une saison invalide existante : corriger les lignes à la main, puis relancer.
