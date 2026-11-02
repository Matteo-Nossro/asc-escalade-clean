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

## 4. Mise en ligne auth-profils (migrations **avant** le code)
Pré-requis : § 2 faite. Migrations livrées : `20261029_auth_profils.sql` puis `20261030_profiles_block_status_role.sql` (la première est déjà appliquée sur le dev : ne pas la réécrire). Réglage du dashboard de prod fait **avant** l'étape 6 : `/callback` dans les URLs de redirection (§ 5).

1. **Sauvegarde** schéma + données (§ 2.1).
2. **Liste des migrations** : `npx supabase db push --linked --dry-run` doit proposer ces deux fichiers, et les seuls restant à livrer (lots HelloAsso, § 3). Toute autre ligne ⇒ s'arrêter.
3. **Migrations d'abord** : `npx supabase db push --linked`, puis `npx supabase migration list --linked`.
   - Le code de cette feature lit `profile_completed_at`. Déployé avant la colonne, ou avant son rattrapage, il renverrait **tous** les comptes vers `/completer-profil`. Ne jamais inverser les étapes 3 et 6.
4. **Contrôle des profils existants** (lecture seule) : tous les profils doivent avoir `profile_completed_at` renseigné, soit 0 profil incomplet :
   ```bash
   npx supabase db query --linked "select count(*) from public.profiles where profile_completed_at is null;"
   ```
   Un résultat non nul signale un profil créé par l'ancien code entre l'étape 3 et le déploiement : le compléter à la main avant l'étape 6.
5. **Défaut du statut** : `profiles.status` vaut `'En attente'` par défaut. Les insertions de l'application posent déjà le statut ; aucun compte existant n'est modifié.
6. **Déploiement de l'application** (workflow `.github/workflows/deploy.yml`), seulement après les étapes 3 et 4.
7. **Contrôle sur le dev uniquement** : `node scripts/check-auth-profils-db.mjs` (crée et supprime des comptes de test). Ne jamais le lancer contre le projet de prod.
8. **Hors périmètre** : cette mise en ligne ne corrige **pas** les comptes déjà créés en prod (statuts « Actif » à tort, profils incomplets, comptes Google/Microsoft sans rôle). Le rattrapage marque seulement ces profils comme complétés, pour qu'ils ne soient pas renvoyés vers la complétion. Leur correction relève d'une décision séparée de l'utilisateur.
9. **Revenir sur le dev** : `npx supabase link --project-ref ybtnnogxukfldurozqwa`.

## 5. Réglages manuels du dashboard (hors migrations)
Ces réglages ne sont **pas** portés par `supabase/migrations/` ni par `db push` : ils se font à la main dans le dashboard de **chaque** projet, et ne se recopient pas d'un projet à l'autre. À vérifier lors de toute recréation ou bascule de projet.

| Réglage | Où (dashboard) | Prod | Dev |
|---|---|---|---|
| SMTP personnalisé | Authentication → Emails → SMTP Settings | Resend (déjà en place, rien à faire) | Resend, clé API dédiée au dev ([docs/dev/supabase-dev.md](dev/supabase-dev.md)) |
| Rate limits | Authentication → Rate Limits | valeurs en place | à relever avec le SMTP personnalisé |
| Modèles d'e-mails | Authentication → Emails → Templates | modèles en place | à aligner sur la prod |
| URLs de redirection (`/callback`) | Authentication → URL Configuration → Redirect URLs | `https://escalade-chevigny.fr/callback**` (à adapter au domaine réel de la Site URL de prod) | `https://localhost:3000/callback**` (serveur de dev en https) |
| Protection contre les mots de passe compromis (HaveIBeenPwned, advisor `auth_leaked_password_protection`) | Authentication → Providers → Email (ou Attack Protection, selon la version du dashboard) | à activer si l'offre le permet | à activer si l'offre le permet |

**`/callback` dans les URLs de redirection : à faire AVANT de déployer en prod le code auth-profils R2.** Les liens de confirmation d'inscription (`signUp` et renvoi) passent `emailRedirectTo = <origine>/callback?type=signup`. Une URL absente de la liste est ignorée par Supabase, qui renvoie alors vers la Site URL sans l'écran de confirmation ni de lien expiré.
- `**` couvre les paramètres (`?type=signup`, `?type=recovery`) ; une entrée `…/callback` seule ne les couvre pas.
- Le modèle « Confirm signup » doit utiliser `{{ .ConfirmationURL }}` (ou `{{ .RedirectTo }}`), pas `{{ .SiteURL }}` en dur, sinon le lien de retour est perdu.
