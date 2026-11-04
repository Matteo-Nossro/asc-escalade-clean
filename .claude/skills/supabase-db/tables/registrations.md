# Table `registrations`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

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

- Trigger `registrations_block_user_status_change` (BEFORE UPDATE) : hors admin et secrétaire (`private.is_admin_or_secretary()`), seul un passage de `status` à `cancelled` est permis, et `reviewed_by`, `reviewed_at`, `admin_note` restent réservés. Exemptés avant tout appel : connexion sans claim JWT (`auth.role() IS NULL`) et `service_role` (20261104).
