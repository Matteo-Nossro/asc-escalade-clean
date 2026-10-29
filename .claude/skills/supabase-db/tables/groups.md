# Table `groups`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

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
