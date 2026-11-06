# Mise en production — base Supabase

> Toutes les commandes de ce document sont lancées **par un humain**, dans son terminal. Claude ne touche jamais la prod (voir `CLAUDE.md` § Supabase) : `.claude/hooks/agent-guard.mjs` refuse `supabase db push` / `db reset` dès que le projet lié n'est pas le dev `ybtnnogxukfldurozqwa`.

> **CLI Supabase** : version épinglée dans `package.json` (3.0.0), donc `npm ci` puis `npx supabase` depuis la racine. Règles de cette version, vérifiées sur le dev le 2026-11-04 :
> - **Sans `--remote`, la commande vise la base locale.** `--remote` vise le projet lié (`--linked` est déprécié, retiré en v4).
> - Chaque commande affiche `Target: project <nom> (<ref>)`. **Relire le ref avant de répondre.** Le mot `production` sur cette ligne est le type d'environnement Supabase : il s'affiche aussi sur le dev, seul le ref compte.
> - `db push` et `migration repair` demandent une confirmation sur un projet hébergé : y répondre à la main. **Jamais de `--yes` ni de `SUPABASE_YES` sur la prod.**
> - `db query` en lecture : toujours avec `--read-only`.
> - `db dump` a besoin de **Docker démarré**. En cas d'échec, il laisse un **fichier vide** : contrôler la taille des sauvegardes.

