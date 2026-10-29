---
name: feature
description: Lance une feature de bout en bout avec l'équipe de sous-agents (spec → explorer → planner → validation → [tests d'abord] → implémentation → porte de qualité → reviewer → doc-writer).
argument-hint: <description de la feature | slug>
disable-model-invocation: true
---

Feature demandée : $ARGUMENTS

Tu es l'**orchestrateur**. Tu délègues, tu lis des comptes rendus courts et tu décides. Tu ne parcours pas le code toi-même. Ne lis que les fichiers de `docs/features/<slug>/`.

## 1. Spec
- **Si l'argument est un slug et que `docs/features/<slug>/spec.md` existe** (issu de `/cadrage`) :
  - ne réécris pas la spec et ne pose pas de questions ;
  - copie seulement les fichiers du template qui manquent (`plan.md`, `status.md`, `review.md`), passe la phase de `status.md` à « exploration », puis va directement à l'étape 2 ;
  - à l'étape 2, le prompt de l'explorer cible l'option retenue (`options.md` § Décision) ; à l'étape 3, rappelle au planner de respecter cette Décision ;
  - si la spec n'a pas le champ « Tests d'abord », applique la règle par défaut ci-dessous et ajoute-le.
- Sinon, choisis un slug court en kebab-case. Copie `docs/features/_TEMPLATE/` vers `docs/features/<slug>/`.
- Rédige `spec.md` :
  - objectif, critères d'acceptation **vérifiables**, hors périmètre ;
  - transverse oui/non : une feature est transverse si elle introduit un nouveau flux d'auth, une nouvelle table ou une refonte ;
  - **Tests d'abord** : « oui » par défaut si la feature touche à l'argent, à l'authentification ou aux données des adhérents ; « non » pour l'affichage pur ;
  - **Parcours utilisateur** (e2e), ou « Aucun ».
- Pose à l'utilisateur **uniquement** les questions sans lesquelles la spec est inexacte, en un seul message et avec AskUserQuestion si possible. Sinon, fais des hypothèses et note-les dans « Contraintes / contexte ».
- `status.md` : phase « exploration ».

## 2. Exploration
`explorer` (avant-plan) : « Pour la feature décrite dans docs/features/<slug>/spec.md, quels fichiers, composants, routes, tables et docs sont concernés ? ». Garde son résumé tel quel.

## 3. Plan
`planner` avec le slug et le résumé de l'explorer. Passe `model: "opus"` **seulement** si la spec est transverse.
Montre ensuite à l'utilisateur le plan en version courte : tâches, agents, schéma BDD, mode tests d'abord, parcours e2e, questions. Puis **arrête-toi et attends sa validation explicite**. Coche « Validé » dans `plan.md` une fois qu'elle est donnée.

## 4. Implémentation
- **Tests d'abord = oui** : lance d'abord **T0**.
  - `qa` écrit les tests Vitest à partir des critères d'acceptation ; `e2e` écrit les parcours, s'il y en a. Ils se lancent en parallèle.
  - Les tests doivent **échouer** pour la bonne raison, et les fichiers de test sont listés dans `status.md`.
  - Les agents de dev implémentent ensuite **jusqu'à ce que ces tests passent, sans les modifier**. Un agent qui conteste un test revient ⛔ : tu tranches, ou tu demandes à l'utilisateur, et seul l'auteur du test le modifie.
- Lance chaque tâche avec l'agent assigné. Le prompt contient : le slug, le numéro de tâche, et « lis docs/features/<slug>/plan.md, tâche Tn ».
- Les tâches qui touchent des fichiers différents et sont marquées ∥ se lancent en parallèle (plusieurs appels dans le même message). Les autres se lancent en séquence, dans l'ordre des dépendances.
- Les tâches « orchestrateur » (moins de 20 lignes, un fichier), tu les fais toi-même.
- Si un agent revient ⛔ : lis son blocage, tranche ou demande à l'utilisateur, puis relance via SendMessage vers ce même agent plutôt qu'un nouvel appel.

## 5. Tests, porte de qualité, revue
1. **`qa`** (moment « après implémentation ») : il complète les tests, et les scénarios manuels si besoin.
2. **Porte de qualité**, obligatoire avant `reviewer` :
   - `qa` (moment « porte ») : `npm test` et `npm run typecheck` doivent passer ;
   - **en parallèle**, si la spec contient des parcours utilisateur, `e2e` les lance (`E2E_SKIP_BUILD=1` si un build à jour existe).
3. **En cas d'échec** :
   - renvoie chaque échec à l'agent du domaine concerné (SendMessage vers l'auteur du fichier), puis relance la seule partie qui a échoué de la porte ;
   - compte les échecs consécutifs dans `status.md` ;
   - **après 2 échecs de suite, arrête-toi** et demande à l'utilisateur, avec le résumé des échecs.
4. **`reviewer`** avec le slug, seulement quand la porte est verte. S'il y a des **bloquants** : renvoie chacun à l'agent auteur, repasse la porte, puis relance `reviewer` sur ces seuls points. Au-delà de 2 boucles, demande à l'utilisateur.

## 6. Clôture
- `doc-writer` avec le slug. C'est lui qui lance `graphify update .`, une seule fois.
- Résumé final à l'utilisateur, 15 lignes max :
  - ce qui a été fait (fichiers principaux) ;
  - résultat de la porte de qualité et de la revue ;
  - points restants ;
  - **la liste exacte à créer à la main dans Storyblok** (copiée de la section « Côté Storyblok » de `spec.md`).
