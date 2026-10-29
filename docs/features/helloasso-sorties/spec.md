# Spec — Sorties payantes synchronisées avec HelloAsso

> Slug : `helloasso-sorties` · Créée le : 2026-10-22 · Transverse : non
> **Tests d'abord : oui** (argent / données des adhérents)
> Cadrage : [helloasso-sync/options.md](../helloasso-sync/options.md) § Décision (option B) · **Lot 5/7** · Dépend de : `helloasso-sync-adhesions`, `helloasso-rapprochement`

## Objectif
Pour une sortie payante, **payer = être inscrit**. Un paiement HelloAsso confirme automatiquement l'inscription à la sortie, et un remboursement l'annule.

## Critères d'acceptation
- [ ] Dans `HelloAssoConfig.vue`, un formulaire HelloAsso de type `Event` est **lié à une sortie** (`helloasso_forms.event_id`).
- [ ] La création d'une sortie dans l'appli et sa liaison à un formulaire `Event` HelloAsso forment **un parcours complet** pensé de bout en bout, pas une simple saisie de slug : créer la sortie, choisir son formulaire HelloAsso dans la liste de l'organisation (`GET /v5/organizations/{slug}/forms?formTypes=Event`, voir lot 2), vérifier la cohérence (dates, jauge), puis corriger ou défaire la liaison. Le parcours est décrit dans le plan avant toute implémentation (ajouté le 2026-10-29, retour des tests manuels du lot 1).
- [ ] La synchronisation (lots 2 et 4) couvre aussi ces formulaires, avec les mêmes garanties : une ligne par item, idempotence, critères de rapprochement forts.
- [ ] Item payé et rattaché : l'inscription de cet adhérent à cette sortie (`registrations`) est **créée si elle est absente**, puis passée à `confirmed`.
- [ ] Item remboursé : l'inscription passe à `cancelled` automatiquement, avec une note admin explicite (« remboursé sur HelloAsso le … »).
- [ ] Item non rapproché : il va dans la file du lot 3. Le rattachement crée ou confirme l'inscription.
- [ ] Inscription annulée dans l'appli alors que le paiement est toujours valide : **signalée à l'admin**, qui rembourse à la main sur HelloAsso. L'appli ne rembourse jamais elle-même.
- [ ] Places : si le nombre d'inscrits payés dépasse `max_participants` (cas de paiements faits directement sur HelloAsso), une **alerte admin** s'affiche. La doc d'exploitation recommande de fixer aussi la jauge sur le formulaire HelloAsso.
- [ ] Les changements de statut passent par le serveur (service role). Le trigger RLS existant n'autorise un utilisateur qu'à passer `cancelled`, et il doit rester intact.
- [ ] Tests Vitest des transitions (payé → confirmé, remboursé → annulé, doublon sans effet), plus des scénarios manuels dans `docs/test-plan.md`.

## Parcours utilisateur (e2e)
- Aucun (statuts pilotés par la synchro HelloAsso : Vitest et fixtures)

## Hors périmètre
- Bouton « Payer » depuis l'appli pour une sortie (lot 6).
- Validation manuelle par le bureau des sorties payantes (écartée : payer = inscrit).
- Remboursement depuis l'appli.

## Contraintes / contexte
- Décision de cadrage : sorties en « payer = inscrit », remboursement = annulation.
- Existant : `useEventRegistrations.ts` (`register()` en `pending`, `confirm()` et `cancel()` en mise à jour directe). Trigger dans `supabase/migrations/20260426_security_fixes_rls.sql` (L102-128). Aucun contrôle de places côté serveur.
- `app/storyblok/sorties/ListeSorties.vue` calcule les places restantes côté front. Ses données sont peut-être en dur (L132-158) : **à vérifier par l'explorer** avant le plan.
- Skill `helloasso-api` : `forms-memberships.md` (formulaires `Event`).

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun nouveau blok pressenti. À confirmer si les sorties affichées viennent de Storyblok (lien story ↔ `events` à vérifier). |
