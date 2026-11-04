# Table `helloasso_tokens`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Jeton d'accès HelloAsso, une ligne par environnement (`sandbox` ou `production`). Accès service role uniquement.

```sql
CREATE TABLE public.helloasso_tokens (
  environment text PRIMARY KEY CHECK (environment IN ('sandbox', 'production')),
  client_id text,                           -- renseigné à l'écriture du jeton
  access_token text,
  access_expires_at timestamp with time zone,
  refresh_token text,
  refresh_expires_at timestamp with time zone,
  lock_holder uuid,
  lock_until timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

- RLS activée sans aucune policy. Droits (20261105) : `service_role` a `SELECT`, `INSERT`, `UPDATE` ; `anon` et `authenticated` n'ont rien ; jamais `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`. Les jetons sont stockés en clair (pas de Vault).
- Fonction `helloasso_acquire_token_lock(p_environment, p_holder, p_ttl_seconds = 20)` → `boolean` : prend le verrou de renouvellement s'il est libre ou expiré. L'heure vient de `now()` de la base. `EXECUTE` réservé au service role.
