# Table `events`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

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
