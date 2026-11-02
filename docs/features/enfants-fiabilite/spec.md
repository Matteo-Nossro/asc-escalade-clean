# Spec — Fiabiliser l'inscription et l'affichage des enfants

> Slug : `enfants-fiabilite` · Créée le : 2026-11-02 · Transverse : non (corrections dans un flux d'auth existant, sans nouvelle table ni refonte)
> **Tests d'abord : oui** (authentification et données des adhérents : rôles, enfants rattachés).

## Objectif
Corriger cinq points du backlog (`docs/backlog.md` Q1, Q2, Q3, Q4, Q10) issus d'auth-profils. Une inscription qui échoue en cours de route ne doit pas laisser un compte avec le rôle `parent` sans enfants, ni masquer ses erreurs de compensation. Deux inscriptions simultanées et un compte non confirmé doivent recevoir une réponse compréhensible. Enfin, l'adhérent (`/profil`) et l'admin (`MemberModal`) doivent voir les enfants dès qu'il existe des liens `parent_access`, quel que soit le rôle coché.

## Critères d'acceptation
- [ ] **Q1** — `server/utils/completeProfile.ts` : le rôle `parent` n'est accordé qu'**après** la création réussie de tous les enfants (et de leurs liens `parent_access`). Si la création d'un enfant échoue, le profil ne porte pas le rôle `parent` à l'issue de la compensation (test : échec simulé à la création d'un enfant ⇒ aucune insertion/conservation du rôle `parent`).
- [ ] **Q1** — Une inscription sans enfant n'accorde pas le rôle `parent` ; une inscription avec enfants réussie l'accorde (comportement nominal inchangé).
- [ ] **Q2** — Chaque erreur rencontrée pendant la compensation (suppression d'enfants, de liens, de rôle, etc.) est journalisée côté serveur (`console.error` ou logger existant) avec l'étape concernée, sans interrompre les étapes suivantes de la compensation ni changer l'erreur renvoyée au client.
- [ ] **Q3** — Deux complétions de profil simultanées pour le même utilisateur (cas sans ligne créée par le trigger) : la seconde reçoit **409** (violation de clé primaire / unicité, code Postgres `23505`) et non 500.
- [ ] **Q4** — `server/api/register.post.ts` : le 403 renvoyé à un compte non confirmé qui refait un `signUp` plus d'une heure après porte un message clair pour l'utilisateur neutre, qui ne révèle pas l'état du compte : « Impossible de finaliser l'inscription. Si vous avez déjà un compte, connectez-vous ; sinon, recommencez l'inscription. », et ce message est affiché tel quel par la page d'inscription. Code HTTP inchangé (403).
- [ ] **Q10** — `/profil` (`app/pages/profil.vue`) : les enfants sont chargés et affichés dès que l'utilisateur a au moins un lien `parent_access`, même sans le rôle `parent` ; aucune section enfants (ni requête parasite visible) sans lien.
- [ ] **Q10** — `MemberModal` (`app/components/admin/modals/MemberModal.vue`) : même règle — les enfants d'un adhérent sont affichés s'il existe des liens `parent_access`, indépendamment de la case « parent ».
- [ ] Capture `profil-390` : **0 % d'écart** par rapport à la référence existante (méthode et référence de profil-register-desktop).
- [ ] `npm test` vert, `npm run typecheck` sans nouvelle erreur par rapport à la baseline.

## Parcours utilisateur (e2e)
- Non-régression visuelle : adhérent de test connecté → `/profil` en 390 px → capture `profil-390` comparée à la référence, 0 % d'écart. Lecture seule, n'écrit pas en base.

## Hors périmètre
- Autres points du backlog (Q5-Q9, Q11+, D1 statut des enfants, D2…).
- Changement de schéma BDD (pas de migration) et des règles RLS.
- Toute modification visuelle de `/profil` ou de `MemberModal` au-delà de la condition d'affichage des enfants.
- Retrait automatique du rôle `parent` à un compte existant qui n'aurait plus d'enfant.

## Contraintes / contexte
- Source des points : `docs/backlog.md` (Q1-Q4, Q10), feature d'origine `docs/features/auth-profils/`.
- Méthode de capture : `docs/features/profil-register-desktop/plan.md` (référence `profil-390`, 0 % d'écart exigé).
- Hypothèses (non confirmées par l'utilisateur) :
  - Q3 : on traduit le code `23505` sur l'insertion du profil en 409 ; le message reprend celui des autres 409 du flux s'il en existe un.
  - Q4 : texte fixé par l'utilisateur (ci-dessus), un seul message pour tous les 403 de `/api/register`, adresse e-mail différente comprise.
  - Q10 : la présence de liens `parent_access` est la seule condition ; le rôle `parent` reste éditable dans `MemberModal` sans effet sur l'affichage des enfants.
- Pas de nouveau composant Storyblok.

## Côté Storyblok
Rien à créer.
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | — |
