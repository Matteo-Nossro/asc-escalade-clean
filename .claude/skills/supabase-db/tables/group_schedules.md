# Table `group_schedules`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Créneaux horaires des groupes.

```sql
CREATE TABLE public.group_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),  -- 1=Lundi … 7=Dimanche
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  CONSTRAINT group_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT group_schedules_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
```
