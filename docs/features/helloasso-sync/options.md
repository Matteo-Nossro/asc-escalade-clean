# Options — helloasso-sync

> Cadrage du 2026-10-21 · Rédigé par : planner (opus, mode options) · Aucun plan d'implémentation ici.

## Besoin
- L'appli reflète **fidèlement et en continu** l'état HelloAsso des paiements, adhésions de saison et inscriptions aux événements/sorties (pas les dons ni la boutique). Un remboursement fait sur HelloAsso doit remonter.
- Pour le bureau d'abord : se fier au statut « payé » et aux tableaux de bord sans vérifier sur HelloAsso. Pour les adhérents et parents ensuite : voir l'état de leurs inscriptions.
- Deux parcours : checkout intégré (adhérent connecté) **et** paiement direct sur HelloAsso. Paiement sans adhérent correspondant → file « à rapprocher » validée à la main.
- Échéance : saison 2027-2028 (septembre 2027). **La robustesse prime sur la vitesse.**

## Existant réutilisable / impacté
- `supabase/migrations/20260520_helloasso.sql` (non commitée) — `helloasso_forms` (L29-36), `profile_payments` (L75-83, UNIQUE order_id + UNIQUE(profile_id, form_id), sans saison), trigger de protection de `payment_done`/`payment_amount` (L113-132). Les deux contraintes UNIQUE empêchent deux paiements d'un même formulaire et un remboursement d'une commande sur deux.
- `server/api/webhooks/helloasso.post.ts` — secret en query facultatif, rapprochement prénom/nom, upsert sur Authorized, suppression sur Refunded/Cancelled. Fait confiance au contenu du payload.
- `server/api/admin/sync-helloasso.post.ts` — OAuth à chaque appel (pas de cache), pagination des items Membership, non-rapprochés non persistés.
- `server/api/admin/helloasso-forms*.ts` — CRUD du référentiel des formulaires (sans DELETE).
- `server/api/admin/helloasso-stats.get.ts` + `KpiCards.vue` L34-58 + `GroupsList.vue` L52-57 + `dashboard.vue` L74, L227-243 — KPI lus sur `profiles.payment_done`.
- `app/components/admin/HelloAssoConfig.vue` — config des formulaires.
- `app/components/admin/modals/MemberModal.vue:L143` — override manuel de `payment_done`.
- `profiles`, `group_members`, `events`, `registrations` (`registration_status`) — aucun lien paiement aujourd'hui ; `register.post.ts`, `add-child.post.ts` n'en parlent pas.
- `nuxt.config.ts` L133-140 — `runtimeConfig` sans clé HelloAsso (le code lit `process.env`).
- `netlify.toml` — aucune section `functions` ni `schedule`, pas de dossier `netlify/functions/` ; `@netlify/functions` ^5.1.5 est en dépendance mais inutilisé.

