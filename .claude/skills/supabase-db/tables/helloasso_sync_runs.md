# Table `helloasso_sync_runs`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Historique des passages de synchronisation HelloAsso (alimenté à partir du lot 2).

```sql
CREATE TABLE public.helloasso_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,                      -- ex. 'memberships'
  trigger_source text NOT NULL CHECK (trigger_source IN ('manual', 'cron')),
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  triggered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  counts jsonb NOT NULL DEFAULT '{}',       -- compteurs propres à chaque lot
  error text
);
```

- Index `(scope, started_at DESC)`.
- RLS : lecture pour `is_admin_or_secretary()`. Aucune policy d'écriture : les écritures passent par le service role.
