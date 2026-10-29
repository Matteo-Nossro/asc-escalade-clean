# Table `User` (legacy)

> Extrait de docs/database.md, qui fait foi en cas d'écart.

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
