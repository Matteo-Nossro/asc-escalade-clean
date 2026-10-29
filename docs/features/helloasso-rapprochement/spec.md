# Spec — File « à rapprocher » des paiements HelloAsso

> Slug : `helloasso-rapprochement` · Créée le : 2026-10-22 · Transverse : **oui** (nouvelle table) ⇒ planner en opus
> **Tests d'abord : oui** (argent / données des adhérents)
> Cadrage : [helloasso-sync/options.md](../helloasso-sync/options.md) § Décision (option B) · **Lot 3/7** · Dépend de : `helloasso-sync-adhesions`

## Objectif
Aucun paiement HelloAsso ne reste orphelin. Ceux que l'appli n'a pas pu rattacher avec certitude arrivent dans une file que le bureau traite à la main.

## Critères d'acceptation
- [ ] Chaque item non rapproché par la synchronisation apparaît **une seule fois** dans la file, sans doublon d'un passage à l'autre. On y voit : payeur (nom, email), bénéficiaire, montant, formulaire, date, état HelloAsso.
- [ ] **Suggestions** de profils (nom proche, email proche, enfant d'un parent connu) affichées et triées. Elles ne sont **jamais appliquées automatiquement**.
- [ ] Actions admin :
  - [ ] **rattacher** à un profil existant, avec recherche ;
  - [ ] **ignorer**, avec un motif (paiement hors périmètre, doublon, test…) ;
  - [ ] **annuler** une décision prise par erreur.
- [ ] Décision **mémorisée** : la synchronisation ne remet pas en file un item déjà traité, et applique le rattachement à chaque passage.
- [ ] Un rattachement met à jour **immédiatement** le statut « payé » de l'adhérent, sans attendre le passage suivant.
- [ ] Un item rattaché puis remboursé sur HelloAsso passe en remboursé, comme un item rapproché automatiquement.
- [ ] Le nombre d'items en attente est visible sur le dashboard admin.
- [ ] RLS : file lisible et modifiable par le staff uniquement. Chaque décision enregistre son auteur (`reviewed_by`) et sa date.
- [ ] Tests Vitest du calcul de suggestions, plus des scénarios manuels dans `docs/test-plan.md` : rattacher, ignorer, annuler, item remboursé après rattachement.

## Parcours utilisateur (e2e)
- Aucun (actions admin sur des données d'adhérents : Vitest + scénarios manuels ; e2e possible plus tard avec un environnement de test)

## Hors périmètre
- Création automatique d'un profil à partir d'un paiement (écartée au cadrage).
- Rattachement automatique sur le nom seul.
- Sorties (lot 5) : elles réutiliseront cette file.

## Contraintes / contexte
- Décision de cadrage : paiement non rapproché → file à valider par le bureau.
- Skill `supabase-db` : `profiles`, `parent_access` pour les parents qui paient pour leurs enfants, et nouvelle migration pour la table de la file.
- Composants admin existants à suivre (`docs/conventions.md` § Composants admin), par exemple `ReviewModal.vue` pour le style des actions de validation.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun blok (espace admin) |
