# Table `group_instructors`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Initiateurs (encadrants) rattachés à un groupe.

```sql
CREATE TABLE public.group_instructors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT group_instructors_pkey PRIMARY KEY (id),
  CONSTRAINT group_instructors_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_instructors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```