## 0. Branches et environnements
> **Deux règles d'ici la livraison groupée (§ 3) :**
> 1. **Jamais de « Trigger deploy » dans Netlify** : il publierait `master`, plus ancien que le site en ligne.
> 2. **Pas de push sur `dev`** : la sauvegarde passe par `sauvegarde-dev` (commande ci-dessous).
>
> **Retrouver le serveur perso comme environnement de test avant la livraison** : la règle 2 ne peut être levée que si les **deux** conditions sont remplies :
> - Deploy Previews des PR désactivés dans Netlify (« Don't deploy pull requests ») ;
> - serveur perso vérifié sur le Supabase de dev (vérification ci-dessous).

| Branche | Déploie sur | Quand | Base Supabase |
|---|---|---|---|
| `master` | **Production**, Netlify | automatique à chaque fusion ou push | prod |
| `dev` | Serveur perso, environnement de test (`.github/workflows/deploy.yml`) | à chaque push | doit être le dev : voir la vérification ci-dessous |
| `sauvegarde-dev` | rien | | |

**La mise en ligne réelle est la fusion de `dev` dans `master`**, en dernière étape de la livraison groupée, après les migrations et les réglages manuels (§ 3, étape 9). Un push sur `dev` ne change pas le site public.

**État actuel (constaté le 2026-11-05)** : le site en ligne est `dev@cf52470`, un aperçu de la PR #13 publié manuellement en production le 7 septembre à 19 h 39. `master` n'a pas ce code : `origin/master` est sur `0aa28a8` (fusion de la PR #12, 1er septembre), 7 commits derrière `cf52470`. Toute publication depuis `master` remplacerait donc le site en ligne par un code plus ancien, y compris un simple « Trigger deploy » dans Netlify. Piège connu, résolu par l'étape 9 du § 3 : pas de fusion anticipée (`docs/backlog.md`, P8).

**Aperçus Netlify** : la PR #13 (`dev` → `master`) étant ouverte, un push sur `dev` peut relancer un aperçu. Ne pas le publier à la main : ce serait une mise en ligne hors de l'ordre du § 3. Vérifier aussi à quelle base les aperçus sont branchés (variables Netlify, contexte Deploy Previews) avant de s'y connecter.

### À vérifier avant tout push sur `dev` : le serveur perso est branché sur le dev
Le serveur perso doit utiliser le projet Supabase de dev `ybtnnogxukfldurozqwa`. Sinon, il ferait tourner le nouveau code sur la base de prod, avant ses migrations, et ses tests écriraient dans les données réelles.
1. Ouvrir le site du serveur perso, onglet Réseau des outils de développement, puis tenter une connexion : les requêtes doivent partir vers `https://ybtnnogxukfldurozqwa.supabase.co`.
2. Contrôler ce que recevra le prochain build : les secrets GitHub `SUPABASE_URL`, `SUPABASE_KEY` et `SUPABASE_SECRET_KEY` (illisibles une fois enregistrés : dans le doute, les ressaisir avec les valeurs du dev) et les variables de la stack Portainer `asc-escalade`.

**Si le serveur n'est pas branché sur le dev, ou si le doute subsiste : ne pas pousser `dev` avant la fin de l'étape 8 du § 3**, c'est-à-dire avant que les migrations soient en prod. La validation des lots se fait alors en local.

### Branche `sauvegarde-dev`
Sauvegarde uniquement : elle ne déclenche aucun déploiement et ne sert ni à tester ni à livrer. Elle permet de mettre `dev` à l'abri sur GitHub sans le pousser. Pour la mettre à jour :
```bash
git push origin dev:sauvegarde-dev
```
Un refus (non fast-forward) signale que l'historique de `dev` a été réécrit : regarder pourquoi avant de forcer quoi que ce soit.

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
   npx supabase db dump --remote -f backup/prod_schema_AAAAMMJJ.sql
   npx supabase db dump --remote --data-only -f backup/prod_data_AAAAMMJJ.sql
   ```
   Docker doit être démarré. Vérifier que les deux fichiers ne sont pas vides. Les sauvegardes restent hors du dépôt (`backup/` est dans `.gitignore`).
2. **Vérifier qu'aucune dérive n'a eu lieu depuis le dump de référence** : comparer le nouveau dump de schéma avec `prod_schema.sql`. Tout objet ajouté à la main entre-temps doit d'abord être reporté dans une **nouvelle** migration (jamais dans une migration existante). **Différences attendues, sans nouvelle migration** : celles de la migration A, appliquée le 2026-11-04 (§ 2 bis) : schéma `private`, fonction `private.member_directory_rows()`, vue `member_directory` recréée sans `avatar_url` et ses droits. Tout autre écart ⇒ s'arrêter.
3. **Constater l'historique vide** :
   ```bash
   npx supabase migration list --remote   # colonne « Remote » vide
   ```
4. **Marquer comme appliquées** les migrations présentes de fait (aucune n'est exécutée) :
   ```bash
   npx supabase migration repair --remote --status applied 20260101 20260409 20260411 20260426 20260520
   ```
5. **Contrôler** :
   ```bash
   npx supabase migration list --remote   # Local = Remote pour les 5 versions
   npx supabase db push --remote --dry-run # ne propose que des versions postérieures à 20260520
   ```
   Le dry-run liste les migrations plus récentes encore à livrer, dont `20261102` tant qu'elle n'est pas enregistrée : c'est normal, ne pas les pousser ici. S'il propose la moindre de ces 5 migrations : **s'arrêter**, ne pas pousser.
6. **Revenir sur le dev** immédiatement :
   ```bash
   npx supabase link --project-ref ybtnnogxukfldurozqwa
   ```

À partir de là, prod et dev partagent le même historique. Les nouvelles migrations (lots HelloAsso…) sont testées sur le dev puis poussées en prod par `db push`.

## 2 bis. Correctif de sécurité anticipé : migration A (`member_directory`)
Applique `20261102_member_directory_securite.sql` en prod **seule**, dans le SQL Editor, avant les autres migrations en attente. Elle ne dépend d'aucune d'elles.

> **Appliquée en prod le 2026-11-04 (étapes 1 à 5), hors historique des migrations.** `20261102` n'est pas enregistrée dans `schema_migrations`. Le § 2 n'était pas fait à cette date : il se fera le jour de la livraison groupée, puis l'étape 6 ci-dessous, avant le dry-run (§ 3, étape 6). Ne pas lancer l'étape 6 avant le § 2.
> Constaté : `attendu` = 0, aucun référent ni moniteur n'étant affecté aux groupes en prod, donc l'annuaire est vide ; anonyme, 0 profil lisible ; adhérent, son seul profil, 0 profil de tiers ; `anon` et `authenticated` en `SELECT` seul ; `is_updatable` et `is_insertable_into` à `NO` ; `avatar_url` en erreur 42703 ; DELETE anonyme en erreur 55000. PATCH non lancé (jugé inutile par l'utilisateur, `is_updatable` = `NO`). `/tarifs` : la page se charge normalement, sans nom affiché.

**État de la prod avant (2026-11-03)** : correctif manuel fait, `anon` sans droit, `authenticated` en `SELECT` seul sur l'ancienne vue. Conséquences jusqu'à la migration : un adhérent connecté lit encore le nom et l'avatar de tous les profils ; un visiteur anonyme ne voit plus les noms des moniteurs sur `/tarifs`, sans message d'erreur (`useGroups` ignore l'erreur). La migration est compatible avec ce `revoke` : elle supprime la vue, la recrée et repose tous ses droits. Elle est aussi compatible avec le code déployé, qui ne lit que `id, full_name`.

### Prérequis
- § 2 fait : `migration list --remote` montre les 5 versions historiques (indispensable avant l'étape 6, voir la remarque sur `--include-all`).
- Sauvegarde du jour non vide (§ 2.1).
- `private` absent des schémas exposés : Project Settings → Data API (constaté le 2026-11-03 : `public`, `graphql_public`).
- Le SQL Editor est ouvert sur le projet de **prod** : vérifier le ref dans l'URL du dashboard.

### Déroulé
**1. Contrôle avant** (SQL Editor, lecture seule) : `objets_dependants` doit valoir 0, sinon la migration échouerait et s'annulerait. Noter `attendu` : c'est le nombre de lignes que renverra l'annuaire.
```sql
select
  (select count(*)
     from pg_depend d
     left join pg_rewrite r on r.oid = d.objid and d.classid = 'pg_rewrite'::regclass
    where d.refobjid = 'public.member_directory'::regclass and d.deptype = 'n'
      and coalesce(r.ev_class, 0) <> 'public.member_directory'::regclass) as objets_dependants,
  (select count(*) from public.profiles p
    where exists (select 1 from public.groups g where g.referent_id = p.id)
       or exists (select 1 from public.group_instructors gi where gi.user_id = p.id)) as attendu,
  to_regnamespace('private') as schema_private; -- doit être vide : sinon, s'arrêter et regarder ce qu'il contient
```
**2. Migration** : coller **tout** le fichier `supabase/migrations/20261102_member_directory_securite.sql` et l'exécuter une fois. Il porte son `BEGIN` / `COMMIT` : en cas d'erreur, rien n'est appliqué.

**3. Droits sur la vue** : `anon` et `authenticated` n'ont que `SELECT`. Pour `service_role`, `TRUNCATE, REFERENCES, TRIGGER` est toléré à ce stade (reste des privilèges par défaut, retiré par la migration B).
```sql
select r as role,
       coalesce((select string_agg(p, ', ')
                   from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p
                  where has_table_privilege(r, 'public.member_directory', p)), '(aucun)') as droits
  from unnest(array['anon','authenticated','service_role']) r;
```
Puis la vue et sa fonction. Attendu : `{security_invoker=true}`, `NO`, `NO`, colonnes `id, full_name`, `true`, `true`, `false`.
```sql
select c.reloptions::text as options, v.is_updatable, v.is_insertable_into,
       (select string_agg(column_name, ', ' order by ordinal_position)
          from information_schema.columns
         where table_schema = 'public' and table_name = 'member_directory') as colonnes,
       has_function_privilege('anon', 'private.member_directory_rows()', 'EXECUTE') as anon_exec,
       has_function_privilege('authenticated', 'private.member_directory_rows()', 'EXECUTE') as auth_exec,
       has_function_privilege('service_role', 'private.member_directory_rows()', 'EXECUTE') as service_exec
  from pg_class c
  join information_schema.views v on v.table_schema = 'public' and v.table_name = c.relname
 where c.oid = 'public.member_directory'::regclass;
```
**4. Ce que voit chaque rôle** (SQL Editor, lecture seule). Garder le `begin` et le `rollback` : `set local` n'agit que dans une transaction, sans elle la requête tournerait avec les droits de `postgres` et son résultat ne prouverait rien.

Visiteur anonyme. Attendu : `lignes_annuaire` = `attendu` de l'étape 1, `profils_lisibles` = 0.
```sql
begin;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select (select count(*) from public.member_directory) as lignes_annuaire,
       (select count(*) from public.profiles) as profils_lisibles;
rollback;
```
Choisir un adhérent de test (ni staff, ni référent, ni moniteur) :
```sql
select p.id from public.profiles p
 where p.email is not null
   and not exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role_code in ('admin','secretary'))
   and not exists (select 1 from public.groups g where g.referent_id = p.id)
   and not exists (select 1 from public.group_instructors gi where gi.user_id = p.id)
 limit 1;
