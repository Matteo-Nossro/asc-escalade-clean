# Table `group_members`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

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
