# Table `parent_access`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

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