## Socle commun (vrai pour les trois options)
Ces points ne départagent pas les options, mais chacune les exige :
- **Jeton OAuth partagé** : stocké côté serveur (en base, l'instance serverless ne garde rien), rafraîchi par un seul chemin (rotation du refresh_token : deux refresh concurrents se révoquent). Endpoint d'auth limité à 50 appels/h.
- **Webhook non authentifiable** pour une association : pas de signature, seulement l'IP source (prod `51.138.206.200`, sandbox `4.233.135.234`), que la doc ne garantit pas comme stable. Le contenu d'une notification ne fait donc jamais foi seul : on relit la commande via `GET /v5/orders/{id}`.
- **Remboursement par API exclu** (clé d'association, endpoint annoncé comme fermé) : le bureau rembourse dans le back-office HelloAsso, l'appli constate.
- **Checkout intégré = commandes de type `Checkout`** (formSlug `default` dans les exemples), pas des items du formulaire `Membership` de la saison. Le lien avec l'adhérent passe par `metadata` / `checkoutIntentId`, et il faut valider par webhook ou `GET checkout-intents/{id}`, jamais sur `code=succeeded`.
- **Saison** : un formulaire HelloAsso par saison (choix d'organisation, la doc n'en impose pas). `helloasso_forms` doit porter la saison et, pour une sortie, l'`event_id`. `profiles.payment_done`, qui ne porte pas de saison, ne peut plus être la vérité.
- **Paiements hors HelloAsso** (espèces, chèque, exonération) : l'override de `MemberModal` doit devenir un paiement manuel explicite. Sinon la synchronisation l'écrasera ou sera écrasée par lui.
- **Rapprochement** : identifiant de checkout (metadata) → `items[].user` (adhérent) + `payer.email` (souvent un parent, via `parent_access`) → sinon file « à rapprocher ». Le nom seul ne suffit jamais pour un rapprochement automatique.

## Option A — Miroir événementiel (push + journal + rattrapage)
- **Principe** : chaque notification est d'abord journalisée telle quelle (boîte de réception dédupliquée), puis traitée à part : on relit la commande sur l'API et on met à jour un **miroir local** des commandes, items et paiements HelloAsso. Le statut des adhérents et des inscriptions est **dérivé** de ce miroir. Une resynchronisation planifiée rattrape ce que les webhooks ont raté.
- **Réutilisé** : référentiel `helloasso_forms` (étendu), trigger de protection, CRUD formulaires, UI `HelloAssoConfig`. **Créé** : client HelloAsso partagé, journal entrant, miroir, moteur de rapprochement, job planifié, écrans admin journal, file et écarts, statut côté adhérent, checkout.
- **Storyblok** : rien de structurant. Au mieux, les textes des pages de retour de paiement (succès, erreur, en attente) via un blok.
- **Supabase** : **remplace** `profile_payments`, dont les contraintes UNIQUE sont incompatibles. Nouvelles tables : journal des notifications (clé de déduplication, payload brut, état de traitement, nombre d'essais), miroir `orders` / `items` / `payments` HelloAsso indexé par leurs ids, liens item → profil / inscription, file à rapprocher, paiements manuels, historique des synchronisations. `helloasso_forms` reçoit `season` et `event_id`. `payment_done` devient une donnée dérivée (vue ou recalcul), ou disparaît. RLS : staff en lecture/écriture ; l'adhérent ou le parent lit ses seuls statuts dérivés.
- **API** : webhook réécrit (journalise, répond 200 vite) ; traitement du journal ; sync planifiée et manuelle ; admin : journal, rejeu, file (lister, rattacher, ignorer), écarts ; checkout (init + statut au retour) ; statut côté adhérent. Stats réécrites sur le dérivé.
- **Complexité** : **L** · ~32-36 fichiers (≈ 6 modifiés, ≈ 27 créés, docs comprises).
- **Risques** : le plus de pièces mobiles ; il faut traiter le journal hors de la requête webhook (Netlify n'a pas de file native : il faut un traitement immédiat borné ou un job) ; la clé de déduplication est une convention du projet (pas d'id de notification documenté). **Difficile à changer ensuite** : le schéma du miroir colle à celui de l'API v5. Une v6 annoncée « pas avant 2027 » obligerait à migrer.
- **Évolutivité** : permet un historique complet et auditable, le rejeu, et des tableaux de bord fins (échéances, contestations) ; ajouter les dons ou la boutique plus tard ne coûterait presque rien. Bloque peu, mais coûte cher à maintenir.

## Option B — Instantané planifié (pull, état seul)
- **Principe** : la vérité arrive par **scrutation**. Un job planifié relit en entier les formulaires actifs de la saison (adhésion, sorties, commandes Checkout) et met à jour **une ligne d'état par item HelloAsso** : même entrée, même résultat. Le webhook n'est qu'un **accélérateur** : il déclenche la relecture de la seule commande concernée, sans croire son contenu. Au retour d'un checkout, on interroge `GET checkout-intents/{id}`, ce qui donne un retour immédiat à l'adhérent.
- **Réutilisé** : `helloasso_forms`, `profile_payments` **modifiée** (pas remplacée), boucle de pagination de `sync-helloasso.post.ts`, webhook existant réduit au rôle de déclencheur, stats et UI admin existantes. **Créé** : client partagé, moteur d'instantané, job planifié, file à rapprocher, paiements manuels, checkout, statut côté adhérent.
- **Storyblok** : rien de structurant (mêmes textes de retour de paiement qu'en A, en option).
- **Supabase** : **fait évoluer** la migration 20260520. `profile_payments` est indexée par `helloasso_item_id` (UNIQUE) ; elle reçoit `state` HelloAsso, `season`, `registration_id` nullable, `source` (helloasso | manuel), `last_seen_at`, `state_changed_at`. Les contraintes UNIQUE(profile_id, form_id) et UNIQUE(order_id) tombent. On ajoute la file à rapprocher (item, payeur, suggestion, décision), un historique léger des passages du job (début, fin, compteurs, erreur) et `helloasso_forms.season` / `event_id`. `payment_done` est recalculé par saison à chaque passage, ou remplacé par une vue.
- **API** : job de sync (planifié + bouton admin), webhook simplifié, admin : file (rattacher, ignorer), dernier passage et erreurs ; checkout (init + statut au retour) ; statut côté adhérent. Stats adaptées à la saison.
- **Complexité** : **M** · ~24-28 fichiers (≈ 8 modifiés, ≈ 18 créés, docs comprises).
- **Risques** : latence égale à l'intervalle du job pour les paiements directs sur HelloAsso. Rate limits des endpoints de données non documentés. Durée maximale d'une Scheduled Function Netlify courte, à vérifier : relire tout doit tenir dedans ; à l'échelle du club (quelques centaines d'items par saison) c'est probable, pas garanti. Un remboursement partiel reste ambigu (aucun état d'item dédié). **Difficile à changer ensuite** : peu de choses. Pas d'historique des transitions au-delà de `state_changed_at`.
- **Évolutivité** : permet d'ajouter un journal plus tard (on évolue vers A sans casser) et d'élargir le périmètre à d'autres types de formulaires. Bloque l'audit fin (« qui a changé quoi, quand ») et une vraie réactivité temps réel sur les paiements directs.

## Option C — Registre local maître (app-first, HelloAsso comme preuve)
- **Principe** : **notre base** fait foi. Chaque inscription (adhésion de saison, sortie) crée une **somme due** locale. Un paiement HelloAsso, reçu par webhook confirmé ou par import, est une **preuve** rattachée à une somme due. Un écart (remboursement, paiement inconnu, montant différent) **ne modifie rien automatiquement** : il ouvre un cas que le bureau tranche.
- **Réutilisé** : `helloasso_forms`, client OAuth, webhook (rôle de collecteur de preuves), UI admin. **Créé** : registre des sommes dues branché sur les flux d'inscription existants, preuves, cas d'écart, rapport de rapprochement quotidien, checkout lié à une somme due, statut côté adhérent.
- **Storyblok** : rien de structurant. Éventuellement, les montants des sommes dues pourraient venir des tarifs déjà gérés dans Storyblok (`tarifs-planning`), ce qui crée une dépendance de plus.
- **Supabase** : **remplace** `profile_payments`. Nouvelles tables : sommes dues (profil, saison ou inscription, montant attendu, statut dû | payé | remboursé | exonéré), preuves HelloAsso (item id UNIQUE, état lu), cas d'écart (type, statut, décision). `registrations` et `group_members` sont reliés à leur somme due. `payment_done` devient une vue sur le registre.
- **API** : création des sommes dues dans `register.post.ts`, `add-child.post.ts` et l'inscription aux événements ; webhook ; import planifié ; admin : cas d'écart (accepter, refuser, rattacher), sommes dues ; checkout ; statut côté adhérent.
- **Complexité** : **L** · ~30-34 fichiers, dont des flux d'inscription existants à rouvrir (risque de régression sur un code stable).
- **Risques** : contredit en partie le besoin. Un remboursement HelloAsso **ne remonte pas tout seul**, il attend une décision, donc l'appli peut afficher « payé » sur un paiement déjà remboursé. Charge manuelle du bureau en septembre. Montants attendus à maintenir (tarifs, réductions, fratries). **Difficile à changer ensuite** : le registre devient le pivot de toutes les inscriptions.
- **Évolutivité** : permet de suivre les impayés (sommes dues sans preuve), les paiements hors HelloAsso et les relances. Bloque une synchronisation « sans humain » et alourdit chaque nouveau type d'inscription.

## Comparatif
| Critère | A — Miroir événementiel | B — Instantané planifié | C — Registre local maître |
|---|---|---|---|
| Complexité (S/M/L) · fichiers | L · ~32-36 | M · ~24-28 | L · ~30-34 (flux d'inscription rouverts) |
| Éditable par le bureau (Storyblok) | Textes de retour de paiement (optionnel) | Idem | Idem (+ dépendance possible aux tarifs) |
| Changement Supabase | Remplace `profile_payments` ; journal + miroir 3 tables + liens + file + manuels + runs | Fait évoluer `profile_payments` (clé item, état, saison, source) + file + runs | Remplace `profile_payments` ; sommes dues + preuves + cas d'écart ; FK depuis inscriptions |
| Nouvelles routes API | Webhook réécrit, traitement journal, sync, rejeu, file, écarts, checkout, statut adhérent | Sync (planifiée + bouton), webhook simplifié, file, checkout, statut adhérent | Webhook, import, cas d'écart, sommes dues, checkout, statut adhérent + 3 routes d'inscription modifiées |
| Risque principal | Nombre de pièces et traitement asynchrone sur Netlify | Durée max d'une Scheduled Function et rate limits non documentés ; latence des paiements directs | Remboursement non répercuté automatiquement, ce qui contredit le besoin ; charge manuelle |
| Évolutivité | Maximale (audit, rejeu, autres formulaires) | Bonne ; peut évoluer vers A | Bonne pour les impayés, mauvaise pour l'automatisation |
| **Q1 · Source de vérité** | HelloAsso (miroir en lecture seule) ; notre base pour les liens et les paiements manuels | HelloAsso pour l'état des paiements ; notre base pour les liens et les paiements manuels | Notre base ; HelloAsso n'apporte que des preuves |
| **Q2 · Webhooks / resync** | Webhooks principaux + resync incrémentale horaire + relecture complète nocturne | Resync complète **toutes les 15 min** (horaire hors période d'inscription, à décider) ; webhook = accélérateur facultatif | Webhooks + import et rapport de rapprochement **quotidiens** |
| **Q3 · Perte / doublon** | Doublon : clé de déduplication du journal (convention du projet, pas d'id documenté) ; le traitement relit l'API, donc l'ordre n'importe pas. Perte : la resync la rattrape (≤ 1 h) | Doublon sans effet (même item → même ligne, état lu sur l'API). Perte sans effet (le webhook n'est pas nécessaire). Ordre sans objet | Doublon : preuve UNIQUE par item. Perte : l'import quotidien la rattrape, mais un cas d'écart ne s'ouvre qu'à J+1 |
| **Q4 · Tests sandbox** | Compte sandbox + tunnel HTTPS déclaré comme URL de notification. Payloads du journal rejouables en local et en Vitest. Risque : webhooks sandbox parfois absents (signalé, non officiel) | Le plus simple : le job se teste sans webhook ni tunnel (bouton « synchroniser » sur la sandbox) ; fixtures Vitest issues des réponses API. Tunnel seulement pour le checkout (URL de retour en HTTPS) et l'accélérateur | Comme A pour les webhooks ; en plus, scénarios d'écart à fabriquer à la main (remboursement dans le back-office sandbox) |
| **Q5 · Admin voit / fait** | Journal des notifications (état, erreurs, **rejouer**), file à rapprocher (rattacher, ignorer), rapport d'écarts, dernière sync et **sync maintenant**, historique d'un paiement, saisie d'un paiement manuel | File à rapprocher (rattacher, ignorer), **dernier passage** (heure, compteurs, erreur) et **sync maintenant**, état HelloAsso de chaque ligne (payé, remboursé, échéance refusée), saisie d'un paiement manuel | Cas d'écart à **décider** un par un, sommes dues et impayés, preuves rattachées, saisie d'un paiement manuel ou d'une exonération |
| **Livrable par lots ?** | Oui : 1. Socle client et jeton · 2. Journal + miroir des adhésions · 3. Rapprochement et file · 4. Resync planifiée et écarts · 5. Événements et sorties · 6. Checkout et statut côté adhérent | Oui : 1. Socle client et jeton · 2. Instantané des adhésions (bouton manuel) · 3. File à rapprocher · 4. Planification · 5. Événements et sorties · 6. Checkout et statut côté adhérent · 7. Webhook accélérateur | Oui, mais le lot 2 touche les inscriptions existantes : 1. Socle · 2. Registre des sommes dues · 3. Checkout lié aux sommes dues · 4. Import des paiements directs et file · 5. Rapport d'écarts · 6. Événements et sorties |

## Recommandation
**Option B.** Elle répond le mieux à « la robustesse prime » : l'état se relit sur HelloAsso à chaque passage, donc les doublons, l'ordre des notifications et les webhooks perdus ou non authentifiables n'ont plus d'importance (A doit traiter ces trois points, C les reporte sur le bureau). Les remboursements remontent seuls en ≤ 15 min, ce que C ne fait pas. Elle reprend la migration en cours au lieu de la jeter, se teste en sandbox sans webhook, et se livre par lots. Si le bureau veut plus tard un historique auditable, B peut évoluer vers A. Condition préalable : vérifier en lot 1 qu'une Scheduled Function Netlify tient la relecture complète.

## Ajustements après discussion (2026-10-22) — option B pressentie
- **Planification** : un **cron externe sur un serveur OVH** appelle une route protégée par un secret en en-tête, à la place d'une Scheduled Function Netlify. La route s'exécute quand même dans une fonction Netlify, avec sa durée maximale. Si une relecture complète ne tient pas dans un seul appel, il faut pouvoir la découper (par formulaire, par page `continuationToken`) et la reprendre au passage suivant.
- **Migration 20260520 non appliquée en production** : on la réécrit librement, sans reprise de données.
- **Pas de paiement en plusieurs fois** : échéances hors périmètre (formulaires HelloAsso sans échéancier). La question « échéance refusée » tombe.
- **Objectif prioritaire** : le moins possible d'erreurs de rapprochement entre un paiement et l'adhérent ou l'inscription.
  - Paiement lancé **depuis l'appli** (checkout) : le lien est **certain**, grâce à l'identifiant d'inscription transmis dans `metadata` et relu sur l'API.
  - Paiement fait **directement sur HelloAsso** : rapprochement automatique sur des critères forts (adhérent déclaré dans l'item, email du payeur ou du parent), sinon **file à valider**.
- **Parcours d'inscription existant** (explorer, 2026-10-22) :
  - groupes : `useGroups.enroll()` → `group_members` en `pending` → validation du bureau (`ReviewModal`, mise à jour directe + email) → `confirmed` ou `cancelled` ;
  - sorties : `useEventRegistrations.register()` → `registrations` en `pending` → `confirm()` ou `cancel()` ;
  - aucune étape de paiement aujourd'hui ;
  - places (`max_members`, `max_participants`) contrôlées seulement dans l'interface ;
  - aucune notion de saison en base (calculée en dur).
- **Branchement du paiement** : à trancher, groupe par groupe et pour les sorties, entre deux modes :
  - « payer = inscrit » : le paiement confirme l'inscription ;
  - « demande → validation → paiement » : le bureau valide, puis l'adhérent paie.

## Risques transverses et questions ouvertes
- **Planification Netlify** (remplacée par le cron OVH, voir les ajustements ci-dessus) : rien n'est configuré aujourd'hui. Il existe deux voies, la Scheduled Function (`netlify/functions/*.mts` avec `config.schedule`, ou `schedule` dans `netlify.toml`) qui appelle une route interne protégée par un secret, ou les `scheduledTasks` de Nitro, dont le support par le preset Netlify n'est pas vérifié. La durée maximale d'exécution est courte (de l'ordre de 30 s d'après Netlify, à confirmer). En secours : un cron externe (GitHub Actions, cron-job.org).
- ~~**Migration 20260520 déjà appliquée en production ?**~~ Non : elle peut être réécrite.
- **Adhésions payées via le checkout** : elles seront des commandes `Checkout` et n'apparaîtront pas dans le formulaire d'adhésion HelloAsso de la saison (pas de carte d'adhérent HelloAsso). Le bureau l'accepte-t-il, ou préfère-t-il rediriger vers le formulaire d'adhésion HelloAsso ?
- **Effet d'un paiement sur une inscription à une sortie** : `registrations.status` passe-t-il seul à `confirmed` au paiement, et à `cancelled` au remboursement, ou le bureau garde-t-il la validation ?
- ~~**Échéances**~~ : hors périmètre, pas de paiement en plusieurs fois.
- **Remboursement partiel** : contradictoire dans la doc, à tester en sandbox avant de choisir comment l'afficher.
- **IP du webhook** : seule piste d'authenticité ; la vérifier exige l'en-tête d'IP client fourni par Netlify (à confirmer), et l'IP peut changer.
- **Sandbox** : URL exacte du token (`/oauth2` ou `/oauth2/token`), cartes de test non officielles, webhooks sandbox parfois absents (signalé, non officiel).
- **Comptes HelloAsso** : 5 URL de notification au plus par association ; les comptes prod et sandbox ont des identifiants distincts.

## Décision
- **Option retenue** : **B — Instantané planifié**, avec ces ajustements :
  - planification par un **cron externe (serveur OVH)** qui appelle une route protégée par un secret en en-tête ;
  - migration `20260520_helloasso.sql` **réécrite** (non appliquée en production) ;
  - **pas de paiement en plusieurs fois** ;
  - le bouton « Payer » de l'appli utilise le **checkout intégré** : la liste de référence des adhérents est celle de l'appli, il n'est pas nécessaire que tous figurent dans la liste HelloAsso ;
  - **groupes** : parcours actuel conservé (demande → validation du bureau → paiement), le paiement marque « payé » sans toucher à la validation ;
  - **sorties** : « payer = inscrit », le paiement confirme l'inscription et un remboursement l'annule ; places vérifiées côté serveur avant d'ouvrir un paiement ;
  - **paiement non rapproché** : file à valider par le bureau, jamais de création automatique de profil.
- **Raisons** :
  - HelloAsso est la source de vérité de l'état des paiements, relu à chaque passage : doublons, ordre et webhooks perdus ou non authentifiables n'ont plus d'effet ;
  - les remboursements faits sur HelloAsso remontent seuls ;
  - le checkout donne un lien paiement ↔ inscription certain, ce qui sert l'objectif « le moins de coquilles possible » ;
  - complexité M, livrable par lots, testable en sandbox sans tunnel jusqu'au checkout.
- **Options écartées** :
  - **A — Miroir événementiel** : trop de pièces mobiles (journal, traitement asynchrone, rejeu) pour un gain d'audit non demandé. B peut évoluer vers A plus tard.
  - **C — Registre local maître** : un remboursement HelloAsso n'y remonte pas automatiquement, ce qui contredit le besoin, et il faut rouvrir des flux d'inscription stables.
- **Date** : 2026-10-22

### Lots (un dossier `docs/features/<slug>/` par lot, à lancer dans cet ordre)
| # | Slug | Contenu | Dépend de | Transverse |
|---|---|---|---|---|
| 1 | `helloasso-socle` | client HelloAsso serveur, jeton partagé, config prod/sandbox, migration réécrite, test de connexion | — | oui |
| 2 | `helloasso-sync-adhesions` | instantané des adhésions (bouton manuel), rapprochement fort, remboursements, paiements manuels, statut payé par saison | 1 | oui |
| 3 | `helloasso-rapprochement` | file « à rapprocher » et actions du bureau | 2 | oui |
| 4 | `helloasso-cron` | route planifiée sécurisée, verrou, reprise, cron OVH, alerte | 2 | non |
| 5 | `helloasso-sorties` | formulaires Event ↔ sorties, « payer = inscrit », remboursement = annulation | 2, 3 | non |
| 6 | `helloasso-checkout` | bouton « Payer » (groupe validé, sortie), retour vérifié côté serveur | 2, 5 | oui |
| 7 | `helloasso-webhook` | webhook accélérateur, facultatif | 2 | non |