```
Adhérent, en remplaçant `<UUID>` aux **trois** endroits. Attendu : `lignes_annuaire` = `attendu`, `profils_de_tiers` = 0, `profils_lisibles` = lui et ses enfants rattachés.
```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"<UUID>"}', true);
select (select count(*) from public.member_directory) as lignes_annuaire,
       (select count(*) from public.profiles) as profils_lisibles,
       (select count(*) from public.profiles
         where id <> '<UUID>'
           and id not in (select child_id from public.parent_access where parent_id = '<UUID>')) as profils_de_tiers;
rollback;
```
**5. Vue non modifiable** (SQL Editor). Attendu : `NO`, `NO`.
```sql
select is_updatable, is_insertable_into
  from information_schema.views
 where table_schema = 'public' and table_name = 'member_directory';
```
**Contrôle de l'extérieur** (Git Bash, clé publique de la prod ; les écritures visent un identifiant qui n'existe pas et ne peuvent donc rien modifier) :
```bash
U=https://<REF-PROD>.supabase.co/rest/v1/member_directory; K=<CLE-ANON-PROD>; Z=00000000-0000-0000-0000-000000000000
curl -s "$U?select=id,full_name" -H "apikey: $K"                 # uniquement les référents et moniteurs
curl -s "$U?select=avatar_url" -H "apikey: $K"                   # erreur 42703, colonne absente
curl -s -X PATCH "$U?id=eq.$Z" -H "apikey: $K" -H "Content-Type: application/json" -d '{"full_name":"x"}'   # erreur 55000
curl -s -X DELETE "$U?id=eq.$Z" -H "apikey: $K"                  # erreur 55000
```
Puis ouvrir `/tarifs` en navigation privée : les noms du référent et des moniteurs s'affichent de nouveau. Si `attendu` vaut 0, l'API renvoie `[]` et la page s'affiche sans aucun nom : c'est normal.

**6. Enregistrer la migration dans l'historique** (terminal) :
```bash
npx supabase link --project-ref <REF-PROD>
npx supabase migration repair --remote --status applied 20261102   # relire « Target », confirmer à la main
npx supabase migration list --remote                               # 20261102 présente côté Remote
npx supabase link --project-ref ybtnnogxukfldurozqwa
```

**Si un contrôle échoue après l'étape 2** : ne pas faire l'étape 6. En cas de fuite constatée, fermer l'accès tout de suite (`revoke all on public.member_directory from anon, authenticated;`), puis corriger par une nouvelle migration.

### Conséquence : `--include-all` sur tous les `db push` suivants
Une fois `20261102` dans l'historique, les migrations plus anciennes encore à livrer (`20261025`, `20261029`, `20261030`) sont refusées sans `--include-all`. Cette option pousse **tout** ce qui manque à l'historique : si le § 2 n'avait pas été fait, elle rejouerait les 5 migrations historiques, dont le `TRUNCATE` de `20260411`. Le contrôle de la liste exacte au dry-run reste donc obligatoire, et il passe aussi `--include-all`.

## 3. Livraison groupée : HelloAsso, auth-profils, sécurité
`db push` envoie **toutes** les migrations en attente d'un coup : ces livraisons ne peuvent pas se faire séparément. Elles partagent donc un même `db push`, suivi d'une seule mise en ligne de l'application (fusion de `dev` dans `master`).

**Migrations livrées**, dans cet ordre : `20261025_helloasso_socle.sql`, `20261029_auth_profils.sql`, `20261030_profiles_block_status_role.sql`, `20261103_fonctions_search_path.sql` (B), `20261104_registrations_service_role.sql` (C), `20261105_helloasso_grants_explicites.sql` (D), plus celles des lots HelloAsso livrés (`20260520_helloasso.sql` n'étant jamais réécrite).

**Prérequis bloquants**
- § 2 fait le jour de la livraison, au plus tard avant l'étape 6 ci-dessous. Sa sauvegarde peut servir à l'étape 2 si elle est du même jour.
- § 2 bis fait jusqu'à l'étape 5 (2026-11-04). Son étape 6 se fait au début de l'étape 6 ci-dessous.
- **La migration D (backlog Q29) fait partie de la liste.** Sans elle, « Automatically expose new tables » étant désactivé, `service_role` n'aurait aucun droit sur `helloasso_tokens` et `helloasso_sync_runs` : le jeton et la synchronisation HelloAsso seraient cassés.
- Lots à livrer mergés et validés sur le dev, en sandbox HelloAsso.
- **Rien n'arrive sur `master` avant l'étape 9** : toute fusion ou tout push y publie en production.
- **Serveur perso vérifié** (§ 0) avant tout push sur `dev`. S'il n'est pas branché sur le dev, `dev` attend la fin de l'étape 8.
- **Variables Netlify comparées** entre les contextes Production et Deploy Previews (Supabase, Storyblok, HelloAsso) : le site en ligne a été construit comme un aperçu, la fusion le reconstruit en contexte Production. **Écart inexpliqué ⇒ s'arrêter.** Les valeurs de prod posées à l'étape 5 seront ensuite un écart attendu.

### Déroulé
1. **Gel** : plus aucune modification de schéma à la main dans le dashboard de prod.
2. **Sauvegarde** schéma + données (§ 2.1).
3. **Doublon `helloasso_forms`** : `20261025_helloasso_socle.sql` est refusée tant que la prod contient le doublon `(Membership, test-rls)`. Le traiter **avant** le push, à la main, selon la décision de l'utilisateur : vérifier d'abord si `profile_payments` référence les lignes concernées (clé étrangère `ON DELETE RESTRICT` : une ligne référencée ne se supprime pas).
4. **Réglage du dashboard** : `/callback` dans les URLs de redirection (§ 5), avant l'étape 9.
5. **Variables d'environnement de prod** dans le dashboard Netlify (les secrets GitHub n'alimentent que le serveur perso) : `NUXT_HELLOASSO_*` (client id/secret **de production**, slug de l'organisation, URL de l'API de prod, environnement `NUXT_HELLOASSO_ENVIRONMENT=production`, **obligatoire** : sans lui la synchronisation renvoie `config_missing`), secret du webhook à définir **avant** d'exposer le webhook (lot 7), secret du cron si le lot 4 est livré.
6. **Liste des migrations** :
   ```bash
   npx supabase link --project-ref <REF-PROD>
   npx supabase migration repair --remote --status applied 20261102   # § 2 bis, étape 6 ; relire « Target », confirmer à la main
   npx supabase db push --remote --include-all --dry-run
   ```
   Sans ce `repair`, le push rejouerait la migration A. La liste doit contenir **exactement** les migrations listées plus haut. Aucune des 5 versions historiques, ni `20261102`. Toute autre ligne ⇒ s'arrêter.
7. **Migrations d'abord** : `npx supabase db push --remote --include-all` (relire « Target », confirmer à la main), puis `npx supabase migration list --remote`.
8. **Contrôles de la base** (lecture seule) :
   - **Fonctions** : `has_role` et `is_admin_or_secretary` dans `private` uniquement ; aucune ligne ne doit ressortir de la seconde requête (fonction sans `search_path` vide).
     ```sql
     select n.nspname, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where p.proname in ('has_role', 'is_admin_or_secretary');

     select n.nspname, p.proname, p.proconfig::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public', 'private')
        and (p.prosecdef or p.proname in ('handle_updated_at', 'registrations_block_user_status_change',
             'profiles_block_payment_change', 'profiles_block_status_change', 'helloasso_acquire_token_lock'))
        and not coalesce(p.proconfig, array[]::text[]) @> array['search_path=""'];
     ```
   - **Droits HelloAsso** : `anon` aucun ; `authenticated` `SELECT` sur `helloasso_sync_runs` seulement ; `service_role` exactement `SELECT, INSERT, UPDATE` sur les deux tables.
     ```sql
     select t as table_name, r as role,
            coalesce((select string_agg(p, ', ')
                        from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p
                       where has_table_privilege(r, 'public.' || t, p)), '(aucun)') as droits
       from unnest(array['helloasso_tokens','helloasso_sync_runs']) t,
            unnest(array['anon','authenticated','service_role']) r
      order by 1, 2;
     ```
   - **Saison des formulaires existants** : `20261025_helloasso_socle.sql` remplit `season` d'après la date de création (coupure au 1er septembre) ; un formulaire créé après le 1er septembre 2026 reçoit donc `2026-2027`, même s'il concerne la saison 2025-2026. Relire la saison de **chaque** formulaire (`select form_slug, label, season, created_at from helloasso_forms order by created_at;`) et corriger les erreurs par une requête `update` ciblée.
   - **Profils existants** : tous doivent avoir `profile_completed_at` renseigné.
     ```bash
     npx supabase db query --remote --read-only "select count(*) from public.profiles where profile_completed_at is null;"
     ```
     Un résultat non nul signale un profil créé par l'ancien code entre les étapes 7 et 9 : le compléter à la main avant l'étape 9.
   - **Défaut du statut** : `profiles.status` vaut `'En attente'` par défaut. Les insertions de l'application posent déjà le statut ; aucun compte existant n'est modifié.
   **Revenir sur le dev**, ces contrôles terminés : `npx supabase link --project-ref ybtnnogxukfldurozqwa`.
9. **Mise en ligne : fusion de `dev` dans `master`**, dernière étape de la livraison, seulement après les migrations (7), leurs contrôles (8) et les réglages manuels (4 et 5) :
   ```bash
   git push origin dev            # si ce n'est pas déjà fait ; ne touche pas au site public
   git fetch origin
   git rev-parse dev origin/dev   # les deux SHA doivent être identiques
   gh pr merge 13 --merge         # PR #13, dev → master : Netlify publie automatiquement
   ```
   Dans Netlify → Deploys, contrôler que le déploiement de production publié est bien ce commit de fusion. Si le site reste sur `cf52470`, vérifier que la publication automatique n'est pas verrouillée (publication manuelle du 7 septembre).
   Le code lit `profile_completed_at` : mis en ligne avant la colonne ou son rattrapage, il renverrait **tous** les comptes vers `/completer-profil`. Ne jamais inverser les étapes 7 et 9.

**Après la mise en ligne** : les étapes suivantes contrôlent le site ou branchent des automatismes qui ont besoin des nouvelles routes. Elles ne peuvent pas la précéder.

10. **Contrôles dans l'admin** :
    - « Tester la connexion » HelloAsso : environnement `production`, organisation correcte, OK ;
    - première synchronisation manuelle des adhésions, sans erreur ; si le lot `helloasso-sync` est livré, vérification du passage dans `helloasso_sync_runs` (compteurs). Sans ce lot, le serveur n'écrit pas encore dans cette table ;
    - contrôle sur quelques adhérents connus du statut « payé ».
11. **Automatismes** (selon les lots livrés) : activer le cron OVH (lot 4), déclarer l'URL du webhook dans HelloAsso (lot 7). **Le secret du webhook doit être défini en prod (étape 5) AVANT de déclarer cette URL chez HelloAsso** : sans secret, la route refuse toutes les notifications. L'URL déclarée doit contenir `?secret=<NUXT_HELLOASSO_WEBHOOK_SECRET>` : sinon les notifications sont ignorées et les paiements ne sont plus enregistrés.

**Contrôles sur le dev uniquement** : `scripts/check-auth-profils-db.mjs`, `scripts/check-helloasso-socle-db.mjs` et `scripts/check-securite-bdd.mjs` créent et suppriment des données de test. Ne jamais les lancer contre la prod.

**Hors périmètre** : cette livraison ne corrige **pas** les comptes déjà créés en prod (statuts « Actif » à tort, profils incomplets, comptes Google/Microsoft sans rôle, comptes de test sans profil). Le rattrapage marque seulement ces profils comme complétés, pour qu'ils ne soient pas renvoyés vers la complétion. Leur correction relève d'une décision séparée de l'utilisateur.

### Retour arrière
- Application : dans Netlify → Deploys, republier le déploiement précédent (`cf52470` à la première livraison). Le serveur perso n'est pas concerné.
- Base : les migrations ne se défont pas ; une correction passe par une **nouvelle** migration. La restauration de la sauvegarde (§ 2.1) est le dernier recours.
- HelloAsso : désactiver le cron et le webhook ; HelloAsso reste la source de vérité des paiements, une synchronisation ultérieure rattrape l'état.

## 4. (fusionné dans le § 3)
La mise en ligne auth-profils fait partie de la livraison groupée du § 3.

## 5. Réglages manuels du dashboard (hors migrations)
Ces réglages ne sont **pas** portés par `supabase/migrations/` ni par `db push` : ils se font à la main dans le dashboard de **chaque** projet, et ne se recopient pas d'un projet à l'autre. À vérifier lors de toute recréation ou bascule de projet.

| Réglage | Où (dashboard) | Prod | Dev |
|---|---|---|---|
| SMTP personnalisé | Authentication → Emails → SMTP Settings | Resend (déjà en place, rien à faire) | Resend, clé API dédiée au dev ([docs/dev/supabase-dev.md](dev/supabase-dev.md)) |
| Rate limits | Authentication → Rate Limits | valeurs en place | à relever avec le SMTP personnalisé |
| Modèles d'e-mails | Authentication → Emails → Templates | modèles en place | à aligner sur la prod |
| URLs de redirection (`/callback`) | Authentication → URL Configuration → Redirect URLs | `https://escalade-chevigny.fr/callback**` (à adapter au domaine réel de la Site URL de prod) | `https://localhost:3000/callback**` (serveur de dev en https) |
| « Automatically expose new tables » (privilèges par défaut des nouveaux objets) | Project Settings → Data API (ou API → Settings, selon la version du dashboard) | **désactivé** (constaté le 2026-11-03) | **désactivé** le 2026-11-03, aligné sur la prod |
| Protection contre les mots de passe compromis (HaveIBeenPwned, advisor `auth_leaked_password_protection`) | Authentication → Providers → Email (ou Attack Protection, selon la version du dashboard) | à activer si l'offre le permet | à activer si l'offre le permet |

**`/callback` dans les URLs de redirection : à faire AVANT de déployer en prod le code auth-profils R2.** Les liens de confirmation d'inscription (`signUp` et renvoi) passent `emailRedirectTo = <origine>/callback?type=signup`. Une URL absente de la liste est ignorée par Supabase, qui renvoie alors vers la Site URL sans l'écran de confirmation ni de lien expiré.
- `**` couvre les paramètres (`?type=signup`, `?type=recovery`) ; une entrée `…/callback` seule ne les couvre pas.
- Le modèle « Confirm signup » doit utiliser `{{ .ConfirmationURL }}` (ou `{{ .RedirectTo }}`), pas `{{ .SiteURL }}` en dur, sinon le lien de retour est perdu.
