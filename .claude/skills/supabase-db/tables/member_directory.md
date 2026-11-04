# Table `member_directory`

> Extrait de docs/database.md, qui fait foi en cas d'écart.

Annuaire public limité aux référents de groupe (`groups.referent_id`) et aux moniteurs (`group_instructors.user_id`). Colonnes `id` et `full_name` seulement (`avatar_url` retiré par 20261102).

- Vue `security_invoker = true` au-dessus de `private.member_directory_rows()` (`SECURITY DEFINER`, `search_path = ''`, `STABLE`). Non modifiable (`is_updatable = NO`, `is_insertable_into = NO`). Remplace la vue de 20260426, qui lisait tous les profils.
- Droits : `SELECT` seul pour `anon` et `authenticated` ; `EXECUTE` de la fonction pour ces deux rôles ; rien pour `PUBLIC` ni `service_role`.
- Lecteur unique : `useGroups.fetchGroups` (blok public `GroupsAccordion`, `/mes-inscriptions`, `/admin/dashboard`).
