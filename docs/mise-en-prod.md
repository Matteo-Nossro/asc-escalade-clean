# Mise en production — base Supabase

> Toutes les commandes de ce document sont lancées **par un humain**, dans son terminal. Claude ne touche jamais la prod (voir `CLAUDE.md` § Supabase) : `.claude/hooks/agent-guard.mjs` refuse `supabase db push` / `db reset` dès que le projet lié n'est pas le dev `ybtnnogxukfldurozqwa`.

## 1. Situation de départ
- Le schéma de prod a été créé **à la main** dans le dashboard : la table `supabase_migrations.schema_migrations` de la prod est vide.
- Le dépôt contient pourtant des migrations dont les objets **existent déjà en prod** (vérifié le 2026-10-24 contre le dump `prod_schema.sql`, schéma `public`) :

| Migration | Présente de fait en prod ? | Remarque |
|---|---|---|
| `20260101_rattrapage_schema.sql` | oui | reproduit le schéma de base de la prod (tables, fonctions, policies, droits) |
| `20260409_profiles_children_support.sql` | oui | |
| `20260411_groups_import.sql` | oui | ⚠️ `TRUNCATE … CASCADE` des groupes : **ne doit jamais s'exécuter en prod** |
| `20260426_security_fixes_rls.sql` | oui | |
| `20260520_helloasso.sql` | oui | objets identiques au dump |

Un `supabase db push` lancé tel quel sur la prod rejouerait donc tout, dont le `TRUNCATE` de `20260411`. Il faut d'abord **marquer ces migrations comme appliquées**, sans les exécuter.

## 2. Mettre la prod en cohérence (une seule fois, avant tout `db push`)
1. **Sauvegarde** (schéma + données) :
   ```bash
   npx supabase link --project-ref <REF-PROD>
   npx supabase db dump --linked -f backup/prod_schema_AAAAMMJJ.sql
   npx supabase db dump --linked --data-only -f backup/prod_data_AAAAMMJJ.sql
   ```
   Les sauvegardes restent hors du dépôt (jamais commitées).
2. **Vérifier qu'aucune dérive n'a eu lieu depuis le dump de référence** : comparer le nouveau dump de schéma avec `prod_schema.sql`. Tout objet ajouté à la main entre-temps doit d'abord être reporté dans une **nouvelle** migration (jamais dans une migration existante).
3. **Constater l'historique vide** :
   ```bash
   npx supabase migration list --linked   # colonne « Remote » vide
   ```
4. **Marquer comme appliquées** les migrations présentes de fait (aucune n'est exécutée) :
   ```bash
   npx supabase migration repair --linked --status applied 20260101 20260409 20260411 20260426 20260520
   ```
5. **Contrôler** :
   ```bash
   npx supabase migration list --linked   # Local = Remote pour les 5 versions
   npx supabase db push --linked --dry-run # « Remote database is up to date »
   ```
   Si le dry-run propose la moindre de ces 5 migrations : **s'arrêter**, ne pas pousser.
6. **Revenir sur le dev** immédiatement :
   ```bash
   npx supabase link --project-ref ybtnnogxukfldurozqwa
   ```

À partir de là, prod et dev partagent le même historique. Les nouvelles migrations (lots HelloAsso…) sont testées sur le dev puis poussées en prod par `db push`.

## 3. Jour de la mise en ligne HelloAsso
Pré-requis : la mise en cohérence (§ 2) est faite, les lots à livrer sont mergés et validés sur le dev en sandbox HelloAsso.

1. **Gel** : plus aucune modification de schéma à la main dans le dashboard de prod.
2. **Sauvegarde** schéma + données (§ 2.1).
3. **Liste des migrations à livrer** : `npx supabase db push --linked --dry-run` ne doit proposer **que** les nouvelles migrations HelloAsso (créées par les lots, `20260520_helloasso.sql` n'étant jamais réécrite). Toute autre ligne ⇒ s'arrêter.
   - `20261025_helloasso_socle.sql` est refusée tant que `helloasso_forms` contient en prod le doublon `(Membership, test-rls)`. Ce cas se traite **avant** le push, à la main, selon la décision de l'utilisateur : vérifier d'abord si `profile_payments` référence les lignes concernées (clé étrangère `ON DELETE RESTRICT` : une ligne référencée ne se supprime pas). La relecture des saisons après la migration est à l'étape 5.
4. **Variables d'environnement de prod** chez l'hébergeur : `NUXT_HELLOASSO_*` (client id/secret **de production**, slug de l'organisation, URL de l'API de prod, environnement `NUXT_HELLOASSO_ENVIRONMENT=production`, **obligatoire** : sans lui la synchronisation renvoie `config_missing`), secret du webhook à définir **avant** d'exposer le webhook (lot 7), secret du cron si le lot 4 est livré.
5. **Migrations** : `npx supabase db push --linked`, puis `migration list` pour contrôler.
   - **Saison des formulaires existants** : `20261025_helloasso_socle.sql` remplit `season` d'après la date de création (coupure au 1er septembre) ; un formulaire créé après le 1er septembre 2026 reçoit donc `2026-2027`, même s'il concerne la saison 2025-2026. Juste après la migration, relire la saison de **chaque** formulaire existant (`select form_slug, label, season, created_at from helloasso_forms order by created_at;`) et corriger les erreurs dans l'admin ou par une requête `update` ciblée.
6. **Déploiement de l'application** (workflow `.github/workflows/deploy.yml`).
7. **Contrôles** dans l'admin :
   - « Tester la connexion » HelloAsso : environnement `production`, organisation correcte, OK ;
   - première synchronisation manuelle des adhésions, vérification du passage dans `helloasso_sync_runs` (compteurs, aucune erreur) ;
   - contrôle sur quelques adhérents connus du statut « payé ».
8. **Automatismes** (selon les lots livrés) : activer le cron OVH (lot 4), déclarer l'URL du webhook dans HelloAsso (lot 7). **Le secret du webhook doit être défini en prod (étape 4) AVANT de déclarer cette URL chez HelloAsso** : sans secret, la route refuse toutes les notifications. L'URL déclarée doit contenir `?secret=<NUXT_HELLOASSO_WEBHOOK_SECRET>` : sinon les notifications sont ignorées et les paiements ne sont plus enregistrés.
9. **Revenir sur le dev** : `npx supabase link --project-ref ybtnnogxukfldurozqwa`.

### Retour arrière
- Application : redéployer l'image précédente.
- Base : les migrations ne se défont pas ; une correction passe par une **nouvelle** migration. La restauration de la sauvegarde (§ 2.1) est le dernier recours.
- HelloAsso : désactiver le cron et le webhook ; HelloAsso reste la source de vérité des paiements, une synchronisation ultérieure rattrape l'état.
