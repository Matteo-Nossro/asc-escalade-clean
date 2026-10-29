# Spec — Webhook HelloAsso accélérateur (facultatif)

> Slug : `helloasso-webhook` · Créée le : 2026-10-22 · Transverse : non
> **Tests d'abord : oui** (argent / données des adhérents)
> Cadrage : [helloasso-sync/options.md](../helloasso-sync/options.md) § Décision (option B) · **Lot 7/7 (facultatif)** · Dépend de : `helloasso-sync-adhesions` (idéalement après `helloasso-checkout`)

## Objectif
Rendre les mises à jour quasi immédiates : une notification HelloAsso déclenche la relecture de **la seule commande concernée**, sans attendre le prochain passage du cron. La fiabilité ne dépend jamais du webhook.

## Critères d'acceptation
- [ ] Le webhook `server/api/webhooks/helloasso.post.ts` est **réécrit** :
  - [ ] il répond `200` vite ;
  - [ ] il **ne fait jamais confiance au contenu** de la notification : il relit la commande via l'API (client du lot 1), puis applique la même logique que la synchronisation (idempotente).
- [ ] Doublon, désordre ou notification perdue sont **sans effet** sur l'état final : le cron rattrape les manques.
- [ ] Protection contre l'abus :
  - [ ] relectures dédoublonnées par commande sur une courte fenêtre ;
  - [ ] nombre de relectures plafonné (rate limits HelloAsso non documentés) ;
  - [ ] une notification qui désigne une commande inexistante ou hors périmètre est ignorée sans erreur.
- [ ] Filtres d'authenticité **facultatifs** : secret dans l'URL, IP source (IP documentées dans la skill ; l'en-tête d'IP client de Netlify est à vérifier). Ils réduisent le bruit mais ne sont jamais la garantie : la relecture par l'API l'est.
- [ ] Tests Vitest :
  - [ ] notification `Order` ;
  - [ ] notification `Payment` avec `state` `Refunded` ;
  - [ ] doublon ;
  - [ ] commande inconnue.
  
  Test sandbox via un tunnel HTTPS, documenté.

## Parcours utilisateur (e2e)
- Aucun

## Hors périmètre
- Journal des notifications et rejeu (option A, écartée au cadrage).
- Signature HMAC (réservée aux partenaires HelloAsso).

## Contraintes / contexte
- Décision de cadrage : le webhook n'est qu'un accélérateur, l'état est toujours relu sur l'API.
- Skill `helloasso-api`, fichier `webhooks.md` :
  - 5 URL de notification max par association ;
  - un checkout produit 2 notifications (`Order` puis `Payment`) ;
  - renvois pendant environ 27 h si la réponse n'est pas `200`.
- Webhooks sandbox parfois absents (signalé, non officiel) : ne pas bloquer le lot dessus.

## Côté Storyblok
| Technical name (tirets) | Type (nestable / content type) | Champs (nom : type) | Notes |
|---|---|---|---|
| — | — | — | Aucun blok |
