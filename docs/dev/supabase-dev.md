# Projet Supabase de dev (`ybtnnogxukfldurozqwa`)

Seul projet sur lequel Claude travaille (voir `CLAUDE.md` § Supabase). Le schéma passe par `supabase/migrations/` ; certains réglages du dashboard **ne sont pas couverts par les migrations** et se font à la main.

## Réglages manuels du dashboard (hors migrations)
Liste commune dev / prod : [docs/mise-en-prod.md § 5](../mise-en-prod.md#5-réglages-manuels-du-dashboard-hors-migrations).

| Réglage | Où (dashboard) | Dev |
|---|---|---|
| SMTP personnalisé | Authentication → Emails → SMTP Settings | **Resend**, clé API **dédiée au dev** (jamais la clé de prod). Sans SMTP personnalisé, le SMTP intégré de Supabase plafonne très bas les envois (cause de la limite rencontrée par l'e2e d'inscription réelle). |
| Rate limits | Authentication → Rate Limits | À relever avec le SMTP personnalisé (envois d'e-mails par heure) ; reporter ici les valeurs choisies. |
| Modèles d'e-mails | Authentication → Emails → Templates | Confirmation d'inscription, réinitialisation du mot de passe, etc. : à garder alignés sur la prod (contenu et liens). Le lien doit rester `{{ .ConfirmationURL }}` (constaté le 2026-10-29 : lien vers `…/auth/v1/verify`). |
| URLs de redirection | Authentication → URL Configuration → Redirect URLs | **`https://localhost:3000/callback**`** : le serveur de dev tourne en **https** (`devServer.https` dans `nuxt.config.ts`), et `emailRedirectTo` vaut `window.location.origin` + `/callback?type=signup`. Une entrée en `http://` ne correspond pas, et Supabase retombe alors sur la Site URL (constaté le 2026-10-29). `**` couvre aussi `?type=recovery`. Réglage fait le 2026-10-29. |
| Site URL | Authentication → URL Configuration → Site URL | **`https://localhost:3000`**, avec le même schéma que le serveur de dev. C'est la destination de repli quand le lien de retour n'est pas autorisé ; en `http://`, la page de repli ne se charge pas. Réglage fait le 2026-10-29 ; auparavant `http://localhost:3000`. |

## Comptes de test (`scripts/seed-test-users.mjs`)
Créés/vérifiés par `node scripts/seed-test-users.mjs` (idempotent, dev uniquement) ; lecture avec `--check`. Adresse `TEST_USERS_EMAIL` avec un suffixe, mot de passe commun `TEST_USERS_PASSWORD`.

| Suffixe | Rôle (`user_roles`) | État du profil | Usage |
|---|---|---|---|
| `+admin` | `admin` | Actif, complété | Bureau, dashboard admin |
| `+secretaire` | `secretary` | Actif, complété | Bureau |
| `+initiateur` | `initiateur` | Actif, complété | Encadrant de groupe |
| `+adherent` | `parent` | Actif, complété, 2 enfants rattachés (`parent_access`) | Adhérent avec famille, captures `/profil` |
| `+incomplete` | aucun | **Toujours remis en « En attente », `profile_completed_at` NULL** à chaque lancement du script, même s'il a été complété entre deux exécutions | Captures/tests de `/completer-profil` (affiche le vrai formulaire plutôt qu'une redirection) |

`+incomplete` n'est reconnu par aucun `test_role` de `supabase/seed.sql` (filtre `IN ('admin','secretary','initiateur','parent')`) : il ne reçoit donc jamais de rôle ni de données fictives, seulement le profil minimal posé par le trigger `handle_new_user`.

## Conséquences pour les tests
- Le parcours e2e `@email` (inscription réelle) envoie un vrai e-mail et consomme le quota d'envoi du dev : ne le lancer que si nécessaire (skill `testing`, règle 5).
- Le script `scripts/check-auth-profils-db.mjs` crée ses comptes jetables par l'API admin (`email_confirm`), sans envoi d'e-mail.
