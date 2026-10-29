# Table `roles`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Table de référence des rôles disponibles.

```sql
CREATE TABLE public.roles (
  code text NOT NULL,   -- 'admin' | 'secretary' | 'parent' | 'initiateur'
  label text NOT NULL,
  CONSTRAINT roles_pkey PRIMARY KEY (code)
);
```
