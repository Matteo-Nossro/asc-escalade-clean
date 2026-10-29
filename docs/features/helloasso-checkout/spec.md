# Spec — Paiement depuis l'appli (checkout intégré HelloAsso)

> Slug : `helloasso-checkout` · Créée le : 2026-10-22 · Transverse : **oui** (nouveau flux de paiement, complexité L) ⇒ planner en opus
> **Tests d'abord : oui** (argent / données des adhérents)
> Cadrage : [helloasso-sync/options.md](../helloasso-sync/options.md) § Décision (option B) · **Lot 6/7** · Dépend de : `helloasso-sync-adhesions`, `helloasso-sorties`

## Objectif
Un adhérent, ou un parent pour son enfant, paie depuis son espace, avec un lien **certain** entre le paiement et l'inscription :
- l'adhésion à un groupe, une fois sa demande validée par le bureau ;
- une sortie, où le paiement vaut inscription.

## Critères d'acceptation
- [ ] Sur `mes-inscriptions`, un bouton **« Payer »** apparaît :
  - [ ] pour une demande de groupe `confirmed` et non payée pour la saison ;
  - [ ] pour une sortie payante qui a encore des places, **vérifiées côté serveur** avant d'ouvrir le paiement.
- [ ] Une route serveur crée le `checkout-intent` :
  - [ ] le **montant est calculé côté serveur** (`groups.price`, `events.price`), jamais transmis par le client ;
  - [ ] `metadata` contient l'identifiant d'inscription, le profil et la saison ;
  - [ ] redirection vers `redirectUrl`, valable 15 min.
- [ ] Pas de double paiement pour une même inscription (double clic, deux onglets) : l'intention valide est réutilisée, ou le paiement est refusé si l'inscription est déjà payée.
- [ ] Pages de retour (succès, erreur, abandon ; URL HTTPS) :
  - [ ] le statut est vérifié côté serveur par `GET checkout-intents/{id}`, **jamais** d'après les paramètres d'URL ;
  - [ ] tant que le paiement n'est pas confirmé, la page affiche « paiement en cours de confirmation ».
- [ ] La synchronisation (lot 2) reconnaît les commandes `Checkout` via `metadata` ou `checkoutIntentId` : **rattachement automatique**, jamais de passage par la file.
- [ ] Effets du paiement :
  - [ ] groupe : l'adhérent passe « payé » et la validation du bureau reste inchangée ;
  - [ ] sortie : l'inscription passe à `confirmed`, selon les règles du lot 5.
- [ ] Un parent peut payer pour un enfant s'il a les droits `register` ou `full` dans `parent_access`.
- [ ] Un `409` HelloAsso (association non éligible) affiche un message clair à l'adhérent et une alerte admin.
- [ ] Tests : Vitest avec réponses de l'API mockées, plus un parcours sandbox de bout en bout, documenté (tunnel HTTPS pour les URL de retour en local, cartes de test).

## Parcours utilisateur (e2e)
- Adhérent connecté, demande de groupe validée → `mes-inscriptions` → le bouton « Payer » est visible et actif (arrêt avant le clic : aucun appel HelloAsso en e2e). Compte de test requis, lecture seule. Le paiement complet est un scénario manuel en sandbox.

## Hors périmètre
- Paiement en plusieurs fois.
- Réductions et tarifs fratrie.
- Dons.
- Remboursement depuis l'appli.
- Inscription au formulaire d'adhésion HelloAsso : écartée, la liste de référence des adhérents est celle de l'appli.

## Contraintes / contexte
- Décision de cadrage : checkout intégré pour le bouton « Payer » ; groupes en demande → validation → paiement ; sorties en « payer = inscrit ».
- Skill `helloasso-api`, fichier `checkout.md` :
  - les paramètres de `returnUrl` sont falsifiables ;
  - `metadata` fait 20 000 caractères max ;
  - les URL de retour sont en HTTPS uniquement ;
  - init en `409` si l'association n'est pas éligible.
- Cartes de test : non officielles, à trouver pendant le lot.
- Existant : `app/pages/mes-inscriptions.vue` (L220-233, L372-375), `useGroups.enroll()`, `useEventRegistrations.register()`.
- Le contrôle de places est aujourd'hui fait uniquement dans l'interface : il doit passer côté serveur pour les sorties payantes.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| `paiement-retour` (pressenti) | nestable | `titre` : Text · `texte_succes` : Richtext · `texte_attente` : Richtext · `texte_erreur` : Richtext | Textes des pages de retour, éditables par le bureau. À confirmer au plan, sinon textes en dur. |
