---
name: supabase-db
description: Schéma et règles d'accès Supabase d'ASC Escalade (tables, colonnes, enums, relations, client vs service role, RLS). À utiliser avant d'écrire une requête Supabase, une route server/api, une migration, ou de relire du code qui touche aux données.
---

# Supabase — index et règles d'accès

Source de vérité : `docs/database.md`. Ouvre seulement la fiche de la table utile.

| Table | Rôle | Fiche |
|---|---|---|
| `profiles` | adhérents (UUID autonome, `email` nullable pour les enfants) | [tables/profiles.md](tables/profiles.md) |
| `roles` / `user_roles` | rôles `admin`, `secretary`, `parent`, `initiateur` (N:N) | [roles](tables/roles.md) · [user_roles](tables/user_roles.md) |
| `groups` | groupes d'escalade | [tables/groups.md](tables/groups.md) |
| `group_schedules` | créneaux (`day_of_week` 1 = lundi … 7) | [tables/group_schedules.md](tables/group_schedules.md) |
| `group_instructors` | initiateurs d'un groupe | [tables/group_instructors.md](tables/group_instructors.md) |
| `group_members` | inscriptions aux groupes (`registration_status`) | [tables/group_members.md](tables/group_members.md) |
| `events` / `registrations` | événements et inscriptions (`registration_status`) | [events](tables/events.md) · [registrations](tables/registrations.md) |
| `parent_access` | parent → enfant (`access_type` : read, register, full) | [tables/parent_access.md](tables/parent_access.md) |
| `notification_logs` | emails envoyés | [tables/notification_logs.md](tables/notification_logs.md) |
| `temps_user` | import FFME temporaire | [tables/temps_user.md](tables/temps_user.md) |
| `User` | **legacy, ne plus utiliser** | [tables/user-legacy.md](tables/user-legacy.md) |
| `helloasso_forms` | formulaires HelloAsso (`season`, `event_id` ; écritures admin seul) | [tables/helloasso_forms.md](tables/helloasso_forms.md) |
| `helloasso_tokens` | jeton HelloAsso par environnement, service role seul | [tables/helloasso_tokens.md](tables/helloasso_tokens.md) |
| `helloasso_sync_runs` | historique des synchronisations HelloAsso (lecture admin + secrétaire) | [tables/helloasso_sync_runs.md](tables/helloasso_sync_runs.md) |

Enums : `registration_status` = `pending`, `confirmed`, `cancelled` · `access_type` = `read`, `register`, `full`.

## Règles d'accès
- **Client** (`app/`) : `useSupabaseClient()` / `useSupabaseUser()` uniquement (clé publique `SUPABASE_KEY`, RLS active).
- **Serveur** (`server/`) : `serverSupabaseUser(event)` pour l'identité. `serverSupabaseServiceRole(event)` **contourne la RLS** : à réserver à `server/`, et toujours après `requireAdmin(event)` (`server/utils/requireAdmin.ts`) ou une vérification d'autorisation explicite.
- **Jamais côté client** : `SUPABASE_SECRET_KEY`, la service role ou tout autre secret. Rien dans `runtimeConfig.public`, aucun import `#supabase/server` dans `app/`.
- Id utilisateur : `user.value?.id ?? user.value?.sub` (SSR / JWT).
- Le middleware `app/middleware/auth.global.ts` ne protège pas les appels API directs : la garde doit être côté serveur.
- **Schéma** : nouvelle migration `supabase/migrations/AAAAMMJJ_<nom>.sql`, **seulement** si `plan.md` la prévoit, puis mise à jour de `docs/database.md`. RLS de référence : `supabase/migrations/20260426_security_fixes_rls.sql`.
- **Droits explicites dans chaque migration** (« Automatically expose new tables » désactivé sur le dev et la prod depuis le 2026-11-03) : un objet créé par `postgres` dans `public` ne reçoit plus SELECT / INSERT / UPDATE / DELETE pour `anon`, `authenticated` **ni `service_role`** ; une fonction n'est plus exécutable que par `postgres`. Pour toute nouvelle table, vue, séquence ou fonction exposée, la migration contient :
  1. `REVOKE ALL ON <objet> FROM PUBLIC, anon, authenticated;` (les privilèges par défaut laissent encore TRUNCATE / REFERENCES / TRIGGER sur les tables) ;
  2. les `GRANT` au **strict nécessaire**, rôle par rôle : `service_role` si `server/` y accède, `authenticated` seulement pour ce que les policies autorisent, `anon` seulement pour une lecture publique voulue ; `USAGE` sur la séquence si un rôle client insère ;
  3. pour une fonction `SECURITY DEFINER` : `SET search_path = ''`, noms qualifiés, `EXECUTE` à `PUBLIC` retiré ; aucune fonction de trigger exécutable par `anon` / `authenticated`.
  4. fonctions utilitaires de sécurité (`SECURITY DEFINER` appelées par des policies ou des vues) : dans le schéma **`private`** (non exposé par l'API, donc pas de RPC), avec `USAGE` sur `private` et `EXECUTE` au seul rôle qui en a besoin. Conventions : `private.has_role(text)` et `private.is_admin_or_secretary()` (déplacées depuis `public` par la migration `securite-bdd` B ; les policies existantes suivent, car elles référencent la fonction et non son nom), toujours écrites avec le préfixe `private.` dans les nouvelles policies et fonctions ; fonction de l'annuaire `member_directory` dans `private`, `EXECUTE` à `anon` et `authenticated`, pas à `service_role`.
  Ne jamais s'appuyer sur `ALTER DEFAULT PRIVILEGES` (celui de `20260101_rattrapage_schema.sql` est historique et ne doit pas servir de modèle).
