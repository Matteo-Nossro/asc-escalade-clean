# Spec — Échec de lecture du profil : réessai puis blocage (Q25, Q26)

> Slug : `auth-erreur-profil` · Créée le : 2026-11-04 · Transverse : non
> **Tests d'abord : oui** (authentification), avec le vrai `useAuth` : seul le client Supabase est simulé.

## Objectif
Aujourd'hui, quand le chargement du profil échoue, `app/middleware/auth.global.ts` laisse passer un profil incomplet vers les pages connectées. Un adhérent ou un admin doit voir à la place un état d'erreur clair et pouvoir réessayer (Q25). `useAuth` doit aussi perdre son état `loading` / `error` s'il n'a aucun lecteur, ou le séparer entre lecture du profil et actions de connexion (Q26).

## Critères d'acceptation
Q25 :
- [ ] Sur une page connectée, si la lecture du profil échoue une fois puis réussit, la navigation aboutit normalement, sans message d'erreur.
- [ ] Le réessai automatique est unique : un échec persistant produit exactement 2 lectures du profil pour une navigation (lecture initiale + 1 réessai).
- [ ] Après ces 2 échecs, la page connectée n'affiche aucun contenu dépendant du profil ; elle affiche un message clair et un bouton « Réessayer ».
- [ ] Le bouton « Réessayer » relance la lecture : en cas de succès, la page demandée s'affiche sans rechargement manuel et l'utilisateur reste sur la même URL, sauf redirection normale du profil chargé (profil incomplet → `/completer-profil`, `/admin` sans le rôle → `/`) ; en cas d'échec, le message reste affiché.
- [ ] Le bloc d'erreur contient un lien « Se déconnecter » qui fonctionne sans dépendre de l'en-tête.
- [ ] Aucune boucle de redirection : l'échec de lecture du profil ne redirige ni vers `/login` ni vers une autre page, `/admin` compris, et chaque navigation produit au plus une redirection. Le renvoi `/admin` → `/` reste pour un rôle manquant une fois le profil chargé.
- [ ] Un test vérifie que la coquille de `/admin` rendue avant le montage ne contient aucune donnée : ni profil, ni liste, ni statistique.
- [ ] Un visiteur sans session garde le comportement actuel sur les pages connectées (redirection vers la connexion), et les pages publiques restent accessibles quel que soit l'état de la lecture du profil.
- [ ] Une fois le profil chargé, il n'est pas relu à chaque navigation : la lecture unique des rôles par session reste en place (le serveur revérifie chaque action).

Q26 :
- [ ] Le lecteur éventuel de `loading` et `error` de `useAuth` est vérifié par `Grep` au moment de l'implémentation. Sans lecteur, ils sont retirés. Avec lecteur, l'état est séparé entre lecture du profil et actions de connexion.
- [ ] Un échec d'une action de connexion n'est jamais pris pour un échec de lecture du profil, et ne déclenche pas le blocage de Q25.

Qualité :
- [ ] Les tests couvrent ces critères avec le vrai `useAuth`, sans simuler le composable.
- [ ] Q25 et Q26 sont retirés de `docs/backlog.md` à la clôture.

- [ ] `/admin/**` est en `ssr: false` et la porte bloque dès le premier rendu : en cas d'échec de lecture, le `onMounted` des pages admin ne s'exécute pas (aucune lecture métier, aucune redirection).
- [ ] `/profil`, `/mes-inscriptions` et `/completer-profil` sont aussi en `ssr: false` via `routeRules`, sans message d'hydratation en cas d'échec de lecture ; l'accès direct à `/completer-profil` est testé.
- [ ] Les e2e existants et le spec de captures, dont la capture du dashboard admin, passent toujours avec ce changement de rendu. Les écarts déjà présents sur `dev` (`accueil-1440`, `accueil-390`, `register-1440`, `profil-1440`, `admin-dashboard-390`) relèvent du backlog (Q35, Q36).

## Parcours utilisateur (e2e)
- Aucun nouveau parcours. Les e2e existants et le spec de captures sont relancés à la porte de qualité (non-régression du passage de `/admin/**` en `ssr: false`).

## Hors périmètre
- Relire les rôles à chaque navigation ou invalider le cache des rôles pendant la session.
- Modifier les vérifications côté serveur (`server/api`, `requireAdmin`…).
- Modifier le schéma ou la RLS de Supabase.

## Contraintes / contexte
- Backlog : `docs/backlog.md`, lignes Q25 et Q26 (issues de la feature `auth-profils`).
- Hypothèses :
  - le réessai automatique est immédiat ; aucun délai n'a été demandé ;
  - les « pages connectées » sont celles que le middleware protège déjà (`/profil`, `/admin`…), sans changement de la liste ;
  - le message et le bouton s'affichent à la place du contenu de la page, à l'URL demandée, pour éviter toute redirection ;
  - couverture par Vitest seul : provoquer un échec de lecture du profil en e2e n'apporte pas assez par rapport au test du vrai `useAuth`.
- Docs : [docs/architecture.md](../../architecture.md) (middleware d'auth, composables).

## Côté Storyblok
Rien à créer.
