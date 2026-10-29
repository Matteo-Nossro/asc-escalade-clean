# Spec — Synchronisation planifiée (cron OVH)

> Slug : `helloasso-cron` · Créée le : 2026-10-22 · Transverse : non
> **Tests d'abord : oui** (argent / données des adhérents)
> Cadrage : [helloasso-sync/options.md](../helloasso-sync/options.md) § Décision (option B) · **Lot 4/7** · Dépend de : `helloasso-sync-adhesions`

## Objectif
La synchronisation tourne seule, sans clic du bureau, grâce à un cron sur le serveur OVH qui appelle l'appli à intervalle régulier.

## Critères d'acceptation
- [ ] Route `POST` dédiée, protégée par un **secret en en-tête**, comparé à temps constant. Sans secret ou avec un secret faux : `401`, sans aucun traitement. Aucune session utilisateur requise. Le secret est dans le `runtimeConfig` serveur.
- [ ] **Verrou** : deux passages ne se chevauchent jamais. Un passage interrompu (timeout, crash) n'empêche pas le suivant : le verrou expire.
- [ ] **Reprise** : si la relecture complète ne tient pas dans la durée maximale d'une fonction Netlify, le passage s'arrête proprement. Le suivant reprend là où le précédent s'est arrêté (curseur par formulaire et par page), et une relecture complète finit toujours par aboutir.
- [ ] Chaque passage est enregistré dans la table des passages du lot 1 : début, fin, partiel ou complet, compteurs, erreur.
- [ ] Admin : **alerte visible** si le dernier passage réussi est plus ancien que deux intervalles, ou si les derniers passages sont en erreur.
- [ ] Documentation dans `docs/architecture.md` :
  - [ ] ligne crontab OVH (`curl` avec en-tête) ;
  - [ ] fréquences conseillées : 15 min en période d'inscription, horaire le reste de l'année ;
  - [ ] rotation du secret ;
  - [ ] test manuel en sandbox.
- [ ] Tests Vitest : refus sans secret, verrou, reprise d'un passage partiel.

## Parcours utilisateur (e2e)
- Aucun

## Hors périmètre
- Scheduled Functions Netlify et `scheduledTasks` Nitro (remplacées par le cron OVH).
- Webhook (lot 7).
- Toute logique de synchronisation nouvelle : la route réutilise le moteur du lot 2.

## Contraintes / contexte
- Décision de cadrage : le cron externe sur le serveur OVH remplace la planification Netlify. La route s'exécute toutefois dans une fonction Netlify, donc avec sa durée maximale, d'où l'exigence de reprise.
- Rate limits des endpoints de données HelloAsso non documentés (skill `helloasso-api`, `limits-sandbox.md`) : rester raisonnable sur la fréquence et le parallélisme.
- Peut être développé avant ou après le lot 3, mais pas en même temps : les deux touchent probablement `app/pages/admin/dashboard.vue`.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun blok |
