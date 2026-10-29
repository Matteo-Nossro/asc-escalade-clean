---
name: cadrage
description: Réfléchir à une feature avant de la développer — besoin, existant, 2-3 options comparées (planner opus), discussion, décision, puis spec.md prêt pour /feature. Aucun code.
argument-hint: <idée de feature>
disable-model-invocation: true
---

Idée : $ARGUMENTS

Tu es l'orchestrateur d'un **cadrage**, c'est-à-dire de la réflexion uniquement.
- Tu n'écris aucun code applicatif et tu ne lances aucun agent de développement (`storyblok-dev`, `ui-dev`, `api-dev`, `qa`, `reviewer`, `doc-writer`).
- Tu n'écris que dans `docs/features/<slug>/`.
- Pas de `graphify update`.

## 1. Besoin (toi, sans agent)
- Reformule la demande en **3 lignes** : pour qui, quoi, pourquoi. Propose un slug en kebab-case.
- Pose **4 questions max**, sur le **besoin** uniquement :
  - utilisateurs : visiteurs, adhérents, parents, bureau / admin ;
  - usage et fréquence ;
  - contraintes : édition par le bureau, données personnelles, délai ;
  - priorités : indispensable ou bonus.
- Aucune question technique. Un seul message, avec AskUserQuestion si les réponses sont des choix. Si la demande est déjà claire, pose moins de questions.
- **Attends les réponses** avant de continuer.

## 2. Existant (`explorer`)
Prompt : « Cadrage <slug> : <besoin en 3 lignes + réponses>. Qu'est-ce qui existe déjà et pourrait être réutilisé ou impacté : composants, composables, routes `server/api`, tables Supabase, bloks Storyblok ? Chemins + 1 ligne chacun. »
Donne-moi l'essentiel en 3 lignes max, et garde son compte rendu pour l'étape 3.

## 3. Options (`planner`, `model: "opus"`, seule utilisation d'opus)
Prompt : « **Mode options (cadrage)** — slug <slug>. Besoin : … Réponses : … Existant (explorer) : … Écris `docs/features/<slug>/options.md` selon `.claude/skills/cadrage/options-template.md`. Pas de plan d'implémentation. »

## 4. Discussion (toi, sans agent)
- **Résumé** de 12 lignes max, sans recopier le fichier :
  - 2 lignes par option (principe, complexité S/M/L, compromis clé) ;
  - la recommandation ;
  - le chemin vers `options.md`.
- Pour répondre aux questions, lis seulement la section concernée d'`options.md`. Pour un fait de code précis, relance `explorer` (haiku), jamais `planner`.
- Si j'ajuste ou combine des options, mets à jour `options.md` toi-même : option modifiée ou nouvelle « Option A+B », comparatif et recommandation cohérents. Si la modification change fondamentalement l'analyse, propose de refaire l'étape 3.

## 5. Décision (toi, seulement quand je tranche explicitement)
1. Ajoute en bas d'`options.md` la section **« Décision »** (format en commentaire à la fin du template) : option retenue et ajustements, raisons, options écartées et pourquoi, date.
2. Rédige `docs/features/<slug>/spec.md` d'après `docs/features/_TEMPLATE/spec.md` :
   - objectif ;
   - critères d'acceptation, tirés de l'option retenue et de mes réponses ;
   - hors périmètre, y compris ce qu'apportaient les options écartées ;
   - contraintes, avec un renvoi vers `options.md` § Décision ;
   - **Transverse : oui** si la complexité est L, ou s'il y a une nouvelle table ou un nouveau flux d'auth ;
   - **Tests d'abord : oui** si la feature touche à l'argent, à l'authentification ou aux données des adhérents, sinon « non » ; et la section « Parcours utilisateur (e2e) », ou « Aucun » ;
   - section « Côté Storyblok » pré-remplie avec les bloks et champs pressentis (storyblok-dev la complétera).
3. Crée `status.md` d'après le template, avec la phase « spec (cadrage terminé) ».
4. Termine par : « Spec prête : lance `/feature <slug>`. »
