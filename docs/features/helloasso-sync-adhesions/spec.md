# Spec — Synchronisation des adhésions HelloAsso

> Slug : `helloasso-sync-adhesions` · Créée le : 2026-10-22 · Transverse : **oui** (refonte de `profile_payments`, sens de « payé ») ⇒ planner en opus
> **Tests d'abord : oui** (argent / données des adhérents)
> Cadrage : [helloasso-sync/options.md](../helloasso-sync/options.md) § Décision (option B) · **Lot 2/7** · Dépend de : `helloasso-socle`

## Objectif
Le bureau clique sur « Synchroniser » et l'appli reflète exactement l'état HelloAsso des adhésions de la saison, remboursements compris. C'est le cœur de l'option B : un instantané relu en entier, où la même entrée donne toujours le même résultat.

## Critères d'acceptation
- [ ] Relecture **complète** des formulaires `Membership` actifs de la saison, via le client du lot 1 : pagination `continuationToken`, `withDetails=true` pour les champs personnalisés.
- [ ] **Une ligne d'état par item HelloAsso** (clé unique = id d'item), refonte de `profile_payments` : état HelloAsso, montant, saison, formulaire, commande, payeur, profil rattaché (nullable), `source` (`helloasso` | `manuel`), `last_seen_at`, `state_changed_at`. Les contraintes UNIQUE(profile_id, form_id) et UNIQUE(order_id) disparaissent.
- [ ] **Idempotence** : deux synchronisations successives sans changement côté HelloAsso ne modifient aucune ligne, hors `last_seen_at`.
- [ ] Rapprochement automatique **seulement sur des critères forts** : le payeur est l'adhérent (email du profil), ou le payeur est un parent (`parent_access`) d'un enfant dont le bénéficiaire de l'item correspond. **Le nom seul ne suffit jamais.** Les items non rapprochés sont comptés et listés dans le résultat ; la file à valider arrive au lot 3.
- [ ] Statut « payé » **par saison**, calculé à partir des lignes HelloAsso et des paiements manuels. `profiles.payment_done` est soit recalculé par saison, soit remplacé (choix du planner). Le trigger de protection reste cohérent.
- [ ] Un **remboursement fait sur HelloAsso** (testé en sandbox) fait passer la ligne à remboursé au passage suivant, et l'adhérent n'est plus « payé ».
- [ ] **Paiement manuel** (espèces, chèque, exonération) saisi par l'admin dans `MemberModal.vue` : c'est une ligne `source = manuel`, que la synchronisation n'écrase jamais. Elle remplace l'override actuel de `payment_done`.
- [ ] Admin : bouton « Synchroniser maintenant », plus le **dernier passage** (heure, items lus, créés, modifiés, remboursés, non rapprochés, erreur), lu dans la table des passages du lot 1.
- [ ] Les KPI du dashboard (`helloasso-stats.get.ts`, `KpiCards`, `GroupsList`) portent sur la saison courante.
- [ ] Tests Vitest avec fixtures de réponses API : nouveau paiement, remboursement, item vu deux fois, item inconnu, paiement manuel préservé. Scénario sandbox ajouté à `docs/test-plan.md`.

## Parcours utilisateur (e2e)
- Aucun (synchronisation = appels HelloAsso : couvert par Vitest et fixtures, scénario manuel sandbox)

## Hors périmètre
- File à rapprocher et actions de rattachement (lot 3).
- Exécution planifiée (lot 4).
- Formulaires `Event` et sorties (lot 5).
- Commandes `Checkout` (lot 6).
- Webhook (lot 7).
- Paiements en plusieurs fois.

## Contraintes / contexte
- Décision de cadrage : HelloAsso fait foi pour l'**état** des paiements ; notre base fait foi pour les **liens** (item → profil) et les **paiements manuels**. L'état est toujours relu sur l'API, jamais déduit d'une notification.
- Skill `helloasso-api` (`forms-memberships.md`, `orders-payments.md`, `refunds.md`). Le `totalCount` de pagination vaut souvent `-1` : s'arrêter quand `data` est vide. Remboursement partiel ambigu dans la doc : à tester en sandbox avant de décider de son affichage.
- Saison : à définir au plan. Probablement du 1er septembre au 31 août, comme la règle d'âge du blok `tarifs-planning` ; à confirmer.
- Réutiliser la boucle de pagination de `sync-helloasso.post.ts`, et respecter le trigger de `20260520`.
- Le webhook existant doit rester inoffensif jusqu'au lot 7 : neutralisé, ou réduit à déclencher une relecture.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun blok |
